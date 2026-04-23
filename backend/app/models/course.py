import enum
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, Integer, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CourseLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseCategory(str, enum.Enum):
    PROGRAMMING = "programming"
    DESIGN = "design"
    BUSINESS = "business"
    MARKETING = "marketing"
    DATA_SCIENCE = "data_science"
    DEVOPS = "devops"
    MOBILE = "mobile"
    OTHER = "other"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    level: Mapped[CourseLevel] = mapped_column(Enum(CourseLevel), default=CourseLevel.BEGINNER)
    category: Mapped[CourseCategory] = mapped_column(Enum(CourseCategory), default=CourseCategory.OTHER)
    estimated_hours: Mapped[float] = mapped_column(Float, default=0.0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=False)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    teacher = relationship("User", back_populates="courses_teaching", foreign_keys=[teacher_id])
    lessons = relationship("Lesson", back_populates="course", order_by="Lesson.order", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")
    payments = relationship("Payment", back_populates="course")
    ai_recommendations = relationship("AIRecommendation", back_populates="course")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    is_free_preview: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    course = relationship("Course", back_populates="lessons")
    progress = relationship("UserProgress", back_populates="lesson")
    materials = relationship(
        "LessonMaterial",
        back_populates="lesson",
        order_by="LessonMaterial.created_at",
        cascade="all, delete-orphan",
    )


class LessonMaterial(Base):
    __tablename__ = "lesson_materials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    lesson = relationship("Lesson", back_populates="materials")
