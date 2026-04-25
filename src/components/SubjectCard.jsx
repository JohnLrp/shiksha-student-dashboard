import "../styles/subjectCard.css";

export default function SubjectCard({ img, subject, teacher, recordingsCount, taskCount, onClick }) {
  return (
    <div
      className="subjectCard"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
      }}
    >
      <div className="subjectCard__imgWrapper">
        <img
          className="subjectCard__img"
          src={img}
          alt={subject || "Subject"}
          loading="lazy"
        />
        {taskCount !== undefined && (
          <span className="subjectCard__taskBadge">
            {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
          </span>
        )}
      </div>
      <div className="subjectCard__body">
        <h4 className="subjectCard__title">{subject}</h4>
        <p className="subjectCard__teacher">{teacher}</p>
        {recordingsCount !== undefined && (
          <p className="subjectCard__count">
            🎬 {recordingsCount} video{recordingsCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}