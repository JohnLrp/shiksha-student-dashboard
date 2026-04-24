/**
 * FILE: STUDENT_DASHBOARD/src/pages/StudyGroupLive.jsx
 *
 * Reuses the existing PrivateClassroomUI inside a LiveKitRoom.
 * Adds a hard-duration countdown banner (bottom-right) unique to
 * study groups. On countdown end the user is booted back to the
 * Study Groups list.
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import studyGroupService from "../api/studyGroupService";
import PrivateClassroomUI from "../components/live/PrivateClassroomUI";
import "../styles/privateSessions.css";
import "../styles/studyGroups.css";

function formatCountdown(ms) {
  if (ms == null || ms < 0) return "--:--";
  const total = Math.floor(ms / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function StudyGroupLive() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [livekitData, setLivekitData] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const detail = await studyGroupService.getDetail(id);
        if (cancelled) return;
        setSessionDetail(detail);

        const joinData = await studyGroupService.joinRoom(id);
        if (cancelled) return;
        setLivekitData(joinData);
        setRemainingMs(joinData.remaining_ms ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Unable to join study group. It may not be open yet."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  // Local countdown tick
  useEffect(() => {
    if (remainingMs == null) return;
    if (remainingMs <= 0) return;
    const startedAt = Date.now();
    const startValue = remainingMs;
    const interval = setInterval(() => {
      const next = Math.max(0, startValue - (Date.now() - startedAt));
      setRemainingMs(next);
      if (next <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livekitData]);

  // Auto-exit at duration end
  useEffect(() => {
    if (remainingMs != null && remainingMs <= 0 && livekitData) {
      const timer = setTimeout(() => navigate("/study-groups"), 600);
      return () => clearTimeout(timer);
    }
  }, [remainingMs, livekitData, navigate]);

  if (loading) {
    return (
      <div className="tps__live-loading">
        <div className="tps__live-spinner" />
        <p>Joining study group…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tps__live-error">
        <h2>Unable to join study group</h2>
        <p>{error}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/study-groups")}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#015865", color: "#fff", fontWeight: 600, cursor: "pointer",
            }}
          >
            Back to Study Groups
          </button>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            style={{
              padding: "10px 24px", borderRadius: 8,
              border: "2px solid #94a3b8", background: "transparent",
              color: "#475569", fontWeight: 600, cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!livekitData) {
    return (
      <div className="tps__live-error">
        <h2>Study group not open yet</h2>
        <p>The room hasn't started. Please wait for someone to accept and try again.</p>
        <button
          onClick={() => navigate("/study-groups")}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "#015865", color: "#fff", fontWeight: 600, cursor: "pointer",
          }}
        >
          Back to Study Groups
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitData.livekit_url}
      token={livekitData.token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={() => navigate("/study-groups")}
    >
      {/* Dedicated countdown banner — marks room visually as a study group */}
      <div className="sgLive__banner">
        <span className="sgLive__bannerBadge">STUDY GROUP</span>
        <span className="sgLive__bannerSubject">
          {sessionDetail?.subjectName || "Study Group"}
        </span>
        <span className="sgLive__bannerCountdown">
          ⏳ {formatCountdown(remainingMs)} left
        </span>
      </div>

      <PrivateClassroomUI
        role={(livekitData.role || "student").toLowerCase()}
        session={{
          ...sessionDetail,
          subject: sessionDetail?.subjectName,
          topic: sessionDetail?.topic,
        }}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
