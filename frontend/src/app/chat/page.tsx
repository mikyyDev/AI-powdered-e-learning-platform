"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  MessageSquare,
  Paperclip,
  Wifi,
  WifiOff,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { chatService } from "@/services/chat.service";
import { type ChatRoom, type Message } from "@/types";
import { cn, getInitials } from "@/lib/utils";

export default function ChatPage() {
  const router = useRouter();
  const { user, initialize, isLoading } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, isConnected } = useChat(
    activeRoom?.id ?? null,
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    chatService.myRooms().then(setRooms);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  }

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeRoom) return;
      setUploading(true);
      try {
        await chatService.uploadFile(activeRoom.id, file);
      } catch {
        // silent — backend may not have file endpoint in all environments
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [activeRoom],
  );

  const getRoomName = (room: ChatRoom) => {
    if (room.name) return room.name;
    if (room.members && user) {
      const other = room.members.find((m) => m.id !== user.id);
      return other?.full_name ?? "Chat";
    }
    return `Room #${room.id}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">
        <div className="glass rounded-2xl px-6 py-4 text-sm">
          Loading chat...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16 h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 border-r border-white/5 bg-dark-800/60 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" /> Messages
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rooms.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No conversations yet
              </div>
            ) : (
              rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                    activeRoom?.id === room.id
                      ? "bg-brand-500/15 border border-brand-500/25"
                      : "hover:bg-white/5",
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getInitials(getRoomName(room))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {getRoomName(room)}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {room.is_direct ? "Direct message" : "Group"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {activeRoom ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="h-14 border-b border-white/5 px-5 flex items-center justify-between bg-dark-800/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {getInitials(getRoomName(activeRoom))}
                </div>
                <span className="font-medium text-white text-sm">
                  {getRoomName(activeRoom)}
                </span>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  isConnected ? "text-emerald-400" : "text-slate-500",
                )}
              >
                {isConnected ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                {isConnected ? "Live" : "Disconnected"}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={msg.id ?? i}
                    message={msg}
                    isOwn={msg.sender_id === user.id}
                  />
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-dark-800/40">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  aria-label="Attach a file"
                  title="Attach a file"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !isConnected}
                  aria-label="Attach a file"
                  title="Attach a file"
                  className="text-slate-500 hover:text-brand-400 transition-colors p-2 rounded-lg hover:bg-brand-500/10 disabled:opacity-40"
                >
                  <Paperclip
                    className={cn("w-5 h-5", uploading && "animate-pulse")}
                  />
                </button>
                <input
                  className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), handleSend())
                  }
                  aria-label="Message input"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !isConnected}
                  aria-label="Send message"
                  title="Send message"
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 flex items-center justify-center text-white hover:shadow-glow-sm disabled:opacity-40 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="w-14 h-14 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-400 font-medium">
                Select a conversation
              </p>
              <p className="text-slate-600 text-sm mt-1">
                Choose a chat from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex gap-2.5", isOwn && "flex-row-reverse")}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5",
          isOwn
            ? "bg-gradient-to-br from-brand-500 to-indigo-500"
            : "bg-gradient-to-br from-slate-600 to-slate-700",
        )}
      >
        {message.sender ? getInitials(message.sender.full_name) : "?"}
      </div>
      <div className={cn("max-w-[70%]", isOwn && "items-end flex flex-col")}>
        {message.sender && !isOwn && (
          <p className="text-xs text-slate-500 mb-1 ml-1">
            {message.sender.full_name}
          </p>
        )}
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isOwn
              ? "bg-gradient-to-r from-brand-500 to-indigo-500 text-white rounded-tr-sm"
              : "glass text-slate-200 rounded-tl-sm",
          )}
        >
          {message.content}
        </div>
        <p
          className={cn(
            "text-[10px] text-slate-600 mt-1 px-1",
            isOwn && "text-right",
          )}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
