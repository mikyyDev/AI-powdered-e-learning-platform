from typing import List, Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_teacher
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseOut, CourseRoadmap, LessonCreate, LessonUpdate, LessonOut, LessonMaterialOut
from app.services import course_service
from app.utils.file_upload import save_upload

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=List[CourseOut])
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await course_service.get_courses(db, skip, limit, category)


@router.post("", response_model=CourseOut, status_code=201)
async def create_course(
    data: CourseCreate,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.create_course(data, teacher, db)


@router.get("/{course_id}/roadmap", response_model=CourseRoadmap)
async def get_roadmap(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.get_course_roadmap(course_id, user, db)


@router.patch("/{course_id}", response_model=CourseOut)
async def update_course(
    course_id: int,
    data: CourseUpdate,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.update_course(course_id, data, teacher, db)


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    await course_service.delete_course(course_id, teacher, db)


@router.post("/{course_id}/thumbnail", response_model=CourseOut)
async def upload_thumbnail(
    course_id: int,
    file: UploadFile = File(...),
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    url = await save_upload(file, "thumbnails")
    return await course_service.update_course(course_id, type("U", (), {"thumbnail": url, "model_dump": lambda s, **kw: {"thumbnail": url}})(), teacher, db)


# ── Lessons ──────────────────────────────────────────────────────────────────

@router.post("/{course_id}/lessons", response_model=LessonOut, status_code=201)
async def add_lesson(
    course_id: int,
    data: LessonCreate,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.add_lesson(course_id, data, teacher, db)


@router.patch("/lessons/{lesson_id}", response_model=LessonOut)
async def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.update_lesson(lesson_id, data, teacher, db)


@router.delete("/lessons/{lesson_id}", status_code=204)
async def delete_lesson(
    lesson_id: int,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    await course_service.delete_lesson(lesson_id, teacher, db)


@router.get("/lessons/{lesson_id}/materials", response_model=List[LessonMaterialOut])
async def list_lesson_materials(
    lesson_id: int,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.list_lesson_materials(lesson_id, teacher, db)


@router.post("/lessons/{lesson_id}/materials", response_model=LessonMaterialOut, status_code=201)
async def add_lesson_material(
    lesson_id: int,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    return await course_service.add_lesson_material(lesson_id, file, title, teacher, db)


@router.delete("/materials/{material_id}", status_code=204)
async def delete_lesson_material(
    material_id: int,
    teacher: User = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    await course_service.delete_lesson_material(material_id, teacher, db)
