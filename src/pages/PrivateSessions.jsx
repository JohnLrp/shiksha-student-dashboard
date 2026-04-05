/**
 * FILE: STUDENT_DASHBOARD/src/pages/PrivateSessions.jsx
 *
 * UPDATES:
 * - Request cards: removed cancel button, made clickable → opens detail view
 * - Request detail: full info page with Cancel Request (modal), status
 * - History cards: clickable with hover effect → opens detail view
 * - History detail: shows teacher, participants, timing, duration, status
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import privateSession from "../api/privateSessionService";
import PrivateSessionCard from "../components/PrivateSessionCard";
import PageHeader from "../components/PageHeader";
import "../styles/privateSessions.css";

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function Stars({ count }) {
  const n = Math.round(count || 0);
  return (
    <span className="ps__stars">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

function TeacherAvatar({ name, size = 42 }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <div className="ps__teacherAvatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function statusLabel(st) {
  const m = {
    approved: "✅ Approved", pending: "⏳ Pending", ongoing: "🔴 Live",
    needs_reconfirmation: "⚠️ Needs Confirmation",
    completed: "✔ Completed", cancelled: "✗ Cancelled", declined: "✗ Declined",
    expired: "⏰ Expired", withdrawn: "↩ Withdrawn",
    teacher_no_show: "⚠ Teacher No-Show", student_no_show: "⚠ Student No-Show",
  };
  return m[st] || st;
}

function statusCls(st) {
  const m = {
    approved: "approved", pending: "pending", ongoing: "ongoing",
    needs_reconfirmation: "needs_reconfirmation",
    completed: "completed", cancelled: "cancelled", declined: "declined",
    expired: "expired", withdrawn: "withdrawn",
    teacher_no_show: "noshow", student_no_show: "noshow",
  };
  return m[st] || "";
}

function formatDate(d) {
  if (!d) return "TBD";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
}

function formatTime(t) {
  if (!t) return "TBD";
  try {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch { return t; }
}

function calcDurationDisplay(startTime, durationMins) {
  if (!startTime || !durationMins) return "";
  try {
    const [h, m] = startTime.split(":").map(Number);
    const endTotal = h * 60 + m + durationMins;
    const eh = Math.floor(endTotal / 60) % 24;
    const em = endTotal % 60;
    const startStr = formatTime(startTime);
    const endAmpm = eh >= 12 ? "PM" : "AM";
    const endH12 = eh % 12 || 12;
    const endStr = `${endH12}:${String(em).padStart(2, "0")} ${endAmpm}`;
    return `${startStr} – ${endStr}`;
  } catch { return formatTime(startTime); }
}

/* ═══════════════════════════════════════════════════════════
   CANCEL MODAL (shared by Scheduled + Request detail)
═══════════════════════════════════════════════════════════ */
function CancelModal({ session, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <div className="ps__modalOverlay" onClick={onClose}>
      <div className="ps__modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ps__modalTitle">Cancel Request</h3>
        <div className="ps__modalInfo">
          <div className="ps__modalInfoRow"><span className="ps__modalInfoLabel">Date:</span> <strong>{formatDate(session.date)}</strong></div>
          <div className="ps__modalInfoRow"><span className="ps__modalInfoLabel">Time Slot:</span> <strong>{calcDurationDisplay(session.time, session.durationMinutes) || formatTime(session.time)}</strong></div>
          <div className="ps__modalInfoRow"><span className="ps__modalInfoLabel">Duration:</span> <strong>{session.duration || `${session.durationMinutes} minutes`}</strong></div>
        </div>
        <p className="ps__modalNote">
          <strong>Note:</strong> The Teacher and Group Members will be notified of the cancellation.
        </p>
        <div className="ps__modalActions">
          <button className="ps__modalBack" onClick={onClose}>Back</button>
          <button className="ps__modalConfirm" onClick={() => onConfirm(session.id, reason)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIRM SESSION MODAL (for accepting reschedule)
═══════════════════════════════════════════════════════════ */
function ConfirmModal({ session, onClose, onConfirm }) {
  return (
    <div className="ps__modalOverlay" onClick={onClose}>
      <div className="ps__modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ps__modalTitle">Confirm Session</h3>
        <div className="ps__modalInfo">
          <div className="ps__modalInfoRow"><span className="ps__modalInfoLabel">Date:</span> <strong>{formatDate(session.rescheduledDate || session.date)}</strong></div>
          <div className="ps__modalInfoRow"><span className="ps__modalInfoLabel">Timing:</span> <strong>{calcDurationDisplay(session.rescheduledTime || session.time, session.durationMinutes) || formatTime(session.rescheduledTime || session.time)}</strong></div>
          <div className="ps__modalInfoRow"><span className="ps__modalInfoLabel">Duration:</span> <strong>{session.duration || `${session.durationMinutes} minutes`}</strong></div>
        </div>
        <p className="ps__modalNote">
          <strong>Note:</strong> The session will be scheduled and saved upon confirmation.
        </p>
        <div className="ps__modalActions">
          <button className="ps__modalBack" onClick={onClose}>Back</button>
          <button className="ps__modalConfirm" style={{ background: "#16a34a" }} onClick={() => onConfirm(session.id)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SESSION DETAIL VIEW (Scheduled tab)
═══════════════════════════════════════════════════════════ */
function SessionDetail({ session, onBack, onCancel, onEnterRoom }) {
  const [showCancel, setShowCancel] = useState(false);
  const isLive = session.status === "ongoing";

  return (
    <div className="ps__detail">
      <div className="ps__sidebarBack">
        <button className="ps__backBtn" onClick={onBack}>‹ Back to Sessions</button>
      </div>
      <div className={`ps__statusBar ${isLive ? "ps__statusBar--live" : "ps__statusBar--upcoming"}`}>
        <span>
          {isLive
            ? "STATUS: CURRENTLY LIVE"
            : `STATUS: UPCOMING at ${formatTime(session.time)}`}
        </span>
        {isLive ? (
          <button className="ps__joinBtn" onClick={() => onEnterRoom(session)}>JOIN</button>
        ) : (
          <button className="ps__cancelBtn" onClick={() => setShowCancel(true)}>Cancel Class</button>
        )}
      </div>
      <div className="ps__detailLabel">Summary:</div>
      <div className="ps__detailBody">
        <div className="ps__detailLeft">
          {[
            ["Subject", session.subject],
            ["Teacher", session.teacher],
            ["Date", formatDate(session.date)],
            ["Time", formatTime(session.time)],
            ["Duration", session.duration],
            ["Type", session.sessionType === "group" ? "Group" : "One-on-One"],
          ].map(([k, v]) => (
            <div key={k} className="ps__detailRow">
              <span className="ps__detailKey">{k}:</span>
              <span className="ps__detailVal">{v}</span>
            </div>
          ))}
          {session.note && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Note:</div>
              <div className="ps__noteBox">{session.note}</div>
            </div>
          )}
        </div>
        <div className="ps__detailRight">
          <div className="ps__groupHeader">Group Strength: <strong>{session.groupStrength}</strong></div>
          <div className="ps__studentList">
            {session.students?.map((s, i) => (
              <div key={i} className="ps__studentItem">{s}</div>
            ))}
          </div>
        </div>
      </div>
      {showCancel && (
        <CancelModal
          session={session}
          onClose={() => setShowCancel(false)}
          onConfirm={(id, reason) => {
            setShowCancel(false);
            onCancel(id, reason);
            onBack();
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REQUEST DETAIL VIEW (Requests tab — when card is clicked)
═══════════════════════════════════════════════════════════ */
function RequestDetail({ session, onBack, onCancel, onConfirmReschedule, onDeclineReschedule }) {
  const [showCancel, setShowCancel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isPending = session.status === "pending";
  const isReconfirm = session.status === "needs_reconfirmation";

  return (
    <div className="ps__detail">
      <div className="ps__sidebarBack">
        <button className="ps__backBtn" onClick={onBack}>‹ Back to Sessions</button>
      </div>

      <div className="ps__statusBar ps__statusBar--pending">
        <span>STATUS: {isPending ? "PENDING APPROVAL" : "NEEDS RECONFIRMATION"}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {isReconfirm && (
            <button className="ps__joinBtn" style={{ background: "#16a34a" }} onClick={() => setShowConfirm(true)}>Accept</button>
          )}
          <button className="ps__cancelBtn" onClick={() => setShowCancel(true)}>Cancel Request</button>
        </div>
      </div>

      {isReconfirm && session.teacherNote && (
        <div className="ps__reschedBanner">
          <div className="ps__reschedBannerIcon">📅</div>
          <div className="ps__reschedBannerText">
            <strong>Teacher proposed a new time</strong>
            <p>
              Original: {formatDate(session.originalDate)}, {formatTime(session.originalTime)}<br />
              New: <strong>{formatDate(session.rescheduledDate)}, {formatTime(session.rescheduledTime)}</strong><br />
              Note: "{session.teacherNote}"
            </p>
          </div>
        </div>
      )}

      <div className="ps__detailLabel">Summary:</div>
      <div className="ps__detailBody">
        <div className="ps__detailLeft">
          {[
            ["Subject", session.subject],
            ["Teacher", session.teacher],
            ["Date", formatDate(isReconfirm ? (session.rescheduledDate || session.date) : session.date)],
            ["Time Slot", calcDurationDisplay(isReconfirm ? (session.rescheduledTime || session.time) : session.time, session.durationMinutes) || formatTime(session.time)],
            ["Duration", session.duration || `${session.durationMinutes} minutes`],
            ["Type", session.sessionType === "group" ? "Group" : "One-on-One"],
          ].map(([k, v]) => (
            <div key={k} className="ps__detailRow">
              <span className="ps__detailKey">{k}:</span>
              <span className="ps__detailVal">{v}</span>
            </div>
          ))}
          {session.note && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Student's Note:</div>
              <div className="ps__noteBox">{session.note}</div>
            </div>
          )}
          {session.teacherNote && !isReconfirm && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Teacher's Note:</div>
              <div className="ps__noteBox">{session.teacherNote}</div>
            </div>
          )}
        </div>
        <div className="ps__detailRight">
          <div className="ps__groupHeader">Group Strength: <strong>{session.groupStrength}</strong></div>
          <div className="ps__studentList">
            {session.students?.length > 0
              ? session.students.map((s, i) => <div key={i} className="ps__studentItem">{s}</div>)
              : <div className="ps__studentItem" style={{ opacity: 0.5 }}>Just you</div>
            }
          </div>
        </div>
      </div>

      {showCancel && (
        <CancelModal
          session={session}
          onClose={() => setShowCancel(false)}
          onConfirm={(id) => {
            setShowCancel(false);
            onCancel(id);
            onBack();
          }}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          session={session}
          onClose={() => setShowConfirm(false)}
          onConfirm={(id) => {
            setShowConfirm(false);
            onConfirmReschedule(id);
            onBack();
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HISTORY DETAIL VIEW (History tab — when card is clicked)
═══════════════════════════════════════════════════════════ */
function HistoryDetail({ session, onBack }) {
  return (
    <div className="ps__detail">
      <div className="ps__sidebarBack">
        <button className="ps__backBtn" onClick={onBack}>‹ Back to Sessions</button>
      </div>

      <div className={`ps__statusBar ps__statusBar--${statusCls(session.status)}`}>
        <span>STATUS: {statusLabel(session.status).toUpperCase()}</span>
      </div>

      <div className="ps__detailLabel">Session Summary:</div>
      <div className="ps__detailBody">
        <div className="ps__detailLeft">
          {[
            ["Subject", session.subject],
            ["Teacher", session.teacher],
            ["Date", formatDate(session.date)],
            ["Timing", calcDurationDisplay(session.time, session.durationMinutes) || formatTime(session.time)],
            ["Duration", session.duration || `${session.durationMinutes} minutes`],
            ["Type", session.sessionType === "group" ? "Group" : "One-on-One"],
            ["Status", statusLabel(session.status)],
          ].map(([k, v]) => (
            <div key={k} className="ps__detailRow">
              <span className="ps__detailKey">{k}:</span>
              <span className="ps__detailVal">{v}</span>
            </div>
          ))}
          {session.startedAt && (
            <div className="ps__detailRow">
              <span className="ps__detailKey">Started:</span>
              <span className="ps__detailVal">{new Date(session.startedAt).toLocaleString()}</span>
            </div>
          )}
          {session.endedAt && (
            <div className="ps__detailRow">
              <span className="ps__detailKey">Ended:</span>
              <span className="ps__detailVal">{new Date(session.endedAt).toLocaleString()}</span>
            </div>
          )}
          {session.startedAt && session.endedAt && (
            <div className="ps__detailRow">
              <span className="ps__detailKey">Actual Duration:</span>
              <span className="ps__detailVal">{Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 60000)} minutes</span>
            </div>
          )}
          {session.note && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Student's Note:</div>
              <div className="ps__noteBox">{session.note}</div>
            </div>
          )}
          {session.cancelReason && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Cancellation Reason:</div>
              <div className="ps__noteBox" style={{ borderLeft: "3px solid #dc2626" }}>{session.cancelReason}</div>
            </div>
          )}
          {session.declineReason && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Decline Reason:</div>
              <div className="ps__noteBox" style={{ borderLeft: "3px solid #dc2626" }}>{session.declineReason}</div>
            </div>
          )}
        </div>
        <div className="ps__detailRight">
          <div className="ps__groupHeader">Participants: <strong>{session.groupStrength}</strong></div>
          <div className="ps__studentList">
            {session.students?.length > 0
              ? session.students.map((s, i) => <div key={i} className="ps__studentItem">{s}</div>)
              : <div className="ps__studentItem" style={{ opacity: 0.5 }}>No participants recorded</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCHEDULED TAB
═══════════════════════════════════════════════════════════ */
function ScheduledTab({ onEnterRoom, searchTerm = "" }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    privateSession.getSessions("scheduled").then((data) => {
      setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleConfirm = async (id) => {
    await privateSession.confirmReschedule(id);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s)));
  };
  const handleDecline = async (id) => {
    await privateSession.declineReschedule(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };
  const handleCancel = async (id, reason) => {
    await privateSession.cancelSession(id, reason);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)));
  };

  if (loading) return <div style={{ padding: 20 }}>Loading sessions...</div>;

  const searchFilter = (items) => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((s) =>
      (s.subject || "").toLowerCase().includes(q) ||
      (s.teacher || "").toLowerCase().includes(q) ||
      (s.topic || "").toLowerCase().includes(q)
    );
  };

  const reconfirm = sessions.filter((s) => s.status === "needs_reconfirmation");
  const active = searchFilter(sessions.filter((s) =>
    ["approved", "ongoing", "needs_reconfirmation"].includes(s.status)
  ));

  if (selected) {
    return (
      <SessionDetail
        session={selected}
        onBack={() => setSelected(null)}
        onCancel={(id, reason) => { handleCancel(id, reason); setSelected(null); }}
        onEnterRoom={onEnterRoom}
      />
    );
  }

  return (
    <div>
      {reconfirm.map((s) => (
        <div key={s.id} className="ps__reconfirmBanner">
          <div className="ps__reconfirmIcon">⚠️</div>
          <div className="ps__reconfirmText">
            <strong>{s.teacher} proposed a new time for your {s.subject} session</strong>
            <p>
              Original: {formatDate(s.originalDate)}, {formatTime(s.originalTime)}<br />
              New time: <strong>{formatDate(s.rescheduledDate)}, {formatTime(s.rescheduledTime)}</strong><br />
              {s.teacherNote && <span>Note: &quot;{s.teacherNote}&quot;</span>}
            </p>
          </div>
          <div className="ps__reconfirmActions">
            <button className="ps__confirmBtn" onClick={() => handleConfirm(s.id)}>✓ Confirm</button>
            <button className="ps__declineBtn" onClick={() => handleDecline(s.id)}>✗ Decline</button>
          </div>
        </div>
      ))}

      {active.length === 0 ? (
        <div className="ps__empty"><div className="ps__emptyIcon">📭</div><p>{searchTerm ? "No sessions match your search." : "No scheduled sessions."}</p></div>
      ) : (
        <div className="ps__cardGrid">
          {active.map((s) => (
            <PrivateSessionCard
              key={s.id}
              subject={s.subject}
              topic={s.topic}
              teacher={s.teacher}
              date={formatDate(s.date)}
              time={formatTime(s.time)}
              status={s.status}
              onClick={() => setSelected(s)}
              onEnterRoom={() => onEnterRoom(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REQUEST CARD (no cancel button, just clickable)
═══════════════════════════════════════════════════════════ */
function RequestedCard({ item, onClick }) {
  return (
    <div className="ps__reqCard" onClick={onClick} role="button" tabIndex={0}>
      <div className="ps__reqCardTop">
        <span className="ps__reqBadge">🔒 Private</span>
        <span className="ps__reqStatus">⏳ Pending</span>
      </div>
      <div className="ps__reqSubject">{item.subject}</div>
      <div className="ps__reqTopic">{item.topic}</div>
      <div className="ps__reqTeacher">👤 {item.teacher}</div>
      {item.groupStrength > 1 && (
        <div className="ps__reqMeta">👥 {item.groupStrength} student{item.groupStrength !== 1 ? "s" : ""}</div>
      )}
      <div className="ps__reqTimeRow">
        <span>📅 {formatDate(item.date)}</span>
        <span>🕐 {formatTime(item.time)}</span>
      </div>
      {item.note && <div className="ps__reqNote">&quot;{item.note}&quot;</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REQUESTS TAB
═══════════════════════════════════════════════════════════ */
function RequestsTab({ onUnreadChange, searchTerm = "" }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(() => {
    privateSession.getSessions("requests").then((data) => {
      setRequests(data);
      setLoading(false);
      onUnreadChange(data.length);
    }).catch(() => setLoading(false));
  }, [onUnreadChange]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleCancel = async (id) => {
    await privateSession.cancelSession(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleConfirmReschedule = async (id) => {
    await privateSession.confirmReschedule(id);
    loadRequests();
  };

  const handleDeclineReschedule = async (id) => {
    await privateSession.declineReschedule(id);
    loadRequests();
  };

  const handleFormSubmit = async (formData) => {
    try {
      await privateSession.requestSession(formData);
      setShowForm(false);
      loadRequests();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to submit request. Please try again.");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading requests...</div>;

  if (showForm) {
    return <RequestForm onBack={() => setShowForm(false)} onSubmit={handleFormSubmit} />;
  }

  if (selected) {
    return (
      <RequestDetail
        session={selected}
        onBack={() => { setSelected(null); loadRequests(); }}
        onCancel={handleCancel}
        onConfirmReschedule={handleConfirmReschedule}
        onDeclineReschedule={handleDeclineReschedule}
      />
    );
  }

  const searchFilter = (items) => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((s) =>
      (s.subject || "").toLowerCase().includes(q) ||
      (s.teacher || "").toLowerCase().includes(q) ||
      (s.topic || "").toLowerCase().includes(q)
    );
  };

  const filteredRequests = searchFilter(requests);

  return (
    <div>
      <div className="ps__reqHeader">
        <span className="ps__reqCount">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
        </span>
        <button className="ps__requestBtn" onClick={() => setShowForm(true)}>
          + Request Private Session
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="ps__empty"><div className="ps__emptyIcon">📋</div><p>{searchTerm ? "No requests match your search." : "No pending requests."}</p></div>
      ) : (
        <div className="ps__reqGrid">
          {filteredRequests.map((r) => (
            <RequestedCard key={r.id} item={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4-STEP REQUEST FORM — CONNECTED TO REAL API
═══════════════════════════════════════════════════════════ */
function RequestForm({ onBack, onSubmit }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({
    subject: "Mathematics",
    teacher: null,
    groupSize: 1,
    students: [],
    scheduledDate: "",
    timeSlot: null,
    duration: null,
    note: "",
  });

  const displayName = user?.profile?.full_name || user?.email || "Student";
  const steps = ["Teacher", "Students", "Schedule", "Summary"];

  const canNext = () => {
    if (step === 1) return !!data.teacher;
    if (step === 2) {
      if (data.groupSize <= 1) return true;
      return data.students.every((s) => s.valid);
    }
    if (step === 3) return !!data.scheduledDate && !!data.timeSlot && !!data.duration;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        teacherId: data.teacher.id,
        subject: data.subject_id,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.timeSlot.value,
        durationMinutes: data.duration.value,
        studentIds: data.students.filter((s) => s.valid).map((s) => s.studentId),
        note: data.note,
      });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="ps__formWrap">
      <div className="ps__formTitle">Request a session</div>
      <div className="ps__stepper">
        {steps.map((s, i) => (
          <div key={s} className="ps__stepGroup">
            <div className={`ps__stepCircle ${step > i + 1 ? "done" : step === i + 1 ? "active" : ""}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`ps__stepLabel ${step === i + 1 ? "active" : ""}`}>{s}</span>
            {i < steps.length - 1 && <div className={`ps__stepLine ${step > i + 1 ? "done" : ""}`} />}
          </div>
        ))}
      </div>
      <div className="ps__formBody">
        {step === 1 && <Step1 data={data} setData={setData} />}
        {step === 2 && <Step2 data={data} setData={setData} displayName={displayName} />}
        {step === 3 && <Step3 data={data} setData={setData} />}
        {step === 4 && <Step4 data={data} displayName={displayName} />}
      </div>
      <div className="ps__formActions">
        <button className="ps__formBackBtn" onClick={() => (step === 1 ? onBack() : setStep(step - 1))}>
          {step === 1 ? "Cancel" : "Back"}
        </button>
        {step < 4 ? (
          <button className="ps__formNextBtn" onClick={() => setStep(step + 1)} disabled={!canNext()}>Continue</button>
        ) : (
          <button className="ps__formSubmitBtn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}

function Step1({ data, setData }) {
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [subjects, setSubjects] = useState(privateSession.SUBJECTS);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Fetch subjects dynamically from backend, fallback to hardcoded list
  useEffect(() => {
    setLoadingSubjects(true);
    privateSession.getSubjectsByCourse()
      .then((res) => {
        // API may return array of strings, array of {name}, or grouped object
        let list = [];
        if (Array.isArray(res)) {
          list = res.map((s) => (typeof s === "string" ? s : s.name || s.subject_name || String(s)));
        } else if (res && typeof res === "object") {
          // Grouped by course — flatten all subjects
          Object.values(res).forEach((arr) => {
            if (Array.isArray(arr)) arr.forEach((s) => list.push(typeof s === "string" ? s : s.name || String(s)));
          });
        }
        if (list.length > 0) {
          const unique = [...new Set(list)].sort();
          setSubjects(unique);
          // If current subject not in new list, reset to first
          if (!unique.includes(data.subject)) {
            setData((prev) => ({ ...prev, subject: unique[0], teacher: null }));
          }
        }
      })
      .catch(() => { /* keep fallback SUBJECTS */ })
      .finally(() => setLoadingSubjects(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoadingTeachers(true);
    privateSession.getTeachers(data.subject).then((list) => { setTeachers(list); setLoadingTeachers(false); }).catch(() => setLoadingTeachers(false));
  }, [data.subject]);

  return (
    <div>
      <div className="ps__fieldRow" style={{ alignItems: "center" }}>
        <label className="ps__fieldLabel">Subject :</label>
        {loadingSubjects ? (
          <span style={{ fontSize: 13, color: "#6b7280" }}>Loading subjects...</span>
        ) : (
          <select className="ps__select" value={data.subject} onChange={(e) => setData({ ...data, subject: e.target.value, teacher: null })}>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>
      <div className="ps__sectionLabel">Teachers for {data.subject} :</div>
      {loadingTeachers ? (<div style={{ padding: 20, color: "#6b7280" }}>Loading teachers...</div>
      ) : teachers.length === 0 ? (<div style={{ padding: 20, color: "#6b7280" }}>No teachers found for this subject.</div>
      ) : (
        <div className="ps__teacherGrid">
          {teachers.map((t) => (
            <div key={t.id} className={`ps__teacherCard ${data.teacher?.id === t.id ? "selected" : ""}`} onClick={() => setData({ ...data, teacher: t })}>
              <TeacherAvatar name={t.name} size={42} />
              <div className="ps__teacherInfo">
                <div className="ps__teacherName">{t.name}</div>
                <div className="ps__teacherMeta"><span>{t.subject}</span>{t.rating && <Stars count={t.rating} />}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Step2({ data, setData, displayName }) {
  const [groupInput, setGroupInput] = useState(String(data.groupSize));
  const [validating, setValidating] = useState({});
  const applyGroupSize = (n) => {
    const size = Math.max(1, Math.min(10, n));
    const students = Array(Math.max(0, size - 1)).fill(null).map((_, i) => data.students[i] || { studentId: "", name: "", userId: "", valid: false });
    setData({ ...data, groupSize: size, students });
    setGroupInput(String(size));
  };
  const handleGroupType = (e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 2); setGroupInput(raw); if (raw === "") return; const n = parseInt(raw); if (!isNaN(n)) applyGroupSize(n); };
  const handleGroupBlur = () => { const n = parseInt(groupInput); if (!n || n < 1) applyGroupSize(1); else if (n > 10) applyGroupSize(10); else applyGroupSize(n); };
  const setStudentId = async (i, val) => {
    const students = [...data.students]; students[i] = { studentId: val, name: "", userId: "", valid: false }; setData({ ...data, students });
    if (!val.trim()) return;
    setValidating((prev) => ({ ...prev, [i]: true }));
    try {
      const result = await privateSession.validateStudentId(val.trim());
      setData((prev) => { const updated = [...prev.students]; if (updated[i]?.studentId === val) { updated[i] = { studentId: val, name: result.valid ? result.name : "", userId: result.valid ? result.user_id : "", valid: result.valid }; } return { ...prev, students: updated }; });
    } catch {} finally { setValidating((prev) => ({ ...prev, [i]: false })); }
  };
  const clearStudent = (i) => { const students = [...data.students]; students[i] = { studentId: "", name: "", userId: "", valid: false }; setData({ ...data, students }); };
  return (
    <div>
      <div className="ps__groupRow">
        <label className="ps__fieldLabel">Group Strength</label>
        <div className="ps__groupCtrl">
          <button className="ps__groupBtn" onClick={() => applyGroupSize(data.groupSize - 1)}>−</button>
          <input className="ps__groupInput" value={groupInput} onChange={handleGroupType} onBlur={handleGroupBlur} maxLength={2} />
          <button className="ps__groupBtn" onClick={() => applyGroupSize(data.groupSize + 1)}>+</button>
        </div>
      </div>
      <div className="ps__studentInputs">
        <div className="ps__studentRow"><span className="ps__slotNum">1.</span><input className="ps__studentInput ps__studentInput--you" value={`${displayName} (You)`} readOnly /><span className="ps__youTag">You</span></div>
        {data.students.map((s, i) => (
          <div key={i} className="ps__studentRow">
            <span className="ps__slotNum">{i + 2}.</span>
            <input className={`ps__studentInput ${s.valid ? "ps__studentInput--valid" : s.studentId ? "ps__studentInput--invalid" : ""}`} placeholder="Enter Student ID" value={s.studentId} onChange={(e) => setStudentId(i, e.target.value)} />
            {validating[i] ? <span style={{ fontSize: 11, color: "#6b7280" }}>...</span> : s.valid ? <span className="ps__validTag">✓ {s.name}</span> : <button className="ps__clearBtn" onClick={() => clearStudent(i)}>✕</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3({ data, setData }) {
  const today = new Date(); today.setDate(today.getDate() + 1); const minDate = today.toISOString().split("T")[0];
  return (
    <div>
      <div className="ps__fieldRow" style={{ marginBottom: 20 }}><label className="ps__fieldLabel">Select Date:</label><input type="date" className="ps__select" value={data.scheduledDate} min={minDate} onChange={(e) => setData({ ...data, scheduledDate: e.target.value })} /></div>
      <div className="ps__sectionLabel">Select Time Slot:</div>
      <div className="ps__slotBtns">{privateSession.TIME_SLOTS.map((t) => (<button key={t.value} className={`ps__slotBtn ${data.timeSlot?.value === t.value ? "selected" : ""}`} onClick={() => setData({ ...data, timeSlot: t })}>{t.label}</button>))}</div>
      <div className="ps__sectionLabel">Select Duration:</div>
      <div className="ps__slotBtns">{privateSession.DURATIONS.map((d) => (<button key={d.value} className={`ps__slotBtn ${data.duration?.value === d.value ? "selected" : ""}`} onClick={() => setData({ ...data, duration: d })}>{d.label}</button>))}</div>
      <div className="ps__sectionLabel">Note (Reason for the Session):</div>
      <textarea className="ps__noteArea" placeholder="Need help understanding trigonometric identities..." value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })} rows={5} />
    </div>
  );
}

function Step4({ data, displayName }) {
  const validStudents = data.students.filter((s) => s.valid);
  const allNames = [displayName, ...validStudents.map((s) => s.name)];
  const groupLabel = allNames.length > 1 ? `${allNames[0].split(" ")[0]} + ${allNames.length - 1} others` : allNames[0];
  return (
    <div>
      <div className="ps__summaryLabel">Summary:</div>
      <div className="ps__summaryTable">
        {[["Subject", data.subject], ["Teacher", data.teacher?.name || "—"], ["Date", data.scheduledDate ? formatDate(data.scheduledDate) : "—"], ["Time Slot", data.timeSlot?.label || "—"], ["Duration", data.duration?.label || "—"], ["Group", groupLabel], ["Note", data.note || "—"]].map(([k, v]) => (
          <div key={k} className="ps__summaryRow"><span className="ps__summaryKey">{k}</span><span className="ps__summaryVal">{v}</span></div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HISTORY TAB — cards are now clickable
═══════════════════════════════════════════════════════════ */
function HistoryTab({ searchTerm = "" }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    privateSession.getSessions("history").then((data) => { setHistory(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const searchFilter = (items) => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase();
    return items.filter((s) =>
      (s.subject || "").toLowerCase().includes(q) ||
      (s.teacher || "").toLowerCase().includes(q) ||
      (s.topic || "").toLowerCase().includes(q)
    );
  };

  const filtered = searchFilter(filter === "all" ? history : history.filter(h => h.status === filter));

  if (loading) return <div style={{ padding: 20 }}>Loading history...</div>;

  if (selected) {
    return <HistoryDetail session={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <div className="ps__historyFilterRow">
        <span className="ps__reqCount">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</span>
        <select className="ps__historyFilter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All History</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="teacher_no_show">Teacher No-Show</option>
          <option value="student_no_show">Student No-Show</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="ps__empty"><div className="ps__emptyIcon">📜</div><p>{searchTerm || filter !== "all" ? "No sessions match your search/filter." : "No session history yet."}</p></div>
      ) : (
        <div className="ps__historyList">
          {filtered.map((h) => (
            <div key={h.id} className="ps__historyCard ps__historyCard--clickable" onClick={() => setSelected(h)} role="button" tabIndex={0}>
              <div className="ps__historyLeft">
                <span className={`ps__historyBadge ps__historyBadge--${statusCls(h.status)}`}>{statusLabel(h.status)}</span>
                <div className="ps__historySubject">{h.subject}</div>
                <div className="ps__historyTopic">{h.topic}</div>
                <div className="ps__historyTeacher">👤 {h.teacher}</div>
              </div>
              <div className="ps__historyRight">
                <div className="ps__historyMeta">📅 {formatDate(h.date)}</div>
                <div className="ps__historyMeta">🕐 {formatTime(h.time)}</div>
                <div className="ps__historyMeta">⏱ {h.duration}</div>
                <div className="ps__historyMeta">👥 {h.groupStrength} student{h.groupStrength !== 1 ? "s" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function PrivateSessions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [requestsUnread, setRequestsUnread] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEnterRoom = (session) => {
    navigate(`/private-session/live/${session.id}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "requests") setRequestsUnread(0);
  };

  return (
    <div className="ps__page">
      <div className="ps__headerBox">
        <PageHeader title="Private Sessions" />
      </div>
      <div className="ps__bodyBox">
        <div className="ps__tabs">
          {["scheduled", "requests", "history"].map((tab) => (
            <button key={tab} className={`ps__tab ${activeTab === tab ? "ps__tab--active" : ""}`} onClick={() => handleTabChange(tab)}>
              <span className="ps__tabLabelWrap">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "requests" && requestsUnread > 0 && (<span className="ps__tabBadge">{requestsUnread}</span>)}
              </span>
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="ps__searchWrap">
          <span className="ps__searchIcon">🔍</span>
          <input
            type="text"
            className="ps__searchInput"
            placeholder="Search by subject, teacher, or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="ps__tabContent">
          {activeTab === "scheduled" && <ScheduledTab onEnterRoom={handleEnterRoom} searchTerm={searchTerm} />}
          {activeTab === "requests" && <RequestsTab onUnreadChange={setRequestsUnread} searchTerm={searchTerm} />}
          {activeTab === "history" && <HistoryTab searchTerm={searchTerm} />}
        </div>
      </div>
    </div>
  );
}