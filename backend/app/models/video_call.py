import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CallStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    ENDED = "ended"
    DECLINED = "declined"


class VideoCall(Base):
    __tablename__ = "video_calls"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    caller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    callee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True)
    status: Mapped[CallStatus] = mapped_column(Enum(CallStatus), default=CallStatus.PENDING)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    caller = relationship("User", foreign_keys=[caller_id])
    callee = relationship("User", foreign_keys=[callee_id])
