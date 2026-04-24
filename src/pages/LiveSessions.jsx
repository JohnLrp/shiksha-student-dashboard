import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useCourse } from "../contexts/CourseContext";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
import "../styles/liveSessions.css";
import useNotificationSocket from "../hooks/useNotificationSocket";

function computeStatus(session) {
  const now = Date.now();
  const end = new Date(session.end_time).getTime();
  const start = new Date(session.start_time).getTime();
  if (session.status === "CANCELLED") return "CANCELLED";
  if (session.status === "COMPLETED") return "COMPLETED";
  if (now >= end) return "COMPLETED";
  if (session.status === "PAUSED" && !session.teacher_left_at) return "PAUSED";
  if (session.teacher_left_at) {
    const mins = (now - new Date(session.teacher_left_at).getTime()) / 60000;
    if (mins <= 10) return "RECONNECTING";
    if (mins <= 60) return "PAUSED";
    return "COMPLETED";
  }
  if (session.status === "LIVE") return "LIVE";
  if (now < start) return "SCHEDULED";
  return "WAITING_FOR_TEACHER";
}

function computeCanJoin(session) {
  const now = Date.now();
  const start = new Date(session.start_time).getTime();
  const end = new Date(session.end_time).getTime();
  if (session.status === "CANCELLED") return false;
  if (now >= end) return false;
  if (session.status === "COMPLETED") return false;
  if (session.teacher_left_at) {
    const mins = (now - new Date(session.teacher_left_at).getTime()) / 60000;
    if (mins > 60) return false;
  }
  return now >= start - 15 * 60000;
}

const STATUS_CONFIG = {
  LIVE:               { label: "Live Now",          color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  PAUSED:             { label: "Paused",             color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  RECONNECTING:       { label: "Reconnecting",       color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  SCHEDULED:          { label: "Scheduled",          color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  WAITING_FOR_TEACHER:{ label: "Starting soon",      color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  COMPLETED:          { label: "Completed",          color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
  CANCELLED:          { label: "Cancelled",          color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
};

function LiveCard({ session, onClick, tick }) {
  void tick;
  const [tapped, setTapped] = React.useState(false);
  const status = computeStatus(session);
  const canJoin = computeCanJoin(session);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
  const start = new Date(session.start_time);
  const end = new Date(session.end_time);
  const dateStr = start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const endStr  = end.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div
      className={"liveCard" + (canJoin ? "" : " liveCard--disabled") + (tapped ? " tapped" : "")}
      onClick={() => {
        if (window.matchMedia("(hover: none)").matches) {
          if (!tapped) { setTapped(true); return; }
        }
        canJoin && onClick(session);
      }}
      onBlur={() => setTapped(false)}
      role="button"
      tabIndex={canJoin ? 0 : -1}
      onKeyDown={(e) => e.key === "Enter" && canJoin && onClick(session)}
    >
      <div className="liveCard__thumb">
        <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600" alt={session.title} className="liveCard__img" />
        <span className="liveCard__badge" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
        <div className="liveCard__overlay">
          <p className="liveCard__desc">{session.description || "No description provided."}</p>
          {canJoin && <span className="liveCard__joinBtn">Join Session</span>}
        </div>
      </div>
      <div className="liveCard__body">
        <p className="liveCard__subject">{session.subject_name}</p>
        <p className="liveCard__title">{session.title}</p>
        <p className="liveCard__teacher">{session.teacher}</p>
        <div className="liveCard__time">
          <span>{dateStr}</span>
          <span>{timeStr} to {endStr}</span>
        </div>
      </div>
    </div>
  );
}

export default function LiveSessions() {
  const navigate = useNavigate();
  const { activeCourse } = useCourse();
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const wsRef = useRef(null);
  const { notifications } = useNotificationSocket();

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const latest = notifications[0];
    if (latest?.data?.type === "live_session" && activeCourse) {
      api.get("/livestream/student/sessions/?course_id=" + activeCourse.id)
        .then(res => setSessions(res.data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))))
        .catch(console.error);
    }
  }, [notifications, activeCourse]);

  useEffect(() => {
    if (!activeCourse) { setSessions([]); setSubjects([]); setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const [sRes, subRes] = await Promise.all([
          api.get("/livestream/student/sessions/?course_id=" + activeCourse.id),
          api.get("/courses/" + activeCourse.id + "/subjects/"),
        ]);
        setSessions(sRes.data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
        setSubjects(subRes.data);
      } catch { setError("Unable to load sessions."); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [activeCourse]);

  useEffect(() => {
    if (!activeCourse) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
    const ws = new WebSocket(proto + "://" + wsHost + "/ws/course-sessions/" + activeCourse.id + "/");
    wsRef.current = ws;
    ws.onmessage = (e) => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type !== "session_list_update") return;
      setSessions((prev) => {
        const updated = msg.data;
        const exists = prev.find((s) => s.id === updated.id);
        if (!exists) return [...prev, updated].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        return prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
      });
    };
    ws.onerror = () => {};
    return () => { ws.close(); wsRef.current = null; };
  }, [activeCourse]);

  const filtered = selectedSubject
    ? sessions.filter((s) => String(s.subject_id) === String(selectedSubject))
    : sessions;

  if (loading) return <div className="liveSessionsPage"><div style={{padding:20,color:"#6b7280"}}>Loading sessions...</div></div>;
  if (error)   return <div className="liveSessionsPage"><div style={{padding:20,color:"red"}}>{error}</div></div>;

  return (
    <div className="liveSessionsPage">
      <div className="liveSessionsHeaderBox">
        <PageHeader title={activeCourse ? "Live Sessions" : "Live Sessions"} />
        <select className="liveSubjectFilter" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
        </select>
      </div>
      <div className="liveSessionsBodyBox">
        {!activeCourse ? (
          <p style={{color:"#9ca3af",textAlign:"center",padding:"40px 0"}}>Please select a course.</p>
        ) : filtered.length === 0 ? (
          <p style={{color:"#9ca3af",textAlign:"center",padding:"40px 0"}}>No live sessions available.</p>
        ) : (
          <div className="liveGrid">
            {filtered.map((s) => (
              <LiveCard key={s.id} session={s} tick={tick} onClick={(session) => navigate("/live/" + session.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
