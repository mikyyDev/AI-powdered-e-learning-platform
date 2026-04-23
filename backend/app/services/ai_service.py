import json
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, not_

from app.core.config import settings
from app.models.course import Course, Lesson
from app.models.enrollment import Enrollment, UserProgress
from app.models.ai_recommendation import AIRecommendation
from app.models.user import User
from app.schemas.ai import AIRecommendationOut, AILearningPathOut
from app.schemas.course import CourseOut


async def get_recommendations(user: User, db: AsyncSession) -> List[AIRecommendationOut]:
    enrolled_result = await db.execute(
        select(Enrollment.course_id).where(Enrollment.user_id == user.id)
    )
    enrolled_ids = list(enrolled_result.scalars().all())

    q = select(Course).where(Course.is_published == True)
    if enrolled_ids:
        q = q.where(not_(Course.id.in_(enrolled_ids)))
    result = await db.execute(q.limit(20))
    available_courses = result.scalars().all()

    if not available_courses:
        return []

    progress_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user.id,
            UserProgress.is_completed == True,
        )
    )
    completed_count = len(list(progress_result.scalars().all()))

    user_context = {
        "completed_lessons": completed_count,
        "enrolled_courses": len(enrolled_ids),
        "role": user.role.value,
    }
    courses_data = [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category.value,
            "level": c.level.value,
            "price": c.price,
        }
        for c in available_courses
    ]

    scored = await _ask_groq(user_context, courses_data)

    for item in scored[:5]:
        existing = await db.execute(
            select(AIRecommendation).where(
                AIRecommendation.user_id == user.id,
                AIRecommendation.course_id == item["course_id"],
            )
        )
        rec = existing.scalar_one_or_none()
        if rec:
            rec.score = item["score"]
            rec.reason = item["reason"]
        else:
            db.add(
                AIRecommendation(
                    user_id=user.id,
                    course_id=item["course_id"],
                    score=item["score"],
                    reason=item["reason"],
                )
            )

    await db.flush()

    recs_result = await db.execute(
        select(AIRecommendation)
        .where(AIRecommendation.user_id == user.id)
        .order_by(AIRecommendation.score.desc())
        .limit(5)
    )
    recs = recs_result.scalars().all()

    out = []
    for rec in recs:
        course_result = await db.execute(select(Course).where(Course.id == rec.course_id))
        course = course_result.scalar_one_or_none()
        out.append(
            AIRecommendationOut(
                id=rec.id,
                user_id=rec.user_id,
                course_id=rec.course_id,
                score=rec.score,
                reason=rec.reason,
                created_at=rec.created_at,
                course=CourseOut.model_validate(course) if course else None,
            )
        )
    return out


async def get_learning_path_tip(course_id: int, user: User, db: AsyncSession) -> AILearningPathOut:
    progress_result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user.id,
            UserProgress.course_id == course_id,
            UserProgress.is_completed == True,
        )
    )
    completed_ids = [p.lesson_id for p in progress_result.scalars().all()]

    next_result = await db.execute(
        select(Lesson)
        .where(Lesson.course_id == course_id, not_(Lesson.id.in_(completed_ids)))
        .order_by(Lesson.order)
        .limit(3)
    )
    next_lessons = [l.id for l in next_result.scalars().all()]

    tip = await _ask_groq_tip(len(completed_ids), len(next_lessons))

    return AILearningPathOut(course_id=course_id, suggested_next_lessons=next_lessons, tip=tip)


# ── Groq helpers ──────────────────────────────────────────────────────────────

async def _ask_groq(user_context: dict, courses: list) -> list:
    if not settings.GROQ_API_KEY:
        return _fallback_scores(courses)

    try:
        from groq import AsyncGroq

        client = AsyncGroq(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
        )

        prompt = (
            "You are a personalized learning recommendation engine.\n"
            f"User context: {json.dumps(user_context)}\n"
            f"Available courses: {json.dumps(courses)}\n\n"
            "Return ONLY a valid JSON array of the top 5 recommendations:\n"
            '[{"course_id": <int>, "score": <float 0.0-1.0>, "reason": "<one sentence>"}]\n'
            "No extra text, no markdown."
        )

        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        raw = response.choices[0].message.content.strip()
        return json.loads(raw)

    except Exception:
        return _fallback_scores(courses)


async def _ask_groq_tip(completed: int, remaining: int) -> str:
    if not settings.GROQ_API_KEY:
        return _fallback_tip(completed, remaining)

    try:
        from groq import AsyncGroq

        client = AsyncGroq(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
        )

        prompt = (
            f"A student has completed {completed} lessons and has {remaining} remaining.\n"
            "Write a single motivational tip (max 20 words) to keep them on track."
        )

        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

        return response.choices[0].message.content.strip()

    except Exception:
        return _fallback_tip(completed, remaining)


def _fallback_scores(courses: list) -> list:
    return [
        {"course_id": c["id"], "score": round(0.95 - i * 0.1, 2), "reason": "Matches your learning profile"}
        for i, c in enumerate(courses[:5])
    ]


def _fallback_tip(completed: int, remaining: int) -> str:
    if completed == 0:
        return "Start your first lesson to begin your learning journey!"
    if remaining == 0:
        return "You completed all lessons in this course — great work!"
    return f"You've completed {completed} lessons. Keep going, you're doing great!"
