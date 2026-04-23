from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.course import CourseLevel, CourseCategory


class LessonCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: int = Field(ge=1)
    duration_minutes: int = Field(default=0, ge=0)
    is_free_preview: bool = False


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: Optional[int] = Field(None, ge=1)
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_free_preview: Optional[bool] = None


class LessonMaterialOut(BaseModel):
    id: int
    lesson_id: int
    title: str
    file_name: str
    file_url: str
    mime_type: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class LessonOut(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str]
    content: Optional[str]
    video_url: Optional[str]
    order: int
    duration_minutes: int
    is_free_preview: bool
    created_at: datetime
    materials: List[LessonMaterialOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class LessonWithProgress(LessonOut):
    is_completed: bool = False
    is_unlocked: bool = False


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    short_description: Optional[str] = Field(None, max_length=500)
    price: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD", max_length=10)
    level: CourseLevel = CourseLevel.BEGINNER
    category: CourseCategory = CourseCategory.OTHER
    estimated_hours: float = Field(default=0.0, ge=0)
    is_free: bool = False


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=500)
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    level: Optional[CourseLevel] = None
    category: Optional[CourseCategory] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    is_free: Optional[bool] = None
    is_published: Optional[bool] = None


class CourseOut(BaseModel):
    id: int
    title: str
    description: str
    short_description: Optional[str]
    thumbnail: Optional[str]
    price: float
    currency: str
    level: CourseLevel
    category: CourseCategory
    estimated_hours: float
    is_published: bool
    is_free: bool
    teacher_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CourseWithLessons(CourseOut):
    lessons: List[LessonOut] = []


class CourseRoadmap(CourseOut):
    lessons: List[LessonWithProgress] = []
    total_lessons: int = 0
    completed_lessons: int = 0
    progress_percent: float = 0.0
    is_enrolled: bool = False
