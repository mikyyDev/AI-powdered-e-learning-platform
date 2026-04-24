import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models.course import Course, CourseCategory, CourseLevel
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.user import User, UserRole
from app.services import payment_service


TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.mark.asyncio
async def test_verify_payment_keeps_pending_status(monkeypatch):
    async def fake_verify(tx_ref: str) -> str:
        assert tx_ref == "tx-pending"
        return "pending"

    monkeypatch.setattr(payment_service, "_verify_with_chapa", fake_verify)

    async with TestSession() as session:
        teacher = User(
            email="teacher-pending@test.com",
            username="teacher_pending",
            full_name="Teacher Pending",
            hashed_password="hashed-password",
            role=UserRole.TEACHER,
        )
        student = User(
            email="student-pending@test.com",
            username="student_pending",
            full_name="Student Pending",
            hashed_password="hashed-password",
            role=UserRole.STUDENT,
        )
        session.add_all([teacher, student])
        await session.flush()

        course = Course(
            title="Pending Course",
            description="A course used to verify pending payments stay pending.",
            price=250.0,
            currency="ETB",
            level=CourseLevel.BEGINNER,
            category=CourseCategory.OTHER,
            teacher_id=teacher.id,
            is_published=True,
            is_free=False,
        )
        session.add(course)
        await session.flush()

        payment = Payment(
            user_id=student.id,
            course_id=course.id,
            amount=course.price,
            currency="ETB",
            payment_method=PaymentMethod.CHAPA,
            transaction_id="tx-pending",
            status=PaymentStatus.PENDING,
        )
        session.add(payment)
        await session.commit()

    async with TestSession() as session:
        result = await payment_service.verify_payment("tx-pending", session)
        await session.commit()

    assert result.enrolled is False
    assert result.payment.status == PaymentStatus.PENDING
    assert result.message == "Payment is still processing. Please wait and try again."