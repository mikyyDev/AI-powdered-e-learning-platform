from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserOut


class RatingCreate(BaseModel):
    course_id: int
    stars: int = Field(ge=1, le=5)
    review: Optional[str] = Field(None, max_length=1000)


class RatingOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    stars: int
    review: Optional[str]
    created_at: datetime
    user: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class CourseStats(BaseModel):
    course_id: int
    total_students: int
    avg_rating: float
    total_ratings: int
    completion_rate: float
