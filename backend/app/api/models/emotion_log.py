import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Float, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("users.id"), nullable=False, index=True
    )
    checkin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), nullable=True, index=True
    )
    detected_emotion: Mapped[str] = mapped_column(String(30), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    happy: Mapped[float | None] = mapped_column(Float, nullable=True)
    sad: Mapped[float | None] = mapped_column(Float, nullable=True)
    angry: Mapped[float | None] = mapped_column(Float, nullable=True)
    neutral: Mapped[float | None] = mapped_column(Float, nullable=True)
    fear: Mapped[float | None] = mapped_column(Float, nullable=True)
    surprise: Mapped[float | None] = mapped_column(Float, nullable=True)
    disgust: Mapped[float | None] = mapped_column(Float, nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="emotion_logs")
