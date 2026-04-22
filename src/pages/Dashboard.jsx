// ============================================================
// STUDENT — src/pages/Dashboard.jsx  (FULL REPLACEMENT)
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SessionCard from "../components/SessionCard";
import AssignmentCard from "../components/AssignmentCard";
import QuizCard from "../components/QuizCard";
import NotificationCard from "../components/NotificationCard";
import DropdownMenu from "../components/DropdownMenu";
import TopSliderTabs from "../components/TopSliderTabs";
import api from "../api/apiClient";
import { useCourse } from "../contexts/CourseContext";
import useNotificationSocket from "../hooks/useNotificationSocket";
import "../styles/dashboard.css";

const DATE_FORMAT = { day: "2-digit", month: "short", year: "numeric" };

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", DATE_FORMAT);
}

function toDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Event colours for calendar dots
const EVENT_COLORS = {
  assignment:       "#57D982",
  quiz:             "#93A1E5",
  "live-session":   "#38bdf8",
  "private-session":"#FF8A65",
};

const SCHEDULE_TYPE_LABELS = {
  "live-session":    "Live Session",
  assignment:        "Assignment",
  quiz:              "Quiz",
  "private-session": "Private Session",
};

export default function Dashboard() {
  const { activeCourse } = useCourse();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate]       = useState(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAssignments, setShowAssignments] = useState(true);
  const [showQuizzes, setShowQuizzes]         = useState(true);
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [scheduleFilter, setScheduleFilter]   = useState("All");
  const [activeMobileTab, setActiveMobileTab] = useState("sessions");

  // Calendar state
  const today = new Date();
  const [currMonth, setCurrMonth] = useState(today.getMonth());
  const [currYear, setCurrYear]   = useState(today.getFullYear());

  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const years  = Array.from({ length: 81 }, (_, i) => 1970 + i);

  const daysInMonth  = new Date(currYear, currMonth + 1, 0).getDate();
  const firstDayIdx  = new Date(currYear, currMonth, 1).getDay();
  const startOffset  = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

  const goToPrevMonth = () => {
    if (currMonth === 0) { setCurrMonth(11); setCurrYear((y) => y - 1); }
    else setCurrMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (currMonth === 11) { setCurrMonth(0); setCurrYear((y) => y + 1); }
    else setCurrMonth((m) => m + 1);
  };

  // Dashboard API data
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Notification hook — persisted feed + live WS
  const { markOneRead } = useNotificationSocket();

  useEffect(() => {
    if (!activeCourse) {
      setLoading(false);
      return;
    }
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/dashboard/?course_id=${activeCourse.id}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [activeCourse]);

  const sessions        = data?.sessions        ?? [];
  const allSessions     = data?.all_sessions    ?? [];  // FIX: was never read before
  const assignments     = data?.assignments     ?? [];
  const quizzes         = data?.quizzes         ?? [];
  const privateSessions = data?.private_sessions ?? [];
  const notifications   = data?.notifications   ?? [];

  const collapsedSessions = sessions.slice(0, 3);

  // Compute timing + startsIn from raw API dateTime field
  // and fix navigation to /live-sessions instead of /live/:id
  const renderSessionCard = (s, idx) => {
    const sessionTime = new Date(s.dateTime);
    const now         = new Date();
    const diffMs      = sessionTime - now;
    const diffMins    = Math.round(diffMs / 60000);

    let startsIn;
    if (diffMs < 0) {
      startsIn = "In progress";
    } else if (diffMins < 60) {
      startsIn = `Starts in ${diffMins} min`;
    } else {
      startsIn = `Starts in ${Math.floor(diffMins / 60)}h`;
    }

    const timing = sessionTime.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    return (
      <SessionCard
        key={s.id || idx}
        id={s.id}
        subject={s.subject}
        topic={s.topic}
        teacher={s.teacher}
        startsIn={startsIn}
        timing={timing}
      />
    );
  };

  // Calendar event map — FIX: live sessions now included
  const calendarEvents = useMemo(() => {
    const map = {};
    const add = (dateStr, type) => {
      const key = toDateKey(dateStr);
      if (!key) return;
      if (!map[key]) map[key] = [];
      if (!map[key].includes(type)) map[key].push(type);
    };
    assignments.forEach((a)     => add(a.due,      "assignment"));
    quizzes.forEach((q)         => add(q.due,      "quiz"));
    privateSessions.forEach((p) => add(p.date,     "private-session"));
    allSessions.forEach((s)     => add(s.dateTime, "live-session")); // FIX: was missing
    return map;
  }, [assignments, quizzes, privateSessions, allSessions]);

  // Unified schedule — FIX: uses allSessions (future), not just today's sessions
  const scheduleItems = useMemo(() => {
    const items = [];
    allSessions.forEach((s) =>
      items.push({
        id:      `session-${s.id}`,
        type:    "live-session",
        title:   `${s.subject} - ${s.topic}`,
        date:    s.dateTime,
        teacher: s.teacher,
        subject: s.subject,
        link:    `/live/${s.id}`,
      })
    );
    assignments.forEach((a) =>
      items.push({
        id:      `assignment-${a.id}`,
        type:    "assignment",
        title:   a.title,
        date:    a.due,
        teacher: a.teacher,
        subject: a.subject_name || "",
        link:    a.subject_id ? `/subjects/${a.subject_id}/assignments` : null,
      })
    );
    quizzes.forEach((q) =>
      items.push({
        id:      `quiz-${q.id}`,
        type:    "quiz",
        title:   q.title,
        date:    q.due,
        teacher: q.teacher,
        subject: q.subject_name || "",
        link:    q.subject_id ? `/subjects/quiz/${q.subject_id}` : null,
      })
    );
    privateSessions.forEach((ps) =>
      items.push({
        id:      `private-${ps.id}`,
        type:    "private-session",
        title:   ps.subject,
        date:    ps.date,
        teacher: ps.teacher_name,
        subject: ps.subject,
        link:    `/private-sessions`,
      })
    );
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return items;
  }, [allSessions, assignments, quizzes, privateSessions]);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  // Empty state — FIX: was stuck on "Loading..." if no course
  if (!activeCourse) {
    return (
      <div style={{ padding: 20 }}>
        <p>No course selected. Please select a course to view your dashboard.</p>
      </div>
    );
  }

  // Filtered notifications (type filter uses uppercase Activity types)
  const filteredNotifications =
    notificationFilter === "All"
      ? notifications
      : notifications.filter((n) => n.type === notificationFilter);

  // Filtered schedule
  const filteredSchedule = scheduleItems.filter((item) => {
    if (selectedDate) {
      const itemDate = new Date(item.date);
      const selDate  = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
      if (!isSameDay(itemDate, selDate)) return false;
    }
    if (scheduleFilter !== "All") {
      const filterMap = { ASSIGNMENT: "assignment", SESSION: "live-session", QUIZ: "quiz" };
      const mapped = filterMap[scheduleFilter] || scheduleFilter;
      if (item.type !== mapped) return false;
    }
    return true;
  });

  const handleDateClick = (day) => {
    if (
      selectedDate &&
      selectedDate.day === day &&
      selectedDate.month === currMonth &&
      selectedDate.year === currYear
    ) {
      setSelectedDate(null);
    } else {
      setSelectedDate({ day, month: currMonth, year: currYear });
    }
  };

  function getDateStyle(dateKey) {
    const types = calendarEvents[dateKey];
    if (!types || types.length === 0) return {};
    const colors = types.map((t) => EVENT_COLORS[t]).filter(Boolean);
    if (colors.length === 0) return {};
    if (colors.length === 1) return { background: colors[0], color: "#1f2d3d" };
    return { background: `linear-gradient(135deg, ${colors.join(", ")})`, color: "#1f2d3d" };
  }

  const renderCalendarGrid = () => (
    <>
      <div className="calendarHeader">
        <span className="calNavBtn" onClick={goToPrevMonth}>◀</span>
        <div className="calendarHeader__mid">
          <select className="calendarSelect" value={currMonth}
            onChange={(e) => setCurrMonth(parseInt(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i}>{m.substring(0, 3)}</option>)}
          </select>
          <select className="calendarSelect" value={currYear}
            onChange={(e) => setCurrYear(parseInt(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <span className="calNavBtn" onClick={goToNextMonth}>▶</span>
      </div>

      <div className="calendarGrid">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
          <div key={d} className="calDayName">{d}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="calDate" style={{ visibility: "hidden" }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isToday =
            day === today.getDate() &&
            currMonth === today.getMonth() &&
            currYear === today.getFullYear();
          const isSelected =
            selectedDate &&
            selectedDate.day === day &&
            selectedDate.month === currMonth &&
            selectedDate.year === currYear;
          const dateKey = `${currYear}-${String(currMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const eventStyle = !isToday && !isSelected && calendarEvents[dateKey]
            ? getDateStyle(dateKey) : {};

          return (
            <div
              key={day}
              className={`calDate ${isToday ? "calToday" : ""} ${isSelected ? "calSelected" : ""}`}
              style={eventStyle}
              onClick={() => handleDateClick(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend — FIX: live session dot added */}
      <div className="calLegend">
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#57D982" }} />Assignment
        </span>
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#93A1E5" }} />Quiz
        </span>
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#38bdf8" }} />Live Session
        </span>
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#FF8A65" }} />Private Session
        </span>
      </div>
    </>
  );

  const renderScheduleItem = (item, idx) => {
    const typeClass =
      item.type === "live-session"    ? "livesessions"
      : item.type === "assignment"    ? "assignments"
      : item.type === "quiz"          ? "quiz"
      : item.type === "private-session" ? "privatesession"
      : "";

    return (
      <div
        key={item.id || idx}
        className={`scheduleItem scheduleItem--${typeClass}`}
        onClick={() => { if (item.link) navigate(item.link); }}
        style={item.link ? { cursor: "pointer" } : {}}
      >
        <div className="scheduleItem__header">
          <p className="scheduleDate">{formatDate(item.date)}</p>
          <span className={`scheduleBadge scheduleBadge--${typeClass}`}>
            {SCHEDULE_TYPE_LABELS[item.type] || item.type}
          </span>
        </div>
        <p className="scheduleTitle">{item.title}</p>
        <p className="scheduleSub">{item.subject}</p>
        <p className="scheduleSub">{item.teacher}</p>
      </div>
    );
  };

  // ── MOBILE ──────────────────────────────────────────────────
  const renderMobileSection = () => {
    switch (activeMobileTab) {
      case "sessions":
        return (
          <div className="mobileSectionContent">
            {(showAllSessions ? sessions : collapsedSessions).map((s, idx) => renderSessionCard(s, idx))}
            {sessions.length === 0 && (
              <div className="emptyState">No upcoming live sessions</div>
            )}
          </div>
        );

      case "calendar":
        return (
          <div className="calendarBox mobileCalendarCard">
            {renderCalendarGrid()}
          </div>
        );

      case "assign":
        return (
          <div className="mobileSectionContent">
            {assignments.map((a, idx) => <AssignmentCard key={idx} {...a} />)}
            {assignments.length === 0 && <div className="emptyState">No assignments</div>}
          </div>
        );

      case "quiz":
        return (
          <div className="mobileSectionContent">
            {quizzes.map((q) => (
              <QuizCard
                key={q.id}
                title={q.title}
                teacher={q.teacher}
                deadline={q.due ? new Date(q.due).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "No due date"}
                isCompleted={false}
                inProgress={false}
                onClick={() => navigate(q.subject_id ? `/subjects/quiz/${q.subject_id}` : "/subjects/quiz")}
              />
            ))}
            {quizzes.length === 0 && <div className="emptyState">No quizzes</div>}
          </div>
        );

      case "notify":
        return (
          <>
            <div className="mobileSectionTopAction">
              <DropdownMenu value={notificationFilter} onChange={setNotificationFilter} />
            </div>
            <div className="mobileSectionContent">
              {filteredNotifications.map((n) => (
                <NotificationCard key={n.id} notification={n} onRead={markOneRead} />
              ))}
              {filteredNotifications.length === 0 && (
                <div className="emptyState">No notifications</div>
              )}
            </div>
          </>
        );

      case "schedule":
        return (
          <>
            <div className="mobileSectionTopAction">
              <DropdownMenu value={scheduleFilter} onChange={setScheduleFilter} />
            </div>
            <div className="mobileSectionContent">
              {filteredSchedule.map((item, idx) => renderScheduleItem(item, idx))}
              {filteredSchedule.length === 0 && <div className="emptyState">No schedule</div>}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="dashExact">

      {/* ── DESKTOP ── */}
      <div className="desktopOnly">
        {/* Top row: sessions + calendar */}
        <div className="dashExact__top">
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>Upcoming Live Sessions</h3>
              <button className="arrowBtn" onClick={() => setShowAllSessions(!showAllSessions)}>
                <span className={`arrowBtn__chevron ${showAllSessions ? "arrowBtn__chevron--up" : ""}`}>
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
            <div className={showAllSessions ? "sessionsGridExpanded" : "sessionsGridCollapsed"}>
              {(showAllSessions ? sessions : collapsedSessions).map((s, idx) => renderSessionCard(s, idx))}
              {sessions.length === 0 && (
                <div className="emptyState">No upcoming live sessions for today</div>
              )}
            </div>
          </div>

          <div className="calendarBox">{renderCalendarGrid()}</div>
        </div>

        {/* Bottom row: assignments + quizzes + notifications + schedule */}
        <div className="dashExact__bottom">

          {/* Assignments */}
          <div className="dashExact__leftCol">
            <div className="whiteCard">
              <div className="cardHeader cardHeader--clickable"
                onClick={() => setShowAssignments(!showAssignments)}>
                <h3>Assignments</h3>
                <button className="arrowBtn">
                  <span className={`arrowBtn__chevron ${showAssignments ? "arrowBtn__chevron--up" : ""}`}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
              {showAssignments && (
                <div className="listBody">
                  {assignments.map((a, idx) => <AssignmentCard key={idx} {...a} />)}
                  {assignments.length === 0 && <div className="emptyState">No assignments</div>}
                </div>
              )}
            </div>
          </div>

          {/* FIX: Quiz card — was completely missing on desktop */}
          <div className="dashExact__leftCol">
            <div className="whiteCard">
              <div className="cardHeader cardHeader--clickable"
                onClick={() => setShowQuizzes(!showQuizzes)}>
                <h3>Quizzes</h3>
                <button className="arrowBtn">
                  <span className={`arrowBtn__chevron ${showQuizzes ? "arrowBtn__chevron--up" : ""}`}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
              {showQuizzes && (
                <div className="listBody">
                  {quizzes.map((q) => (
              <QuizCard
                key={q.id}
                title={q.title}
                teacher={q.teacher}
                deadline={q.due ? new Date(q.due).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "No due date"}
                isCompleted={false}
                inProgress={false}
                onClick={() => navigate(q.subject_id ? `/subjects/quiz/${q.subject_id}` : "/subjects/quiz")}
              />
            ))}
                  {quizzes.length === 0 && <div className="emptyState">No quizzes</div>}
                </div>
              )}
            </div>
          </div>

          {/* Notifications — FIX: passes notification object + onRead handler */}
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>Notifications</h3>
              <DropdownMenu value={notificationFilter} onChange={setNotificationFilter} />
            </div>
            <div className="notifBody">
              {filteredNotifications.map((n) => (
                <NotificationCard key={n.id} notification={n} onRead={markOneRead} />
              ))}
              {filteredNotifications.length === 0 && (
                <div className="emptyState">No notifications</div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>
                Schedule
                {selectedDate && (
                  <span style={{ fontWeight: 400, fontSize: "0.8rem", marginLeft: 8 }}>
                    — {new Date(selectedDate.year, selectedDate.month, selectedDate.day)
                        .toLocaleDateString("en-GB", DATE_FORMAT)}
                  </span>
                )}
              </h3>
              <DropdownMenu value={scheduleFilter} onChange={setScheduleFilter} />
            </div>
            <div className="scheduleList">
              {filteredSchedule.map((item, idx) => renderScheduleItem(item, idx))}
              {filteredSchedule.length === 0 && <div className="emptyState">No schedule</div>}
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="mobileOnly">
        <div className="topSliderTabs">
          <TopSliderTabs active={activeMobileTab} setActive={setActiveMobileTab} />
        </div>
        <div className="mobileSectionBody">
          {renderMobileSection()}
        </div>
      </div>

    </div>
  );
}
