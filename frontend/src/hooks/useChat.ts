"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Message } from "@/types";
import { chatService } from "@/services/chat.service";

export function useChat(roomId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const loadHistory = useCallback(async () => {
    if (!roomId) return;
    const history = await chatService.messages(roomId);
    setMessages(history);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    loadHistory();

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = chatService.createWebSocket(roomId, token);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data as Message]);
    };

    return () => ws.close();
  }, [roomId, loadHistory]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content, type: "text" }));
    }
  }, []);

  return { messages, sendMessage, isConnected };
}
