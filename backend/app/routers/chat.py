from typing import List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db, AsyncSessionLocal
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.models.user import User
from app.models.chat import MessageType
from app.schemas.chat import ChatRoomWithMembers, MessageOut
from app.services import chat_service
from app.websocket.connection_manager import manager
from app.utils.file_upload import save_upload

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/rooms", response_model=List[ChatRoomWithMembers])
async def my_rooms(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_service.get_user_rooms(user, db)


@router.post("/rooms/direct/{user_id}", response_model=ChatRoomWithMembers)
async def open_direct_chat(
    user_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_service.get_or_create_direct_room(user, user_id, db)


@router.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
async def get_messages(
    room_id: int,
    limit: int = Query(50, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_service.get_room_messages(room_id, user, db, limit)


@router.post("/rooms/{room_id}/files", response_model=MessageOut)
async def upload_file(
    room_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_url = await save_upload(file, "files")
    msg = await chat_service.save_message(room_id, user, file_url, MessageType.FILE, db)
    msg.file_name = file.filename
    await db.flush()
    return msg


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    token: str = Query(...),
):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=1008)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == int(payload["sub"])))
        user = result.scalar_one_or_none()

    if not user:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket, room_id, user.id)
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "")
            msg_type = MessageType(data.get("type", "text"))

            async with AsyncSessionLocal() as db:
                msg = await chat_service.save_message(room_id, user, content, msg_type, db)
                await db.commit()

            await manager.broadcast(room_id, {
                "id": msg.id,
                "room_id": room_id,
                "sender_id": user.id,
                "sender_name": user.full_name,
                "content": content,
                "type": msg_type.value,
                "created_at": msg.created_at.isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
