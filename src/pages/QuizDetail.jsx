import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/quiz.css";

export default function QuizDetail() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [timeLeft, setTimeLeft] = useState(null);

  const answersRef = useRef({});
  const submittedRef = useRef(false);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/quizzes/${quizId}/`);
        setQuizData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    }

    if (quizId) fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!quizData) return;

    const duration = (quizData.time_limit_minutes || 5) * 60;

    let startTime = localStorage.getItem(`quiz_${quizId}_start`);

    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(`quiz_${quizId}_start`, startTime);
    } else {
      startTime = parseInt(startTime);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);

        if (!submittedRef.current) {
          submittedRef.current = true;
          handleAutoSubmit();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizData]);

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: choiceId };
      answersRef.current = updated;
      return updated;
    });
  };

  const handleAutoSubmit = async () => {
    try {
      const formattedAnswers = Object.entries(answersRef.current).map(
        ([questionId, choiceId]) => ({
          question: questionId,
          selected_choice: choiceId,
        })
      );

      // ✅ Fix 1: added leading slash
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formattedAnswers });

      localStorage.removeItem(`quiz_${quizId}_start`);
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      console.error("Auto submit failed", err);
    }
  };

  const handleSubmit = async () => {
    // ✅ Fix 2: guard against unanswered questions
    if (!allAnswered) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formattedAnswers = Object.entries(answers).map(
        ([questionId, choiceId]) => ({
          question: questionId,
          selected_choice: choiceId,
        })
      );

      // ✅ Fix 1: added leading slash
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formattedAnswers });

      localStorage.removeItem(`quiz_${quizId}_start`);
      submittedRef.current = true;

      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="quizActivePage">Loading quiz...</div>;
  if (error) return <div className="quizActivePage">{error}</div>;
  if (!quizData) return null;

  const currentQuestion = quizData.questions[currentIndex];
  const allAnswered = quizData.questions?.every((q) => answers[q.id] !== undefined) ?? false;

  return (
    <div className="quizActivePage">
      <button className="quizBackHeader" onClick={() => navigate(`/subjects/quiz/${subjectId}`)}>
        &lt; Back
      </button>

      <div className="quizActiveHeaderBox">
        <h2 className="quizPendingHeaderTitle">{quizData.subject_name}</h2>

        <div className="quizSearchWrapper">
          {timeLeft !== null && (
            <div className="quizTimer">
              <span className="quizTimerIcon">⏱</span>
              <span className="quizTimerText">
                {Math.floor(timeLeft / 60)}:
                {String(timeLeft % 60).padStart(2, "0")}
              </span>
            </div>
          )}

          <div className="quizSearch">
            <input placeholder="Search..." />
            <span className="quizSearchIcon">🔍</span>
          </div>
        </div>
      </div>

      <div className="quizActiveBodyBox">
        <div className="quizDetailInfo">
          <h3 className="quizDetailInfoTitle">{quizData.title}</h3>
          <p className="quizDetailInfoMeta">{quizData.teacher_name}</p>
          <p className="quizDetailInfoDue">Due: {new Date(quizData.due_date).toLocaleString()}</p>
        </div>

        <div className="quizDetailQuestion">
          <p className="quizDetailQuestionText">
            {currentIndex + 1}. {currentQuestion.text}
          </p>

          <div className="quizDetailOptions">
            {currentQuestion.choices.map((choice) => (
              <label
                key={choice.id}
                className={`quizDetailOption ${
                  answers[currentQuestion.id] === choice.id
                    ? "quizDetailOption--selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={answers[currentQuestion.id] === choice.id}
                  onChange={() =>
                    handleAnswerChange(currentQuestion.id, choice.id)
                  }
                />
                <span className="quizDetailOptionRadio" />
                <span className="quizDetailOptionText">{choice.text}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          {quizData.questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(index)}
              style={{
                margin: "5px",
                padding: "6px 10px",
                background: answers[q.id]
                  ? "green"
                  : index === currentIndex
                  ? "blue"
                  : "gray",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          {currentIndex > 0 && (
            <button onClick={() => setCurrentIndex(currentIndex - 1)}>
              Back
            </button>
          )}

          {currentIndex < quizData.questions.length - 1 ? (
            <button onClick={() => setCurrentIndex(currentIndex + 1)}>
              Save & Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !allAnswered}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}