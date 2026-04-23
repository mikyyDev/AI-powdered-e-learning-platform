from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.video_call import CallStatus
from app.schemas.user import UserOut


class CallCreate(BaseModel):
    callee_id: int
    course_id: Optional[int] = None


class CallOut(BaseModel):
    id: int
    caller_id: int
    callee_id: int
    course_id: Optional[int]
    status: CallStatus
    duration_seconds: int
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    caller: Optional[UserOut] = None
    callee: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class CallSignal(BaseModel):
    type: str   # offer | answer | ice-candidate | hangup | accept | decline
    data: Optional[dict] = None
    candidate: Optional[str] = None
    sdp: Optional[str] = None
