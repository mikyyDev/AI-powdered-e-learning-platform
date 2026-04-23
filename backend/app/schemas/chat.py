from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.chat import MessageType
from app.schemas.user import UserOut


class ChatRoomCreate(BaseModel):
    name: Optional[str] = None
    member_ids: List[int]
    is_direct: bool = True


class ChatRoomOut(BaseModel):
    id: int
    name: Optional[str]
    is_direct: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRoomWithMembers(ChatRoomOut):
    members: List[UserOut] = []


class MessageCreate(BaseModel):
    content: Optional[str] = None
    message_type: MessageType = MessageType.TEXT


class MessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: Optional[str]
    message_type: MessageType
    file_url: Optional[str]
    file_name: Optional[str]
    is_read: bool
    created_at: datetime
    sender: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class WSMessage(BaseModel):
    type: str
    room_id: int
    content: Optional[str] = None
    message_type: MessageType = MessageType.TEXT
