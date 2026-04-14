import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SessionCard from "../components/SessionCard";
import AssignmentCard from "../components/AssignmentCard";
import NotificationCard from "../components/NotificationCard";
import DropdownMenu from "../components/DropdownMenu";
import TopSliderTabs from "../components/TopSliderTabs";
import api from "../api/apiClient";
import { useCourse } from "../contexts/CourseContext";
import "../styles/dashboard.css";

const DATE_FORMAT = { day: "2-digit", month: "short", year: "numeric" };

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", DATE_FORMAT);
}

function toDateKey(dateStr) {
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

const EVENT_COLORS = {
  assignment: "#57D982",
  quiz: "#93A1E5",
  "private-session": "#FF8A65",
};

const SCHEDULE_TYPE_LABELS = {
  "live-session": "Live Session",
  assignment: "Assignment",
  quiz: "Quiz",
  "private-session": "Private Session",
};

export default function Dashboard() {
  const { activeCourse } = useCourse();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(null);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAssignments, setShowAssignments] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [scheduleFilter, setScheduleFilter] = useState("All");
  const [activeMobileTab, setActiveMobileTab] = useState("sessions");

  // --- CALENDAR LOGIC STATE ---
  const today = new Date();
  const [currMonth, setCurrMonth] = useState(today.getMonth());
  const [currYear, setCurrYear] = useState(today.getFullYear());

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const years = Array.from({ length: 81 }, (_, i) => 1970 + i);

  const daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currYear, currMonth, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const goToPrevMonth = () => {
    if (currMonth === 0) {
      setCurrMonth(11);
      setCurrYear(currYear - 1);
    } else {
      setCurrMonth(currMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currMonth === 11) {
      setCurrMonth(0);
      setCurrYear(currYear + 1);
    } else {
      setCurrMonth(currMonth + 1);
    }
  };

  // =============================
  // DASHBOARD DATA STATE
  // =============================

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // FETCH DASHBOARD DATA
  // =============================

  useEffect(() => {
    if (!activeCourse) return;

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

  const sessions = data?.sessions ?? [];
  const assignments = data?.assignments ?? [];
  const quizzes = data?.quizzes ?? [];
  const privateSessions = data?.private_sessions ?? [];
  const notifications = data?.notifications ?? [];

  // --- Calendar events map (assignments, quizzes, private sessions) ---
  const calendarEvents = useMemo(() => {
    const map = {};
    const addEvent = (dateStr, type) => {
      if (!dateStr) return;
      const key = toDateKey(dateStr);
      if (!map[key]) map[key] = [];
      if (!map[key].includes(type)) map[key].push(type);
    };
    assignments.forEach((a) => addEvent(a.due, "assignment"));
    quizzes.forEach((q) => addEvent(q.due, "quiz"));
    privateSessions.forEach((ps) => addEvent(ps.date, "private-session"));
    return map;
  }, [assignments, quizzes, privateSessions]);

  // --- Combined schedule items ---
  const scheduleItems = useMemo(() => {
    const items = [];
    sessions.forEach((s) =>
      items.push({
        id: `session-${s.id}`,
        type: "live-session",
        title: `${s.subject} - ${s.topic}`,
        date: s.dateTime,
        teacher: s.teacher,
        subject: s.subject,
        link: `/live/${s.id}`,
      })
    );
    assignments.forEach((a) =>
      items.push({
        id: `assignment-${a.id}`,
        type: "assignment",
        title: a.title,
        date: a.due,
        teacher: a.teacher,
        subject: a.subject_name || "",
        link: a.subject_id ? `/subjects/${a.subject_id}/assignments/${a.id}` : null,
      })
    );
    quizzes.forEach((q) =>
      items.push({
        id: `quiz-${q.id}`,
        type: "quiz",
        title: q.title,
        date: q.due,
        teacher: q.teacher,
        subject: q.subject_name || "",
        link: q.subject_id ? `/subjects/quiz/${q.subject_id}` : null,
      })
    );
    privateSessions.forEach((ps) =>
      items.push({
        id: `private-${ps.id}`,
        type: "private-session",
        title: `${ps.subject}`,
        date: ps.date,
        teacher: ps.teacher_name,
        subject: ps.subject,
        link: `/private-sessions`,
      })
    );
    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return items;
  }, [sessions, assignments, quizzes, privateSessions]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  const collapsedSessions = sessions.slice(0, 3);

  const filteredNotifications =
    notificationFilter === "All"
      ? notifications
      : notifications.filter((n) => n.type === notificationFilter);

  // Filter schedule by selected date + type filter
  const filteredSchedule = scheduleItems.filter((item) => {
    if (selectedDate) {
      const itemDate = new Date(item.date);
      const selDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
      if (!isSameDay(itemDate, selDate)) return false;
    }
    if (scheduleFilter !== "All") {
      // Map backend filter values to our schedule types
      const filterMap = {
        ASSIGNMENT: "assignment",
        SESSION: "live-session",
        QUIZ: "quiz",
      };
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

  // --- Calendar date style helper ---
  function getDateStyle(dateKey) {
    const types = calendarEvents[dateKey];
    if (!types || types.length === 0) return {};
    const colors = types.map((t) => EVENT_COLORS[t]).filter(Boolean);
    if (colors.length === 0) return {};
    if (colors.length === 1) return { background: colors[0], color: "#1f2d3d" };
    return {
      background: `linear-gradient(135deg, ${colors.join(", ")})`,
      color: "#1f2d3d",
    };
  }

  // --- Render calendar grid (shared between mobile and desktop) ---
  const renderCalendarGrid = () => (
    <>
      <div className="calendarHeader">
        <span className="calNavBtn" onClick={goToPrevMonth}>◀</span>
        <div className="calendarHeader__mid">
          <select
            className="calendarSelect"
            value={currMonth}
            onChange={(e) => setCurrMonth(parseInt(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={m} value={i}>{m.substring(0, 3)}</option>
            ))}
          </select>
          <select
            className="calendarSelect"
            value={currYear}
            onChange={(e) => setCurrYear(parseInt(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
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
          const eventStyle = (!isToday && !isSelected && calendarEvents[dateKey]) ? getDateStyle(dateKey) : {};

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

      {/* Legend */}
      <div className="calLegend">
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#57D982" }} />
          Assignment
        </span>
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#93A1E5" }} />
          Quiz
        </span>
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#FF8A65" }} />
          Private Session
        </span>
      </div>
    </>
  );

  // --- Render schedule item ---
  const renderScheduleItem = (item, idx) => {
    const typeClass =
      item.type === "live-session" ? "livesessions"
      : item.type === "assignment" ? "assignments"
      : item.type === "quiz" ? "quiz"
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
        <div>
          <p className="scheduleSub">{item.subject}</p>
          <p className="scheduleSub">{item.teacher}</p>
        </div>
      </div>
    );
  };

  const renderMobileSection = () => {
    switch (activeMobileTab) {
      case "sessions":
        return (
          <div className="mobileSectionContent">
            {(showAllSessions ? sessions : collapsedSessions).map((s, idx) => (
              <SessionCard key={idx} {...s} />
            ))}
            {(showAllSessions ? sessions : collapsedSessions).length === 0 && (
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
            {assignments.map((a, idx) => (
              <AssignmentCard key={idx} {...a} />
            ))}
            {assignments.length === 0 && (
              <div className="emptyState">No assignments</div>
            )}
          </div>
        );

      case "quiz":
        return (
          <div className="mobileSectionContent">
            {quizzes.map((q, idx) => (
              <AssignmentCard key={idx} {...q} />
            ))}
            {quizzes.length === 0 && (
              <div className="emptyState">No quizzes</div>
            )}
          </div>
        );

      case "notify":
        return (
          <>
            <div className="mobileSectionTopAction">
              <DropdownMenu
                value={notificationFilter}
                onChange={setNotificationFilter}
              />
            </div>
            <div className="mobileSectionContent">
              {filteredNotifications.map((n, idx) => (
                <NotificationCard key={idx} {...n} />
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
              <DropdownMenu
                value={scheduleFilter}
                onChange={setScheduleFilter}
              />
            </div>
            <div className="mobileSectionContent">
              {filteredSchedule.map((item, idx) => renderScheduleItem(item, idx))}
              {filteredSchedule.length === 0 && (
                <div className="emptyState">No schedule</div>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashExact">
      <div className="desktopOnly">
        {/* Top Section */}
        <div className="dashExact__top">
          {/* Upcoming Sessions */}
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>Upcoming Live Sessions</h3>
              <button
                className="arrowBtn"
                onClick={() => setShowAllSessions(!showAllSessions)}
              >
                <span
                  className={`arrowBtn__chevron ${
                    showAllSessions ? "arrowBtn__chevron--up" : ""
                  }`}
                >
                  <svg width="14" height="10" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1.5L6 6.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </div>

            <div
              className={
                showAllSessions
                  ? "sessionsGridExpanded"
                  : "sessionsGridCollapsed"
              }
            >
              {(showAllSessions ? sessions : collapsedSessions).map((s, idx) => (
                <SessionCard key={idx} {...s} />
              ))}
              {(showAllSessions ? sessions : collapsedSessions).length === 0 && (
                <div className="emptyState">No upcoming live sessions for today</div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="calendarBox">
            {renderCalendarGrid()}
          </div>
        </div>

        {/* Bottom Section */}
        
          <div className="dashExact__bottom">
            {/* Assignments */}
            <div className="dashExact__leftCol">
              <div className="whiteCard">
                <div
                  className="cardHeader cardHeader--clickable"
                  onClick={() => setShowAssignments(!showAssignments)}
                >
                  <h3>Assignment</h3>
                  <button className="arrowBtn">
                    <span
                      className={`arrowBtn__chevron ${
                        showAssignments ? "arrowBtn__chevron--up" : ""
                      }`}
                    >
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path
                          d="M1 1.5L6 6.5L11 1.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>

                {showAssignments && (
                  <div className="listBody">
                    {assignments.map((a, idx) => (
                      <AssignmentCard key={idx} {...a} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="whiteCard">
              <div className="cardHeader">
                <h3>Notification</h3>
                <DropdownMenu
                  value={notificationFilter}
                  onChange={setNotificationFilter}
                />
              </div>
              <div className="notifBody">
                {filteredNotifications.map((n, idx) => (
                  <NotificationCard key={idx} {...n} />
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="emptyState">No notifications</div>
                )}
              </div>
            </div>

            {/* Schedule (filtered by calendar date) */}
            <div className="whiteCard">
              <div className="cardHeader">
                <h3>
                  Schedule
                  {selectedDate && (
                    <span style={{ fontWeight: 400, fontSize: "0.8rem", marginLeft: 8 }}>
                      — {new Date(selectedDate.year, selectedDate.month, selectedDate.day).toLocaleDateString("en-GB", DATE_FORMAT)}
                    </span>
                  )}
                </h3>
                <DropdownMenu
                  value={scheduleFilter}
                  onChange={setScheduleFilter}
                />
              </div>
              <div className="scheduleList">
                {filteredSchedule.map((item, idx) => renderScheduleItem(item, idx))}
                {filteredSchedule.length === 0 && (
                  <div className="emptyState">No schedule</div>
                )}
              </div>
            </div>
          </div>
        
      </div>

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
