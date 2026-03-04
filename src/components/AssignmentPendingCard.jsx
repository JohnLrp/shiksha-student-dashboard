import { useNavigate } from "react-router-dom";
import "../styles/assignmentPending.css";

export default function AssignmentPendingCard({ id, title, teacher, deadline }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/assignments/${id}`);
  };

  return (
    <div className="assignmentPendingCard" onClick={handleClick}>
      <div className="assignmentPendingCard__top">
        <p className="assignmentPendingCard__title">{title}</p>
      </div>
      <p className="assignmentPendingCard__teacher">{teacher}</p>
      <div className="assignmentPendingCard__bottom">
        <p className="assignmentPendingCard__deadline">{deadline}</p>
      </div>
    </div>
  );
}
