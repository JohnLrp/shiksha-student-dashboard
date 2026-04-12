import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useState } from "react";
import api from "../../api/apiClient";

/**
 * TeacherControls
 *
 * Props:
 *   sessionId — UUID string of the current session (for pause API)
 *   onLeave   — callback to clear cache + navigate away
 */
export default function TeacherControls({ sessionId, onLeave }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const [paused, setPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(
      !localParticipant.isMicrophoneEnabled
    );
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(
      !localParticipant.isCameraEnabled
    );
  };

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(
      !localParticipant.isScreenShareEnabled
    );
  };

  const handlePauseResume = async () => {
    if (!sessionId) return;
    setPauseLoading(true);
    try {
      const res = await api.post(`/livestream/sessions/${sessionId}/pause/`);
      setPaused(res.data.status === "PAUSED");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to pause session.");
    } finally {
      setPauseLoading(false);
    }
  };

  const handleLeave = async () => {
    await room.disconnect();
    if (onLeave) onLeave();
  };

  return (
    <div className="control-bar">
      <button
        className="ctrl-btn"
        onClick={toggleMic}
        title={localParticipant.isMicrophoneEnabled ? "Mute" : "Unmute"}
      >
        {localParticipant.isMicrophoneEnabled ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
        <span>{localParticipant.isMicrophoneEnabled ? "Mute" : "Unmute"}</span>
      </button>

      <button
        className="ctrl-btn"
        onClick={toggleCamera}
        title={localParticipant.isCameraEnabled ? "Camera Off" : "Camera On"}
      >
        {localParticipant.isCameraEnabled ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16"/>
            <path d="M9.5 5H16a2 2 0 0 1 2 2v7.5"/>
            <polygon points="23 7 16 12 23 17 23 7"/>
          </svg>
        )}
        <span>{localParticipant.isCameraEnabled ? "Cam Off" : "Cam On"}</span>
      </button>

      <button
        className="ctrl-btn"
        onClick={toggleScreenShare}
        title={localParticipant.isScreenShareEnabled ? "Stop Share" : "Share Screen"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span>{localParticipant.isScreenShareEnabled ? "Stop Share" : "Share"}</span>
      </button>

      {/* Pause / Resume — hits the backend API */}
      <button
        className="ctrl-btn"
        onClick={handlePauseResume}
        disabled={pauseLoading}
        title={paused ? "Resume session" : "Pause session"}
        style={{
          background: paused ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
          color: paused ? "#22c55e" : "#f59e0b",
          border: `1px solid ${paused ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
          opacity: pauseLoading ? 0.6 : 1,
          cursor: pauseLoading ? "not-allowed" : "pointer",
        }}
      >
        <span style={{ fontSize: 16 }}>{paused ? "▶" : "⏸"}</span>
        <span>{pauseLoading ? "..." : paused ? "Resume" : "Pause"}</span>
      </button>

      {/* Leave — clears sessionStorage cache */}
      <button
        className="ctrl-btn ctrl-btn--leave"
        onClick={handleLeave}
        title="End session"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>End</span>
      </button>
    </div>
  );
}
