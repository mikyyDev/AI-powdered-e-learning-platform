from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.schemas.course import CourseOut


class AIRecommendationOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    score: float
    reason: Optional[str]
    created_at: datetime
    course: Optional[CourseOut] = None

    model_config = {"from_attributes": True}


class AIRecommendationList(BaseModel):
    recommendations: List[AIRecommendationOut]
    generated_at: datetime


class AILearningPathOut(BaseModel):
    course_id: int
    suggested_next_lessons: List[int]
    tip: str
