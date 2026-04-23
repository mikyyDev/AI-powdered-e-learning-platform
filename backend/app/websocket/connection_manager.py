import json
from collections import defaultdict
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, user_id)
        self._rooms: Dict[int, List[tuple[WebSocket, int]]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, room_id: int, user_id: int):
        await websocket.accept()
        self._rooms[room_id].append((websocket, user_id))

    def disconnect(self, websocket: WebSocket, room_id: int):
        self._rooms[room_id] = [
            (ws, uid) for ws, uid in self._rooms[room_id] if ws is not websocket
        ]

    async def broadcast(self, room_id: int, message: dict):
        dead = []
        for ws, uid in self._rooms[room_id]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, room_id)

    async def send_personal(self, websocket: WebSocket, message: dict):
        await websocket.send_text(json.dumps(message))


manager = ConnectionManager()
