from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.enrollment import Enrollment, UserProgress
from app.models.course import Lesson
from app.models.payment import PaymentMethod
from app.schemas.enrollment import EnrollmentOut, ProgressUpdate, ProgressOut

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("", response_model=List[EnrollmentOut])
async def my_enrollments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Enrollment).where(Enrollment.user_id == user.id))
    return result.scalars().all()


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unenroll(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.payment))
        .where(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    payment = enrollment.payment
    if payment and payment.payment_method == PaymentMethod.CHAPA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid enrollments cannot be unenrolled automatically",
        )

    await db.execute(
        delete(UserProgress).where(
            UserProgress.user_id == user.id,
            UserProgress.course_id == course_id,
        )
    )
    await db.delete(enrollment)
    await db.flush()


@router.post("/progress", response_model=ProgressOut)
async def update_progress(
    data: ProgressUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify enrolled
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == data.lesson_id))
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    enrolled = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == lesson.course_id)
    )
    if not enrolled.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    existing = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user.id, UserProgress.lesson_id == data.lesson_id)
    )
    prog = existing.scalar_one_or_none()

    if prog:
        prog.is_completed = data.is_completed
        prog.completed_at = datetime.now(timezone.utc) if data.is_completed else None
    else:
        prog = UserProgress(
            user_id=user.id,
            course_id=lesson.course_id,
            lesson_id=data.lesson_id,
            is_completed=data.is_completed,
            completed_at=datetime.now(timezone.utc) if data.is_completed else None,
        )
        db.add(prog)

    await db.flush()
    await db.refresh(prog)
    return prog
