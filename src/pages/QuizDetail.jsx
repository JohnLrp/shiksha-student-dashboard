import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/quiz.css";

export default function QuizDetail() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ✅ TIMER STATE
  const [timeLeft, setTimeLeft] = useState(null);

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

  // ✅ TIMER LOGIC
  useEffect(() => {
    if (!quizData) return;

    const duration = (quizData.duration || 10) * 60;

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
        handleAutoSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quizData]);

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  // ✅ AUTO SUBMIT
  const handleAutoSubmit = async () => {
    try {
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, choiceId]) => ({
          question: questionId,
          selected_choice: choiceId,
        })
      );

      await api.post(`student/quizzes/${quizId}/submit/`, { answers: formattedAnswers });

      localStorage.removeItem(`quiz_${quizId}_start`);

      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      console.error("Auto submit failed", err);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const formattedAnswers = Object.entries(answers).map(
        ([questionId, choiceId]) => ({
          question: questionId,
          selected_choice: choiceId,
        })
      );

      await api.post(`student/quizzes/${quizId}/submit/`, { answers: formattedAnswers });

      // ✅ CLEAR TIMER
      localStorage.removeItem(`quiz_${quizId}_start`);

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

  const allAnswered = quizData.questions?.every((q) => answers[q.id] !== undefined) ?? false;

  return (
    <div className="quizActivePage">
      <button className="quizBackHeader" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="quizActiveHeaderBox">
        <h2 className="quizPendingHeaderTitle">{quizData.subject_name}</h2>

        <div className="quizSearch">
          <input placeholder="Search..." />
          <span className="quizSearchIcon">🔍</span>

          {/* ✅ TIMER DISPLAY */}
          {timeLeft !== null && (
            <span className="quizTimer">
              ⏱ {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>

      <div className="quizActiveBodyBox">
        <div className="quizDetailInfo">
          <h3 className="quizDetailInfoTitle">{quizData.title}</h3>
          <p className="quizDetailInfoMeta">{quizData.teacher_name}</p>
          <p className="quizDetailInfoDue">Due: {new Date(quizData.due_date).toLocaleString()}</p>
        </div>

        <div className="quizDetailQuestions">
          {quizData.questions.map((q, index) => (
            <div key={q.id} className="quizDetailQuestion">
              <p className="quizDetailQuestionText">
                {index + 1}. {q.text}
              </p>
              <div className="quizDetailOptions">
                {q.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className={`quizDetailOption ${
                      answers[q.id] === choice.id ? "quizDetailOption--selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={answers[q.id] === choice.id}
                      onChange={() => handleAnswerChange(q.id, choice.id)}
                    />
                    <span className="quizDetailOptionRadio" />
                    <span className="quizDetailOptionText">{choice.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="quizDetailSubmitWrap">
          <button
            className="quizDetailSubmit"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
