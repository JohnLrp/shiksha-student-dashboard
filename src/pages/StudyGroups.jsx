/**
 * FILE: STUDENT_DASHBOARD/src/pages/StudyGroups.jsx
 *
 * Study Groups page — parallel to PrivateSessions but visually
 * distinct (uses its own sg__* class prefix + studyGroups.css).
 * Tabs: Upcoming | Invitations | History.
 *
 * This page is additive: it does NOT import or change anything used
 * by the existing Private Sessions flow.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import studyGroupService from "../api/studyGroupService";
import "../styles/studyGroups.css";

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
  const m = {
    scheduled: "📅 Scheduled", live: "🔴 Live",
    completed: "✔ Completed", cancelled: "✗ Cancelled", expired: "⏰ Expired",
  };
  return m[st] || st;
}

function shortId(id) {
  if (!id) return "";
  return String(id).length > 10 ? `${String(id).slice(0, 8)}…` : id;
}

/* ═══════════════════════════════════════════════════════════
   STUDY GROUP CARD
═══════════════════════════════════════════════════════════ */
function StudyGroupCard({ group, onOpen }) {
  return (
    <div className={`sg__card sg__card--${group.status}`} onClick={() => onOpen(group)}>
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
      const data = await studyGroupService.getCourseStudents(subjectId, q);
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
   CREATE MODAL
═══════════════════════════════════════════════════════════ */
function CreateStudyGroupModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);

  const [subjectGroups, setSubjectGroups] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [invitees, setInvitees] = useState([]);   // [{user_id, name, student_id}]
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(studyGroupService.DURATIONS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load subjects on mount
  useEffect(() => {
    let cancelled = false;
    studyGroupService.getMySubjects()
      .then((g) => { if (!cancelled) setSubjectGroups(g || []); })
      .catch(() => { if (!cancelled) setSubjectGroups([]); });
    return () => { cancelled = true; };
  }, []);

  // Load teachers whenever subject changes
  useEffect(() => {
    if (!subjectId) { setTeachers([]); setTeacherId(""); return; }
    let cancelled = false;
    studyGroupService.getTeachers(subjectId)
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

  const selectedSubjectName = useMemo(() => {
    for (const g of subjectGroups) {
      const s = (g.subjects || []).find((x) => x.id === subjectId);
      if (s) return s.name;
    }
    return "";
  }, [subjectGroups, subjectId]);

  const addInvitee = (s) => {
    if (invitees.find((x) => x.user_id === s.user_id)) return;
    if (invitees.length >= studyGroupService.MAX_INVITEES) return;
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
      const sg = await studyGroupService.createStudyGroup({
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
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Could not create the study group."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sg__modalOverlay" onClick={onClose}>
      <div className="sg__modal" onClick={(e) => e.stopPropagation()}>
        <div className="sg__modalHead">
          <h3 className="sg__modalTitle">Create Study Group</h3>
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
                <option key={t.user_id} value={t.user_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === 2 && (
          <div className="sg__step">
            <label className="sg__label">
              Invite classmates (min 1, max {studyGroupService.MAX_INVITEES})
            </label>
            <p className="sg__hint">
              You can only invite students enrolled in the same course.
              Your study group opens as soon as <strong>one classmate accepts</strong>.
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
            {invitees.length < studyGroupService.MAX_INVITEES && (
              <InviteePicker
                subjectId={subjectId}
                excludeUserIds={invitees.map((i) => i.user_id)}
                onSelect={addInvitee}
              />
            )}
            <div className="sg__count">
              {invitees.length} / {studyGroupService.MAX_INVITEES} invited
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
              {studyGroupService.TIME_SLOTS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`sg__slotBtn ${time === t.value ? "selected" : ""}`}
                  onClick={() => setTime(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="sg__label">Duration</label>
            <div className="sg__slotGrid sg__slotGrid--dur">
              {studyGroupService.DURATIONS.map((d) => (
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
              <div className="sg__summaryRow"><span>Teacher</span><strong>{teachers.find((t) => t.user_id === teacherId)?.name || "None"}</strong></div>
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
              {submitting ? "Creating…" : "Create Study Group"}
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
function StudyGroupDetail({ group, onBack, onChanged }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [data, setData] = useState(group);

  useEffect(() => { setData(group); }, [group]);

  const refresh = useCallback(async () => {
    try {
      const fresh = await studyGroupService.getDetail(data.id);
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

  const canJoin =
    (isHost || myInviteStatus === "accepted") &&
    (data.status === "live" ||
      (data.status === "scheduled" && accepted.length >= 1));

  const enterRoom = async () => {
    setBusy(true); setError("");
    try {
      await studyGroupService.joinRoom(data.id);
      navigate(`/study-group/live/${data.id}`);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Unable to join the study group right now."
      );
      setBusy(false);
    }
  };

  const doAccept = async () => {
    setBusy(true); setError("");
    try {
      const fresh = await studyGroupService.acceptInvite(data.id);
      setData(fresh); onChanged?.(fresh);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to accept.");
    } finally { setBusy(false); }
  };

  const doDecline = async () => {
    setBusy(true); setError("");
    try {
      const fresh = await studyGroupService.declineInvite(data.id);
      setData(fresh); onChanged?.(fresh);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to decline.");
    } finally { setBusy(false); }
  };

  const doReinvite = async (uid) => {
    setBusy(true); setError("");
    try {
      const fresh = await studyGroupService.reinvite(data.id, uid);
      setData(fresh); onChanged?.(fresh);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to re-invite.");
    } finally { setBusy(false); }
  };

  const doCancel = async () => {
    if (!window.confirm("Cancel this study group? Invitees will be notified.")) return;
    setBusy(true); setError("");
    try {
      const fresh = await studyGroupService.cancelStudyGroup(data.id);
      setData(fresh); onChanged?.(fresh);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to cancel.");
    } finally { setBusy(false); }
  };

  return (
    <div className="sg__detail">
      <div className="sg__detailBack">
        <button className="sg__backBtn" onClick={onBack}>‹ Back to Study Groups</button>
      </div>

      <div className={`sg__statusBar sg__statusBar--${data.status}`}>
        <span>STATUS: {statusLabel(data.status)}</span>
        {canJoin && (
          <button
            className="sg__joinBtn"
            disabled={busy}
            onClick={enterRoom}
          >
            JOIN ROOM
          </button>
        )}
        {isHost && data.status === "scheduled" && (
          <button className="sg__cancelBtn" onClick={doCancel} disabled={busy}>
            Cancel Study Group
          </button>
        )}
      </div>

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
          <div className="sg__sectionHead">Participants</div>
          <div className="sg__participantList">
            <div className="sg__participant sg__participant--host">
              <span className="sg__pAv">{(data.hostName || "?").charAt(0).toUpperCase()}</span>
              <div className="sg__pInfo">
                <span className="sg__pName">{data.hostName}</span>
                <span className="sg__pRole">Host</span>
              </div>
            </div>
            {accepted.map((inv) => (
              <div key={inv.id} className="sg__participant sg__participant--accepted">
                <span className="sg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                <div className="sg__pInfo">
                  <span className="sg__pName">{inv.name}</span>
                  <span className="sg__pRole">
                    {inv.role === "teacher" ? "Teacher (accepted)" : "Accepted"}
                  </span>
                </div>
              </div>
            ))}
            {pending.map((inv) => (
              <div key={inv.id} className="sg__participant sg__participant--pending">
                <span className="sg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                <div className="sg__pInfo">
                  <span className="sg__pName">{inv.name}</span>
                  <span className="sg__pRole">
                    {inv.role === "teacher" ? "Teacher (pending)" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
            {declined.map((inv) => (
              <div key={inv.id} className="sg__participant sg__participant--declined">
                <span className="sg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                <div className="sg__pInfo">
                  <span className="sg__pName">{inv.name}</span>
                  <span className="sg__pRole">Declined</span>
                </div>
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

          {isHost && data.status === "scheduled" && (
            <InviteMoreInline
              session={data}
              onDone={(fresh) => { setData(fresh); onChanged?.(fresh); }}
            />
          )}
        </div>
      </div>

      {/* Invitee actions */}
      {!isHost && myInviteStatus === "pending" && data.status === "scheduled" && (
        <div className="sg__inviteeBar">
          <button className="sg__btnPrimary" disabled={busy} onClick={doAccept}>Accept</button>
          <button className="sg__btnGhost" disabled={busy} onClick={doDecline}>Decline</button>
        </div>
      )}

      {!isHost && myInviteStatus === "declined" && (
        <div className="sg__inviteeNote">
          You declined this study group{data.status === "scheduled" ? "" : " (it has already moved on)"}.
        </div>
      )}
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

  const submit = async () => {
    if (picked.length === 0) return;
    setBusy(true); setErr("");
    try {
      const fresh = await studyGroupService.inviteMore(
        session.id, picked.map((p) => p.user_id),
      );
      onDone?.(fresh);
      setPicked([]); setOpen(false);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to invite.");
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
            subjectId={session.subject_id || session.subject}
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
export default function StudyGroups() {
  const [tab, setTab] = useState("upcoming");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pendingInvites, setPendingInvites] = useState(0);

  const loadGroups = useCallback(async (targetTab = tab) => {
    setLoading(true);
    try {
      const data = await studyGroupService.getMyStudyGroups(targetTab);
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
      const data = await studyGroupService.getMyStudyGroups("invites");
      setPendingInvites((data || []).length);
    } catch {
      setPendingInvites(0);
    }
  }, []);

  useEffect(() => { loadGroups(tab); }, [tab, loadGroups]);
  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  const handleCreated = (sg) => {
    setTab("upcoming");
    loadGroups("upcoming");
    setSelected(sg);
  };

  const handleChanged = () => {
    loadGroups(tab);
    refreshPendingCount();
  };

  if (selected) {
    return (
      <div className="sg__page">
        <PageHeader title="Study Groups" onSearch={() => {}} />
        <StudyGroupDetail
          group={selected}
          onBack={() => { setSelected(null); handleChanged(); }}
          onChanged={(fresh) => { setSelected(fresh); handleChanged(); }}
        />
      </div>
    );
  }

  return (
    <div className="sg__page">
      <PageHeader title="Study Groups" onSearch={() => {}} />

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
        <button className="sg__btnPrimary" onClick={() => setShowCreate(true)}>
          + Create Study Group
        </button>
      </div>

      {loading ? (
        <div className="sg__loading">Loading study groups…</div>
      ) : groups.length === 0 ? (
        <div className="sg__empty">
          {tab === "upcoming" && "No upcoming study groups. Create one to get started!"}
          {tab === "invites" && "You have no pending invitations."}
          {tab === "history" && "No past study groups yet."}
        </div>
      ) : (
        <div className="sg__grid">
          {groups.map((g) => (
            <StudyGroupCard key={g.id} group={g} onOpen={setSelected} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateStudyGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
