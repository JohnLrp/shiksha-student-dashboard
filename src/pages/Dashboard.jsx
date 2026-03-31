import { useState, useEffect } from "react";
import SessionCard from "../components/SessionCard";
import AssignmentCard from "../components/AssignmentCard";
import NotificationCard from "../components/NotificationCard";
import DropdownMenu from "../components/DropdownMenu";
import TopSliderTabs from "../components/TopSliderTabs";
import api from "../api/apiClient";
import { useCourse } from "../contexts/CourseContext";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { activeCourse } = useCourse();

  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAssignments, setShowAssignments] = useState(true);
  const [showQuizzes, setShowQuizzes] = useState(true);
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

  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schedule, setSchedule] = useState([]);

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

        setSessions(res.data.sessions || []);
        setAssignments(res.data.assignments || []);
        setQuizzes(res.data.quizzes || []);
        setNotifications(res.data.notifications || []);
        setSchedule(res.data.schedule || []);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [activeCourse]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  const collapsedSessions = sessions.slice(0, 3);

  const filteredNotifications =
    notificationFilter === "All"
      ? notifications
      : notifications.filter((n) => n.type === notificationFilter);

  const filteredSchedule =
    scheduleFilter === "All"
      ? schedule
      : schedule.filter((s) => s.type === scheduleFilter);

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
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
                <div key={d} className="calDayName">{d}</div>
              ))}

              {Array.from({ length: startOffset }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="calDate"
                  style={{ visibility: "hidden" }}
                ></div>
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;

                const isToday =
                  day === today.getDate() &&
                  currMonth === today.getMonth() &&
                  currYear === today.getFullYear();

                return (
                  <div
                    key={day}
                    className={`calDate ${isToday ? "calRed" : ""}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
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
              {filteredSchedule.map((item, idx) => (
                <div key={idx} className={`scheduleItem scheduleItem--${
                item.type === "Live Sessions" ? "livesessions"
                : item.type === "Assignments" ? "assignments"
                : item.type === "Quiz" ? "quiz"
                : ""
            }`}>

                  <div className="scheduleItem__header">
                    <p className="scheduleDate">{item.date}</p>
                    {item.type && (
                      <span className={`scheduleBadge scheduleBadge--${
                        item.type === "Live Sessions" ? "livesessions"
                        : item.type === "Assignments" ? "assignments"
                        : item.type === "Quiz" ? "quiz" : ""
                      }`}>{item.type}</span>
                    )}
                  </div>
                  <p className="scheduleTitle">{item.title}</p>
                  <p className="scheduleSub">{item.subject}</p>
                  <p className="scheduleSub">{item.teacher}</p>
                  <p className="scheduleSub">{item.time}</p>
                </div>
              ))}
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
            </div>
          </div>

          {/* Calendar */}
          <div className="calendarBox">
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
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
                <div key={d} className="calDayName">{d}</div>
              ))}

              {Array.from({ length: startOffset }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="calDate"
                  style={{ visibility: "hidden" }}
                ></div>
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;

                const isToday =
                  day === today.getDate() &&
                  currMonth === today.getMonth() &&
                  currYear === today.getFullYear();

                return (
                  <div
                    key={day}
                    className={`calDate ${isToday ? "calRed" : ""}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        {!showAllSessions && (
          <div className="dashExact__bottom">
            {/* Assignments + Quizzes */}
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

              <div className="whiteCard">
                <div
                  className="cardHeader cardHeader--clickable"
                  onClick={() => setShowQuizzes(!showQuizzes)}
                >
                  <h3>Quiz</h3>

                  <button className="arrowBtn">
                    <span
                      className={`arrowBtn__chevron ${
                        showQuizzes ? "arrowBtn__chevron--up" : ""
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

                {showQuizzes && (
                  <div className="listBody">
                    {quizzes.map((q, idx) => (
                      <AssignmentCard key={idx} {...q} />
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
              </div>
            </div>

            {/* Schedule */}
            <div className="whiteCard">
              <div className="cardHeader">
                <h3>Schedule</h3>
                <DropdownMenu
                  value={scheduleFilter}
                  onChange={setScheduleFilter}
                />
              </div>

              <div className="scheduleList">
                {filteredSchedule.map((item, idx) => (
                  <div key={idx} className={`scheduleItem scheduleItem--${
                    item.type === "Live Sessions" ? "livesessions"
                    : item.type === "Assignments" ? "assignments"
                    : item.type === "Quiz" ? "quiz"
                    : ""
                    }`}>

                    <div className="scheduleItem__header">
                      <p className="scheduleDate">{item.date}</p>
                        {item.type && (
                          <span className={`scheduleBadge scheduleBadge--${
                            item.type === "Live Sessions" ? "livesessions"
                            : item.type === "Assignments" ? "assignments"
                            : item.type === "Quiz" ? "quiz" : ""
                          }`}>{item.type}</span>
                        )}
                      </div>
                      <p className="scheduleTitle">{item.title}</p>

                    <p className="scheduleSub">{item.subject}</p>
                    <p className="scheduleSub">{item.teacher}</p>
                    <p className="scheduleSub">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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