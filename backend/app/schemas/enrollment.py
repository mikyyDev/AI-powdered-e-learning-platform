from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.schemas.course import CourseOut


class EnrollmentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime

    model_config = {"from_attributes": True}


class EnrollmentWithCourse(EnrollmentOut):
    course: Optional[CourseOut] = None


class ProgressUpdate(BaseModel):
    lesson_id: int
    is_completed: bool = True


class ProgressOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    lesson_id: int
    is_completed: bool
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}
