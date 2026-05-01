"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Signal {
  type: string;
  sdp?: string;
  candidate?: string;
  from_user_id?: number;
  name?: string;
  data?: RTCIceCandidateInit;
}

export function useVideoCall(callId: number | null, userId: number | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [status, setStatus] = useState<"waiting" | "connecting" | "active" | "ended">("waiting");

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

  const send = useCallback((msg: object) => {
    wsRef.current?.send(JSON.stringify(msg));
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  }, []);

  const initPC = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);

    pc.ontrack = (e) => { e.streams[0].getTracks().forEach((t) => remote.addTrack(t)); };
    pc.onicecandidate = (e) => { if (e.candidate) send({ type: "ice-candidate", candidate: e.candidate.toJSON() }); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") { setStatus("active"); startTimer(); }
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") setStatus("ended");
    };
    return pc;
  }, [send, startTimer]);

  const startCall = useCallback(async () => {
    if (!pcRef.current || !localStream) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    send({ type: "offer", sdp: offer.sdp });
    setStatus("connecting");
  }, [send, localStream]);

  useEffect(() => {
    if (!callId || !userId) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setLocalStream(stream);
      const pc = initPC(stream);

      const token = localStorage.getItem("access_token");
      const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api";
      const ws = new WebSocket(`${wsBase}/calls/ws/${callId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); setStatus("ended"); };

      ws.onmessage = async (e) => {
        const sig: Signal = JSON.parse(e.data);

        if (sig.type === "peer-joined" && sig.from_user_id !== userId) {
          // We are the caller — send offer
          await startCall();
        }
        if (sig.type === "offer" && sig.sdp) {
          await pc.setRemoteDescription({ type: "offer", sdp: sig.sdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: "answer", sdp: answer.sdp }));
          setStatus("connecting");
        }
        if (sig.type === "answer" && sig.sdp) {
          await pc.setRemoteDescription({ type: "answer", sdp: sig.sdp });
        }
        if (sig.type === "ice-candidate" && sig.data) {
          await pc.addIceCandidate(new RTCIceCandidate(sig.data));
        }
        if (sig.type === "hangup") {
          setStatus("ended");
          pc.close();
        }
      };
    }).catch(() => setStatus("ended"));

    return () => {
      wsRef.current?.close();
      pcRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, userId]);

  const hangup = useCallback(() => {
    send({ type: "hangup" });
    pcRef.current?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("ended");
  }, [send, localStream]);

  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((c) => !c);
  }, [localStream]);

  const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return { localStream, remoteStream, status, isConnected, isMuted, isCameraOff, callDuration: formatDuration(callDuration), hangup, toggleMute, toggleCamera, startCall };
}
