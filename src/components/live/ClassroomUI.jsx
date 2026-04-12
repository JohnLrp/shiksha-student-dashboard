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

export default function ClassroomUI({ role, sessionId: sessionIdProp, onLeave }) {
  const isPresenter = role === "PRESENTER";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [raisedHands, setRaisedHands] = useState({});
  const [raiseHandToasts, setRaiseHandToasts] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);
  const containerRef = useRef(null);
  const room = useRoomContext();
  const sessionId = sessionIdProp || window.location.pathname.split("/").filter(Boolean).pop();
  const { messages: chatMessages, sendMessage, sessionStatus: hookStatus } = useLiveSessionChat(sessionId);

  useEffect(() => {
    if (hookStatus) setSessionStatus(hookStatus);
  }, [hookStatus]);

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
          setRaisedHands((prev) => { const u = { ...prev }; delete u[identity]; return u; });
        }
      } catch {}
    };
    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room, isPresenter]);

  const toggleFullscreen = () => {
    if (!isFullscreen) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const screenTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const mainTrack = screenTrack || cameraTrack;
  const pipTrack = screenTrack ? cameraTrack : null;



  if (!isPresenter && sessionStatus === "PAUSED") {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", flexDirection: "column",
        background: "#0d1117", color: "#e8eaf2", gap: 16,
      }}>
        <div style={{ fontSize: 52 }}>&#9208;</div>
        <h2 style={{ margin: 0, fontWeight: 600 }}>Session paused by teacher</h2>
        <p style={{ color: "#6b7591", margin: 0, fontSize: 14 }}>
          Please wait, the session will resume shortly
        </p>
      </div>
    );
  }

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
          {!isPresenter && <p>You will be connected as soon as the session begins</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={"classroom-layout" + (isFullscreen ? " fs-mode" : "")} ref={containerRef}>

      {isPresenter && raiseHandToasts.length > 0 && (
        <div className="rh-toasts">
          {raiseHandToasts.map((t) => (
            <div key={t.id} className="rh-toast">
              <strong>{t.identity}</strong> raised their hand
            </div>
          ))}
        </div>
      )}

      <div className={"main-stage" + (!sidebarOpen ? " full-width" : "")}>
        <VideoTrack trackRef={mainTrack} />
        {pipTrack && <div className="pip-camera"><VideoTrack trackRef={pipTrack} /></div>}
        {isPresenter && <TeacherControls sessionId={sessionId} onLeave={onLeave} />}
        <div className="video-overlay-actions">
          <button className="ov-btn" onClick={() => setSidebarOpen((v) => !v)}>
            <IoChatbubblesOutline size={17} />
          </button>
          <button className="ov-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <MdFullscreenExit size={19} /> : <MdFullscreen size={19} />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div className="right-sidebar">
          <ParticipantsPanel raisedHands={raisedHands} />
          <ChatPanel role={role} messages={chatMessages} onSendMessage={sendMessage} />
        </div>
      )}

      <ControlBar onLeave={onLeave} />
      {!isPresenter && <RaiseHandButton />}
    </div>
  );
}
