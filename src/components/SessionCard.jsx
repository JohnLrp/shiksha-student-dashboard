import { useNavigate } from "react-router-dom";
import "../styles/sessionCard.css";

export default function SessionCard({ id, subject, topic, teacher, startsIn, timing }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/live/${id}`);
  };

  return (
    <div
      className="sessionCard"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="sessionCard__top">
        <h4 className="sessionCard__subject">{subject}</h4>
        <p className="sessionCard__topic">{topic}</p>
        <p className="sessionCard__teacher">{teacher}</p>
      </div>

      <div className="sessionCard__bottom">
        <p className="sessionCard__startsIn">{startsIn}</p>
        <p className="sessionCard__timing">{timing}</p>
      </div>
    </div>
  );
}
