import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, ForeignKey, Float, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class VitalsLog(Base):
    __tablename__ = "vitals_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), ForeignKey("users.id"), nullable=False, index=True
    )
    checkin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True, native_uuid=False), nullable=True, index=True
    )
    hr_bpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    hrv_rmssd_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    hrv_sdnn_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    stress_vital: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    video_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="vitals_logs")