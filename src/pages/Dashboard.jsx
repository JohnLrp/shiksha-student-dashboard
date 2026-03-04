import { useState, useEffect } from "react";
import SessionCard from "../components/SessionCard";
import AssignmentCard from "../components/AssignmentCard";
import NotificationCard from "../components/NotificationCard";
import DropdownMenu from "../components/DropdownMenu";
import TopSliderTabs from "../components/TopSliderTabs";
import BottomNav from "../components/BottomNav";
import "../styles/dashboard.css";

/* ─────────────────────────────────────────────
   Utility: compute urgency from "DD/MM/YYYY (Day)" due string
   Returns: "red" (≤2 days / overdue) | "yellow" (≤7 days) | "green"
───────────────────────────────────────────── */
function computeUrgency(dueStr) {
  try {
    const [d, m, y] = dueStr.split(" ")[0].split("/");
    const dueDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const days = Math.ceil((dueDate - todayStart) / (1000 * 60 * 60 * 24));
    if (days <= 2) return "red";
    if (days <= 7) return "yellow";
    return "green";
  } catch {
    return "green";
  }
}

/* ─────────────────────────────────────────────
   Utility: map event type to CSS class suffix
───────────────────────────────────────────── */
function typeClass(type) {
  if (type === "Live Sessions") return "livesessions";
  if (type === "Assignments")   return "assignments";
  if (type === "Quiz")          return "quiz";
  return "";
}

/* ─────────────────────────────────────────────
   Utility: extract full day name from schedule date string
   e.g. "21/01/2026 (Wed)" → "Wednesday"
───────────────────────────────────────────── */
function extractDay(dateStr) {
  const match = dateStr.match(/\((\w+)\)/);
  if (!match) return "";
  const map = {
    Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
    Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
  };
  return map[match[1]] || match[1];
}

