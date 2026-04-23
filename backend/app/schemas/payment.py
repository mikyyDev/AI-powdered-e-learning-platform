from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentInitiate(BaseModel):
    course_id: int
    currency: str = "ETB"


class PaymentOut(BaseModel):
    id: int
    user_id: int
    course_id: int
    amount: float
    currency: str
    payment_method: PaymentMethod
    transaction_id: Optional[str]
    status: PaymentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ChapaInitResponse(BaseModel):
    checkout_url: str
    transaction_id: str
    payment_id: int


class ChapaVerifyResponse(BaseModel):
    payment: PaymentOut
    enrolled: bool
    message: str
