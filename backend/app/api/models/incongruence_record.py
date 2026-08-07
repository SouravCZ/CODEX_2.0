import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, ForeignKey, Float, Boolean, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class IncongruenceRecord(Base):
    __tablename__ = "incongruence_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("users.id"), nullable=False, index=True
    )
    checkin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), nullable=True, index=True
    )
    wellness_index: Mapped[float | None] = mapped_column(Float, nullable=True)
    masking_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    masking_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    aligned: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    face_wellbeing: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_wellbeing: Mapped[float | None] = mapped_column(Float, nullable=True)
    vitals_wellbeing: Mapped[float | None] = mapped_column(Float, nullable=True)
    text_wellbeing: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="incongruence_records")