import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, ForeignKey, Float, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("users.id"), nullable=False, index=True
    )
    checkin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    sentiment_label: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emotional_tone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    stress_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    key_themes: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array stored as text
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="journal_entries")
