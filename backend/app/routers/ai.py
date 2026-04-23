from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import AIRecommendationOut, AILearningPathOut
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/recommendations", response_model=List[AIRecommendationOut])
async def get_recommendations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ai_service.get_recommendations(user, db)


@router.get("/learning-path/{course_id}", response_model=AILearningPathOut)
async def get_learning_path(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ai_service.get_learning_path_tip(course_id, user, db)
