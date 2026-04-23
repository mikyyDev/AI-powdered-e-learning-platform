import uuid
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.payment import PaymentInitiate, PaymentOut, ChapaInitResponse, ChapaVerifyResponse


async def initiate_payment(data: PaymentInitiate, user: User, db: AsyncSession) -> ChapaInitResponse | dict:
    course = await _get_course(data.course_id, db)

    existing = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == data.course_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled in this course")

    if course.is_free or course.price == 0:
        return await _enroll_free(user, course, db)

    return await _initiate_chapa(user, course, data.currency, db)


async def verify_payment(tx_ref: str, db: AsyncSession) -> ChapaVerifyResponse:
    result = await db.execute(select(Payment).where(Payment.transaction_id == tx_ref))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    if payment.status == PaymentStatus.SUCCESS:
        return ChapaVerifyResponse(
            payment=PaymentOut.model_validate(payment),
            enrolled=True,
            message="Already verified and enrolled",
        )

    chapa_status = (await _verify_with_chapa(tx_ref)).lower()

    if chapa_status == "success":
        payment.status = PaymentStatus.SUCCESS
        await db.flush()
        enrolled = await _create_enrollment(payment, db)
        return ChapaVerifyResponse(
            payment=PaymentOut.model_validate(payment),
            enrolled=enrolled,
            message="Payment verified. Enrollment complete.",
        )

    if chapa_status in {"pending", "processing", "ongoing"}:
        payment.status = PaymentStatus.PENDING
        await db.flush()
        return ChapaVerifyResponse(
            payment=PaymentOut.model_validate(payment),
            enrolled=False,
            message="Payment is still processing. Please wait and try again.",
        )

    payment.status = PaymentStatus.FAILED
    await db.flush()
    return ChapaVerifyResponse(
        payment=PaymentOut.model_validate(payment),
        enrolled=False,
        message="Payment verification failed",
    )


async def get_user_payments(user: User, db: AsyncSession) -> list[PaymentOut]:
    result = await db.execute(select(Payment).where(Payment.user_id == user.id))
    return [PaymentOut.model_validate(p) for p in result.scalars().all()]


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _enroll_free(user: User, course: Course, db: AsyncSession) -> dict:
    payment = Payment(
        user_id=user.id,
        course_id=course.id,
        amount=0.0,
        currency="ETB",
        payment_method=PaymentMethod.FREE,
        status=PaymentStatus.SUCCESS,
    )
    db.add(payment)
    await db.flush()
    db.add(Enrollment(user_id=user.id, course_id=course.id, payment_id=payment.id))
    await db.flush()
    return {"message": "Enrolled for free", "course_id": course.id, "enrolled": True}


async def _initiate_chapa(user: User, course: Course, currency: str, db: AsyncSession) -> ChapaInitResponse:
    tx_ref = f"lp-{user.id}-{course.id}-{uuid.uuid4().hex[:8]}"
    name_parts = user.full_name.split()
    first_name = name_parts[0]
    last_name = name_parts[-1] if len(name_parts) > 1 else "."

    payload = {
        "amount": str(course.price),
        "currency": currency,
        "email": user.email,
        "first_name": first_name,
        "last_name": last_name,
        "tx_ref": tx_ref,
        "callback_url": settings.CHAPA_CALLBACK_URL,
        "return_url": settings.CHAPA_RETURN_URL,
        "customization[title]": course.title,
        "customization[description]": f"Enroll in {course.title}",
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.CHAPA_BASE_URL}/transaction/initialize",
            headers={
                "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15.0,
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Chapa error: {resp.text}",
        )

    chapa_data = resp.json().get("data", {})
    checkout_url = chapa_data.get("checkout_url", "")

    payment = Payment(
        user_id=user.id,
        course_id=course.id,
        amount=course.price,
        currency=currency,
        payment_method=PaymentMethod.CHAPA,
        transaction_id=tx_ref,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    return ChapaInitResponse(checkout_url=checkout_url, transaction_id=tx_ref, payment_id=payment.id)


async def _verify_with_chapa(tx_ref: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.CHAPA_BASE_URL}/transaction/verify/{tx_ref}",
            headers={"Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}"},
            timeout=15.0,
        )
    if resp.status_code != 200:
        return "failed"
    return resp.json().get("data", {}).get("status", "failed")


async def _create_enrollment(payment: Payment, db: AsyncSession) -> bool:
    existing = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == payment.user_id,
            Enrollment.course_id == payment.course_id,
        )
    )
    if existing.scalar_one_or_none():
        return True
    db.add(Enrollment(user_id=payment.user_id, course_id=payment.course_id, payment_id=payment.id))
    await db.flush()
    return True


async def _get_course(course_id: int, db: AsyncSession) -> Course:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course
