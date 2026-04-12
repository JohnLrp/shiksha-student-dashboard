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
  // Allow joining paused sessions — student will see paused screen
  if (session.teacher_left_at) {
    const mins = (now - new Date(session.teacher_left_at).getTime()) / 60000;
    if (mins > 60) return false;
  }
  return now >= start - 15 * 60000;
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

  // Ticker: recompute time-based statuses every 60s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh when live session notification arrives
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.data?.type === "live_session" && activeCourse) {
      api.get("/livestream/student/sessions/?course_id=" + activeCourse.id)
        .then(res => {
          const sorted = res.data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
          setSessions(sorted);
        })
        .catch(console.error);
    }
  }, [notifications, activeCourse]);

  // Fetch sessions + subjects
  useEffect(() => {
    if (!activeCourse) {
      setSessions([]);
      setSubjects([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sessionRes, subjectRes] = await Promise.all([
          api.get("/livestream/student/sessions/?course_id=" + activeCourse.id),
          api.get("/courses/" + activeCourse.id + "/subjects/"),
        ]);
        setSessions(sessionRes.data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
        setSubjects(subjectRes.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load sessions.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCourse]);

  // WebSocket: real-time session list updates
  useEffect(() => {
    if (!activeCourse) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.host;
    const ws = new WebSocket(proto + "://" + wsHost + "/ws/course-sessions/" + activeCourse.id + "/");
    wsRef.current = ws;
    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type !== "session_list_update") return;
      setSessions((prev) => {
        const updated = msg.data;
        const exists = prev.find((s) => s.id === updated.id);
        if (!exists) {
          return [...prev, updated].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        }
        return prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
      });
    };
    ws.onerror = (e) => console.error("Course WS error", e);
    return () => { ws.close(); wsRef.current = null; };
  }, [activeCourse]);

  const filteredSessions = selectedSubject
    ? sessions.filter((s) => String(s.subject_id) === String(selectedSubject))
    : sessions;

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });

  const formatStatus = (session) => {
    void tick;
    const status = computeStatus(session);
    if (status === "LIVE") return "Live Now";
    if (status === "SCHEDULED") return "Starts at " + formatTime(session.start_time);
    if (status === "COMPLETED") return "Completed";
    if (status === "PAUSED") return "Paused by teacher";
    if (status === "RECONNECTING") return "Teacher reconnecting...";
    if (status === "WAITING_FOR_TEACHER") return "Waiting for teacher";
    if (status === "CANCELLED") return "Cancelled";
    return status;
  };

  if (loading) return <div style={{ padding: 20 }}>Loading sessions...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div className="liveSessionsPage">
      <div className="liveSessionsHeaderBox">
        <PageHeader
          title={activeCourse ? "Live Sessions - " + activeCourse.title : "Live Sessions"}
        />
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ marginLeft: "20px", padding: "6px 10px", borderRadius: "6px" }}
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>
      </div>

      <div className="liveSessionsBodyBox">
        {!activeCourse ? (
          <div>Please select a course.</div>
        ) : filteredSessions.length === 0 ? (
          <div>No live sessions available.</div>
        ) : (
          <div className="liveGrid">
            {filteredSessions.map((s) => {
              void tick;
              const canJoin = computeCanJoin(s);
              const status = computeStatus(s);
              return (
                <div
                  key={s.id}
                  className={"liveCard " + (canJoin ? "" : "disabledCard")}
                  onClick={() => { if (canJoin) navigate("/live/" + s.id); }}
                  style={{ cursor: canJoin ? "pointer" : "not-allowed", opacity: canJoin ? 1 : 0.6 }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600"
                    alt={s.title}
                    className="liveCardImg"
                  />
                  <div className="liveCardBody">
                    <p className="liveCardText">{s.title}</p>
                    <p className="liveCardText">{s.teacher}</p>
                    <p className="liveCardText">{formatDateTime(s.start_time)}</p>
                    <p className="liveCardText">{formatStatus(s)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
