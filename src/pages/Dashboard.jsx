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

const EVENT_COLORS = {
  assignment: "#57D982",
  quiz: "#93A1E5",
  "live-session": "#38bdf8",
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
  const [showAssignments, setShowAssignments] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [scheduleFilter, setScheduleFilter] = useState("All");
  const [activeMobileTab, setActiveMobileTab] = useState("sessions");

  const today = new Date();
  const [currMonth, setCurrMonth] = useState(today.getMonth());
  const [currYear, setCurrYear] = useState(today.getFullYear());

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const years = Array.from({ length: 81 }, (_, i) => 1970 + i);

  const daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
  const firstDayIdx = new Date(currYear, currMonth, 1).getDay();
  const startOffset = firstDayIdx === 0 ? 6 : firstDayIdx - 1;

  const goToPrevMonth = () => {
    if (currMonth === 0) {
      setCurrMonth(11);
      setCurrYear((y) => y - 1);
    } else {
      setCurrMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currMonth === 11) {
      setCurrMonth(0);
      setCurrYear((y) => y + 1);
    } else {
      setCurrMonth((m) => m + 1);
    }
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { notifications: liveNotifications, markOneRead } = useNotificationSocket();

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

const sessions = data?.sessions?.length ? data.sessions : (data?.all_sessions ?? []);
  const allSessions = data?.all_sessions ?? [];
  const assignments = data?.assignments ?? [];
  const quizzes = data?.quizzes ?? [];
  const privateSessions = data?.private_sessions ?? [];
  const apiNotifications = data?.notifications ?? [];
  console.log("FULL DASHBOARD DATA:", data);
console.log("sessions:", data?.sessions);
console.log("all_sessions:", data?.all_sessions);

  const notifications = (() => {
    const seen = new Set();
    const merged = [];
    for (const n of [...liveNotifications, ...apiNotifications]) {
      const key = n.id || JSON.stringify(n);
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(n);
      }
    }
    return merged;
  })();

  const renderSessionCard = (s, idx) => {
    const sessionTime = new Date(s.dateTime);
    const now = new Date();
    const diffMs = sessionTime - now;
    const diffMins = Math.round(diffMs / 60000);

    let startsIn;
    if (diffMs < 0) {
      startsIn = "In progress";
    } else if (diffMins < 60) {
      startsIn = `Starts in ${diffMins} min`;
    } else {
      startsIn = `Starts in ${Math.floor(diffMins / 60)}h`;
    }

    const timing = sessionTime.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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

  const calendarEvents = useMemo(() => {
    const map = {};
    const add = (dateStr, type) => {
      const key = toDateKey(dateStr);
      if (!key) return;
      if (!map[key]) map[key] = [];
      if (!map[key].includes(type)) map[key].push(type);
    };

    assignments.forEach((a) => add(a.due, "assignment"));
    quizzes.forEach((q) => add(q.due, "quiz"));
    privateSessions.forEach((p) => add(p.date, "private-session"));
    allSessions.forEach((s) => add(s.dateTime, "live-session"));

    return map;
  }, [assignments, quizzes, privateSessions, allSessions]);

  const scheduleItems = useMemo(() => {
    const items = [];

    allSessions.forEach((s) =>
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
        link: a.subject_id ? `/subjects/${a.subject_id}/assignments` : null,
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
        title: ps.subject,
        date: ps.date,
        teacher: ps.teacher_name,
        subject: ps.subject,
        link: `/private-sessions`,
      })
    );

    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return items;
  }, [allSessions, assignments, quizzes, privateSessions]);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  if (!activeCourse) {
    return (
      <div style={{ padding: 20 }}>
        <p>No course selected. Please select a course to view your dashboard.</p>
      </div>
    );
  }

  const filteredNotifications =
    notificationFilter === "All"
      ? notifications
      : notifications.filter((n) => n.type === notificationFilter);

  const filteredSchedule = scheduleItems.filter((item) => {
    if (selectedDate) {
      const itemDate = new Date(item.date);
      const selDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
      if (!isSameDay(itemDate, selDate)) return false;
    }

    if (scheduleFilter !== "All") {
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
              <option key={m} value={i}>
                {m.substring(0, 3)}
              </option>
            ))}
          </select>

          <select
            className="calendarSelect"
            value={currYear}
            onChange={(e) => setCurrYear(parseInt(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <span className="calNavBtn" onClick={goToNextMonth}>▶</span>
      </div>

      <div className="calendarGrid">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="calDayName">
            {d}
          </div>
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
          const dayEvents = calendarEvents[dateKey] || [];

          return (
            <button
              key={day}
              type="button"
              className={`calDate ${isToday ? "calToday" : ""} ${isSelected ? "calSelected" : ""}`}
              onClick={() => handleDateClick(day)}
            >
              <span className="calDate__num">{day}</span>

              {dayEvents.length > 0 && (
                <span className="calDate__dots">
                  {dayEvents.slice(0, 3).map((type) => (
                    <span
                      key={type}
                      className="calDate__dot"
                      style={{ background: EVENT_COLORS[type] }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

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
          <span className="calLegend__dot" style={{ background: "#38bdf8" }} />
          Live Session
        </span>
        <span className="calLegend__item">
          <span className="calLegend__dot" style={{ background: "#FF8A65" }} />
          Private Session
        </span>
      </div>
    </>
  );

  const renderScheduleItem = (item, idx) => {
    const typeClass =
      item.type === "live-session"
        ? "livesessions"
        : item.type === "assignment"
        ? "assignments"
        : item.type === "quiz"
        ? "quiz"
        : item.type === "private-session"
        ? "privatesession"
        : "";

    return (
      <div
        key={item.id || idx}
        className={`scheduleItem scheduleItem--${typeClass}`}
        onClick={() => {
          if (item.link) navigate(item.link);
        }}
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

  const renderMobileSection = () => {
    switch (activeMobileTab) {
      case "sessions":
        return (
          <div className="mobileSectionContent">
            {sessions.map((s, idx) => renderSessionCard(s, idx))}
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
            {assignments.map((a, idx) => (
              <AssignmentCard key={idx} {...a} />
            ))}
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
                deadline={
                  q.due
                    ? new Date(q.due).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "No due date"
                }
                isCompleted={false}
                inProgress={false}
                onClick={() =>
                  navigate(q.subject_id ? `/subjects/quiz/${q.subject_id}` : "/subjects/quiz")
                }
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

  return (
    <div className="dashExact">
      <div className="desktopOnly">
        <div className="dashExact__top">
          <div className="whiteCard liveSessionsCard">
            <div className="cardHeader liveSessionsHeader">
              <h3>Upcoming Live Sessions</h3>
              <p className="sessionCountText">
                {sessions.length} Classes {sessions.length > 0 ? "(Remaining classes)" : ""}
              </p>
            </div>

            <div className="sessionsScrollRow">
              {sessions.length > 0 ? (
                sessions.map((s, idx) => renderSessionCard(s, idx))
              ) : (
                <div className="liveEmptyState">
                  <div className="liveEmptyState__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 2V5M16 2V5M3 9H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5ZM12 13V17M10 15H14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="liveEmptyState__content">
                    <p className="liveEmptyState__title">
                      No upcoming live sessions for today
                    </p>
                    <p className="liveEmptyState__text">
                      Relax and prepare for your next class!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="calendarBox">{renderCalendarGrid()}</div>
        </div>

        <div className="dashExact__bottom">
          <div className="dashExact__leftCol">
            <div className="whiteCard">
              <div
                className="cardHeader cardHeader--clickable"
                onClick={() => setShowAssignments(!showAssignments)}
              >
                <h3>Assignments</h3>
                <button className="arrowBtn">
                  <span className={`arrowBtn__chevron ${showAssignments ? "arrowBtn__chevron--up" : ""}`}>
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
                  {assignments.length === 0 && (
                    <div className="emptyState">No assignments</div>
                  )}
                </div>
              )}
            </div>
          </div>

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

          <div className="whiteCard">
            <div className="cardHeader">
              <h3>
                Schedule
                {selectedDate && (
                  <span style={{ fontWeight: 400, fontSize: "0.8rem", marginLeft: 8 }}>
                    —{" "}
                    {new Date(
                      selectedDate.year,
                      selectedDate.month,
                      selectedDate.day
                    ).toLocaleDateString("en-GB", DATE_FORMAT)}
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

      <div className="mobileOnly">
        <div className="topSliderTabs">
          <TopSliderTabs active={activeMobileTab} setActive={setActiveMobileTab} />
        </div>
        <div className="mobileSectionBody">{renderMobileSection()}</div>
      </div>
    </div>
  );
}