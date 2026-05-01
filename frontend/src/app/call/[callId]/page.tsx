"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  Paperclip,
  Clock,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVideoCall } from "@/hooks/useVideoCall";
import { callService } from "@/services/call.service";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ChatMsg {
  text: string;
  fromSelf: boolean;
  time: string;
}

export default function VideoCallPage() {
  const { callId } = useParams<{ callId: string }>();
  const router = useRouter();
  const { user, initialize } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!callId || !user) return;

    callService
      .myCalls()
      .then((calls) => {
        const currentCall = calls.find((call) => call.id === Number(callId));
        setCourseId(currentCall?.course_id ?? null);
      })
      .catch(() => setCourseId(null));
  }, [callId, user]);

  const {
    localStream,
    remoteStream,
    status,
    isMuted,
    isCameraOff,
    callDuration,
    hangup,
    toggleMute,
    toggleCamera,
  } = useVideoCall(callId ? Number(callId) : null, user?.id ?? null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (status === "ended" && !isLeaving) {
      toast("Call ended");
      setTimeout(() => router.back(), 2000);
    }
  }, [status, router, isLeaving]);

  function sendChatMsg() {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [
      ...m,
      {
        text: chatInput.trim(),
        fromSelf: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatInput("");
  }

  async function handleEndCall() {
    setIsLeaving(true);
    try {
      await callService.end(Number(callId));
    } catch {
      /* ignore */
    }
    hangup();
    if (courseId) {
      router.push(`/courses/${courseId}`);
    } else {
      router.push("/dashboard");
    }
  }

  const statusLabels = {
    waiting: "Waiting…",
    connecting: "Connecting…",
    active: "Live",
    ended: "Call Ended",
  };
  const statusColors = {
    waiting: "text-amber-400",
    connecting: "text-blue-400",
    active: "text-emerald-400",
    ended: "text-rose-400",
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="h-14 glass border-b border-white/5 flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                status === "active"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400",
              )}
            />
            <span className={cn("text-sm font-medium", statusColors[status])}>
              {statusLabels[status]}
            </span>
          </div>
          {status === "active" && (
            <span className="flex items-center gap-1.5 text-sm text-white font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {callDuration}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            title={showChat ? "Hide chat" : "Show chat"}
            aria-label={showChat ? "Hide chat" : "Show chat"}
            className={cn(
              "p-2 rounded-lg transition-all",
              showChat
                ? "bg-brand-500/20 text-brand-300"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={handleEndCall}
            title="Leave call"
            aria-label="Leave call"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video */}
        <div className="flex-1 relative bg-dark-800">
          {/* Remote video (main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Placeholder when no remote video */}
          {status !== "active" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-glow animate-pulse">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <p className="text-slate-400 text-lg">{statusLabels[status]}</p>
                {status === "waiting" && (
                  <p className="text-slate-600 text-sm mt-1">
                    Waiting for the other person to join…
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-xl overflow-hidden border border-white/10 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                isCameraOff && "hidden",
              )}
            />
            {isCameraOff && (
              <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-slate-500" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <CallButton
              onClick={toggleMute}
              active={!isMuted}
              icon={isMuted ? MicOff : Mic}
              label={isMuted ? "Unmute" : "Mute"}
            />
            <CallButton
              onClick={toggleCamera}
              active={!isCameraOff}
              icon={isCameraOff ? VideoOff : Video}
              label={isCameraOff ? "Camera on" : "Camera off"}
            />
            <button
              onClick={handleEndCall}
              title="End call"
              aria-label="End call"
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow-lg hover:shadow-rose-500/30 transition-all"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/5 bg-dark-800/80 flex flex-col overflow-hidden"
            >
              <div className="h-12 flex items-center justify-between px-4 border-b border-white/5">
                <span className="text-sm font-semibold text-white">
                  In-call Chat
                </span>
                <button
                  onClick={() => setShowChat(false)}
                  title="Close chat"
                  aria-label="Close chat"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <p className="text-center text-slate-600 text-xs py-8">
                    No messages yet
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.fromSelf ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                        msg.fromSelf
                          ? "bg-gradient-to-r from-brand-500 to-indigo-500 text-white"
                          : "glass text-slate-200",
                      )}
                    >
                      <p>{msg.text}</p>
                      <p className="text-[10px] mt-1 opacity-60 text-right">
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              <div className="p-3 border-t border-white/5 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), sendChatMsg())
                  }
                  placeholder="Message…"
                  className="flex-1 glass rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                />
                <button
                  onClick={sendChatMsg}
                  title="Send message"
                  aria-label="Send message"
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 flex items-center justify-center text-white hover:shadow-glow-sm transition-all disabled:opacity-40"
                  disabled={!chatInput.trim()}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CallButton({
  onClick,
  active,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  active: boolean;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
        active
          ? "bg-white/15 hover:bg-white/20 text-white"
          : "bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30",
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
