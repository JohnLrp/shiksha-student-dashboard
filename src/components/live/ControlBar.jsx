import {
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import { useState, useEffect, useRef } from "react";

export default function ControlBar({ onLeave }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [canUnmute, setCanUnmute] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  /* ── timer ── */
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* ── mic ── */
  const toggleMic = async () => {
    if (!micOn && !canUnmute) return;
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  /* ── video ── */
  const toggleVideo = async () => {
    const next = !videoOn;
    await localParticipant.setCameraEnabled(next);
    setVideoOn(next);
  };

  /* ── screen share ── */
  const toggleScreen = async () => {
    const next = !screenOn;
    try {
      await localParticipant.setScreenShareEnabled(next);
      setScreenOn(next);
    } catch (e) {
      console.error("screen share failed", e);
    }
  };

  /* ── force mute from teacher ── */
  useEffect(() => {
    const handleData = (payload) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);
        if (msg.type === "force-mute") {
          localParticipant.setMicrophoneEnabled(false);
          setMicOn(false);
          setCanUnmute(false);
        }
        if (msg.type === "force-unmute") {
          setCanUnmute(true);
          localParticipant.setMicrophoneEnabled(true);
          setMicOn(true);
        }
      } catch {}
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, localParticipant]);

  const leaveRoom = async () => {
    await room.disconnect();
    if (onLeave) onLeave();
  };

  return (
    <div className="control-bar">

      {/* LEFT — TIMER */}
      <div className="cb-timer">{formatTime(elapsed)}</div>

      {/* CENTER — MAIN ACTIONS */}
      <div className="cb-center">

        {/* Mute */}
        <button
          className="cb-btn"
          onClick={toggleMic}
          title={micOn ? "Mute" : canUnmute ? "Unmute" : "Only teacher can unmute"}
        >
          <div className={`cb-icon ${!micOn ? "cb-icon--off" : ""}`}>
            {micOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </div>
          <span className="cb-label">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        {/* Video */}
        <button className="cb-btn" onClick={toggleVideo} title="Toggle camera">
          <div className={`cb-icon ${!videoOn ? "cb-icon--off" : ""}`}>
            {videoOn ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </div>
          <span className="cb-label">Video</span>
        </button>

        {/* Screen Share */}
        <button className="cb-btn" onClick={toggleScreen} title="Share screen">
          <div className={`cb-icon ${screenOn ? "cb-icon--active" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span className="cb-label">Screen</span>
        </button>

        {/* Other (3-dot menu placeholder) */}
        <button className="cb-btn" title="More options">
          <div className="cb-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </div>
          <span className="cb-label">Other</span>
        </button>

        {/* Leave */}
        <button className="cb-btn" onClick={leaveRoom} title="Leave class">
          <div className="cb-icon cb-icon--leave">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span className="cb-label">Leave</span>
        </button>

      </div>

      {/* RIGHT — Info / People / Chat */}
      <div className="cb-right">
        <button className="cb-side-btn" title="Info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Info</span>
        </button>

        <button className="cb-side-btn" title="People">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>People</span>
        </button>

        <button className="cb-side-btn" title="Chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat</span>
        </button>
      </div>

    </div>
  );
}