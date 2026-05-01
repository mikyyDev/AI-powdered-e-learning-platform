import api from "@/lib/api";
import type { ChatRoom, Message } from "@/types";

export const chatService = {
  async myRooms(): Promise<ChatRoom[]> {
    const res = await api.get("/chat/rooms");
    return res.data;
  },

  async openDirect(userId: number): Promise<ChatRoom> {
    const res = await api.post(`/chat/rooms/direct/${userId}`);
    return res.data;
  },

  async messages(roomId: number, limit = 50): Promise<Message[]> {
    const res = await api.get(`/chat/rooms/${roomId}/messages`, { params: { limit } });
    return res.data;
  },

  async uploadFile(roomId: number, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/chat/rooms/${roomId}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  createWebSocket(roomId: number, token: string): WebSocket {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api";
    return new WebSocket(`${wsBase}/chat/ws/${roomId}?token=${token}`);
  },
};
