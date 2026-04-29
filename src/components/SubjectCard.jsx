import { useState } from "react";
import "../styles/subjectCard.css";

export default function SubjectCard({
  img,
  subject,
  teacher,
  pendingCount,
  completedCount,
  taskCount,
  taskLabel,
  onClick,
}) {
  const [imageError, setImageError] = useState(false);

  const hasAssignmentBadges =
    pendingCount !== undefined || completedCount !== undefined;

  const hasTaskBadge = taskCount !== undefined && taskLabel;

  const subjectInitials = subject
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const getTaskBadgeText = () => {
    const count = taskCount ?? 0;
    const label = count === 1 ? taskLabel : `${taskLabel}s`;
    return `${count} ${label}`;
  };

  return (
    <div className="subjectCard" onClick={onClick} title={subject}>
      <div className="subjectCard__imageBox">
        {!imageError && img ? (
          <img
            src={img}
            alt={subject}
            className="subjectCard__image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="subjectCard__fallback">
            <span>{subjectInitials || "S"}</span>
          </div>
        )}

        {hasAssignmentBadges && (
          <div className="subjectCard__badges">
            <span className="subjectCard__badge subjectCard__badge--pending">
              {pendingCount ?? 0} Pending
            </span>

            <span className="subjectCard__badge subjectCard__badge--completed">
              {completedCount ?? 0} Completed
            </span>
          </div>
        )}

        {hasTaskBadge && (
          <div className="subjectCard__badges">
            <span className="subjectCard__badge subjectCard__badge--info">
              {getTaskBadgeText()}
            </span>
          </div>
        )}
      </div>

      <div className="subjectCard__content">
        <h3 className="subjectCard__title" title={subject}>
          {subject}
        </h3>

        <p className="subjectCard__teacher" title={teacher}>
          {teacher || "No teacher assigned"}
        </p>
      </div>
    </div>
  );
}