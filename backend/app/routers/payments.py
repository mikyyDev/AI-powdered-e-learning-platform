from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.payment import PaymentInitiate, PaymentOut, ChapaInitResponse, ChapaVerifyResponse
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/initiate", summary="Start a Chapa payment or enroll for free")
async def initiate(
    data: PaymentInitiate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initiates a Chapa checkout for paid courses.
    For free courses, enrolls the user immediately and returns `{"enrolled": true}`.
    Default currency is ETB (Ethiopian Birr).
    """
    return await payment_service.initiate_payment(data, user, db)


@router.get(
    "/chapa/callback",
    response_model=ChapaVerifyResponse,
    summary="Chapa webhook callback — verifies payment and enrolls user",
)
async def chapa_callback(
    trx_ref: str | None = Query(None, description="Transaction reference returned by Chapa"),
    tx_ref: str | None = Query(None, description="Alternative transaction reference name from Chapa"),
    db: AsyncSession = Depends(get_db),
):
    resolved_ref = trx_ref or tx_ref
    if not resolved_ref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction reference is required",
        )
    return await payment_service.verify_payment(resolved_ref, db)


@router.get("/my", response_model=List[PaymentOut], summary="List current user's payment history")
async def my_payments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await payment_service.get_user_payments(user, db)
