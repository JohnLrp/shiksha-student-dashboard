import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCourse } from "../contexts/CourseContext";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
import "../styles/liveSessions.css";
import useNotificationSocket from "../hooks/useNotificationSocket";

export default function LiveSessions() {
  const navigate = useNavigate();
  const { activeCourse } = useCourse();

  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notifications } = useNotificationSocket();

  // 🔥 Auto-refresh when new live session notification arrives
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.data?.type === "live_session") {
      // Re-trigger fetchData by updating activeCourse dependency
      setSessions((prev) => [...prev]); // force re-render
      if (activeCourse) {
        api.get(`/livestream/student/sessions/?course_id=${activeCourse.id}`)
          .then(res => {
            const sorted = res.data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            setSessions(sorted);
          })
          .catch(console.error);
      }
    }
  }, [notifications, activeCourse]);

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
        const sessionRes = await api.get(
          `/livestream/student/sessions/?course_id=${activeCourse.id}`
        );

        const subjectRes = await api.get(
          `/courses/${activeCourse.id}/subjects/`
        );

        const sorted = sessionRes.data.sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );

        setSessions(sorted);
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

  const filteredSessions = selectedSubject
    ? sessions.filter(
        (s) => String(s.subject_id) === String(selectedSubject)
      )
    : sessions;

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (session) => {
    const status = session.computed_status;

    if (status === "LIVE") return "🔴 Live Now";
    if (status === "SCHEDULED") return `Starts at ${formatTime(session.start_time)}`;
    if (status === "COMPLETED") return "✅ Completed";
    if (status === "PAUSED") return "⏸ Paused — teacher stepped away";
    if (status === "RECONNECTING") return "🔄 Teacher reconnecting...";
    if (status === "WAITING_FOR_TEACHER") return "⏳ Waiting for teacher";
    if (status === "CANCELLED") return "🚫 Cancelled";
    return status;
  };

  if (loading) return <div style={{ padding: 20 }}>Loading sessions...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div className="liveSessionsPage">
      <div className="liveSessionsHeaderBox">
        <PageHeader
          title={
            activeCourse
              ? `Live Sessions - ${activeCourse.title}`
              : "Live Sessions"
          }
        />

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            marginLeft: "20px",
            padding: "6px 10px",
            borderRadius: "6px",
          }}
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
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
            {filteredSessions.map((s) => (
              <div
                key={s.id}
                className={`liveCard ${s.can_join ? "" : "disabledCard"}`}
                onClick={() => {
                  if (!s.can_join) return;
                  navigate(`/live/${s.id}`);
                }}
                style={{
                  cursor: s.can_join ? "pointer" : "not-allowed",
                  opacity: s.can_join ? 1 : 0.6,
                }}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
