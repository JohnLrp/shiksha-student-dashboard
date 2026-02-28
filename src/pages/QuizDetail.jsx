import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/quiz.css";

export default function QuizDetail() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ================================
  // FETCH QUIZ
  // ================================
  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/quizzes/${quizId}/`);
        setQuizData(res.data);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Unable to load quiz."
        );
      } finally {
        setLoading(false);
      }
    }

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  // ================================
  // HANDLE ANSWER
  // ================================
  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  // ================================
  // SUBMIT
  // ================================
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

      await api.post(`/quizzes/${quizId}/submit/`, {
        answers: formattedAnswers,
      });

      navigate(`/subjects/quiz/result/${quizId}`);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to submit quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ================================
  // STATES
  // ================================
  if (loading)
    return <div className="quizDetailPage">Loading quiz...</div>;

  if (error)
    return <div className="quizDetailPage">{error}</div>;

  if (!quizData) return null;

  const allAnswered =
    quizData.questions?.every(
      (q) => answers[q.id] !== undefined
    ) ?? false;

  // ================================
  // RENDER
  // ================================
  return (
    <div className="quizDetailPage">
      <div className="quizDetailBox">

        {/* Back Button */}
        <button
          className="quizDetailBack"
          onClick={() => navigate(-1)}
        >
          &lt; Back
        </button>

        {/* Header */}
        <div className="quizDetailHeader">
          <h2 className="quizDetailTitle">
            {quizData.subject_name}
          </h2>
        </div>

        {/* Content */}
        <div className="quizDetailContent">

          {/* Quiz Info */}
          <div className="quizDetailInfo">
            <h3 className="quizDetailInfoTitle">
              {quizData.title}
            </h3>
            <p className="quizDetailInfoMeta">
              {quizData.teacher_name}
            </p>
            <p className="quizDetailInfoDue">
              Due:{" "}
              {new Date(quizData.due_date).toLocaleString()}
            </p>
          </div>

          {/* Questions */}
          <div className="quizDetailQuestions">
            {quizData.questions.map((q, index) => (
              <div
                key={q.id}
                className="quizDetailQuestion"
              >
                <p className="quizDetailQuestionText">
                  {index + 1}. {q.text}
                </p>

                <div className="quizDetailOptions">
                  {q.choices.map((choice) => (
                    <label
                      key={choice.id}
                      className={`quizDetailOption ${
                        answers[q.id] === choice.id
                          ? "quizDetailOption--selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={
                          answers[q.id] === choice.id
                        }
                        onChange={() =>
                          handleAnswerChange(
                            q.id,
                            choice.id
                          )
                        }
                      />
                      <span className="quizDetailOptionRadio"></span>
                      <span className="quizDetailOptionText">
                        {choice.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
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
    </div>
  );
}