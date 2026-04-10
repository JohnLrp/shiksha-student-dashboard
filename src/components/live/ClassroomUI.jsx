import { useTracks, VideoTrack, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import TeacherControls from "./TeacherControls";
import RaiseHandButton from "./RaiseHandButton";
import ControlBar from "./ControlBar";
import { useState, useRef, useEffect } from "react";
import "../../styles/live.css";
import useLiveSessionChat from "../../hooks/useLiveSessionChat";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";
import { IoChatbubblesOutline } from "react-icons/io5";

export default function ClassroomUI({ role }) {
  const isPresenter = role === "PRESENTER";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const containerRef = useRef(null);
  const room = useRoomContext();

  /* =====================================
     🔥 LIVE CHAT via WebSocket
  ===================================== */
  // Get session ID from URL
  const sessionId = window.location.pathname.split("/").filter(Boolean).pop();
  const { messages: chatMessages, sendMessage } = useLiveSessionChat(sessionId);

  /* =====================================
     🔥 RAISE / LOWER HAND LISTENER
     Only presenter sees toasts.
     Both roles update raisedHands so the
     participant list badge works for everyone.
  ===================================== */
  useEffect(() => {
    const handleData = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const msg = JSON.parse(text);

        // ✅ FIX: lowercase keys to match RaiseHandButton
        if (msg.type === "raise-hand") {
          const identity = participant.identity;

          // Update raised hands map
          setRaisedHands((prev) => ({ ...prev, [identity]: true }));

          // Toast only for presenter
          if (isPresenter) {
            const toastId = Date.now() + Math.random();
            setRaiseHandToasts((prev) => [
              ...prev,
              { id: toastId, identity },
            ]);
            setTimeout(
              () =>
                setRaiseHandToasts((prev) =>
                  prev.filter((t) => t.id !== toastId)
                ),
              5000
            );
          }
        }

        // ✅ FIX: handle lower-hand to clear the badge
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

  /* =====================================
     🔥 FULLSCREEN
  ===================================== */
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  /* =====================================
     🔥 TRACKS
  ===================================== */
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);

  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;

  /* =====================================
     🔥 WAIT SCREEN
  ===================================== */
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

  /* =====================================
     🔥 UI
  ===================================== */
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

        {/* PiP */}
        {pipTrack && (
          <div className="pip-camera">
            <VideoTrack trackRef={pipTrack} />
          </div>
        )}

        {/* Presenter controls */}
        {isPresenter && <TeacherControls />}

        {/* Overlay buttons */}
        <div className="video-overlay-actions">
          <button
            className="ov-btn"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <IoChatbubblesOutline size={17} />
          </button>

          <button className="ov-btn" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <MdFullscreenExit size={19} />
            ) : (
              <MdFullscreen size={19} />
            )}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="right-sidebar">
          {/* ✅ FIX: pass raisedHands so badges show in participant list */}
          <ParticipantsPanel raisedHands={raisedHands} />
          <ChatPanel role={role} messages={chatMessages} onSendMessage={sendMessage} />
        </div>
      )}

      <ControlBar />

      {/* ✅ Only students (non-presenters) see the raise hand button */}
      {!isPresenter && <RaiseHandButton />}
    </div>
  );
}
