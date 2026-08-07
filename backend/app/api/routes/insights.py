from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from api.models.user import User
from api.models.insight import Insight
from api.schemas.schemas import InsightResponse, TrendData
from api.routes.auth import get_current_user
from api.services.drift_detector import detect_drift

router = APIRouter(prefix="/insights", tags=["insights"])


@router.post("/generate", response_model=InsightResponse)
def generate_insight(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new emotional drift insight."""
    result = detect_drift(db, current_user.id)

    insight = Insight(
        user_id=current_user.id,
        drift_status=result["drift_status"],
        drift_score=result["drift_score"],
        summary=result["summary"],
        recommendation=result["recommendation"],
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)

    return InsightResponse.model_validate(insight)


@router.get("/latest", response_model=InsightResponse | None)
def get_latest_insight(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent insight for the current user."""
    insight = (
        db.query(Insight)
        .filter(Insight.user_id == current_user.id)
        .order_by(Insight.created_at.desc())
        .first()
    )
    if not insight:
        return None
    return InsightResponse.model_validate(insight)


@router.get("/trend", response_model=TrendData)
def get_trend_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get trend data for charts."""
    result = detect_drift(db, current_user.id)

    from datetime import datetime, timedelta, timezone
    from api.models.emotion_log import EmotionLog
    from api.models.journal_entry import JournalEntry

    cutoff = datetime.now(timezone.utc) - timedelta(days=14)

    emotion_logs = (
        db.query(EmotionLog)
        .filter(EmotionLog.user_id == current_user.id, EmotionLog.created_at >= cutoff)
        .order_by(EmotionLog.created_at)
        .all()
    )
    journal_entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == current_user.id, JournalEntry.created_at >= cutoff)
        .order_by(JournalEntry.created_at)
        .all()
    )

    # Merge and sort by date
    all_dates = set()
    emotion_map = {}
    journal_map = {}

    for log in emotion_logs:
        date_str = log.created_at.strftime("%Y-%m-%d")
        all_dates.add(date_str)
        emotion_map[date_str] = log.detected_emotion

    for entry in journal_entries:
        date_str = entry.created_at.strftime("%Y-%m-%d")
        all_dates.add(date_str)
        journal_map[date_str] = entry.sentiment_score

    sorted_dates = sorted(all_dates)

    return TrendData(
        dates=sorted_dates,
        emotions=[emotion_map.get(d) for d in sorted_dates],
        sentiment_scores=[journal_map.get(d) for d in sorted_dates],
        drift_scores=result.get("journal_trend", []),
    )
