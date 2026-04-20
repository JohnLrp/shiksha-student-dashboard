import "../styles/quiz.css";

export default function QuizCard({
  title,
  teacher,
  deadline,
  isCompleted,
  inProgress,
  badge,
  onClick,
}) {
  return (
    <div
      className={`quizCard ${isCompleted ? "quizCard--completed" : ""} ${inProgress ? "quizCard--inprogress" : ""}`}
      onClick={onClick}
    >
      {/* Status badge — top-right corner */}
      {isCompleted && <span className="quizCard__badge quizCard__badge--done">✓ Completed</span>}
      {inProgress && (
        <span className="quizCard__badge quizCard__badge--progress">
          ▶ In Progress
        </span>
      )}

      <div className="quizCard__top">
        <p className="quizCard__title">{title}</p>
      </div>

      <p className="quizCard__teacher">{teacher}</p>

      <div className="quizCard__bottom">
        <p className="quizCard__info">{deadline}</p>
        {badge && <span className="quizCard__attempts">{badge}</span>}
      </div>
      {isCompleted && (
        <p className="quizCard__reattempt">Tap to review or re-attempt →</p>
      )}

      {/* Pulsing dot for in-progress */}
      {inProgress && (
        <div className="quizCard__pulse-wrap">
          <span className="quizCard__pulse" />
          <span className="quizCard__pulse-label">Resume</span>
        </div>
      )}
    </div>
  );
}
