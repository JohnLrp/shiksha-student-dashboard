import { useNavigate } from "react-router-dom";
import "../styles/listCard.css";

export default function AssignmentCard({ id, title, teacher, due, urgency = "green" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/assignments/${id}`);
  };

  // Extract day badge from due string: "20/02/2026 (Friday)" → "Friday"
  const dayMatch = due?.match(/\(([^)]+)\)/);
  const dayBadge = dayMatch ? dayMatch[1] : "";

  return (
    <div
      className={`listItem listItem--${urgency}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {dayBadge && <span className="listItem__badge">{dayBadge}</span>}
      <div className="listItem__left">
        <p className="listItem__title">{title}</p>
        <p className="listItem__sub">Teacher: {teacher}</p>
        <p className="listItem__sub">Due Date: {due}</p>
      </div>
    </div>
  );
}
