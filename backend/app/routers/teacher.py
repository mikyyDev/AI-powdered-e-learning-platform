from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.dependencies import get_current_teacher
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment, UserProgress
from app.models.rating import CourseRating
from app.schemas.course import CourseOut
from app.schemas.rating import CourseStats

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.get("/courses", response_model=List[CourseOut])
async def my_courses(
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Course).where(Course.teacher_id == teacher.id))
    return result.scalars().all()


@router.get("/courses/{course_id}/stats", response_model=CourseStats)
async def my_course_stats(
    course_id: int,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    total_students = (await db.execute(
        select(func.count()).where(Enrollment.course_id == course_id)
    )).scalar() or 0

    avg_stars = (await db.execute(
        select(func.avg(CourseRating.stars)).where(CourseRating.course_id == course_id)
    )).scalar() or 0.0

    total_ratings = (await db.execute(
        select(func.count(CourseRating.id)).where(CourseRating.course_id == course_id)
    )).scalar() or 0

    from app.models.course import Lesson
    total_lessons = (await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == course_id)
    )).scalar() or 0

    completed_users = (await db.execute(
        select(func.count(func.distinct(UserProgress.user_id))).where(
            UserProgress.course_id == course_id, UserProgress.is_completed == True
        )
    )).scalar() or 0

    completion_rate = round((completed_users / total_students) * 100, 1) if total_students > 0 else 0.0

    return CourseStats(
        course_id=course_id,
        total_students=total_students,
        avg_rating=round(float(avg_stars), 1),
        total_ratings=total_ratings,
        completion_rate=completion_rate,
    )


@router.get("/dashboard")
async def teacher_dashboard(
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    courses_result = await db.execute(select(Course).where(Course.teacher_id == teacher.id))
    courses = courses_result.scalars().all()
    course_ids = [c.id for c in courses]

    total_students = 0
    if course_ids:
        total_students = (await db.execute(
            select(func.count(func.distinct(Enrollment.user_id))).where(Enrollment.course_id.in_(course_ids))
        )).scalar() or 0

    published = sum(1 for c in courses if c.is_published)

    return {
        "total_courses": len(courses),
        "published_courses": published,
        "draft_courses": len(courses) - published,
        "total_students": total_students,
        "courses": [CourseOut.model_validate(c) for c in courses],
    }
