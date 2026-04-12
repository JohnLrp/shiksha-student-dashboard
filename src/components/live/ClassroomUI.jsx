import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { IoChatbubblesOutline } from "react-icons/io5";

/**
 * ClassroomUI
 *
 * Props:
 *   role      — "PRESENTER" | "STUDENT"
 *   sessionId — UUID of the live session (for WebSocket + TeacherControls)
 *   onLeave   — callback to clear cache + navigate away
 */
export default function ClassroomUI({ role, sessionId, onLeave }) {
  const isPresenter = role === "PRESENTER";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [messages, setMessages] = useState([]);

  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const room = useRoomContext();

  /* ══════════════════════════════════════════
     WebSocket — session state + chat
     Connects to the existing LiveSessionConsumer
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (!sessionId) return;

    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${proto}://${window.location.host}/ws/live-session/${sessionId}/`
    );
    wsRef.current = ws;

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      // Session status from Redis / DB on connect, or broadcast updates
      if (msg.type === "initial_state" || msg.type === "session_update") {
        setSessionStatus(msg.data.status);
      }

      // Full chat history delivered on connect
      if (msg.type === "chat_history") {
        setMessages(
          msg.data.map((m) => ({
            ...m,
            isMe: m.sender_id === String(room.localParticipant?.identity),
          }))
        );
      }

      // Single new chat message broadcast to the group
      if (msg.type === "chat_message") {
        setMessages((prev) => [
          ...prev,
          {
            ...msg.data,
            isMe: msg.data.sender_id === String(room.localParticipant?.identity),
          },
        ]);
      }
    };

    ws.onerror = (e) => console.error("Session WS error", e);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, room]);

  /* ══════════════════════════════════════════
     Send chat via WebSocket
  ══════════════════════════════════════════ */
  const handleSendMessage = (text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "chat_message", text }));
  };

  /* ══════════════════════════════════════════
     Raise / lower hand listener (LiveKit data channel)
  ══════════════════════════════════════════ */
  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        if (msg.type === "raise-hand") {
          const identity = participant.identity;
          setRaisedHands((prev) => ({ ...prev, [identity]: true }));

          if (isPresenter) {
            const toastId = Date.now() + Math.random();
            setRaiseHandToasts((prev) => [...prev, { id: toastId, identity }]);
            setTimeout(
              () => setRaiseHandToasts((prev) => prev.filter((t) => t.id !== toastId)),
              5000
            );
          }
        }

        if (msg.type === "lower-hand") {
          const identity = participant.identity;
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[identity];
            return updated;
          });
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, isPresenter]);

  /* ══════════════════════════════════════════
     Fullscreen
  ══════════════════════════════════════════ */
  const toggleFullscreen = () => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  /* ══════════════════════════════════════════
     Tracks
  ══════════════════════════════════════════ */
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;

  /* ══════════════════════════════════════════
     Paused overlay — students only
     Shown when teacher manually pauses the session
  ══════════════════════════════════════════ */
  if (!isPresenter && sessionStatus === "PAUSED") {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "#0d1117",
        color: "#e8eaf2",
        gap: 16,
      }}>
        <div style={{ fontSize: 52 }}>⏸</div>
        <h2 style={{ margin: 0, fontWeight: 600 }}>Session paused by teacher</h2>
        <p style={{ color: "#6b7591", margin: 0, fontSize: 14 }}>
          Please wait, the session will resume shortly
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     Wait screen — no tracks yet
  ══════════════════════════════════════════ */
  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>
            {isPresenter
              ? "Enable your camera to start the session"
              : "Waiting for teacher to start…"}
          </h2>
          {!isPresenter && (
            <p>You'll be connected as soon as the session begins</p>
          )}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     Main UI
  ══════════════════════════════════════════ */
  return (
    <div
      className={`classroom-layout${isFullscreen ? " fs-mode" : ""}`}
      ref={containerRef}
    >
      {/* Raise-hand toasts — presenter only */}
      {isPresenter && raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              ✋ <strong>{t.identity}</strong> raised their hand
            </div>
          ))}
        </div>
      )}

      {/* MAIN STAGE */}
      <div className={`main-stage${!sidebarOpen ? " full-width" : ""}`}>
        <VideoTrack trackRef={mainTrack} />

        {/* PiP camera when screen sharing */}
        {pipTrack && (
          <div className="pip-camera">
            <VideoTrack trackRef={pipTrack} />
          </div>
        )}

        {/*
          TeacherControls rendered ONCE here.
          It is NOT rendered in LiveSessionDetail — that was the duplication bug.
        */}
        {isPresenter && (
          <TeacherControls sessionId={sessionId} onLeave={onLeave} />
        )}

        {/* Overlay buttons */}
        <div className="video-overlay-actions">
          <button
            className="ov-btn"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <IoChatbubblesOutline size={17} />
          </button>
          <button className="ov-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <MdFullscreenExit size={19} /> : <MdFullscreen size={19} />}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel raisedHands={raisedHands} />
          <ChatPanel
            role={role}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      )}

      {/* Student control bar — leave uses onLeave to clear cache */}
      <ControlBar onLeave={onLeave} />

      {/* Only students see the raise hand button */}
      {!isPresenter && <RaiseHandButton />}
    </div>
  );
}
