// ============================================================
// STUDENT — src/components/NotificationCard.jsx  (FULL REPLACEMENT)
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/listCard.css";

const TYPE_LABELS = {
  ASSIGNMENT: "Assignment",
  SESSION:    "Live Session",
  QUIZ:       "Quiz",
  SUBMISSION: "Submission",
};

const TYPE_CLASSES = {
  ASSIGNMENT: "assignments",
  SESSION:    "livesessions",
  QUIZ:       "quiz",
  SUBMISSION: "submission",
};

export default function NotificationCard({ notification, onRead }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const item = notification || {};
  const { id, type, title, subject_name, subject_id, due_date, created_at, is_read } = item;

  const typeClass    = TYPE_CLASSES[type] || "";
  const displayLabel = TYPE_LABELS[type]  || type;

  const handleClick = () => {
    if (!is_read && id && onRead) onRead(id);
    setExpanded((prev) => !prev);
  };

  const handleView = (e) => {
    e.stopPropagation();
    if (!is_read && id && onRead) onRead(id);
    if (subject_id) {
      if (type === "ASSIGNMENT")   navigate(`/subjects/${subject_id}/assignments`);
      else if (type === "QUIZ")    navigate(`/subjects/quiz/${subject_id}`);
      else if (type === "SESSION") navigate(`/live-sessions`);
      else                         navigate(`/subjects/${subject_id}`);
    } else {
      const fallback = {
        ASSIGNMENT: "/assignments",
        QUIZ:       "/subjects/quiz",
        SESSION:    "/live-sessions",
      };
      if (fallback[type]) navigate(fallback[type]);
    }
  };

  const formattedDue = due_date
    ? new Date(due_date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : null;

  const formattedCreated = created_at
    ? new Date(created_at).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;

  return (
    <div
      className={`notifItem notifItem--${typeClass} ${!is_read ? "notifItem--unread" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="notifItem__bar" />

      {!is_read && <span className="notifItem__unreadDot" />}

      <div className="notifItem__content">
        <div className="notifItem__header">
          <span className={`notifItem__badge notifItem__badge--${typeClass}`}>
            {displayLabel}
          </span>
          <span className="notifItem__chevron">{expanded ? "▴" : "▾"}</span>
        </div>

        <p className="notifItem__title">{title}</p>

        {subject_name && (
          <p className="notifItem__sub">{subject_name}</p>
        )}

        {formattedCreated && (
          <p className="notifItem__time">{formattedCreated}</p>
        )}

        {expanded && (
          <div className="notifItem__expand">
            {formattedDue && (
              <p className="notifItem__expandRow">
                <span className="notifItem__expandLabel">Due</span>
                <span>{formattedDue}</span>
              </p>
            )}
            {subject_name && (
              <p className="notifItem__expandRow">
                <span className="notifItem__expandLabel">Subject</span>
                <span>{subject_name}</span>
              </p>
            )}
            <button className="notifItem__viewBtn" onClick={handleView}>
              View →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
