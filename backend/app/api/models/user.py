import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    emotion_logs = relationship("EmotionLog", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
    voice_logs = relationship("VoiceLog", back_populates="user", cascade="all, delete-orphan")
    vitals_logs = relationship("VitalsLog", back_populates="user", cascade="all, delete-orphan")
    incongruence_records = relationship(
        "IncongruenceRecord", back_populates="user", cascade="all, delete-orphan"
    )
