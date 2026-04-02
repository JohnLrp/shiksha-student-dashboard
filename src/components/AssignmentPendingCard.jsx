import { useNavigate } from "react-router-dom";
import "../styles/assignmentPending.css";

export default function AssignmentPendingCard({ 
  id, 
  subjectId,
  title, 
  teacher, 
  chapter,
  deadline 
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/subjects/${subjectId}/assignments/${id}`);
  };

  return (
    <div className="assignmentPendingCard" onClick={handleClick}>
      
      <div className="assignmentPendingCard__top">
        {/* ✅ LABEL ADDED */}
        <p className="assignmentPendingCard__label">Title:</p>
        <p className="assignmentPendingCard__title">{title}</p>
      </div>

      {/* ✅ LABEL ADDED */}
      {chapter && (
        <p className="assignmentPendingCard__chapter">
          <span className="assignmentPendingCard__label">Chapter:</span> {chapter}
        </p>
      )}

      {teacher && (
        <p className="assignmentPendingCard__teacher">
          <span className="assignmentPendingCard__label">Teacher:</span> {teacher}
        </p>
      )}

      <div className="assignmentPendingCard__bottom">
        <p className="assignmentPendingCard__deadline">
          <span className="assignmentPendingCard__label">Due:</span> {deadline}
        </p>
      </div>
    </div>
  );
}