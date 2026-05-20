import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import React, { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

export default function ClassroomUI({
  role,
  sessionId: sessionIdProp,
  onLeave,
}) {
  const isPresenter = role === "PRESENTER";

  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activePanel, setActivePanel] = useState(null);

  const containerRef = useRef(null);
  const room = useRoomContext();

  const sessionId =
    sessionIdProp ||
    window.location.pathname.split("/").filter(Boolean).pop();

  const {
    messages: chatMessages,
    sendMessage,
    sessionStatus: hookStatus,
  } = useLiveSessionChat(sessionId);

  useEffect(() => {
    setSessionStatus(hookStatus);
  }, [hookStatus]);

  /* ───── PANEL TOGGLE ───── */
  const togglePanel = (panel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  /* ───── FULLSCREEN ───── */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = containerRef.current;
        if (el?.requestFullscreen) await el.requestFullscreen();
        else if (el?.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el?.msRequestFullscreen) await el.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen failed:", e);
    }
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("webkitfullscreenchange", onFSChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("webkitfullscreenchange", onFSChange);
    };
  }, []);

  /* ───── LOCAL RAISE HAND ───── */
  useEffect(() => {
    const handleLocal = (e) => {
      const { type, identity } = e.detail;
      if (type === "raise-hand") {
        setRaisedHands((prev) => ({ ...prev, [identity]: true }));
      }
      if (type === "lower-hand") {
        setRaisedHands((prev) => {
          const updated = { ...prev };
          delete updated[identity];
          return updated;
        });
      }
    };
    window.addEventListener("raise-hand-local", handleLocal);
    return () => window.removeEventListener("raise-hand-local", handleLocal);
  }, []);

  /* ───── REMOTE RAISE HAND ───── */
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
            setTimeout(() => {
              setRaiseHandToasts((prev) =>
                prev.filter((t) => t.id !== toastId)
              );
            }, 5000);
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

  /* ───── TRACKS ───── */
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;

  /* ───── PAUSED ───── */
  if (!isPresenter && sessionStatus === "PAUSED") {
    return (
      <div className="ls-paused">
        <div className="ls-paused__icon">&#9208;</div>
        <h2>Session paused by teacher</h2>
        <p>Please wait, the session will resume shortly</p>
      </div>
    );
  }

  /* ───── WAITING ───── */
  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>
            {isPresenter
              ? "Enable your camera to start the session"
              : "Waiting for teacher to start..."}
          </h2>
          {!isPresenter && (
            <p>You will be connected as soon as the session begins</p>
          )}
        </div>
      </div>
    );
  }

  const participantsList = room.remoteParticipants
    ? Array.from(room.remoteParticipants.values()).map((p) => ({
        name: p.name || p.identity,
        role: "Student",
      }))
    : [];

  /* ───── MAIN UI ───── */
  return (
    <div
      className={
        "classroom-layout" +
        (isFullscreen ? " fs-mode" : "") +
        (!activePanel ? " panel-closed" : "")
      }
      ref={containerRef}
    >

      {/* TOASTS */}
      {isPresenter && raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              <strong>{t.identity}</strong> raised their hand
            </div>
          ))}
        </div>
      )}

      {/* LEFT COLUMN: video + control bar */}
      <div className="classroom-main">

        {/* VIDEO */}
        <div className="main-stage">
          <VideoTrack trackRef={mainTrack} />

          {pipTrack && (
            <div className="pip-camera">
              <VideoTrack trackRef={pipTrack} />
            </div>
          )}

          {isPresenter && (
            <TeacherControls sessionId={sessionId} onLeave={onLeave} />
          )}

          <button
            className="video-fs-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <MdFullscreenExit size={22} /> : <MdFullscreen size={22} />}
          </button>
        </div>

        {/* CONTROL BAR */}
        <ControlBar
          onLeave={onLeave}
          role={role}
          activePanel={activePanel}
          onTogglePanel={togglePanel}
        />
      </div>

      {activePanel && (
        <div className="right-sidebar">

          {activePanel === "chat" && (
            <>
              <ChatPanel
                role={role}
                messages={chatMessages}
                onSendMessage={sendMessage}
                participants={participantsList}
              />
              {!isPresenter && (
                <div className="chat-raise-hand-wrap">
                  <RaiseHandButton />
                </div>
              )}
            </>
          )}

          {activePanel === "people" && (
            <div className="side-panel">
              <div className="side-panel__header">
                <h3>People ({participantsList.length})</h3>
                <button
                  className="side-panel__close"
                  onClick={() => setActivePanel(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="side-panel__body">
                {participantsList.length === 0 ? (
                  <p className="side-panel__empty">No participants yet.</p>
                ) : (
                  participantsList.map((p, i) => (
                    <div className="side-panel__row" key={i}>
                      <div className="side-panel__avatar">
                        {p.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="side-panel__info">
                        <div className="side-panel__name">{p.name}</div>
                        <div className="side-panel__role">{p.role}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activePanel === "info" && (
            <div className="side-panel">
              <div className="side-panel__header">
                <h3>Session Info</h3>
                <button
                  className="side-panel__close"
                  onClick={() => setActivePanel(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="side-panel__body">
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Session ID</div>
                  <div className="side-panel__field-value">{sessionId}</div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Your role</div>
                  <div className="side-panel__field-value">
                    {isPresenter ? "Teacher" : "Student"}
                  </div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Participants</div>
                  <div className="side-panel__field-value">
                    {participantsList.length + 1}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}