export default function Dashboard() {

  /* ── Mobile tab ── */
  const [activeTab, setActiveTab] = useState("sessions");

  /* ── Section collapse ── */
  const [showAssignments, setShowAssignments] = useState(true);
  const [showQuizzes,     setShowQuizzes]     = useState(true);

  /* ── Filters ── */
  const [notificationFilter, setNotificationFilter] = useState("All");
  const [scheduleFilter,     setScheduleFilter]     = useState("All");

  /* ── Calendar ── */
  const today = new Date();
  const [currMonth,    setCurrMonth]    = useState(today.getMonth());
  const [currYear,     setCurrYear]     = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const years = Array.from({ length: 81 }, (_, i) => 1970 + i);

  const daysInMonth  = new Date(currYear, currMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currYear, currMonth, 1).getDay();
  const startOffset  = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const goToPrevMonth = () => {
    if (currMonth === 0) { setCurrMonth(11); setCurrYear(y => y - 1); }
    else setCurrMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (currMonth === 11) { setCurrMonth(0); setCurrYear(y => y + 1); }
    else setCurrMonth(m => m + 1);
  };

  /* ── Data state (swap useEffect body for real API when backend is ready) ── */
  const [sessions,      setSessions]      = useState([]);
  const [assignments,   setAssignments]   = useState([]);
  const [quizzes,       setQuizzes]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [schedule,      setSchedule]      = useState([]);

  /* ISO date string for today, used to filter sessions */
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  /* ─────────────────────────────────────────────
     MOCK DATA  — replace the body of this useEffect
     with a fetch("/api/dashboard") call when the
     backend is ready. Keep the same data shape.
  ───────────────────────────────────────────── */
  useEffect(() => {

    /* Sessions: sessionDate (ISO "YYYY-MM-DD") is used to filter for today */
    const mockSessions = [
      {
        id: "1",
        sessionDate: todayISO,
        subject: "Subject Name",
        topic: "Title/Topic",
        teacher: "Teacher's Name",
        startsIn: "Starts in [time]",
        timing: "Session Timing",
      },
      {
        id: "2",
        sessionDate: todayISO,
        subject: "Biology 101",
        topic: "Introduction to Genetics",
        teacher: "Dr. Lisa Harper",
        startsIn: "Starts in 15 minutes",
        timing: "10:00 AM - 11:30 AM",
      },
      {
        id: "3",
        sessionDate: todayISO,
        subject: "Art History",
        topic: "Renaissance to Modern",
        teacher: "Prof. Mark Williams",
        startsIn: "Starts in 30 min",
        timing: "1:00 PM - 2:30 PM",
      },
      {
        id: "4",
        sessionDate: todayISO,
        subject: "Mathematics",
        topic: "Chapter 3: Algebra",
        teacher: "Sir Zothana",
        startsIn: "Starts in 2 hrs",
        timing: "3:00 PM - 4:30 PM",
      },
    ];

    /*
      Assignments / Quizzes:
        urgency is computed at render from `due` — no need to store it here.
        due format: "DD/MM/YYYY (DayName)"
    */
    const mockAssignments = [
      { id: "1", title: "Subject Name: Topic/Title", teacher: "Teacher's Name", due: "20/02/2026 (Friday)" },
      { id: "2", title: "Subject Name: Topic/Title", teacher: "Teacher's Name", due: "20/02/2026 (Friday)" },
      { id: "3", title: "Subject Name: Topic/Title", teacher: "Teacher's Name", due: "20/02/2026 (Friday)" },
    ];

    const mockQuizzes = [
      { id: "1", title: "Subject Name: Topic/Title", teacher: "Teacher's Name", due: "20/02/2026 (Friday)" },
      { id: "2", title: "Subject Name: Topic/Title", teacher: "Teacher's Name", due: "01/03/2026 (Sunday)" },
      { id: "3", title: "Subject Name: Topic/Title", teacher: "Teacher's Name", due: "01/03/2026 (Sunday)" },
    ];

    /*
      Notifications:
        day   — badge label shown top-right (e.g. "Friday")
        time2 — optional bold second line (used for live session times)
        type  — "Assignments" | "Live Sessions" | "Quiz"
    */
    const mockNotifications = [
      {
        id: "1",
        title: "New Assignment Updated",
        subject: "Subject Name: Topic/Title",
        teacher: "Teacher: Teacher's Name",
        time: "Due Date: 20 Feb 26 (Friday)",
        day: "Friday",
        type: "Assignments",
      },
      {
        id: "2",
        title: "New Live Session Updated",
        subject: "Subject Name",
        teacher: "Teacher: Teacher's Name",
        time: "20 Feb 26 (Friday)",
        time2: "10:00 AM - 11:30 AM",
        day: "Friday",
        type: "Live Sessions",
      },
      {
        id: "3",
        title: "New Assignment Updated",
        subject: "Subject Name: Topic/Title",
        teacher: "Teacher: Teacher's Name",
        time: "Due Date: 20 Feb 26 (Friday)",
        day: "Friday",
        type: "Assignments",
      },
      {
        id: "4",
        title: "New Quiz Updated",
        subject: "Subject Name: Topic/Title",
        teacher: "Teacher: Teacher's Name",
        time: "Due Date: 20 Feb 26 (Friday)",
        day: "Friday",
        type: "Quiz",
      },
      {
        id: "5",
        title: "New Live Session Updated",
        subject: "Subject Name",
        teacher: "Teacher: Teacher's Name",
        time: "20 Feb 26 (Friday)",
        time2: "10:00 AM - 11:30 AM",
        day: "Friday",
        type: "Live Sessions",
      },
    ];

    /*
      Schedule:
        date format: "DD/MM/YYYY (DayAbbr)" — used to build calendar dots
        type — same as notifications
    */
    const mockSchedule = [
      {
        date: "21/01/2026 (Wed)",
        title: "Live Session",
        subject: "Mathematics chapter 1: algebra",
        teacher: "Teacher: Sir Zothana",
        time: "Time: 1:00pm to 2:00pm",
        type: "Live Sessions",
      },
      {
        date: "21/01/2026 (Wed)",
        title: "Due Assignment",
        subject: "Mathematics chapter 1: algebra",
        teacher: "Teacher: Sir Zothana",
        time: "Due Date: 23/01/2026",
        type: "Assignments",
      },
      {
        date: "21/01/2026 (Wed)",
        title: "Live Session",
        subject: "English chapter 1: Poem",
        teacher: "Teacher: Miss Ruatfeli",
        time: "Time: 10:00am to 12:00pm",
        type: "Live Sessions",
      },
      {
        date: "21/01/2026 (Wed)",
        title: "Quiz",
        subject: "Science chapter 1: Chemistry",
        teacher: "Teacher: Miss Ruatfeli",
        time: "Due Date: 23/01/2026",
        type: "Quiz",
      },
      {
        date: "23/01/2026 (Fri)",
        title: "Due Assignment",
        subject: "Mathematics chapter 1: algebra",
        teacher: "Teacher: Sir Zothana",
        time: "Due Date: 23/01/2026",
        type: "Assignments",
      },
      {
        date: "29/01/2026 (Thu)",
        title: "Due Assignment",
        subject: "Mathematics chapter 1: algebra",
        teacher: "Teacher: Sir Zothana",
        time: "Due Date: 29/01/2026",
        type: "Assignments",
      },
    ];

    setSessions(mockSessions);
    setAssignments(mockAssignments);
    setQuizzes(mockQuizzes);
    setNotifications(mockNotifications);
    setSchedule(mockSchedule);

  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived: today's sessions only ── */
  const todaySessions = sessions.filter(s => s.sessionDate === todayISO);

  /* ── Derived: calendar event dot map ── */
  const scheduleByDate = {};
  schedule.forEach(item => {
    const key = item.date.split(" ")[0]; // "21/01/2026"
    if (!scheduleByDate[key]) scheduleByDate[key] = [];
    if (!scheduleByDate[key].includes(item.type)) {
      scheduleByDate[key].push(item.type);
    }
  });

  /* ── Derived: filtered lists ── */
  const filteredNotifications = notificationFilter === "All"
    ? notifications
    : notifications.filter(n => n.type === notificationFilter);

  const filteredSchedule = scheduleFilter === "All"
    ? schedule
    : schedule.filter(s => s.type === scheduleFilter);

  /* Mobile: schedule filtered by selected calendar date */
  const filteredScheduleMobile = schedule.filter(item => {
    const [d, m, y] = item.date.split(" ")[0].split("/");
    const itemDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return itemDate.toDateString() === selectedDate.toDateString();
  });

  /* ── Helper: format selected date for schedule header ── */
  const formatSelectedDate = (date) =>
    `${date.getDate()} ${months[date.getMonth()].substring(0, 3)} ${date.getFullYear()}`;

  /* ────────────────────────── RENDER ────────────────────────── */
  return (
    <div className="dashExact">

      {/* Mobile top slider */}
      <div className="mobileOnly">
        <TopSliderTabs active={activeTab} setActive={setActiveTab} />
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div className="desktopOnly">

        {/* ── TOP: Sessions + Calendar ── */}
        <div className="dashExact__top">

          {/* UPCOMING LIVE SESSIONS */}
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>Upcoming Live Sessions</h3>
              <span className="sessionCount">
                {todaySessions.length} Classes (Remaining classes)
              </span>
            </div>

            <div className="sessionsGrid">
              {todaySessions.map((s, i) => (
                <SessionCard key={i} {...s} />
              ))}
              {todaySessions.length === 0 && (
                <p className="emptyState">No live sessions scheduled for today.</p>
              )}
            </div>
          </div>

          {/* CALENDAR */}
          <div className="calendarBox">
            <div className="calendarHeader">
              <span className="calNavBtn" onClick={goToPrevMonth}>&#8249;</span>

              <div className="calendarHeader__mid">
                <select
                  className="calendarSelect"
                  value={currMonth}
                  onChange={e => setCurrMonth(parseInt(e.target.value))}
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>{m.substring(0, 3)}</option>
                  ))}
                </select>

                <select
                  className="calendarSelect"
                  value={currYear}
                  onChange={e => setCurrYear(parseInt(e.target.value))}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <span className="calNavBtn" onClick={goToNextMonth}>&#8250;</span>
            </div>

            <div className="calendarGrid">
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                <div key={d} className="calDayName">{d}</div>
              ))}

              {/* Empty offset cells */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="calDate" style={{ visibility: "hidden" }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday =
                  day === today.getDate() &&
                  currMonth === today.getMonth() &&
                  currYear === today.getFullYear();
                const isSelected =
                  !isToday &&
                  day === selectedDate.getDate() &&
                  currMonth === selectedDate.getMonth() &&
                  currYear === selectedDate.getFullYear();

                const dateKey = `${String(day).padStart(2, "0")}/${String(currMonth + 1).padStart(2, "0")}/${currYear}`;
                const events = scheduleByDate[dateKey] || [];

                return (
                  <div
                    key={day}
                    className={`calDate${isToday ? " calToday" : ""}${isSelected ? " calSelected" : ""}`}
                    onClick={() => setSelectedDate(new Date(currYear, currMonth, day))}
                  >
                    <span>{day}</span>
                    {events.length > 0 && (
                      <div className="calDate__dots">
                        {events.map(t => (
                          <span key={t} className={`calDate__dot calDate__dot--${typeClass(t)}`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Assignment+Quiz | Notification | Schedule ── */}
        <div className="dashExact__bottom">

          {/* LEFT COLUMN */}
          <div className="dashExact__leftCol">

            {/* ASSIGNMENT */}
            <div className="whiteCard">
              <div
                className="cardHeader cardHeader--clickable"
                onClick={() => setShowAssignments(!showAssignments)}
              >
                <h3>Assignment</h3>
                <button className="arrowBtn">
                  <span className={`arrowBtn__chevron ${showAssignments ? "arrowBtn__chevron--up" : ""}`}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
              </div>

              {showAssignments && (
                <div className="listBody">
                  {assignments.map((a, i) => (
                    <AssignmentCard key={i} {...a} urgency={computeUrgency(a.due)} />
                  ))}
                </div>
              )}
            </div>

            {/* QUIZ */}
            <div className="whiteCard">
              <div
                className="cardHeader cardHeader--clickable"
                onClick={() => setShowQuizzes(!showQuizzes)}
              >
                <h3>Quiz</h3>
                <button className="arrowBtn">
                  <span className={`arrowBtn__chevron ${showQuizzes ? "arrowBtn__chevron--up" : ""}`}>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
              </div>

              {showQuizzes && (
                <div className="listBody">
                  {quizzes.map((q, i) => (
                    <AssignmentCard key={i} {...q} urgency={computeUrgency(q.due)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* NOTIFICATION */}
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>Notification</h3>
              <DropdownMenu value={notificationFilter} onChange={setNotificationFilter} />
            </div>

            <div className="notifBody">
              {filteredNotifications.map((n, i) => (
                <NotificationCard key={i} {...n} />
              ))}
            </div>
          </div>

          {/* SCHEDULE — header shows selected calendar date */}
          <div className="whiteCard">
            <div className="cardHeader">
              <h3>{formatSelectedDate(selectedDate)}</h3>
              <DropdownMenu value={scheduleFilter} onChange={setScheduleFilter} />
            </div>

            <div className="scheduleList">
              {filteredSchedule.map((s, i) => (
                <div key={i} className={`scheduleItem scheduleItem--${typeClass(s.type)}`}>
                  <div className="scheduleItem__header">
                    <p className="scheduleDate">{s.date}</p>
                    <span className="scheduleDayBadge">{extractDay(s.date)}</span>
                  </div>
                  <p className="scheduleTitle">{s.title}</p>
                  <p className="scheduleSub">{s.subject}</p>
                  <p className="scheduleSub">{s.teacher}</p>
                  <p className="scheduleSub">{s.time}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="mobileOnly">

        {activeTab === "sessions" &&
          todaySessions.map((s, i) => <SessionCard key={i} {...s} />)}

        {activeTab === "assign" &&
          assignments.map((a, i) => (
            <AssignmentCard key={i} {...a} urgency={computeUrgency(a.due)} />
          ))}

        {activeTab === "quiz" &&
          quizzes.map((q, i) => (
            <AssignmentCard key={i} {...q} urgency={computeUrgency(q.due)} />
          ))}

        {activeTab === "notify" &&
          notifications.map((n, i) => <NotificationCard key={i} {...n} />)}

        {activeTab === "calendar" && (
          <>
            <div className="calendarBox">
              <div className="calendarHeader">
                <span className="calNavBtn" onClick={goToPrevMonth}>&#8249;</span>
                <strong>{months[currMonth]} {currYear}</strong>
                <span className="calNavBtn" onClick={goToNextMonth}>&#8250;</span>
              </div>

              <div className="calendarGrid">
                {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                  <div key={d} className="calDayName">{d}</div>
                ))}

                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`me-${i}`} className="calDate" style={{ visibility: "hidden" }} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currYear, currMonth, day);
                  const isToday =
                    day === today.getDate() &&
                    currMonth === today.getMonth() &&
                    currYear === today.getFullYear();
                  const isSelected =
                    !isToday && dateObj.toDateString() === selectedDate.toDateString();
                  const dateKey = `${String(day).padStart(2, "0")}/${String(currMonth + 1).padStart(2, "0")}/${currYear}`;
                  const events = scheduleByDate[dateKey] || [];

                  return (
                    <div
                      key={i}
                      className={`calDate${isToday ? " calToday" : ""}${isSelected ? " calSelected" : ""}`}
                      onClick={() => setSelectedDate(dateObj)}
                    >
                      <span>{day}</span>
                      {events.length > 0 && (
                        <div className="calDate__dots">
                          {events.map(t => (
                            <span key={t} className={`calDate__dot calDate__dot--${typeClass(t)}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="whiteCard" style={{ marginTop: "10px" }}>
              {filteredScheduleMobile.length === 0
                ? <p className="emptyState">No events for this date.</p>
                : filteredScheduleMobile.map((item, i) => (
                    <div key={i} className={`scheduleItem scheduleItem--${typeClass(item.type)}`}>
                      <div className="scheduleItem__header">
                        <p className="scheduleDate">{item.date}</p>
                        <span className="scheduleDayBadge">{extractDay(item.date)}</span>
                      </div>
                      <p className="scheduleTitle">{item.title}</p>
                      <p className="scheduleSub">{item.subject}</p>
                      <p className="scheduleSub">{item.teacher}</p>
                      <p className="scheduleSub">{item.time}</p>
                    </div>
                  ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile bottom nav (dashboard tabs) */}
      <BottomNav active={activeTab} setActive={setActiveTab} />

    </div>
  );
}
