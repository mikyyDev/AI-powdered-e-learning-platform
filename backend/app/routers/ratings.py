from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.rating import CourseRating
from app.models.enrollment import Enrollment, UserProgress
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingOut, CourseStats

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("", response_model=RatingOut, status_code=201)
async def rate_course(
    data: RatingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    enrolled = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == data.course_id)
    )
    if not enrolled.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Enroll in this course first")

    existing = await db.execute(
        select(CourseRating).where(CourseRating.user_id == user.id, CourseRating.course_id == data.course_id)
    )
    rating = existing.scalar_one_or_none()
    if rating:
        rating.stars = data.stars
        rating.review = data.review
    else:
        rating = CourseRating(user_id=user.id, course_id=data.course_id, stars=data.stars, review=data.review)
        db.add(rating)

    await db.flush()
    await db.refresh(rating)

    from app.schemas.user import UserOut
    return RatingOut(
        id=rating.id, user_id=rating.user_id, course_id=rating.course_id,
        stars=rating.stars, review=rating.review, created_at=rating.created_at,
        user=UserOut.model_validate(user),
    )


@router.get("/course/{course_id}", response_model=List[RatingOut])
async def course_ratings(course_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CourseRating).where(CourseRating.course_id == course_id).order_by(CourseRating.created_at.desc())
    )
    ratings = result.scalars().all()
    out = []
    from app.schemas.user import UserOut
    from app.models.user import User as UserModel
    for r in ratings:
        u_res = await db.execute(select(UserModel).where(UserModel.id == r.user_id))
        u = u_res.scalar_one_or_none()
        out.append(RatingOut(
            id=r.id, user_id=r.user_id, course_id=r.course_id,
            stars=r.stars, review=r.review, created_at=r.created_at,
            user=UserOut.model_validate(u) if u else None,
        ))
    return out


@router.get("/course/{course_id}/stats", response_model=CourseStats)
async def course_stats(course_id: int, db: AsyncSession = Depends(get_db)):
    total_students = (await db.execute(
        select(func.count()).where(Enrollment.course_id == course_id)
    )).scalar() or 0

    avg_stars = (await db.execute(
        select(func.avg(CourseRating.stars)).where(CourseRating.course_id == course_id)
    )).scalar() or 0.0

    total_ratings = (await db.execute(
        select(func.count()).where(CourseRating.course_id == course_id)
    )).scalar() or 0

    from app.models.course import Lesson
    total_lessons = (await db.execute(
        select(func.count()).where(Lesson.course_id == course_id)
    )).scalar() or 0

    completed_users = 0
    if total_students > 0 and total_lessons > 0:
        fully_done = (await db.execute(
            select(func.count(func.distinct(UserProgress.user_id))).where(
                UserProgress.course_id == course_id, UserProgress.is_completed == True
            )
        )).scalar() or 0
        completed_users = fully_done

    completion_rate = round((completed_users / total_students) * 100, 1) if total_students > 0 else 0.0

    return CourseStats(
        course_id=course_id,
        total_students=total_students,
        avg_rating=round(float(avg_stars), 1),
        total_ratings=total_ratings,
        completion_rate=completion_rate,
    )
