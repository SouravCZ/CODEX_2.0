import glob
import os
import subprocess
import tempfile
import uuid

import cv2
import numpy as np
from scipy import signal
from scipy.fft import rfft, rfftfreq

FRAME_FPS = 15
MIN_SECONDS = 8
FFT_BAND_LOW = 0.5
FFT_BAND_HIGH = 4.0
ROI_FRACTION = 0.55


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _extract_frames(video_path: str, out_dir: str) -> list[np.ndarray]:
    """Decode a video file into RGB frames using the system ffmpeg."""
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", video_path,
        "-vf", f"fps={FRAME_FPS}",
        f"{out_dir}/frame_%04d.png",
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    paths = sorted(glob.glob(os.path.join(out_dir, "frame_*.png")))
    if not paths:
        raise ValueError("Vitals analysis failed: could not decode video frames")
    return [cv2.imread(p) for p in paths]


_FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def _face_roi(gray: np.ndarray, previous=None):
    """Detect the largest face; fall back to the previous ROI if detection drops."""
    faces = _FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(90, 90))
    if len(faces) == 0:
        return previous
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return int(x), int(y), int(w), int(h)


def _extract_ppg(frames: list[np.ndarray]) -> tuple[np.ndarray, float, int]:
    """Average green-channel intensity over the inner face region per frame."""
    pg = []
    roi = None
    detected = 0
    height, width = frames[0].shape[:2]

    for frame in frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        roi = _face_roi(gray, roi)
        if roi is None:
            pg.append(np.nan)
            continue
        detected += 1
        x, y, w, h = roi
        cx, cy = x + w // 2, y + h // 2
        half = int(min(w, h) * ROI_FRACTION / 2)
        x0, y0 = max(0, cx - half), max(0, cy - int(half * 0.8))
        x1, y1 = min(width, cx + half), min(height, cy + half)
        region = frame[y0:y1, x0:x1]
        pg.append(float(np.mean(region[:, :, 1])))

    pg = np.array(pg, dtype=np.float64)
    face_ratio = detected / len(frames) if frames else 0.0
    if detected < max(3, int(len(frames) * 0.3)):
        raise ValueError("Vitals analysis failed: face not consistently visible")
    if np.isnan(pg).any():
        pg = np.interp(np.arange(len(pg)), np.where(~np.isnan(pg))[0], pg[~np.isnan(pg)])
    return pg, face_ratio, detected


def _compute_vitals(ppg: np.ndarray, fps: int) -> dict:
    """Estimate HR + HRV from a raw PPG signal via FFT and peak-timing."""
    n = len(ppg)
    duration = n / fps
    if n < fps * MIN_SECONDS:
        raise ValueError(f"Vitals analysis failed: signal too short ({duration:.1f}s)")

    win = int(fps * 1.6)
    kernel = np.ones(win) / win
    baseline = np.convolve(ppg, kernel, mode="same")
    detrended = ppg - baseline

    sos = signal.butter(4, [FFT_BAND_LOW, FFT_BAND_HIGH], btype="bandpass", output="sos", fs=fps)
    filtered = signal.sosfiltfilt(sos, detrended)

    freqs = rfftfreq(n, d=1.0 / fps)
    spectrum = np.abs(rfft(filtered))
    in_band = (freqs >= FFT_BAND_LOW) & (freqs <= FFT_BAND_HIGH)
    hr_fft = float(freqs[in_band][np.argmax(spectrum[in_band])] * 60.0)

    peaks, _ = signal.find_peaks(
        filtered, distance=int(fps * 0.35), prominence=0.15 * np.std(filtered)
    )
    if len(peaks) < 3:
        return {
            "hr_bpm": round(hr_fft, 1),
            "hrv_rmssd_ms": None,
            "hrv_sdnn_ms": None,
            "num_peaks": int(len(peaks)),
            "duration_s": round(duration, 2),
        }

    ibi = np.diff(peaks) / fps
    ibi = ibi[(ibi >= 0.35) & (ibi <= 1.5)]
    if len(ibi) < 2:
        return {
            "hr_bpm": round(hr_fft, 1),
            "hrv_rmssd_ms": None,
            "hrv_sdnn_ms": None,
            "num_peaks": int(len(peaks)),
            "duration_s": round(duration, 2),
        }

    ibi_ms = ibi * 1000.0
    rmssd = float(np.sqrt(np.mean(np.diff(ibi_ms) ** 2)))
    sdnn = float(np.std(ibi_ms))
    hr_peaks = float(60.0 / np.mean(ibi))

    return {
        "hr_bpm": round(hr_peaks, 1),
        "hrv_rmssd_ms": round(rmssd, 2),
        "hrv_sdnn_ms": round(sdnn, 2),
        "num_peaks": int(len(peaks)),
        "duration_s": round(duration, 2),
    }


def _stress_from_vitals(hr_bpm: float, rmssd: float | None) -> float:
    if rmssd is not None:
        hrv_stress = _clamp((60.0 - rmssd) / 50.0)
    else:
        hrv_stress = 0.5
    hr_stress = _clamp((hr_bpm - 60.0) / 60.0)
    return round(_clamp(0.75 * hrv_stress + 0.25 * hr_stress), 4)


def analyze_video(video_path: str) -> dict:
    """Estimate heart rate and heart-rate variability from a webcam video (rPPG)."""
    with tempfile.TemporaryDirectory() as tmp:
        frames = _extract_frames(video_path, tmp)
        pg, face_ratio, detected = _extract_ppg(frames)
        vitals = _compute_vitals(pg, FRAME_FPS)

    hr = vitals["hr_bpm"]
    rmssd = vitals["hrv_rmssd_ms"]

    stress = _stress_from_vitals(hr, rmssd)

    confidence = _clamp(face_ratio * (vitals["duration_s"] / 20.0) * 0.6
                        + (min(vitals["num_peaks"] / 25.0, 1.0) * 0.4))
    confidence = round(confidence, 4)

    return {
        "hr_bpm": hr,
        "hrv_rmssd_ms": rmssd,
        "hrv_sdnn_ms": vitals["hrv_sdnn_ms"],
        "stress_vital": stress,
        "confidence": confidence,
        "frames_processed": detected,
        "duration_s": vitals["duration_s"],
    }
