import uuid
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from api.models.user import User
from api.models.emotion_log import EmotionLog
from api.schemas.schemas import EmotionResponse
from api.routes.auth import get_current_user
from api.services.emotion_analyzer import analyze_face

router = APIRouter(prefix="/emotion", tags=["emotion"])


@router.post("/analyze", response_model=EmotionResponse)
async def analyze_emotion(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a face image and get emotion analysis."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    try:
        result = analyze_face(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    scores = result["scores"]

    log = EmotionLog(
        user_id=current_user.id,
        detected_emotion=result["detected_emotion"],
        confidence=result["confidence"],
        happy=scores.get("happy"),
        sad=scores.get("sad"),
        angry=scores.get("angry"),
        neutral=scores.get("neutral"),
        fear=scores.get("fear"),
        surprise=scores.get("surprise"),
        disgust=scores.get("disgust"),
        image_path=result.get("image_path"),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return EmotionResponse.model_validate(log)


@router.get("/history", response_model=list[EmotionResponse])
def get_emotion_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent emotion logs for the current user."""
    logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.user_id == current_user.id)
        .order_by(EmotionLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [EmotionResponse.model_validate(log) for log in logs]
