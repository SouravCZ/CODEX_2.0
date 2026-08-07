import numpy as np
import librosa

SR = 22050
FRAME_LENGTH = 2048
HOP_LENGTH = 512
FMIN = 60.0
FMAX = 400.0


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _extract_features(y: np.ndarray) -> dict:
    """Compute low-level acoustic features from a raw waveform."""
    duration = len(y) / SR

    rms = librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)[0]
    rms_db = 20.0 * np.log10(rms + 1e-9)
    noise_floor = np.percentile(rms_db, 20)
    speech_mask = rms_db > (noise_floor + 4.0)
    speech_ratio = float(speech_mask.mean()) if len(rms_db) > 0 else 0.0
    mean_rms_db = float(rms_db[speech_mask].mean()) if speech_mask.any() else float(np.percentile(rms_db, 60))
    dynamic_range = float(np.percentile(rms_db, 90) - np.percentile(rms_db, 20))
    loudness_std = float(rms_db[speech_mask].std()) if speech_mask.any() else 0.0

    f0, voiced_flag, _ = librosa.pyin(
        y, fmin=FMIN, fmax=FMAX, sr=SR, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH
    )
    voiced_flag = np.array(voiced_flag, dtype=bool)
    voiced_ratio = float(voiced_flag.mean()) if len(voiced_flag) > 0 else 0.0
    f0_values = np.array([v for v in f0[voiced_flag] if v == v])
    if len(f0_values) >= 10:
        f0_mean = float(np.median(f0_values))
        f0_std = float(np.std(f0_values))
        pitch_var_norm = float(f0_std / max(f0_mean, 1e-6))
    else:
        f0_mean = 0.0
        f0_std = 0.0
        pitch_var_norm = 0.0

    centroid = librosa.feature.spectral_centroid(y=y, sr=SR)[0]
    centroid_mean = float(centroid.mean()) if len(centroid) > 0 else 0.0
    zcr = librosa.feature.zero_crossing_rate(y=y)[0]
    zcr_mean = float(zcr.mean()) if len(zcr) > 0 else 0.0

    return {
        "duration_s": round(duration, 3),
        "speech_ratio": round(speech_ratio, 4),
        "voiced_ratio": round(voiced_ratio, 4),
        "mean_rms_db": round(mean_rms_db, 3),
        "dynamic_range_db": round(dynamic_range, 3),
        "loudness_std_db": round(loudness_std, 3),
        "f0_mean_hz": round(f0_mean, 2),
        "f0_std_hz": round(f0_std, 2),
        "pitch_var_norm": round(pitch_var_norm, 4),
        "spectral_centroid": round(centroid_mean, 2),
        "zero_crossing_rate": round(zcr_mean, 4),
    }


def _score_vitality(features: dict) -> float:
    """Map acoustic features to a 0-1 vitality score (higher = more animated).

    Pitch variability (a key burnout biomarker) dominates; prosodic loudness
    range and speech ratio add expressiveness.
    """
    pitch_score = _clamp(features["pitch_var_norm"] / 0.20)
    prosodic_score = _clamp(features["loudness_std_db"] / 6.0)
    speech_score = _clamp(features["speech_ratio"] / 0.45)
    return round(0.55 * pitch_score + 0.25 * prosodic_score + 0.20 * speech_score, 4)


def _classify_tone(features: dict, vitality: float) -> str:
    if features["voiced_ratio"] < 0.12 or features["duration_s"] < 0.8:
        return "insufficient_audio"

    strident = features["spectral_centroid"] > 1300.0
    rough = features["zero_crossing_rate"] > 0.07

    if rough and strident:
        return "tense"
    if features["pitch_var_norm"] < 0.10:
        return "flat"
    if vitality >= 0.55 and features["speech_ratio"] >= 0.30:
        return "animated"
    return "neutral"


def _score_stress(features: dict, tone: str, vitality: float) -> float:
    monotony = 1.0 - _clamp(features["pitch_var_norm"] / 0.20)
    low_prosody = 1.0 - _clamp(features["loudness_std_db"] / 6.0)
    low_speech = 1.0 - _clamp(features["speech_ratio"] / 0.45)
    stress = 0.55 * monotony + 0.25 * low_prosody + 0.20 * low_speech
    if tone == "tense":
        stress = max(stress, 0.7)
    if tone == "insufficient_audio":
        stress = 0.5
    return round(_clamp(stress), 4)


def analyze_voice(audio_path: str) -> dict:
    """Analyze a spoken check-in for vocal biomarkers of vitality and stress.

    Maps acoustic features to a vitality score (0-1), a voice tone label, and a
    voice-derived stress score (0-1) used by the incongruence engine.
    """
    try:
        y, _ = librosa.load(audio_path, sr=SR, mono=True)
    except Exception as exc:
        raise ValueError(f"Voice analysis failed: {str(exc)}")

    if len(y) == 0:
        raise ValueError("Voice analysis failed: empty audio")

    features = _extract_features(y)
    vitality = _score_vitality(features)
    tone = _classify_tone(features, vitality)
    stress_voice = _score_stress(features, tone, vitality)

    confidence = _clamp(features["voiced_ratio"] * (features["duration_s"] / 5.0))
    confidence = round(confidence, 4)

    return {
        "vitality": vitality,
        "voice_tone": tone,
        "stress_voice": stress_voice,
        "confidence": confidence,
        "features": features,
    }
