import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import React, { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

export default function StudentPrivateClassroomUI({
  role = "STUDENT",
  sessionId: sessionIdProp,
  onLeave,
}) {
  const isPresenter = false;

  const [raisedHands, setRaisedHands] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  const containerRef = useRef(null);
  const room = useRoomContext();

  const sessionId =
    sessionIdProp ||
    window.location.pathname.split("/").filter(Boolean).pop();

  const { messages: chatMessages, sendMessage } = useLiveSessionChat(sessionId);

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

  /* ───── RE-RENDER ON TRACK CHANGES ───── */
  useEffect(() => {
    if (!room) return;
    const events = [
      "trackMuted", "trackUnmuted", "trackPublished", "trackUnpublished",
      "trackSubscribed", "trackUnsubscribed", "participantConnected",
      "participantDisconnected", "localTrackPublished", "localTrackUnpublished",
    ];
    events.forEach((evt) => room.on(evt, bump));
    return () => { events.forEach((evt) => room.off(evt, bump)); };
  }, [room]);

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
          setRaisedHands((prev) => ({ ...prev, [participant.identity]: true }));
        }
        if (msg.type === "lower-hand") {
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[participant.identity];
            return updated;
          });
        }
      } catch {}
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  /* ───── TRACKS ───── */
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;

  /* ───── WAITING ───── */
  if (!mainTrack) {
    return (
      <div className="waiting-screen">
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <h2>Waiting for teacher to start...</h2>
          <p>You will be connected as soon as the session begins</p>
        </div>
      </div>
    );
  }

  const localId = room.localParticipant?.identity;
  const sessionIdFinal = sessionId;

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

      {/* RIGHT SIDEBAR */}
      {activePanel && (
        <div className="right-sidebar">

          {/* CHAT PANEL */}
          {activePanel === "chat" && (
            <>
              <ChatPanel
                role={role}
                messages={chatMessages}
                onSendMessage={sendMessage}
              />
              <div className="chat-raise-hand-wrap">
                <RaiseHandButton />
              </div>
            </>
          )}

          {/* PEOPLE PANEL */}
          {activePanel === "people" && (
            <ParticipantsPanel raisedHands={raisedHands} />
          )}

          {/* SESSION INFO PANEL */}
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
                  <div className="side-panel__field-value">{sessionIdFinal}</div>
                </div>
                <div className="side-panel__field">
                  <div className="side-panel__field-label">Your role</div>
                  <div className="side-panel__field-value">Student</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
