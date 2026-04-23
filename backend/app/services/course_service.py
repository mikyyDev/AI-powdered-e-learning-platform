from typing import List, Optional
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status, UploadFile

from app.models.course import Course, Lesson, LessonMaterial
from app.models.enrollment import Enrollment, UserProgress
from app.models.payment import Payment
from app.models.rating import CourseRating
from app.models.ai_recommendation import AIRecommendation
from app.models.video_call import VideoCall
from app.models.user import User
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseOut, CourseWithLessons,
    CourseRoadmap, LessonCreate, LessonUpdate, LessonOut, LessonWithProgress,
    LessonMaterialOut,
)
from app.utils.file_upload import save_upload


async def create_course(data: CourseCreate, teacher: User, db: AsyncSession) -> CourseOut:
    course = Course(**data.model_dump(), teacher_id=teacher.id)
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return CourseOut.model_validate(course)


async def update_course(course_id: int, data: CourseUpdate, teacher: User, db: AsyncSession) -> CourseOut:
    course = await _get_course_or_404(course_id, db)
    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(course, field, value)

    await db.flush()
    await db.refresh(course)
    return CourseOut.model_validate(course)


async def delete_course(course_id: int, teacher: User, db: AsyncSession) -> None:
    course = await _get_course_or_404(course_id, db)
    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    # Remove dependent rows explicitly so foreign-key constraints do not block
    # deleting a course that already has enrollments, payments, progress, or ratings.
    await db.execute(
        delete(LessonMaterial).where(
            LessonMaterial.lesson_id.in_(select(Lesson.id).where(Lesson.course_id == course_id))
        )
    )
    await db.execute(delete(UserProgress).where(UserProgress.course_id == course_id))
    await db.execute(delete(Enrollment).where(Enrollment.course_id == course_id))
    await db.execute(delete(Payment).where(Payment.course_id == course_id))
    await db.execute(delete(AIRecommendation).where(AIRecommendation.course_id == course_id))
    await db.execute(delete(CourseRating).where(CourseRating.course_id == course_id))
    await db.execute(delete(VideoCall).where(VideoCall.course_id == course_id))
    await db.delete(course)
    await db.flush()


async def get_courses(db: AsyncSession, skip: int = 0, limit: int = 20, category: Optional[str] = None) -> List[CourseOut]:
    q = select(Course).where(Course.is_published == True)
    if category:
        q = q.where(Course.category == category)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return [CourseOut.model_validate(c) for c in result.scalars().all()]


async def get_course_roadmap(course_id: int, user: User, db: AsyncSession) -> CourseRoadmap:
    course = await _get_course_or_404(course_id, db)

    enrolled = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
    )
    is_enrolled = enrolled.scalar_one_or_none() is not None

    lessons_result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.materials))
        .where(Lesson.course_id == course_id)
        .order_by(Lesson.order)
    )
    lessons = lessons_result.scalars().all()

    progress_result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user.id, UserProgress.course_id == course_id)
    )
    progress_map = {p.lesson_id: p.is_completed for p in progress_result.scalars().all()}

    lesson_list: List[LessonWithProgress] = []
    completed_count = 0

    for i, lesson in enumerate(lessons):
        is_completed = progress_map.get(lesson.id, False)
        # First lesson always unlocked; rest unlock after previous is completed
        is_unlocked = lesson.is_free_preview or is_enrolled and (i == 0 or progress_map.get(lessons[i - 1].id, False))

        if is_completed:
            completed_count += 1

        lesson_list.append(
            LessonWithProgress(
                **LessonOut.model_validate(lesson).model_dump(),
                is_completed=is_completed,
                is_unlocked=is_unlocked,
            )
        )

    total = len(lessons)
    percent = round((completed_count / total) * 100, 1) if total else 0.0

    return CourseRoadmap(
        **CourseOut.model_validate(course).model_dump(),
        lessons=lesson_list,
        total_lessons=total,
        completed_lessons=completed_count,
        progress_percent=percent,
        is_enrolled=is_enrolled,
    )


async def add_lesson(course_id: int, data: LessonCreate, teacher: User, db: AsyncSession) -> LessonOut:
    course = await _get_course_or_404(course_id, db)
    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    lesson = Lesson(**data.model_dump(), course_id=course_id)
    db.add(lesson)
    await db.flush()
    await db.refresh(lesson)
    return await _serialize_lesson(lesson.id, db)


async def update_lesson(lesson_id: int, data: LessonUpdate, teacher: User, db: AsyncSession) -> LessonOut:
    lesson = await _get_lesson_or_404(lesson_id, db)
    course = await _get_course_or_404(lesson.course_id, db)

    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)

    await db.flush()
    await db.refresh(lesson)
    return await _serialize_lesson(lesson.id, db)


async def delete_lesson(lesson_id: int, teacher: User, db: AsyncSession) -> None:
    lesson = await _get_lesson_or_404(lesson_id, db)
    course = await _get_course_or_404(lesson.course_id, db)
    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    await db.execute(delete(LessonMaterial).where(LessonMaterial.lesson_id == lesson_id))
    await db.execute(delete(UserProgress).where(UserProgress.lesson_id == lesson_id))
    await db.delete(lesson)
    await db.flush()


async def list_lesson_materials(lesson_id: int, teacher: User, db: AsyncSession) -> List[LessonMaterialOut]:
    lesson = await _get_lesson_or_404(lesson_id, db)
    course = await _get_course_or_404(lesson.course_id, db)

    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    result = await db.execute(
        select(LessonMaterial)
        .where(LessonMaterial.lesson_id == lesson_id)
        .order_by(LessonMaterial.created_at)
    )
    return [LessonMaterialOut.model_validate(material) for material in result.scalars().all()]


async def add_lesson_material(
    lesson_id: int,
    file: UploadFile,
    title: Optional[str],
    teacher: User,
    db: AsyncSession,
) -> LessonMaterialOut:
    lesson = await _get_lesson_or_404(lesson_id, db)
    course = await _get_course_or_404(lesson.course_id, db)

    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    file_name = file.filename or "lesson-material"
    display_title = title.strip() if title and title.strip() else Path(file_name).stem or file_name
    file_url = await save_upload(file, "lesson_materials")

    material = LessonMaterial(
        lesson_id=lesson_id,
        title=display_title,
        file_name=file_name,
        file_url=file_url,
        mime_type=file.content_type,
    )
    db.add(material)
    await db.flush()
    await db.refresh(material)
    return LessonMaterialOut.model_validate(material)


async def delete_lesson_material(material_id: int, teacher: User, db: AsyncSession) -> None:
    result = await db.execute(select(LessonMaterial).where(LessonMaterial.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    lesson = await _get_lesson_or_404(material.lesson_id, db)
    course = await _get_course_or_404(lesson.course_id, db)

    if course.teacher_id != teacher.id and teacher.role.value != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    await db.delete(material)
    await db.flush()


async def _get_course_or_404(course_id: int, db: AsyncSession) -> Course:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


async def _get_lesson_or_404(lesson_id: int, db: AsyncSession) -> Lesson:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson


async def _serialize_lesson(lesson_id: int, db: AsyncSession) -> LessonOut:
    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.materials))
        .where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one()
    return LessonOut.model_validate(lesson)
