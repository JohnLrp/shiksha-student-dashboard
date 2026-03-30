import "../styles/privateSessions.css";

const STATUS_LABEL = {
  approved:             "✅ Approved",
  pending:              "⏳ Pending",
  ongoing:              "🔴 On Going",
  needs_reconfirmation: "⚠️ Needs Confirmation",
};

export default function PrivateSessionCard({
  subject,
  topic,
  teacher,
  date,
  time,
  status,
  onEnterRoom,
  onClick,
}) {
  return (
    <div className="psCard" onClick={onClick} role="button" tabIndex={0}>
      <span className={`psCard__badge psCard__badge--${status}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
      <h4 className="psCard__subject">{subject}</h4>
      <p className="psCard__topic">{topic}</p>
      <p className="psCard__teacher">👤 {teacher}</p>
      <div className="psCard__footer">
        <span>{date}</span>
        <span>{time}</span>
      </div>
      {(status === "approved" || status === "ongoing") && (
        <button
          className={`psCard__enterBtn ${status === "ongoing" ? "psCard__enterBtn--live" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onEnterRoom && onEnterRoom();
          }}
        >
          {status === "ongoing" ? "🔴 Join Now" : "▶ Enter Room"}
        </button>
      )}
    </div>
  );
}