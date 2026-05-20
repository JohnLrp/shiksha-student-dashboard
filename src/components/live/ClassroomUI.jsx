import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import React, { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";

export default function ClassroomUI({
  role,
  sessionId: sessionIdProp,
  onLeave,
}) {
  const isPresenter = role === "PRESENTER";

  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);

  const containerRef = useRef(null);
  const room = useRoomContext();

  const sessionId =
    sessionIdProp ||
    window.location.pathname
      .split("/")
      .filter(Boolean)
      .pop();

  const {
    messages: chatMessages,
    sendMessage,
    sessionStatus: hookStatus,
  } = useLiveSessionChat(sessionId);

  useEffect(() => {
    setSessionStatus(hookStatus);
  }, [hookStatus]);

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
            setRaiseHandToasts((prev) => [
              ...prev,
              { id: toastId, identity },
            ]);
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

  const screenTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare
  );
  const cameraTrack = tracks.find(
    (t) => t.source === Track.Source.Camera
  );
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

  /* ───── MAIN UI ───── */
  return (
    <div className="classroom-layout" ref={containerRef}>

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

      {/* LEFT COLUMN: video + control bar stacked */}
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
            <TeacherControls
              sessionId={sessionId}
              onLeave={onLeave}
            />
          )}
        </div>

        {/* CONTROL BAR (now in normal flow, under video) */}
        <ControlBar onLeave={onLeave} />
      </div>

      {/* RIGHT COLUMN: chat panel */}
      <div className="right-sidebar">
        <ChatPanel
          role={role}
          messages={chatMessages}
          onSendMessage={sendMessage}
          participants={
            room.remoteParticipants
              ? Array.from(room.remoteParticipants.values()).map((p) => ({
                  name: p.name || p.identity,
                  role: "Student",
                }))
              : []
          }
        />

        {!isPresenter && (
          <div className="chat-raise-hand-wrap">
            <RaiseHandButton />
          </div>
        )}
      </div>

    </div>
  );
}