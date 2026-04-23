import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, AsyncSessionLocal
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.models.user import User
from app.models.video_call import VideoCall, CallStatus
from app.schemas.video_call import CallCreate, CallOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/calls", tags=["Video Calls"])

# room_id -> {user_id: websocket}
_call_peers: dict[int, dict[int, WebSocket]] = {}


@router.post("", response_model=CallOut, status_code=201)
async def initiate_call(
    data: CallCreate,
    caller: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    call = VideoCall(
        caller_id=caller.id,
        callee_id=data.callee_id,
        course_id=data.course_id,
        status=CallStatus.PENDING,
    )
    db.add(call)
    await db.flush()
    await db.refresh(call)
    return _enrich(call, caller, None)


@router.get("/my", response_model=List[CallOut])
async def my_calls(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VideoCall).where(
            (VideoCall.caller_id == user.id) | (VideoCall.callee_id == user.id)
        ).order_by(VideoCall.created_at.desc()).limit(20)
    )
    return result.scalars().all()


@router.patch("/{call_id}/accept", response_model=CallOut)
async def accept_call(
    call_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    call = await _get_call(call_id, db)
    if call.callee_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the callee")
    call.status = CallStatus.ACTIVE
    call.started_at = datetime.now(timezone.utc)
    await db.flush()
    return call


@router.patch("/{call_id}/end", response_model=CallOut)
async def end_call(
    call_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    call = await _get_call(call_id, db)
    if call.caller_id != user.id and call.callee_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not part of this call")
    call.status = CallStatus.ENDED
    call.ended_at = datetime.now(timezone.utc)
    if call.started_at:
        delta = call.ended_at - call.started_at.replace(tzinfo=timezone.utc) if call.started_at.tzinfo is None else call.ended_at - call.started_at
        call.duration_seconds = int(delta.total_seconds())
    await db.flush()
    return call


@router.websocket("/ws/{call_id}")
async def call_ws(
    websocket: WebSocket,
    call_id: int,
    token: str = Query(...),
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == int(payload["sub"])))
        user = result.scalar_one_or_none()

    if not user:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    if call_id not in _call_peers:
        _call_peers[call_id] = {}
    _call_peers[call_id][user.id] = websocket

    # Notify the other peer that someone connected
    await _broadcast_to_others(call_id, user.id, {"type": "peer-joined", "user_id": user.id, "name": user.full_name})

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg["from_user_id"] = user.id
            await _broadcast_to_others(call_id, user.id, msg)
    except WebSocketDisconnect:
        _call_peers[call_id].pop(user.id, None)
        await _broadcast_to_others(call_id, user.id, {"type": "peer-left", "user_id": user.id})


async def _broadcast_to_others(call_id: int, sender_id: int, msg: dict):
    dead = []
    for uid, ws in (_call_peers.get(call_id) or {}).items():
        if uid != sender_id:
            try:
                await ws.send_text(json.dumps(msg))
            except Exception:
                dead.append(uid)
    for uid in dead:
        _call_peers[call_id].pop(uid, None)


async def _get_call(call_id: int, db: AsyncSession) -> VideoCall:
    result = await db.execute(select(VideoCall).where(VideoCall.id == call_id))
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    return call


def _enrich(call: VideoCall, caller: User, callee: User | None) -> CallOut:
    return CallOut(
        id=call.id, caller_id=call.caller_id, callee_id=call.callee_id,
        course_id=call.course_id, status=call.status,
        duration_seconds=call.duration_seconds, created_at=call.created_at,
        started_at=call.started_at, ended_at=call.ended_at,
        caller=UserOut.model_validate(caller),
        callee=UserOut.model_validate(callee) if callee else None,
    )
