/**
 * FILE: student_dashboard/src/pages/PrivateSessions.jsx
 * REPLACE the existing file.
 *
 * FIXES:
 * - History tab now handles ALL statuses (completed, cancelled, declined,
 *   expired, withdrawn, teacher_no_show, student_no_show)
 * - History filter dropdown added
 * - Cancel modal now sends reason to API via cancelSession(id, reason)
 * - RequestsTab unread logic fixed (was clearing immediately)
 * - Added status pill colors for all statuses
 * - Improved empty states
 */

import { useState, useEffect } from "react";
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
  return (
    <span className="ps__stars">
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  );
}

function TeacherAvatar({ name, size = 42 }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <div className="ps__teacherAvatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function statusLabel(st) {
  const m = {
    completed: "✔ Completed", cancelled: "✗ Cancelled", declined: "✗ Declined",
    expired: "⏰ Expired", withdrawn: "↩ Withdrawn",
    teacher_no_show: "⚠ Teacher No-Show", student_no_show: "⚠ Student No-Show",
  };
  return m[st] || st;
}

function statusCls(st) {
  const m = {
    completed: "completed", cancelled: "cancelled", declined: "declined",
    expired: "expired", withdrawn: "withdrawn",
    teacher_no_show: "noshow", student_no_show: "noshow",
  };
  return m[st] || "";
}

