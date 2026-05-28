/**
 * FILE: STUDENT_DASHBOARD/src/pages/GroupSessions.jsx
 *
 * Group Sessions page — parallel to PrivateSessions but visually
 * distinct (uses its own sg__* class prefix + groupSessions.css).
 * Tabs: Upcoming | Invitations | History.
 *
 * This page is additive: it does NOT import or change anything used
 * by the existing Private Sessions flow.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import groupSessionService, { extractApiError } from "../api/groupSessionService";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/groupSessions.css";

/* ═══════════════════════════════════════════════════════════
   FORMATTING HELPERS
═══════════════════════════════════════════════════════════ */
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

function statusLabel(st) {
  // For the "live" state, the leading red dot is rendered by CSS (::before
  // on .sg__statusPill--live) so the pill stays the same shape across
  // browsers/OS — emoji rendering was inconsistent and was making the
  // Live pill look split on cards with long titles.
  const m = {
    scheduled: "📅 Scheduled", live: "Live",
    completed: "✔ Completed", cancelled: "✗ Cancelled", expired: "⏰ Expired",
  };
  return m[st] || st;
}

function shortId(id) {
  if (!id) return "";
  return String(id).length > 10 ? `${String(id).slice(0, 8)}…` : id;
}

/**
 * Returns true if this group session should no longer appear in Upcoming.
 *
 * Three time-based exit triggers — any one suffices:
 *   1. status is terminal (completed/cancelled/expired). Backend should
 *      already have routed these to History, but we guard anyway.
 *   2. status is 'live' AND now >= room_started_at + duration. The
 *      Celery hard-cutoff and 6h cleanup cron handle this server-side,
 *      but neither fires the instant the duration elapses — this client
 *      check makes the card vanish exactly on time.
 *   3. status is still 'scheduled' but the entire scheduled window
 *      (start + duration) has elapsed without anyone opening the room.
 *      Same idea as the backend's past_orphan_q, but tighter — we use
 *      start+duration rather than just start, so a 5-minute "grace
 *      period" overlap (where the start time has passed but duration
 *      hasn't fully elapsed yet) keeps the card visible.
 */
