/**
 * FILE: STUDENT_DASHBOARD/src/components/live/PrivateClassroomUI.jsx
 *
 * Private session room UI — matches Teacher UI visually.
 * Student-only controls: mic, cam, screen share, raise hand, chat, leave.
 * No teacher power controls (record, mute all, mute individual, remove, end for all).
 *
 * Props:
 *   role    — "student" | "teacher"
 *   session — { subject, topic, ... }
 */

import {
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState, useEffect, useCallback } from "react";

import "./privateClassroom.css";
import ChatPanel from "./ChatPanel";

/* ═══════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════ */

function useTimer() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((text, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);
  return { toasts, show };
}

function useSpeakingDetect(participant) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
    if (!participant) return;
    const onSpeaking = (speaking) => setIsSpeaking(speaking);
    participant.on("isSpeakingChanged", onSpeaking);
    return () => participant.off("isSpeakingChanged", onSpeaking);
  }, [participant]);
  return isSpeaking;
}

function SpeakingTile({ track, children }) {
  const isSpeaking = useSpeakingDetect(track.participant);
  return children(isSpeaking);
}

/* ═══════════════════════════════════════════════════════════
   VIDEO TILE — identical to Teacher UI
═══════════════════════════════════════════════════════════ */

function Tile({ track, localId, pinned, onPin, raisedHands, large }) {
  const p = track.participant;
  const name = p.name || p.identity || "?";
  const isLocal = p.identity === localId;
  let metadata = {};
  try { metadata = JSON.parse(p.metadata || "{}"); } catch {}
  const isTeacher = metadata.role === "teacher";
  const isMuted = !p.isMicrophoneEnabled;
  const isCamOff = !p.isCameraEnabled;
  const hasHand = raisedHands[p.identity];

  return (
    <SpeakingTile track={track}>
      {(isSpeaking) => (
        <div className={`pvt-tile ${isSpeaking ? "pvt-tile-speaking" : ""} ${pinned ? "pvt-tile-pinned" : ""}`}>
          {/* Video or placeholder */}
          {!isCamOff && (track.publication?.isSubscribed || isLocal) ? (
            <VideoTrack trackRef={track} />
          ) : (
            <ParticipantPlaceholder name={name} large={large} />
          )}

          {/* Muted bar */}
          {isMuted && (
            <div className="pvt-muted-bar">🔇 Muted</div>
          )}

          {/* Raised hand */}
          {hasHand && (
            <div className="pvt-hand-indicator">🖐</div>
          )}

          {/* Name label */}
          <div className="pvt-tile-label">
            {isTeacher && <span className="pvt-host-badge">HOST</span>}
            {isLocal ? `${name} (You)` : name}
            {isSpeaking && <span className="pvt-speaking-dot">●</span>}
          </div>

          {/* Pin button */}
          <button
            className={`pvt-pin-btn ${pinned ? "pvt-pin-active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onPin(p.identity); }}
            title={pinned ? "Unpin" : "Pin"}
          >
            {pinned ? "📌" : "📍"}
          </button>
        </div>
      )}
    </SpeakingTile>
  );
}

/* ═══════════════════════════════════════════════════════════
   PLACEHOLDER (cam off)
═══════════════════════════════════════════════════════════ */

function ParticipantPlaceholder({ name, large }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const size = large ? 80 : 56;
  return (
    <div className="pvt-placeholder">
      <div className="pvt-placeholder-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
        {initial}
      </div>
      <div className="pvt-placeholder-name">{name}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PARTICIPANTS LIST (sidebar) — no mute/remove controls
═══════════════════════════════════════════════════════════ */

function ParticipantsList({ participants, localId, raisedHands }) {
  return (
    <div className="pvt-participants-list">
      {participants.map((p) => {
        const name = p.name || p.identity;
        const isLocal = p.identity === localId;
        let metadata = {};
        try { metadata = JSON.parse(p.metadata || "{}"); } catch {}
        const isTeacher = metadata.role === "teacher";

        return (
          <div key={p.identity} className="pvt-participant-item">
            <div className="pvt-participant-avatar">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="pvt-participant-info">
              <div className="pvt-participant-name">
                {name} {isLocal && "(You)"}
              </div>
              <div className="pvt-participant-role">
                {isTeacher ? "👑 Host" : "Student"}
              </div>
            </div>
            <div className="pvt-participant-icons">
              <span>{p.isMicrophoneEnabled ? "🎤" : "🔇"}</span>
              <span>{p.isCameraEnabled ? "📹" : "📷"}</span>
              {raisedHands[p.identity] && <span>🖐</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */

export default function PrivateClassroomUI({ role, session }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const timer = useTimer();
  const { toasts, show } = useToast();

  const [sidebarTab, setSidebarTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [pinnedIds, setPinnedIds] = useState(new Set());

  // Get all tracks
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // Listen for data messages: raise/lower hand + teacher force mute/disconnect
  useEffect(() => {
    const decoder = new TextDecoder();

    const handleData = (payload, participant) => {
      try {
        const msg = JSON.parse(decoder.decode(payload));
        const id = participant?.identity || msg.sender;

        if (msg.type === "RAISE_HAND" && id) {
          setRaisedHands((prev) => ({ ...prev, [id]: true }));
          show(`${participant?.name || id} raised their hand 🖐`, "info");
        }
        if (msg.type === "LOWER_HAND" && id) {
          setRaisedHands((prev) => { const u = { ...prev }; delete u[id]; return u; });
        }

        // Teacher force-muted you
        if (msg.type === "FORCE_MUTE" && msg.target === localParticipant.identity) {
          localParticipant.setMicrophoneEnabled(false);
          setMicOn(false);
          show("You were muted by the teacher", "warn");
        }

        // Teacher removed you from session
        if (msg.type === "FORCE_DISCONNECT" && msg.target === localParticipant.identity) {
          show("You were removed from the session", "warn");
          setTimeout(() => room.disconnect(), 1000);
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, show, localParticipant]);

  // ── Controls ──

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
    show(next ? "Mic on" : "Mic muted", "info");
  };

  const toggleCam = async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
    show(next ? "Camera on" : "Camera off", "info");
  };

  const toggleScreen = async () => {
    const next = !screenSharing;
    await localParticipant.setScreenShareEnabled(next);
    setScreenSharing(next);
    show(next ? "Screen sharing started" : "Screen share stopped", "info");
  };

  const toggleHand = async () => {
    const next = !handRaised;
    const type = next ? "RAISE_HAND" : "LOWER_HAND";
    const encoder = new TextEncoder();
    await localParticipant.publishData(
      encoder.encode(JSON.stringify({ type })),
      { reliable: true }
    );
    setHandRaised(next);
    show(next ? "Hand raised 🖐" : "Hand lowered", "info");
  };

  const leaveRoom = async () => {
    if (window.confirm("Leave session?")) {
      show("You left", "info");
      setTimeout(async () => {
        await room.disconnect();
      }, 600);
    }
  };

  // ── Pin logic ──

  const togglePin = (identity) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(identity)) next.delete(identity);
      else if (next.size < 4) next.add(identity);
      return next;
    });
  };

  // ── Grid layout ──

  const camCount = cameraTracks.length;
  const gridClass =
    camCount <= 1 ? "pvt-grid-1" :
    camCount === 2 ? "pvt-grid-2" :
    camCount === 3 ? "pvt-grid-3" :
    camCount === 4 ? "pvt-grid-4" : "pvt-grid-many";

  const sortedCameraTracks = [...cameraTracks].sort((a, b) => {
    const aPin = pinnedIds.has(a.participant.identity) ? 0 : 1;
    const bPin = pinnedIds.has(b.participant.identity) ? 0 : 1;
    return aPin - bPin;
  });

  return (
    <div className="pvt-room">
      {/* ── Top Bar ── */}
      <div className="pvt-topbar">
        <div className="pvt-topbar-left">
          <div className="pvt-session-name">{session?.subject || "Private Session"}</div>
          <div className="pvt-session-sub">{session?.topic || session?.subject || "Private Session"}</div>
        </div>
        <div className="pvt-topbar-right">
          <span className="pvt-timer">⏱ {timer}</span>
          <span className="pvt-count">👥 {participants.length}</span>
        </div>
      </div>

      {/* ── Raised hand banner (visible to all) ── */}
      {Object.keys(raisedHands).length > 0 && (
        <div className="pvt-hand-banner">
          🖐 {Object.keys(raisedHands).length} participant{Object.keys(raisedHands).length !== 1 ? "s" : ""} raised hand
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="pvt-main">
        <div className="pvt-video-area">
          {screenTracks.length > 0 ? (
            <div className="pvt-screen-layout">
              <div className="pvt-screen-main">
                <VideoTrack trackRef={screenTracks[0]} />
              </div>
              <div className="pvt-screen-strip">
                {sortedCameraTracks.map((track) => (
                  <Tile
                    key={track.participant.identity}
                    track={track}
                    localId={localParticipant.identity}
                    pinned={pinnedIds.has(track.participant.identity)}
                    onPin={togglePin}
                    raisedHands={raisedHands}
                    large={false}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className={`pvt-video-grid ${gridClass}`}>
              {sortedCameraTracks.map((track) => (
                <Tile
                  key={track.participant.identity}
                  track={track}
                  localId={localParticipant.identity}
                  pinned={pinnedIds.has(track.participant.identity)}
                  onPin={togglePin}
                  raisedHands={raisedHands}
                  large={camCount <= 2}
                />
              ))}
            </div>
          )}

          {/* ── Control Bar — Student controls only ── */}
          <div className="pvt-controls">
            <div className="pvt-ctrl-left">
              <button
                className={`pvt-ctrl-btn ${handRaised ? "pvt-ctrl-active" : ""}`}
                onClick={toggleHand}
                title={handRaised ? "Lower Hand" : "Raise Hand"}
              >
                🖐
              </button>
            </div>
            <div className="pvt-ctrl-center">
              <button className={`pvt-ctrl-btn ${micOn ? "" : "pvt-ctrl-off"}`} onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}>
                {micOn ? "🎤" : "🔇"}
              </button>
              <button className={`pvt-ctrl-btn ${camOn ? "" : "pvt-ctrl-off"}`} onClick={toggleCam} title={camOn ? "Stop Camera" : "Start Camera"}>
                {camOn ? "📹" : "📷"}
              </button>
              <button className={`pvt-ctrl-btn ${screenSharing ? "pvt-ctrl-active" : ""}`} onClick={toggleScreen} title={screenSharing ? "Stop Share" : "Share Screen"}>
                🖥️
              </button>
              <button
                className={`pvt-ctrl-btn ${sidebarTab === "participants" && sidebarOpen ? "pvt-ctrl-active" : ""}`}
                onClick={() => { setSidebarTab("participants"); setSidebarOpen((o) => sidebarTab === "participants" ? !o : true); }}
                title="Participants"
              >
                👥
              </button>
              <button
                className={`pvt-ctrl-btn ${sidebarTab === "chat" && sidebarOpen ? "pvt-ctrl-active" : ""}`}
                onClick={() => { setSidebarTab("chat"); setSidebarOpen((o) => sidebarTab === "chat" ? !o : true); }}
                title="Chat"
              >
                💬
              </button>
            </div>
            <div className="pvt-ctrl-right">
              <button className="pvt-leave-btn" onClick={leaveRoom}>
                ← Leave
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div className="pvt-sidebar">
            <div className="pvt-sidebar-tabs">
              <button
                className={`pvt-sidebar-tab ${sidebarTab === "participants" ? "active" : ""}`}
                onClick={() => setSidebarTab("participants")}
              >
                Participants ({participants.length})
              </button>
              <button
                className={`pvt-sidebar-tab ${sidebarTab === "chat" ? "active" : ""}`}
                onClick={() => setSidebarTab("chat")}
              >
                Chat
              </button>
            </div>
            <div className="pvt-sidebar-body">
              {sidebarTab === "participants" ? (
                <ParticipantsList
                  participants={participants}
                  localId={localParticipant.identity}
                  raisedHands={raisedHands}
                />
              ) : (
                <ChatPanel role={role} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toasts ── */}
      <div className="pvt-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`pvt-toast pvt-toast-${t.type}`}>{t.text}</div>
        ))}
      </div>
    </div>
  );
}
