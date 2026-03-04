import "../styles/quiz.css";

export default function QuizCard({ title, teacher, deadline, isCompleted, onClick }) {
  return (
    <div className={`quizCard${isCompleted ? " quizCard--completed" : ""}`} onClick={onClick}>
      {isCompleted && <span className="quizCard__badge">✓</span>}
      <div className="quizCard__top">
        <p className="quizCard__title">{title}</p>
      </div>
      <p className="quizCard__teacher">{teacher}</p>
      <div className="quizCard__bottom">
        <p className="quizCard__deadline">{deadline}</p>
      </div>
    </div>
  );
}
