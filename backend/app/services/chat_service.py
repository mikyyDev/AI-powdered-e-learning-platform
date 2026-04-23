from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException, status

from app.models.chat import ChatRoom, ChatRoomMember, Message, MessageType
from app.models.user import User
from app.schemas.chat import ChatRoomCreate, ChatRoomOut, ChatRoomWithMembers, MessageOut
from app.schemas.user import UserOut


async def get_or_create_direct_room(user_a: User, user_b_id: int, db: AsyncSession) -> ChatRoomWithMembers:
    # Find existing direct room between these two users
    result = await db.execute(
        select(ChatRoom)
        .join(ChatRoomMember, ChatRoom.id == ChatRoomMember.room_id)
        .where(ChatRoom.is_direct == True, ChatRoomMember.user_id == user_a.id)
    )
    rooms = result.scalars().all()

    for room in rooms:
        member_result = await db.execute(
            select(ChatRoomMember).where(ChatRoomMember.room_id == room.id, ChatRoomMember.user_id == user_b_id)
        )
        if member_result.scalar_one_or_none():
            return await _room_with_members(room, db)

    # Create new direct room
    room = ChatRoom(is_direct=True)
    db.add(room)
    await db.flush()

    for uid in [user_a.id, user_b_id]:
        db.add(ChatRoomMember(room_id=room.id, user_id=uid))

    await db.flush()
    await db.refresh(room)
    return await _room_with_members(room, db)


async def get_user_rooms(user: User, db: AsyncSession) -> List[ChatRoomWithMembers]:
    result = await db.execute(
        select(ChatRoom)
        .join(ChatRoomMember, ChatRoom.id == ChatRoomMember.room_id)
        .where(ChatRoomMember.user_id == user.id)
    )
    rooms = result.scalars().all()
    return [await _room_with_members(r, db) for r in rooms]


async def get_room_messages(room_id: int, user: User, db: AsyncSession, limit: int = 50) -> List[MessageOut]:
    await _verify_member(room_id, user.id, db)

    result = await db.execute(
        select(Message)
        .where(Message.room_id == room_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    out = []
    for msg in reversed(messages):
        sender_result = await db.execute(select(User).where(User.id == msg.sender_id))
        sender = sender_result.scalar_one_or_none()
        out.append(MessageOut(
            **{c.key: getattr(msg, c.key) for c in msg.__table__.columns},
            sender=UserOut.model_validate(sender) if sender else None,
        ))
    return out


async def save_message(room_id: int, sender: User, content: str, msg_type: MessageType, db: AsyncSession) -> MessageOut:
    await _verify_member(room_id, sender.id, db)

    msg = Message(room_id=room_id, sender_id=sender.id, content=content, message_type=msg_type)
    db.add(msg)
    await db.flush()
    await db.refresh(msg)

    return MessageOut(
        **{c.key: getattr(msg, c.key) for c in msg.__table__.columns},
        sender=UserOut.model_validate(sender),
    )


async def _room_with_members(room: ChatRoom, db: AsyncSession) -> ChatRoomWithMembers:
    members_result = await db.execute(
        select(User)
        .join(ChatRoomMember, User.id == ChatRoomMember.user_id)
        .where(ChatRoomMember.room_id == room.id)
    )
    members = [UserOut.model_validate(u) for u in members_result.scalars().all()]
    return ChatRoomWithMembers(**ChatRoomOut.model_validate(room).model_dump(), members=members)


async def _verify_member(room_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(ChatRoomMember).where(ChatRoomMember.room_id == room_id, ChatRoomMember.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this room")