function isEndedNow(g) {
  if (!g) return false;
  if (g.status === "completed" || g.status === "cancelled" || g.status === "expired") {
    return true;
  }
  const durMs = (g.durationMinutes || 0) * 60_000;
  if (g.status === "live" && g.roomStartedAt && durMs > 0) {
    const end = new Date(g.roomStartedAt).getTime() + durMs;
    if (!Number.isNaN(end) && Date.now() >= end) return true;
  }
  if (g.status === "scheduled" && !g.roomStartedAt && g.date && g.time && durMs > 0) {
    const start = new Date(`${g.date}T${g.time}`).getTime();
    if (!Number.isNaN(start) && Date.now() >= start + durMs) return true;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════
   STUDY GROUP CARD
═══════════════════════════════════════════════════════════ */
function GroupSessionCard({ group, onOpen, selectMode = false, selected = false, onToggleSelect }) {
  // In selection mode the card itself becomes a toggle, not an opener.
  // The checkbox is rendered in the top-right corner so it doesn't fight
  // the status pill for space.
  const handleClick = (e) => {
    if (selectMode) {
      e.preventDefault();
      onToggleSelect?.(group.id);
    } else {
      onOpen(group);
    }
  };
  const cardClass = `sg__card sg__card--${group.status}${selectMode ? " sg__card--selectMode" : ""}${selected ? " sg__card--selected" : ""}`;
  return (
    <div className={cardClass} onClick={handleClick}>
      {selectMode && (
        <span
          className={`sg__cardSelectBox${selected ? " sg__cardSelectBox--on" : ""}`}
          aria-hidden="true"
        >
          {selected ? "✓" : ""}
        </span>
      )}
      <div className="sg__cardTop">
        <div className="sg__cardSubject">{group.subjectName}</div>
        <span className={`sg__statusPill sg__statusPill--${group.status}`}>
          {statusLabel(group.status)}
        </span>
      </div>
      {group.courseTitle && (
        <div className="sg__cardCourse">{group.courseTitle}</div>
      )}
      {group.topic && <div className="sg__cardTopic">“{group.topic}”</div>}
      <div className="sg__cardMetaRow">
        <span className="sg__metaChip">👤 Host: {group.hostName}</span>
        {group.invitedTeacher && (
          <span className="sg__metaChip">🎓 {group.invitedTeacher}</span>
        )}
      </div>
      <div className="sg__cardMetaRow">
        <span className="sg__metaChip">📆 {formatDate(group.date)}</span>
        <span className="sg__metaChip">🕑 {formatTime(group.time)}</span>
        <span className="sg__metaChip">⏱ {group.durationMinutes} min</span>
      </div>
      <div className="sg__cardCountsRow">
        <span className="sg__countChip sg__countChip--accepted">
          ✅ {group.acceptedCount} accepted
        </span>
        <span className="sg__countChip sg__countChip--pending">
          ⏳ {group.pendingCount} pending
        </span>
        {group.declinedCount > 0 && (
          <span className="sg__countChip sg__countChip--declined">
            ✗ {group.declinedCount} declined
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INVITEE PICKER  (mirrors PrivateSessions' StudentPicker UX)
═══════════════════════════════════════════════════════════ */
function InviteePicker({ subjectId, excludeUserIds, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const load = useCallback(async (q) => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const data = await groupSessionService.getCourseStudents(subjectId, q);
      const filtered = (data || []).filter(
        (s) => !excludeUserIds.includes(s.user_id)
      );
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [subjectId, excludeUserIds]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => load(query), 150);
    return () => clearTimeout(id);
  }, [query, open, load]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = (s) => {
    onSelect(s);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="sg__picker" ref={wrapRef}>
      <input
        className="sg__pickerInput"
        placeholder="Search classmate by name or ID…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div className="sg__pickerDrop">
          {loading && <div className="sg__pickerRow muted">Loading…</div>}
          {!loading && results.length === 0 && (
            <div className="sg__pickerRow muted">
              {query ? `No students match "${query}"` : "No other enrolled students"}
            </div>
          )}
          {results.map((s) => (
            <div
              key={s.user_id}
              className="sg__pickerRow"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
            >
              <span className="sg__pickerAv">{(s.name || "?").charAt(0).toUpperCase()}</span>
              <div className="sg__pickerInfo">
                <span className="sg__pickerName">{s.name}</span>
                {s.student_id && (
                  <span className="sg__pickerSub">{shortId(s.student_id)}</span>
                )}
              </div>
              <span className="sg__pickerAdd">+ Add</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INSTANT MEETING DIALOG
   ─────────────────────────────────────────────────────────────
   Two-mode popup shown when the user clicks "Instant Meeting":
     mode="menu"   → Create Instant Meeting | Enter Room ID
     mode="enter"  → input + Join Room
   X close button lives in the top-right of the modal.
═══════════════════════════════════════════════════════════ */
function InstantMeetingDialog({ open, busy, error, onClose, onCreate, onEnter }) {
  const [mode, setMode] = useState("menu");
  const [code, setCode] = useState("");

  // Reset back to the menu whenever the dialog is reopened — otherwise a
  // user who closed mid-"enter" would see the input on next open.
  useEffect(() => {
    if (open) {
      setMode("menu");
      setCode("");
    }
  }, [open]);

  if (!open) return null;

  // Self-contained, inline-styled modal — does not depend on any CSS file,
  // so it renders identically on both dashboards even if the local stylesheet
  // is missing the .modalOverlay / .modal rules.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="im-title"
      onClick={() => !busy && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
          padding: "24px 24px 22px",
          position: "relative",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={() => !busy && onClose()}
          aria-label="Close"
          title="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            border: "none",
            background: "transparent",
            cursor: busy ? "not-allowed" : "pointer",
            borderRadius: 8,
            fontSize: 18,
            color: "#475569",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = "#f1f5f9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          ✕
        </button>

        <h3
          id="im-title"
          style={{
            margin: 0,
            paddingRight: 32,
            fontSize: 18,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em",
          }}
        >
          Instant Meeting
        </h3>
        <p style={{ margin: "6px 0 18px", fontSize: 13.5, color: "#475569", lineHeight: 1.45 }}>
          {mode === "menu"
            ? "Start a brand-new room right now, or join one with a room code shared by the host."
            : "Paste a Group Session room code or the full link the host sent you."}
        </p>

        {mode === "menu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              disabled={busy}
              onClick={onCreate}
              style={{
                width: "100%",
                background: "#015865",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "12px 16px",
                fontWeight: 600,
                fontSize: 14.5,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Starting…" : "+ Create Instant Meeting"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setMode("enter")}
              style={{
                width: "100%",
                background: "#ffffff",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "11px 16px",
                fontWeight: 600,
                fontSize: 14.5,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.55 : 1,
              }}
            >
              Enter Room ID
            </button>
            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 4,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {mode === "enter" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label
              htmlFor="im-code-input"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#334155",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Room ID
            </label>
            <input
              id="im-code-input"
              placeholder="e.g. xyz-abcd-efg"
              value={code}
              autoFocus
              autoComplete="off"
              spellCheck="false"
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.trim() && !busy) onEnter(code.trim());
              }}
              style={{
                width: "100%",
                padding: "11px 12px",
                fontSize: 14,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                outline: "none",
                background: "#fff",
                color: "#0f172a",
                boxSizing: "border-box",
                transition: "border-color 120ms, box-shadow 120ms",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#015865";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(1, 88, 101, 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 2,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 6 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setMode("menu")}
                style={{
                  background: "transparent",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.55 : 1,
                }}
              >
                ‹ Back
              </button>
              <button
                type="button"
                disabled={busy || !code.trim()}
                onClick={() => onEnter(code.trim())}
                style={{
                  background: "#015865",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 18px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: busy || !code.trim() ? "not-allowed" : "pointer",
                  opacity: busy || !code.trim() ? 0.6 : 1,
                }}
              >
                {busy ? "Joining…" : "Join Room"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE MODAL
═══════════════════════════════════════════════════════════ */
function CreateGroupSessionModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);

  const [subjectGroups, setSubjectGroups] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [invitees, setInvitees] = useState([]);   // [{user_id, name, student_id}]
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(groupSessionService.DURATIONS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load subjects on mount
  useEffect(() => {
    let cancelled = false;
    groupSessionService.getMySubjects()
      .then((g) => { if (!cancelled) setSubjectGroups(g || []); })
      .catch(() => { if (!cancelled) setSubjectGroups([]); });
    return () => { cancelled = true; };
  }, []);

  // Load teachers whenever subject changes
  useEffect(() => {
    if (!subjectId) { setTeachers([]); setTeacherId(""); return; }
    let cancelled = false;
    groupSessionService.getTeachers(subjectId)
      .then((t) => { if (!cancelled) setTeachers(t || []); })
      .catch(() => { if (!cancelled) setTeachers([]); });
    return () => { cancelled = true; };
  }, [subjectId]);

  // Clear invitees when subject changes (they're course-scoped)
  useEffect(() => { setInvitees([]); }, [subjectId]);

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  // If the user picked today, any slot earlier than "now" is invalid —
  // the backend rejects past schedules. Compute that cutoff here so the
  // UI can disable those buttons instead of letting the user hit a 400.
  const isToday = date === minDate;
  const nowHHMM = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [date]); // recompute when the chosen date changes (cheap)

  const isSlotPast = (slotValue) => isToday && slotValue <= nowHHMM;

  // If the currently-picked slot becomes invalid (e.g. user changes date
  // from tomorrow back to today), drop the selection.
  useEffect(() => {
    if (time && isSlotPast(time)) setTime("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const selectedSubjectName = useMemo(() => {
    for (const g of subjectGroups) {
      const s = (g.subjects || []).find((x) => x.id === subjectId);
      if (s) return s.name;
    }
    return "";
  }, [subjectGroups, subjectId]);

  const addInvitee = (s) => {
    if (invitees.find((x) => x.user_id === s.user_id)) return;
    if (invitees.length >= groupSessionService.MAX_INVITEES) return;
    setInvitees([...invitees, {
      user_id: s.user_id, name: s.name, student_id: s.student_id,
    }]);
  };

  const removeInvitee = (uid) => {
    setInvitees(invitees.filter((x) => x.user_id !== uid));
  };

  const canNext1 = !!subjectId;
  const canNext2 = invitees.length >= 1;
  const canNext3 = !!date && !!time && !!duration;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const sg = await groupSessionService.createGroupSession({
        subject_id: subjectId,
        invited_teacher_id: teacherId || null,
        invited_user_ids: invitees.map((i) => i.user_id),
        scheduled_date: date,
        scheduled_time: time,
        duration_minutes: duration.value,
        topic,
      });
      onCreated?.(sg);
      onClose();
    } catch (err) {
      // Log the raw response so it shows up in the browser console for
      // debugging, and surface the user-friendly message in the UI.
      // eslint-disable-next-line no-console
      console.error("createGroupSession failed:", err?.response?.data);
      setError(extractApiError(err, "Could not create the group session."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sg__modalOverlay" onClick={onClose}>
      <div className="sg__modal" onClick={(e) => e.stopPropagation()}>
        <div className="sg__modalHead">
          <h3 className="sg__modalTitle">Create Group Session</h3>
          <div className="sg__stepDots">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`sg__stepDot ${n === step ? "active" : ""} ${n < step ? "done" : ""}`}>{n}</span>
            ))}
          </div>
        </div>

        {error && <div className="sg__errorBox">{error}</div>}

        {step === 1 && (
          <div className="sg__step">
            <label className="sg__label">Subject</label>
            <select
              className="sg__input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">-- Select a subject --</option>
              {subjectGroups.map((g) => (
                <optgroup key={g.course_id} label={g.course_label}>
                  {(g.subjects || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <label className="sg__label">Topic (optional)</label>
            <input
              className="sg__input"
              placeholder="e.g. Trigonometric identities revision"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={255}
            />

            <label className="sg__label">Invite a teacher (optional)</label>
            <select
              className="sg__input"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={!subjectId}
            >
              <option value="">-- No teacher (peers only) --</option>
              {teachers.map((t) => (
                // Backend returns teachers as { id, name } — use `id` as the
                // UUID that gets sent to /group-sessions/create/.
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="sg__step">
            <label className="sg__label">
              Invite classmates (min 1, max {groupSessionService.MAX_INVITEES})
            </label>
            <p className="sg__hint">
              You can only invite students enrolled in the same course.
              Your group session opens as soon as <strong>one classmate accepts</strong>.
            </p>

            {/* Selected pills */}
            <div className="sg__pillRow">
              {invitees.map((i) => (
                <div key={i.user_id} className="sg__pill">
                  <span className="sg__pillAv">{(i.name || "?").charAt(0).toUpperCase()}</span>
                  <span className="sg__pillName">{i.name}</span>
                  <button className="sg__pillX" onClick={() => removeInvitee(i.user_id)}>×</button>
                </div>
              ))}
              {invitees.length === 0 && (
                <div className="sg__emptyPill">No classmates added yet.</div>
              )}
            </div>

            {/* Picker */}
            {invitees.length < groupSessionService.MAX_INVITEES && (
              <InviteePicker
                subjectId={subjectId}
                excludeUserIds={invitees.map((i) => i.user_id)}
                onSelect={addInvitee}
              />
            )}
            <div className="sg__count">
              {invitees.length} / {groupSessionService.MAX_INVITEES} invited
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sg__step">
            <label className="sg__label">Date</label>
            <input
              type="date"
              className="sg__input"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <label className="sg__label">Time</label>
            <div className="sg__slotGrid">
              {groupSessionService.TIME_SLOTS.map((t) => {
                const past = isSlotPast(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    disabled={past}
                    title={past ? "This time has already passed today" : undefined}
                    className={`sg__slotBtn ${time === t.value ? "selected" : ""} ${past ? "disabled" : ""}`}
                    onClick={() => { if (!past) setTime(t.value); }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <label className="sg__label">Duration</label>
            <div className="sg__slotGrid sg__slotGrid--dur">
              {groupSessionService.DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`sg__slotBtn ${duration?.value === d.value ? "selected" : ""}`}
                  onClick={() => setDuration(d)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="sg__hint">
              The room ends exactly {duration?.label || "…"} after the first
              person joins, or when it's empty for 7 minutes.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="sg__step">
            <h4 className="sg__summaryHead">Summary</h4>
            <div className="sg__summary">
              <div className="sg__summaryRow"><span>Subject</span><strong>{selectedSubjectName || "—"}</strong></div>
              <div className="sg__summaryRow"><span>Topic</span><strong>{topic || "—"}</strong></div>
              <div className="sg__summaryRow"><span>Teacher</span><strong>{teachers.find((t) => t.id === teacherId)?.name || "None"}</strong></div>
              <div className="sg__summaryRow"><span>Invitees</span><strong>{invitees.length}</strong></div>
              <div className="sg__summaryRow"><span>Date</span><strong>{date ? formatDate(date) : "—"}</strong></div>
              <div className="sg__summaryRow"><span>Time</span><strong>{formatTime(time) || "—"}</strong></div>
              <div className="sg__summaryRow"><span>Duration</span><strong>{duration?.label}</strong></div>
            </div>
          </div>
        )}

        <div className="sg__modalFoot">
          {step > 1 ? (
            <button className="sg__btnGhost" onClick={() => setStep(step - 1)}>Back</button>
          ) : (
            <button className="sg__btnGhost" onClick={onClose}>Cancel</button>
          )}
          {step < 4 ? (
            <button
              className="sg__btnPrimary"
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2) || (step === 3 && !canNext3)}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="sg__btnPrimary"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? "Creating…" : "Create Group Session"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DETAIL VIEW
═══════════════════════════════════════════════════════════ */
function GroupSessionDetail({ group, onBack, onChanged }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [showInvite, setShowInvite] = useState(false);
  const [data, setData] = useState(group);
  const [dlg, setDlg] = useState(null);

  useEffect(() => { setData(group); }, [group]);

  // eslint-disable-next-line no-unused-vars
  const refresh = useCallback(async () => {
    try {
      const fresh = await groupSessionService.getDetail(data.id);
      setData(fresh);
      onChanged?.(fresh);
    } catch {}
  }, [data.id, onChanged]);

  const userId = user?.id ? String(user.id) : null;
  const isHost = userId && data.hostId && String(data.hostId) === userId;
  const myInvite = data.invites.find(
    (i) => userId && String(i.userId) === userId
  );
  const myInviteStatus = myInvite?.status || null;

  const accepted = data.invites.filter((i) => i.status === "accepted");
  const pending = data.invites.filter((i) => i.status === "pending");
  const declined = data.invites.filter((i) => i.status === "declined");

  // Response-window: true while backend still allows accept/decline/unaccept.
  // Mirrors the gating in group_session_views.py.
  const scheduledAt = useMemo(() => {
    if (!data.date || !data.time) return null;
    const d = new Date(`${data.date}T${data.time}`);
    return isNaN(d.getTime()) ? null : d;
  }, [data.date, data.time]);
  const isPast = scheduledAt ? scheduledAt.getTime() <= Date.now() : false;
  const roomOpened = Boolean(data.roomStartedAt);

  // Time-based "session has ended" check. The backend flips status to
  // 'completed' via the Celery hard-cutoff task and the join-attempt
  // fallback (group_session_views.join_group_session line ~916), but those
  // fire at trigger points — if the user has the detail page open at the
  // exact moment the duration elapses, the status flip arrives via
  // refresh/broadcast, not by itself. Computing this client-side here
  // means STATUS and the JOIN ROOM button update instantly without
  // waiting for a re-fetch, AND it prevents the "click JOIN ROOM, get
  // 400 from /join/" failure mode that prompted this fix.
  const isEndedByTime = useMemo(() => {
    if (data.status === "live" && data.roomStartedAt && data.durationMinutes) {
      const end =
        new Date(data.roomStartedAt).getTime() + data.durationMinutes * 60_000;
      if (!Number.isNaN(end) && Date.now() >= end) return true;
    }
    return false;
  }, [data.status, data.roomStartedAt, data.durationMinutes]);

  // What the UI should treat the status as. Backend may still say "live",
  // but if duration has elapsed we render it as completed.
  const effectiveStatus = isEndedByTime ? "completed" : data.status;

  // Host is implicitly accepted, but is the only one who can start the
  // room. Once the host has opened the room (room_started_at is set and
  // status has flipped to live), every accepted invitee can join.
  //
  // Button label depends on who's looking and what state we're in:
  //   * host & not yet opened → "Start room"  (gated on >= 1 non-host
  //                                            invitee having accepted)
  //   * host & live           → "Join room"
  //   * invitee accepted & live → "Join room"
  //   * invitee accepted & scheduled → no button, "waiting for host"
  //                                    note shown below instead.
  const acceptedNonHost = accepted.filter(
    (i) => !data.hostId || String(i.userId) !== String(data.hostId)
  );
  const canHostStart =
    isHost &&
    effectiveStatus === "scheduled" &&
    !roomOpened &&
    !isPast &&
    acceptedNonHost.length >= 1;
  const canJoinLive =
    (isHost || myInviteStatus === "accepted") &&
    effectiveStatus === "live" &&
    roomOpened;
  const canJoin = canHostStart || canJoinLive;
  const joinLabel = canHostStart ? "START ROOM" : "JOIN ROOM";

  const enterRoom = async () => {
    setBusy(true); setError("");
    try {
      await groupSessionService.joinRoom(data.id);
      navigate(`/group-session/live/${data.id}`);
    } catch (err) {
      setError(extractApiError(err, "Unable to join the group session right now."));
      setBusy(false);
    }
  };

  const doAccept = async () => {
    setBusy(true); setError("");
    try {
      const fresh = await groupSessionService.acceptInvite(data.id);
      setData(fresh); onChanged?.(fresh);
    } catch (err) {
      setError(extractApiError(err, "Failed to accept."));
    } finally { setBusy(false); }
  };

  const doDecline = async () => {
    setBusy(true); setError("");
    try {
      const fresh = await groupSessionService.declineInvite(data.id);
      setData(fresh); onChanged?.(fresh);
      setDlg(null);
    } catch (err) {
      setError(extractApiError(err, "Failed to decline."));
    } finally { setBusy(false); }
  };

  // Student invitee who previously accepted flips back to 'pending'. The
  // backend permits this any time before the room actually opens.
  const doUnaccept = async () => {
    setBusy(true); setError("");
    try {
      const fresh = await groupSessionService.unacceptInvite(data.id);
      setData(fresh); onChanged?.(fresh);
      setDlg(null);
    } catch (err) {
      setError(extractApiError(err, "Could not cancel your attendance."));
    } finally { setBusy(false); }
  };

  const doReinvite = async (uid) => {
    setBusy(true); setError("");
    try {
      const fresh = await groupSessionService.reinvite(data.id, uid);
      setData(fresh); onChanged?.(fresh);
    } catch (err) {
      setError(extractApiError(err, "Failed to re-invite."));
    } finally { setBusy(false); }
  };

  const doCancel = async () => {
    setBusy(true); setError("");
    try {
      const fresh = await groupSessionService.cancelGroupSession(data.id);
      setData(fresh); onChanged?.(fresh);
      setDlg(null);
    } catch (err) {
      setError(extractApiError(err, "Failed to cancel."));
    } finally { setBusy(false); }
  };

  const confirmCancelGroup = () => {
    setDlg({
      title: "Cancel this group session?",
      message:
        "Everyone you invited will be notified that the session is cancelled. " +
        "This can't be undone.",
      confirmLabel: "Yes, cancel group session",
      cancelLabel: "Keep it",
      danger: true,
      busy: false,
      onConfirm: doCancel,
    });
  };

  const confirmDecline = () => {
    setDlg({
      title: "Decline this invite?",
      message:
        "You won't be able to join this group session unless the host sends a new invite.",
      confirmLabel: "Decline invite",
      cancelLabel: "Keep it",
      danger: true,
      busy: false,
      onConfirm: doDecline,
    });
  };

  const confirmUnaccept = () => {
    setDlg({
      title: "Cancel your attendance?",
      message:
        "The host and other participants will see you're no longer coming. " +
        "You can re-accept any time before the room opens.",
      confirmLabel: "Yes, cancel attendance",
      cancelLabel: "Keep attending",
      danger: true,
      busy: false,
      onConfirm: doUnaccept,
    });
  };

  return (
    <div className="sg__detail">
      <div className="sg__detailBack">
        <button className="sg__backBtn" onClick={onBack}>‹ Back to Group Sessions</button>
      </div>

      <div className={`sg__statusBar sg__statusBar--${effectiveStatus}`}>
        <span>STATUS: {statusLabel(effectiveStatus)}</span>
        {canJoin && (
          <button
            className="sg__joinBtn"
            disabled={busy}
            onClick={enterRoom}
          >
            {joinLabel}
          </button>
        )}
        {isHost && effectiveStatus === "scheduled" && !roomOpened && (
          <button
            className="sg__cancelBtn"
            onClick={confirmCancelGroup}
            disabled={busy}
          >
            Cancel Group Session
          </button>
        )}
      </div>

      {data.status === "cancelled" && (
        <div className="sg__cancelBanner">
          <strong>
            {isHost
              ? "You cancelled this group session."
              : "This group session was cancelled by the host."}
          </strong>
          {data.cancelReason && (
            <span className="sg__cancelBannerReason">
              Reason: {data.cancelReason}
            </span>
          )}
        </div>
      )}

      {/* "Duration elapsed while the user has the page open" — surfaced
          immediately so we don't have to wait for the next list refresh
          or for the host to manually close the room. Skipped when the
          group is already in a terminal state, since those have their
          own banners above. */}
      {isEndedByTime && data.status !== "cancelled" && (
        <div className="sg__cancelBanner sg__cancelBanner--muted">
          <strong>This group session has ended.</strong>
          <span className="sg__cancelBannerReason">
            The scheduled duration has elapsed. It will move to History
            on the next refresh.
          </span>
        </div>
      )}

      {((data.status === "expired" && !roomOpened) ||
        (data.status === "scheduled" && isPast && !roomOpened)) && (
        <div className="sg__cancelBanner sg__cancelBanner--muted">
          <strong>Not attended.</strong>
          <span className="sg__cancelBannerReason">
            The scheduled time has passed and nobody opened the room, so this
            group session has been moved to History.
          </span>
        </div>
      )}

      {error && <div className="sg__errorBox">{error}</div>}

      <div className="sg__detailBody">
        <div className="sg__detailLeft">
          {[
            ["Subject", data.subjectName],
            ["Course", data.courseTitle || "—"],
            ["Topic", data.topic || "—"],
            ["Host", data.hostName],
            ["Teacher", data.invitedTeacher || "None"],
            ["Date", formatDate(data.date)],
            ["Time", formatTime(data.time)],
            ["Duration", `${data.durationMinutes} minutes`],
          ].map(([k, v]) => (
            <div key={k} className="sg__detailRow">
              <span className="sg__detailKey">{k}:</span>
              <span className="sg__detailVal">{v}</span>
            </div>
          ))}
          {data.cancelReason && (
            <div className="sg__detailRow">
              <span className="sg__detailKey">Cancel reason:</span>
              <span className="sg__detailVal">{data.cancelReason}</span>
            </div>
          )}
        </div>

        <div className="sg__detailRight">
          <div className="sg__sectionHead">
            Participants ({1 + accepted.length + pending.length + declined.length})
          </div>

          {/* Host — always implicitly accepted, sits at the top of the
              list as the source of truth for who started the group. */}
          <div className="sg__participantList">
            <div className="sg__participant sg__participant--host">
              <span className="sg__pAv">{(data.hostName || "?").charAt(0).toUpperCase()}</span>
              <div className="sg__pInfo">
                <span className="sg__pName">
                  {data.hostName}
                  {isHost && <span className="sg__pSelfTag"> (you)</span>}
                </span>
                <span className="sg__pRole">Host · implicitly accepted</span>
              </div>
              <span className="sg__pStatusPill sg__pStatusPill--host">Host</span>
            </div>
          </div>

          {/* Accepted */}
          {accepted.length > 0 && (
            <>
              <div className="sg__sectionSubHead">
                ✅ Accepted ({accepted.length})
              </div>
              <div className="sg__participantList">
                {accepted.map((inv) => (
                  <div key={inv.id} className="sg__participant sg__participant--accepted">
                    <span className="sg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                    <div className="sg__pInfo">
                      <span className="sg__pName">
                        {inv.name}
                        {userId && String(inv.userId) === userId && (
                          <span className="sg__pSelfTag"> (you)</span>
                        )}
                      </span>
                      <span className="sg__pRole">
                        {inv.role === "teacher" ? "Invited teacher" : "Invited student"}
                        {inv.studentId ? ` · ${shortId(inv.studentId)}` : ""}
                      </span>
                    </div>
                    <span className="sg__pStatusPill sg__pStatusPill--accepted">
                      Accepted
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <>
              <div className="sg__sectionSubHead">
                ⏳ Pending ({pending.length})
              </div>
              <div className="sg__participantList">
                {pending.map((inv) => (
                  <div key={inv.id} className="sg__participant sg__participant--pending">
                    <span className="sg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                    <div className="sg__pInfo">
                      <span className="sg__pName">
                        {inv.name}
                        {userId && String(inv.userId) === userId && (
                          <span className="sg__pSelfTag"> (you)</span>
                        )}
                      </span>
                      <span className="sg__pRole">
                        {inv.role === "teacher" ? "Invited teacher" : "Invited student"}
                        {inv.studentId ? ` · ${shortId(inv.studentId)}` : ""}
                      </span>
                    </div>
                    <span className="sg__pStatusPill sg__pStatusPill--pending">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Declined */}
          {declined.length > 0 && (
            <>
              <div className="sg__sectionSubHead">
                ✗ Declined ({declined.length})
              </div>
              <div className="sg__participantList">
                {declined.map((inv) => (
                  <div key={inv.id} className="sg__participant sg__participant--declined">
                    <span className="sg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                    <div className="sg__pInfo">
                      <span className="sg__pName">
                        {inv.name}
                        {userId && String(inv.userId) === userId && (
                          <span className="sg__pSelfTag"> (you)</span>
                        )}
                      </span>
                      <span className="sg__pRole">
                        {inv.role === "teacher" ? "Invited teacher" : "Invited student"}
                        {inv.studentId ? ` · ${shortId(inv.studentId)}` : ""}
                      </span>
                    </div>
                    <span className="sg__pStatusPill sg__pStatusPill--declined">
                      Declined
                    </span>
                    {isHost &&
                     data.status === "scheduled" &&
                     !inv.reinvitedAt &&
                     inv.declineCount < 2 && (
                      <button
                        className="sg__reinviteBtn"
                        disabled={busy}
                        onClick={() => doReinvite(inv.userId)}
                      >
                        Re-invite
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {isHost && data.status === "scheduled" && (
            <InviteMoreInline
              session={data}
              onDone={(fresh) => { setData(fresh); onChanged?.(fresh); }}
            />
          )}
        </div>
      </div>

      {/* Invitee actions */}
      {!isHost &&
        myInviteStatus === "pending" &&
        data.status === "scheduled" &&
        !isPast && (
          <div className="sg__inviteeBar">
            <button
              className="sg__btnPrimary"
              disabled={busy}
              onClick={doAccept}
            >
              Accept
            </button>
            <button
              className="sg__btnGhost"
              disabled={busy}
              onClick={confirmDecline}
            >
              Decline
            </button>
          </div>
      )}

      {!isHost &&
        myInviteStatus === "pending" &&
        data.status === "scheduled" &&
        isPast && (
          <div className="sg__inviteeNote sg__inviteeNote--past">
            The scheduled start time has passed, so you can no longer respond
            to this invite. It will move to History automatically.
          </div>
      )}

      {!isHost &&
        myInviteStatus === "accepted" &&
        data.status === "scheduled" &&
        !roomOpened && (
          <div className="sg__inviteeBar">
            <span className="sg__inviteeNote sg__inviteeNote--inline">
              You're in. Waiting for {data.hostName || "the host"} to start
              the room — only the host can open it. You'll be able to join
              the moment they do.
            </span>
            <button
              className="sg__btnGhost"
              disabled={busy}
              onClick={confirmUnaccept}
            >
              Cancel attendance
            </button>
          </div>
      )}

      {!isHost && myInviteStatus === "declined" && (
        <div className="sg__inviteeNote">
          You declined this group session{data.status === "scheduled" ? "" : " (it has already moved on)"}.
        </div>
      )}

      <ConfirmDialog
        dialog={dlg ? { ...dlg, busy } : null}
        onClose={() => (busy ? null : setDlg(null))}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INVITE-MORE (host, inline)
═══════════════════════════════════════════════════════════ */
function InviteMoreInline({ session, onDone }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const existingIds = session.invites.map((i) => String(i.userId));
  const currentCount = session.invites.length;
  const remaining = session.maxInvitees - currentCount;

  // The picker queries /sessions/subjects/<id>/students/, which restricts
  // results to students enrolled in the subject's course. `subjectId` is
  // mapped through transformGroupSession; the legacy fallback covers any
  // older session shape that hasn't gone through the new transform.
  const inviteSubjectId = session.subjectId || session.subject_id || null;

  const submit = async () => {
    if (picked.length === 0) return;
    setBusy(true); setErr("");
    try {
      const fresh = await groupSessionService.inviteMore(
        session.id, picked.map((p) => p.user_id),
      );
      onDone?.(fresh);
      setPicked([]); setOpen(false);
    } catch (e) {
      setErr(extractApiError(e, "Failed to invite."));
    } finally { setBusy(false); }
  };

  if (remaining <= 0) return null;

  return (
    <div className="sg__inviteMore">
      {!open ? (
        <button className="sg__btnGhost" onClick={() => setOpen(true)}>
          + Invite more ({remaining} slot{remaining === 1 ? "" : "s"} left)
        </button>
      ) : (
        <>
          <p className="sg__hint">
            Only classmates enrolled in the same course who take this subject
            can be invited. They'll need to accept the invitation before
            joining the room.
          </p>
          <div className="sg__pillRow">
            {picked.map((p) => (
              <div key={p.user_id} className="sg__pill">
                <span className="sg__pillAv">{(p.name || "?").charAt(0).toUpperCase()}</span>
                <span className="sg__pillName">{p.name}</span>
                <button
                  className="sg__pillX"
                  onClick={() => setPicked(picked.filter((x) => x.user_id !== p.user_id))}
                >×</button>
              </div>
            ))}
          </div>
          <InviteePicker
            subjectId={inviteSubjectId}
            excludeUserIds={[...existingIds, ...picked.map((p) => p.user_id)]}
            onSelect={(s) => {
              if (picked.length >= remaining) return;
              if (!picked.find((x) => x.user_id === s.user_id)) {
                setPicked([...picked, s]);
              }
            }}
          />
          {err && <div className="sg__errorBox">{err}</div>}
          <div className="sg__inviteMoreFoot">
            <button className="sg__btnGhost" onClick={() => { setOpen(false); setPicked([]); setErr(""); }}>
              Cancel
            </button>
            <button
              className="sg__btnPrimary"
              disabled={picked.length === 0 || busy}
              onClick={submit}
            >
              {busy ? "Inviting…" : `Send ${picked.length} invite${picked.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function GroupSessions() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("upcoming");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInstantMenu, setShowInstantMenu] = useState(false);
  const [instantBusy, setInstantBusy] = useState(false);
  const [instantError, setInstantError] = useState("");
  const [selected, setSelected] = useState(null);
  const [pendingInvites, setPendingInvites] = useState(0);

  // "+ Create Instant Meeting" inside the Instant Meeting popup.
  // POSTs to /group-sessions/instant/ and walks the host straight into
  // the live room — no invitees required (backend bypass already in place).
  const startInstantMeeting = async () => {
    setInstantBusy(true);
    setInstantError("");
    try {
      const sg = await groupSessionService.createInstant({});
      setShowInstantMenu(false);
      navigate(`/group-session/live/${sg.id}`);
    } catch (err) {
      setInstantError(extractApiError(err, "Could not start an instant meeting."));
    } finally {
      setInstantBusy(false);
    }
  };

  // "Enter Room ID" inside the Instant Meeting popup.
  // Looks up the session by short_code (or UUID), then navigates into the
  // live room with the resolved session id. The actual LiveKit token is
  // still issued by /join/ when the live route mounts.
  const enterRoomByCode = async (code) => {
    if (!code) return;
    setInstantBusy(true);
    setInstantError("");
    try {
      const { session_id } = await groupSessionService.joinByCode(code);
      setShowInstantMenu(false);
      navigate(`/group-session/live/${session_id}`);
    } catch (err) {
      setInstantError(extractApiError(err, "Couldn't join that room."));
    } finally {
      setInstantBusy(false);
    }
  };

  // History selection state — Clear All and Select / Delete N for cleanup.
  // Reset whenever the tab changes so we don't carry stale selections in.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyDlg, setHistoryDlg] = useState(null);

  // Ticker that bumps every 15s while the Upcoming tab is showing. Used
  // only to trigger the isEndedNow re-evaluation in the useMemo below —
  // not for re-fetching, since the time-based filter is a pure client
  // computation. The list itself still refreshes on tab change / explicit
  // user action.
  // eslint-disable-next-line no-unused-vars
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    if (tab !== "upcoming") return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, [tab]);

  // Reset selection state whenever the tab switches.
  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [tab]);

  const loadGroups = useCallback(async (targetTab = tab) => {
    setLoading(true);
    try {
      const data = await groupSessionService.getMyGroupSessions(targetTab);
      setGroups(data);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  // Pending invites count for the tab badge
  const refreshPendingCount = useCallback(async () => {
    try {
      const data = await groupSessionService.getMyGroupSessions("invites");
      setPendingInvites((data || []).length);
    } catch {
      setPendingInvites(0);
    }
  }, []);

  useEffect(() => { loadGroups(tab); }, [tab, loadGroups]);
  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  // Visible cards = backend response minus time-expired ones on Upcoming.
  // _tick is referenced via setTick → state change → re-render, which
  // re-runs isEndedNow with a fresh Date.now(). On History/Invitations
  // tabs we pass through unchanged.
  const visibleGroups = useMemo(() => {
    if (tab !== "upcoming") return groups;
    return groups.filter((g) => !isEndedNow(g));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, tab, _tick]);

  const handleCreated = (sg) => {
    setTab("upcoming");
    loadGroups("upcoming");
    setSelected(sg);
  };

  const handleChanged = () => {
    loadGroups(tab);
    refreshPendingCount();
  };

  const toggleSelectId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setHistoryBusy(true);
    try {
      await groupSessionService.clearHistory({
        sessionIds: Array.from(selectedIds),
      });
      exitSelectMode();
      loadGroups("history");
    } catch {
      // Errors here are rare (auth/transient) — swallow and let the user
      // try again. A toast system would be ideal but the page doesn't have
      // one wired in for this surface yet.
    } finally {
      setHistoryBusy(false);
      setHistoryDlg(null);
    }
  };

  const deleteAllHistory = async () => {
    setHistoryBusy(true);
    try {
      await groupSessionService.clearHistory({ all: true });
      exitSelectMode();
      loadGroups("history");
    } catch {
      // see note above
    } finally {
      setHistoryBusy(false);
      setHistoryDlg(null);
    }
  };

  const confirmDeleteSelected = () => {
    setHistoryDlg({
      title: `Delete ${selectedIds.size} from history?`,
      message:
        "These group sessions will disappear from your History. " +
        "Other participants and the host will still see them.",
      confirmLabel: `Delete ${selectedIds.size}`,
      cancelLabel: "Keep",
      danger: true,
      onConfirm: deleteSelected,
    });
  };

  const confirmDeleteAll = () => {
    setHistoryDlg({
      title: "Clear all history?",
      message:
        "Every past group session in your History will be removed from your " +
        "view. Other participants and the host will still see them. " +
        "This can't be undone.",
      confirmLabel: "Clear all",
      cancelLabel: "Keep",
      danger: true,
      onConfirm: deleteAllHistory,
    });
  };

  if (selected) {
    return (
      <div className="sg__page">
        <PageHeader title="Group Sessions" />
        <GroupSessionDetail
          group={selected}
          onBack={() => { setSelected(null); handleChanged(); }}
          onChanged={(fresh) => { setSelected(fresh); handleChanged(); }}
        />
      </div>
    );
  }

  const isHistory = tab === "history";

  return (
    <div className="sg__page">
      <PageHeader title="Group Sessions" />

      <div className="sg__header">
        <div className="sg__tabs">
          <button
            className={`sg__tab ${tab === "upcoming" ? "active" : ""}`}
            onClick={() => setTab("upcoming")}
          >Upcoming</button>
          <button
            className={`sg__tab ${tab === "invites" ? "active" : ""}`}
            onClick={() => setTab("invites")}
          >
            Invitations
            {pendingInvites > 0 && (
              <span className="sg__tabBadge">{pendingInvites}</span>
            )}
          </button>
          <button
            className={`sg__tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >History</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="sg__btnPrimary" onClick={() => setShowCreate(true)}>
            + Create Group Session
          </button>
          <button
            className="sg__btnPrimary"
            onClick={() => { setInstantError(""); setShowInstantMenu(true); }}
            style={{ background: "#1a73e8" }}
            title="Start a new instant meeting or join one with a room code"
          >
            Instant Meeting
          </button>
        </div>
      </div>

      {/* History-tab cleanup controls. Only render when there's actually
          something to clear, otherwise they'd be misleading. */}
      {isHistory && !loading && groups.length > 0 && (
        <div className="sg__historyTools">
          {!selectMode ? (
            <>
              <button
                className="sg__btnGhost"
                onClick={() => setSelectMode(true)}
                disabled={historyBusy}
              >
                Select
              </button>
              <button
                className="sg__btnDangerGhost"
                onClick={confirmDeleteAll}
                disabled={historyBusy}
              >
                Clear All History
              </button>
            </>
          ) : (
            <>
              <span className="sg__historyToolsLabel">
                {selectedIds.size === 0
                  ? "Select cards to delete"
                  : `${selectedIds.size} selected`}
              </span>
              <button
                className="sg__btnDanger"
                onClick={confirmDeleteSelected}
                disabled={historyBusy || selectedIds.size === 0}
              >
                Delete Selected
              </button>
              <button
                className="sg__btnGhost"
                onClick={exitSelectMode}
                disabled={historyBusy}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div className="sg__loading">Loading group sessions…</div>
      ) : visibleGroups.length === 0 ? (
        <div className="sg__empty">
          {tab === "upcoming" && "No upcoming group sessions. Create one to get started!"}
          {tab === "invites" && "You have no pending invitations."}
          {tab === "history" && "No past group sessions yet."}
        </div>
      ) : (
        <div className="sg__grid">
          {visibleGroups.map((g) => (
            <GroupSessionCard
              key={g.id}
              group={g}
              onOpen={setSelected}
              selectMode={isHistory && selectMode}
              selected={selectedIds.has(g.id)}
              onToggleSelect={toggleSelectId}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupSessionModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      <ConfirmDialog
        dialog={historyDlg ? { ...historyDlg, busy: historyBusy } : null}
        onClose={() => (historyBusy ? null : setHistoryDlg(null))}
      />

      {/* Instant Meeting popup — Create | Enter Room ID | ✕ */}
      <InstantMeetingDialog
        open={showInstantMenu}
        busy={instantBusy}
        error={instantError}
        onClose={() => { if (!instantBusy) { setShowInstantMenu(false); setInstantError(""); } }}
        onCreate={startInstantMeeting}
        onEnter={enterRoomByCode}
      />
    </div>
  );
}
