import glob
import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from api.models.user import User
from api.models.emotion_log import EmotionLog
from api.models.journal_entry import JournalEntry
from api.models.voice_log import VoiceLog
from api.models.vitals_log import VitalsLog
from api.models.incongruence_record import IncongruenceRecord
from api.schemas.schemas import (
    CheckinResponse,
    CheckinSignalSignals,
    VerifyResponse,
    VerifyVitals,
    FaceSignal,
)
from api.routes.auth import get_current_user
from api.services.voice_analyzer import analyze_voice
from api.services.vitals_analyzer import analyze_video
from api.services.journal_analyzer import analyze_journal
from api.services.hf_inference import classify_face, crop_largest_face
from api.services.incongruence_engine import assess_incongruence

router = APIRouter(prefix="/analysis", tags=["analysis"])

VIDEO_DIR = Path("uploads/video")
AUDIO_DIR = Path("uploads/audio")
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

EMOTION_LABELS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
MAX_FACE_FRAMES = 4


def _run_ffmpeg(cmd: list[str]) -> bool:
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except Exception:
        return False


def _save_upload(file: UploadFile) -> str:
    ext = Path(file.filename or "upload.webm").suffix or ".webm"
    path = VIDEO_DIR / f"{uuid.uuid4().hex}{ext}"
    with open(path, "wb") as f:
        f.write(file.file.read())
    return str(path)


def _extract_audio(video_path: str) -> str | None:
    wav = AUDIO_DIR / f"{uuid.uuid4().hex}.wav"
    ok = _run_ffmpeg([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "22050", "-ac", "1",
        str(wav),
    ])
    return str(wav) if ok and wav.exists() else None


def _sampled_face_frames(video_path: str, out_dir: str) -> list[str]:
    """Extract ~1 frame/second into `out_dir` and return a small spread of them.

    The caller owns `out_dir` (a persistent temp dir) and must remove it after
    the frames have been consumed by the face analyzer.
    """
    ok = _run_ffmpeg([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", video_path,
        "-vf", "fps=1",
        f"{out_dir}/frame_%03d.png",
    ])
    if not ok:
        return []
    frames = sorted(glob.glob(os.path.join(out_dir, "frame_*.png")))
    if not frames:
        return []
    # Keep a small evenly-spaced subset to bound CPU time.
    step = max(1, round(len(frames) / MAX_FACE_FRAMES))
    return frames[::step][:MAX_FACE_FRAMES]


def _analyze_faces(frame_paths: list[str]) -> FaceSignal | None:
    accum = {label: 0.0 for label in EMOTION_LABELS}
    analyzed = 0
    for p in frame_paths:
        try:
            image_bytes = Path(p).read_bytes()
            crop = crop_largest_face(image_bytes)
            if crop is None:
                continue
            res = classify_face(crop)
        except Exception:
            continue
        for label in EMOTION_LABELS:
            accum[label] += res["scores"].get(label, 0.0)
        analyzed += 1

    if analyzed == 0:
        return None

    scores = {label: round(accum[label] / analyzed, 4) for label in EMOTION_LABELS}
    dominant = max(scores, key=scores.get)
    return FaceSignal(
        detected_emotion=dominant,
        confidence=round(scores[dominant], 4),
        scores=scores,
        frames_analyzed=analyzed,
    )


def _recommendation(masking_level: str) -> str:
    if masking_level == "none":
        return "You're aligned right now. Keep up whatever you're doing — no intervention needed."
    if masking_level == "mild":
        return "A short breathing exercise can help bring your body back in sync. Give it 60 seconds."
    return (
        "Masked stress detected. Try the 60-second guided breathing exercise, then we'll "
        "re-measure your heart-rate variability live to show the change."
    )


