import { useNavigate } from "react-router-dom";
import "../styles/listCard.css";

export default function NotificationCard({ title, subject, teacher, time, time2, day, type }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (type === "Assignments") navigate("/assignments");
    else if (type === "Live Sessions") navigate("/live-sessions");
    else if (type === "Quiz") navigate("/subjects/quiz");
  };

  const typeClass =
    type === "Live Sessions" ? "livesessions"
    : type === "Assignments" ? "assignments"
    : type === "Quiz" ? "quiz"
    : "";

  return (
    <div
      className={`notifItem notifItem--${typeClass}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="notifItem__bar" />
      {day && <span className="notifItem__badge">{day}</span>}
      <div className="notifItem__content">
        <p className="notifItem__title">{title}</p>
        <p className="notifItem__sub">{subject}</p>
        <p className="notifItem__sub">{teacher}</p>
        <p className="notifItem__sub">{time}</p>
        {time2 && <p className="notifItem__time2">{time2}</p>}
      </div>
    </div>
  );
}