/* ═══════════════════════════════════════════════════════════
   CANCEL MODAL
═══════════════════════════════════════════════════════════ */
function CancelModal({ session, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <div className="ps__modalOverlay" onClick={onClose}>
      <div className="ps__modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="ps__modalTitle">Cancel Session?</h3>
        <div className="ps__modalInfo">
          <div className="ps__modalInfoRow"><strong>{session.subject} Session</strong></div>
          <div className="ps__modalInfoRow">Teacher: {session.teacher}</div>
          <div className="ps__modalInfoRow">Timing: {session.date}, {session.time}</div>
        </div>
        <label className="ps__modalLabel">Reason for Cancellation (required):</label>
        <input
          className="ps__modalInput"
          placeholder="Enter reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="ps__modalNote">
          <strong>Note:</strong> Frequent cancellations may affect your ability to book future sessions.
          The Teacher and Group Members will be notified of the cancellation.
        </p>
        <div className="ps__modalActions">
          <button className="ps__modalBack" onClick={onClose}>Back</button>
          <button
            className="ps__modalConfirm"
            onClick={() => reason.trim() && onConfirm(session.id, reason)}
            disabled={!reason.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SESSION DETAIL VIEW
═══════════════════════════════════════════════════════════ */
function SessionDetail({ session, onBack, onCancel, onEnterRoom }) {
  const [showCancel, setShowCancel] = useState(false);
  const isLive = session.status === "ongoing";

  return (
    <div className="ps__detail">
      <button className="ps__backBtn" onClick={onBack}>← Back</button>
      <div className={`ps__statusBar ${isLive ? "ps__statusBar--live" : "ps__statusBar--upcoming"}`}>
        <span>
          {isLive
            ? "STATUS: CURRENTLY LIVE"
            : `STATUS: UPCOMING at ${session.time?.split("–")[0]?.trim()}`}
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
            ["Course",    session.course],
            ["Subject",   session.subject],
            ["Teacher",   session.teacher],
            ["Date",      session.date],
            ["Time Slot", session.time],
            ["Duration",  session.duration],
          ].map(([k, v]) => (
            <div key={k} className="ps__detailRow">
              <span className="ps__detailKey">{k}:</span>
              <span className="ps__detailVal">{v}</span>
            </div>
          ))}
          {session.note && (
            <div className="ps__noteBlock">
              <div className="ps__detailKey">Note (Reason for the Session):</div>
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
   SCHEDULED TAB
═══════════════════════════════════════════════════════════ */
function ScheduledTab({ onEnterRoom }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    privateSession.getSessions("scheduled").then((data) => {
      setSessions(data);
      setLoading(false);
    });
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

  const reconfirm = sessions.filter((s) => s.status === "needs_reconfirmation");
  const active = sessions.filter((s) =>
    ["approved", "ongoing", "needs_reconfirmation"].includes(s.status)
  );

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
              Original: {s.originalDate}, {s.originalTime}<br />
              New time: <strong>{s.date}, {s.time}</strong><br />
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
        <div className="ps__empty"><div className="ps__emptyIcon">📭</div><p>No scheduled sessions.</p></div>
      ) : (
        <div className="ps__cardGrid">
          {active.map((s) => (
            <PrivateSessionCard
              key={s.id}
              {...s}
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
   REQUESTED CARD
═══════════════════════════════════════════════════════════ */
function RequestedCard({ item, onCancel }) {
  return (
    <div className="ps__reqCard">
      <div className="ps__reqCardTop">
        <span className="ps__reqBadge">🔒 Private</span>
        <span className="ps__reqStatus">⏳ Pending</span>
      </div>
      <div className="ps__reqSubject">{item.subject}</div>
      <div className="ps__reqTopic">{item.topic}</div>
      <div className="ps__reqTeacher">👤 {item.teacher}</div>
      {item.students && (
        <div className="ps__reqMeta">👥 {item.students} student{item.students !== 1 ? "s" : ""}</div>
      )}
      <div className="ps__reqTimeRow">
        <span>📅 {item.date}</span>
        <span>🕐 {item.time}</span>
      </div>
      {item.note && <div className="ps__reqNote">&quot;{item.note}&quot;</div>}
      <div className="ps__reqActions">
        <button className="ps__reqCancelBtn" onClick={() => onCancel(item.id)}>✕ Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REQUESTS TAB
═══════════════════════════════════════════════════════════ */
function RequestsTab({ onUnreadChange }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    privateSession.getSessions("requests").then((data) => {
      setRequests(data);
      setLoading(false);
      const unread = data.filter((r) => r.unread).length;
      onUnreadChange(unread);
    });
  }, []);

  // Mark as read after a short delay (simulates "seen")
  useEffect(() => {
    if (!loading && requests.some(r => r.unread)) {
      const timer = setTimeout(() => {
        setRequests((prev) => prev.map((r) => ({ ...r, unread: false })));
        onUnreadChange(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, requests]);

  const handleCancel = async (id) => {
    await privateSession.cancelSession(id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div style={{ padding: 20 }}>Loading requests...</div>;

  if (showForm) {
    return (
      <RequestForm
        onBack={() => setShowForm(false)}
        onSubmit={(data) => {
          setRequests((prev) => [{
            id: `R-${Date.now()}`,
            type: "private",
            subject: data.subject,
            topic: "Private Session",
            teacher: data.teacher?.name || "Teacher",
            date: data.date || "TBD",
            time: data.timeSlot || "TBD",
            students: data.groupSize,
            status: "pending",
            note: data.note,
            unread: false,
          }, ...prev]);
          setShowForm(false);
        }}
      />
    );
  }

  return (
    <div>
      <div className="ps__reqHeader">
        <span className="ps__reqCount">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </span>
        <button className="ps__requestBtn" onClick={() => setShowForm(true)}>
          + Request Private Session
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="ps__empty"><div className="ps__emptyIcon">📋</div><p>No pending requests.</p></div>
      ) : (
        <div className="ps__reqGrid">
          {requests.map((r) => (
            <RequestedCard key={r.id} item={r} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4-STEP REQUEST FORM (unchanged — was working)
═══════════════════════════════════════════════════════════ */
function RequestForm({ onBack, onSubmit }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    subject: "Mathematics", teacher: null,
    groupSize: 6, students: Array(9).fill(""),
    date: "4th April 2026", timeSlot: "", duration: "", note: "",
  });

  const displayName = user?.profile?.full_name || user?.email || "Student";
  const steps = ["Teacher", "Students", "Schedule", "Summary"];

  const canNext = () => {
    if (step === 1) return !!data.teacher;
    if (step === 2) {
      return Array(data.groupSize - 1).fill(0).every((_, i) => {
        const val = data.students[i] || "";
        return val.trim() !== "" && !!privateSession.MOCK_STUDENTS_DB[val];
      });
    }
    if (step === 3) return !!data.timeSlot && !!data.duration;
    return true;
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
          <button className="ps__formNextBtn" onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Continue
          </button>
        ) : (
          <button className="ps__formSubmitBtn" onClick={() => onSubmit(data)}>Submit</button>
        )}
      </div>
    </div>
  );
}

function Step1({ data, setData }) {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    privateSession.getTeachers(data.subject).then(setTeachers);
  }, [data.subject]);

  return (
    <div>
      <div className="ps__fieldRow">
        <label className="ps__fieldLabel">Course :</label>
        <span className="ps__fieldVal">Class 8 (Selected by default)</span>
      </div>
      <div className="ps__fieldRow" style={{ alignItems: "center" }}>
        <label className="ps__fieldLabel">Subject :</label>
        <select className="ps__select" value={data.subject} onChange={(e) => setData({ ...data, subject: e.target.value, teacher: null })}>
          {privateSession.SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="ps__sectionLabel">Teachers for {data.subject} :</div>
      <div className="ps__teacherGrid">
        {teachers.map((t) => (
          <div key={t.id} className={`ps__teacherCard ${data.teacher?.id === t.id ? "selected" : ""}`} onClick={() => setData({ ...data, teacher: t })}>
            <TeacherAvatar name={t.name} size={42} />
            <div className="ps__teacherInfo">
              <div className="ps__teacherName">{t.name}</div>
              <div className="ps__teacherMeta">
                <span>{t.sessions} Private Sessions</span>
                <Stars count={t.rating} />
              </div>
            </div>
            <div className={`ps__teacherAvail ${t.available ? "available" : "unavailable"}`}>
              {t.available ? "Currently available" : `Currently unavailable (For ${t.unavailableDays} days)`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2({ data, setData, displayName }) {
  const [groupInput, setGroupInput] = useState(String(data.groupSize));

  const applyGroupSize = (n) => {
    const size = Math.max(1, Math.min(10, n));
    const students = Array(size - 1).fill("").map((_, i) => data.students[i] || "");
    setData({ ...data, groupSize: size, students });
    setGroupInput(String(size));
  };

  const handleGroupType = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setGroupInput(raw);
    if (raw === "") return;
    const n = parseInt(raw);
    if (!isNaN(n)) applyGroupSize(n);
  };

  const handleGroupBlur = () => {
    const n = parseInt(groupInput);
    if (!n || n < 1) applyGroupSize(1);
    else if (n > 10) applyGroupSize(10);
    else applyGroupSize(n);
  };

  const setStudent = (i, val) => {
    const s = [...data.students];
    s[i] = val;
    setData({ ...data, students: s });
  };
  const validateId = (id) => privateSession.MOCK_STUDENTS_DB[id] || null;

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
        <div className="ps__studentRow">
          <span className="ps__slotNum">1.</span>
          <input className="ps__studentInput ps__studentInput--you" value={`${displayName} (You)`} readOnly />
          <span className="ps__youTag">You</span>
        </div>
        {Array(data.groupSize - 1).fill(0).map((_, i) => {
          const val = data.students[i] || "";
          const name = validateId(val);
          return (
            <div key={i} className="ps__studentRow">
              <span className="ps__slotNum">{i + 2}.</span>
              <input className={`ps__studentInput ${name ? "ps__studentInput--valid" : val ? "ps__studentInput--invalid" : ""}`} placeholder="Enter Student id" value={val} onChange={(e) => setStudent(i, e.target.value)} />
              {name ? <span className="ps__validTag">✓ {name}</span> : <button className="ps__clearBtn" onClick={() => setStudent(i, "")}>✕</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step3({ data, setData }) {
  return (
    <div>
      <div className="ps__fieldRow" style={{ marginBottom: 20 }}>
        <label className="ps__fieldLabel">Select Date:</label>
        <span className="ps__fieldVal" style={{ fontWeight: 700 }}>{data.date} 📅</span>
      </div>
      <div className="ps__sectionLabel">Select Time Slots:</div>
      <div className="ps__slotBtns">
        {privateSession.TIME_SLOTS.map((t) => (
          <button key={t} className={`ps__slotBtn ${data.timeSlot === t ? "selected" : ""}`} onClick={() => setData({ ...data, timeSlot: t })}>{t}</button>
        ))}
      </div>
      <div className="ps__sectionLabel">Select Durations:</div>
      <div className="ps__slotBtns">
        {privateSession.DURATIONS.map((d) => (
          <button key={d} className={`ps__slotBtn ${data.duration === d ? "selected" : ""}`} onClick={() => setData({ ...data, duration: d })}>{d}</button>
        ))}
      </div>
      <div className="ps__sectionLabel">Note (Reason for the Session):</div>
      <textarea className="ps__noteArea" placeholder="Need help understanding trigonometric identities..." value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })} rows={5} />
    </div>
  );
}

function Step4({ data, displayName }) {
  const filled = data.students.filter((s) => s && privateSession.MOCK_STUDENTS_DB[s]);
  const all = [displayName, ...filled.map((s) => privateSession.MOCK_STUDENTS_DB[s])];
  const groupLabel = all.length > 1 ? `${all[0].split(" ")[0]} + ${all.length - 1} others` : all[0];

  return (
    <div>
      <div className="ps__summaryLabel">Summary:</div>
      <div className="ps__summaryTable">
        {[
          ["Course", "Class 8"], ["Subject", data.subject],
          ["Teacher", data.teacher?.name || "—"], ["Date", data.date],
          ["Time Slot", data.timeSlot || "—"], ["Duration", data.duration || "—"],
          ["Group", groupLabel], ["Note", data.note || "—"],
        ].map(([k, v]) => (
          <div key={k} className="ps__summaryRow">
            <span className="ps__summaryKey">{k}</span>
            <span className="ps__summaryVal">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HISTORY TAB (FIXED — now handles all statuses + filter)
═══════════════════════════════════════════════════════════ */
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    privateSession.getSessions("history").then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all"
    ? history
    : history.filter(h => h.status === filter);

  if (loading) return <div style={{ padding: 20 }}>Loading history...</div>;

  return (
    <div>
      {/* Filter */}
      <div className="ps__historyFilterRow">
        <span className="ps__reqCount">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</span>
        <select
          className="ps__historyFilter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
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
        <div className="ps__empty">
          <div className="ps__emptyIcon">📜</div>
          <p>{filter === "all" ? "No session history yet." : "No sessions match this filter."}</p>
        </div>
      ) : (
        <div className="ps__historyList">
          {filtered.map((h) => (
            <div key={h.id} className="ps__historyCard">
              <div className="ps__historyLeft">
                <span className={`ps__historyBadge ps__historyBadge--${statusCls(h.status)}`}>
                  {statusLabel(h.status)}
                </span>
                <div className="ps__historySubject">{h.subject}</div>
                <div className="ps__historyTopic">{h.topic}</div>
                <div className="ps__historyTeacher">👤 {h.teacher}</div>
              </div>
              <div className="ps__historyRight">
                <div className="ps__historyMeta">📅 {h.date}</div>
                <div className="ps__historyMeta">🕐 {h.time}</div>
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

  const handleEnterRoom = (session) => {
    navigate(`/live/${session.id}`);
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
            <button
              key={tab}
              className={`ps__tab ${activeTab === tab ? "ps__tab--active" : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              <span className="ps__tabLabelWrap">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "requests" && requestsUnread > 0 && (
                  <span className="ps__tabBadge">{requestsUnread}</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="ps__tabContent">
          {activeTab === "scheduled" && <ScheduledTab onEnterRoom={handleEnterRoom} />}
          {activeTab === "requests" && <RequestsTab onUnreadChange={setRequestsUnread} />}
          {activeTab === "history" && <HistoryTab />}
        </div>
      </div>
    </div>
  );
}