@router.post("/checkin", response_model=CheckinResponse)
async def run_checkin(
    video: UploadFile = File(...),
    journal_text: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run a full emotional X-ray on a single webm recording (camera + mic).

    The clip is split into voice (audio), face (sampled frames) and vitals
    (rPPG) signals, fused together with any typed journal text, and scored for
    masking/incongruence. A random `checkin_id` groups everything together and
    is passed back to `/analysis/verify` after an intervention.
    """
    checkin_id = uuid.uuid4()
    video_path = _save_upload(video)

    # Voice — degrade gracefully if the clip has no audio track.
    voice = None
    wav = _extract_audio(video_path)
    if wav:
        try:
            voice = analyze_voice(wav)
        except Exception:
            voice = None

    # Vitals (rPPG) — degrade if the face is not consistently visible.
    vitals = None
    try:
        vitals = analyze_video(video_path)
    except Exception:
        vitals = None

    # Face (DeepFace over a few sampled frames).
    face = None
    face_dir = tempfile.mkdtemp(prefix="drift_frames_")
    try:
        frames = _sampled_face_frames(video_path, face_dir)
        if frames:
            face = _analyze_faces(frames)
    finally:
        shutil.rmtree(face_dir, ignore_errors=True)

    # Text — optional typed journal segment.
    text = None
    if journal_text and journal_text.strip():
        try:
            text = analyze_journal(journal_text)
        except Exception:
            text = None

    ic = assess_incongruence(
        face_scores=face.scores if face else None,
        voice=voice or None,
        vitals=vitals or None,
        text=text or None,
    )

    if face:
        db.add(EmotionLog(
            user_id=current_user.id,
            checkin_id=checkin_id,
            detected_emotion=face.detected_emotion,
            confidence=face.confidence,
            happy=face.scores.get("happy"),
            sad=face.scores.get("sad"),
            angry=face.scores.get("angry"),
            neutral=face.scores.get("neutral"),
            fear=face.scores.get("fear"),
            surprise=face.scores.get("surprise"),
            disgust=face.scores.get("disgust"),
            image_path=video_path,
        ))
    if text:
        db.add(JournalEntry(
            user_id=current_user.id,
            checkin_id=checkin_id,
            content=journal_text,
            sentiment_score=text["sentiment_score"],
            sentiment_label=text["sentiment_label"],
            emotional_tone=text["emotional_tone"],
            stress_level=text["stress_level"],
            key_themes="[]",
        ))
    if voice:
        db.add(VoiceLog(
            user_id=current_user.id,
            checkin_id=checkin_id,
            vitality=voice["vitality"],
            stress_voice=voice["stress_voice"],
            voice_tone=voice["voice_tone"],
            confidence=voice["confidence"],
            audio_path=wav,
        ))
    if vitals:
        db.add(VitalsLog(
            user_id=current_user.id,
            checkin_id=checkin_id,
            hr_bpm=vitals["hr_bpm"],
            hrv_rmssd_ms=vitals["hrv_rmssd_ms"],
            hrv_sdnn_ms=vitals["hrv_sdnn_ms"],
            stress_vital=vitals["stress_vital"],
            confidence=vitals["confidence"],
            video_path=video_path,
        ))
    db.add(IncongruenceRecord(
        user_id=current_user.id,
        checkin_id=checkin_id,
        wellness_index=ic["wellness_index"],
        masking_level=ic["masking_level"],
        masking_score=ic["masking_score"],
        aligned=ic["aligned"],
        explanation=ic["explanation"],
        face_wellbeing=ic["signal_scores"].get("face"),
        voice_wellbeing=ic["signal_scores"].get("voice"),
        vitals_wellbeing=ic["signal_scores"].get("body"),
        text_wellbeing=ic["signal_scores"].get("words"),
    ))
    db.commit()

    return CheckinResponse(
        checkin_id=checkin_id,
        wellness_index=ic["wellness_index"],
        masking_level=ic["masking_level"],
        masking_score=ic["masking_score"],
        aligned=ic["aligned"],
        explanation=ic["explanation"],
        signals_available=ic["signals_available"],
        signal_scores=ic["signal_scores"],
        disagreements=ic["disagreements"],
        signals=CheckinSignalSignals(face=face, voice=voice, vitals=vitals, text=text),
        recommendation=_recommendation(ic["masking_level"]),
    )


@router.post("/verify", response_model=VerifyResponse)
async def run_verify(
    video: UploadFile = File(...),
    checkin_id: uuid.UUID = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-measure HRV after a breathing exercise to prove the intervention worked.

    Compares the post-breathing clip against the baseline vitals captured during
    the check-in for the same `checkin_id`, returning the delta and improvement.
    """
    baseline = (
        db.query(VitalsLog)
        .filter(VitalsLog.checkin_id == checkin_id, VitalsLog.user_id == current_user.id)
        .order_by(VitalsLog.created_at.asc())
        .first()
    )

    if baseline is None:
        raise HTTPException(status_code=404, detail="No baseline check-in found for this checkin_id")

    before = VerifyVitals(
        hr_bpm=baseline.hr_bpm,
        hrv_rmssd_ms=baseline.hrv_rmssd_ms,
        stress_vital=baseline.stress_vital,
    )

    video_path = _save_upload(video)
    try:
        after_vitals = analyze_video(video_path)
    except Exception as e:
        db.add(VitalsLog(
            user_id=current_user.id, checkin_id=checkin_id, video_path=video_path
        ))
        db.commit()
        raise HTTPException(status_code=422, detail=str(e))

    after = VerifyVitals(
        hr_bpm=after_vitals["hr_bpm"],
        hrv_rmssd_ms=after_vitals["hrv_rmssd_ms"],
        stress_vital=after_vitals["stress_vital"],
    )
    db.add(VitalsLog(
        user_id=current_user.id,
        checkin_id=checkin_id,
        hr_bpm=after_vitals["hr_bpm"],
        hrv_rmssd_ms=after_vitals["hrv_rmssd_ms"],
        hrv_sdnn_ms=after_vitals["hrv_sdnn_ms"],
        stress_vital=after_vitals["stress_vital"],
        confidence=after_vitals["confidence"],
        video_path=video_path,
    ))
    db.commit()

    if before.hrv_rmssd_ms is not None and after.hrv_rmssd_ms is not None:
        delta = round(after.hrv_rmssd_ms - before.hrv_rmssd_ms, 2)
        improvement_pct = round(delta / before.hrv_rmssd_ms * 100.0, 1) if before.hrv_rmssd_ms > 0 else None
        improved = delta > 1.0
        if improved:
            message = (
                f"Your HRV improved by {improvement_pct:.0f}% ({before.hrv_rmssd_ms:.0f}ms → "
                f"{after.hrv_rmssd_ms:.0f}ms). Your body just proved the breathing worked."
            )
        else:
            message = (
                f"HRV moved {delta:+.0f}ms ({before.hrv_rmssd_ms:.0f}ms → {after.hrv_rmssd_ms:.0f}ms). "
                "Consistency takes practice — a few more rounds usually settles it."
            )
    else:
        delta = improvement_pct = improved = None
        message = "Not enough HRV signal to compare. Try keeping your face steady next round."

    return VerifyResponse(
        checkin_id=checkin_id,
        before=before,
        after=after,
        hrv_delta_ms=delta,
        improvement_pct=improvement_pct,
        improved=improved,
        message=message,
    )