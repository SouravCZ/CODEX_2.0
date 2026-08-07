import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from api.models.user import User
from api.models.journal_entry import JournalEntry
from api.schemas.schemas import JournalCreate, JournalResponse
from api.routes.auth import get_current_user
from api.services.journal_analyzer import analyze_journal

router = APIRouter(prefix="/journal", tags=["journal"])


@router.post("/", response_model=JournalResponse, status_code=201)
def create_journal_entry(
    data: JournalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new journal entry with AI analysis."""
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Journal content cannot be empty")

    analysis = analyze_journal(data.content)

    entry = JournalEntry(
        user_id=current_user.id,
        content=data.content,
        sentiment_score=analysis["sentiment_score"],
        sentiment_label=analysis["sentiment_label"],
        emotional_tone=analysis["emotional_tone"],
        stress_level=analysis["stress_level"],
        key_themes=json.dumps(analysis["key_themes"]),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return JournalResponse.model_validate(entry)


@router.get("/history", response_model=list[JournalResponse])
def get_journal_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent journal entries for the current user."""
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == current_user.id)
        .order_by(JournalEntry.created_at.desc())
        .limit(limit)
        .all()
    )
    return [JournalResponse.model_validate(e) for e in entries]
