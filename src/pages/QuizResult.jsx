import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
import "../styles/quiz.css";

export default function QuizResult() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [resultData, setResultData]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [openExplanation, setOpenExplanation] = useState({});
  const [showReattemptModal, setShowReattemptModal] = useState(false); // NEW

  const toggleExplanation = (id) => {
    setOpenExplanation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReattempt = async () => {
    try {
      await api.post(`/quizzes/${quizId}/start/`);
      navigate(`/subjects/quiz/${subjectId}/take/${quizId}`);
    } catch (err) {
      console.error("Failed to reattempt quiz:", err);
      alert("Unable to start reattempt");
    }
  };

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/quizzes/${quizId}/result/`);
        setResultData(res.data);
      } catch (err) {
        console.error("Failed to load result:", err);
        setError("Unable to load result.");
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [quizId]);

  if (loading) return <div className="quizResultPage">Loading result...</div>;
  if (error)   return <div className="quizResultPage">{error}</div>;
  if (!resultData) return null;

  const total     = resultData.questions.length;
  const correct   = resultData.questions.filter(q => q.is_correct).length;
  const incorrect = total - correct;
  const pct       = Math.round((correct / total) * 100);

  return (
    <div className="quizResultPage">
      <button className="quizResultBack" onClick={() => navigate(`/subjects/quiz/${subjectId}`)}>
        &lt; Back
      </button>

      {/* ── Header with action buttons injected next to search ── */}
      <div className="quizResultHeaderBox">
        <PageHeader
          title={resultData.subject_name}
          headerActions={
            <div className="quizResultHeaderBtns">
              <button
                className="quizResultBackBtn"
                onClick={() => navigate(`/subjects/quiz/${subjectId}`)}
              >
                ← Back to Quizzes
              </button>
              <button
                className="quizResultReattemptBtn"
                onClick={() => setShowReattemptModal(true)}
              >
                🔁 Reattempt Quiz
              </button>
            </div>
          }
        />
      </div>

      <div className="quizResultBodyBox">

        {/* ── Quiz info ── */}
        <div className="quizDetailInfo quizDetailInfo--result">
          <div className="quizDetailInfoLeft">
            <h3 className="quizDetailInfoTitle">{resultData.title}</h3>
            <p className="quizDetailInfoMeta">{resultData.teacher_name}</p>
            <p className="quizDetailInfoDue">
              Submitted: {new Date(resultData.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Score summary cards ── */}
        <div className="quizResultSummary">
          {[
            { label: "Score",     value: `${resultData.score} / ${resultData.total_marks}`, mod: "score" },
            { label: "Correct",   value: correct,   mod: "correct" },
            { label: "Incorrect", value: incorrect, mod: "incorrect" },
            { label: "Accuracy",  value: `${pct}%`, mod: "accuracy" },
          ].map(({ label, value, mod }) => (
            <div key={label} className={`quizResultSummaryCard quizResultSummaryCard--${mod}`}>
              <div className="quizResultSummaryValue">{value}</div>
              <div className="quizResultSummaryLabel">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Questions ── */}
        <div className="quizDetailQuestions">
          {resultData.questions.map((q, index) => (
            <div
              key={q.id}
              className={`quizDetailQuestion quizDetailQuestion--result ${
                q.is_correct ? "quizDetailQuestion--correct" : "quizDetailQuestion--wrong"
              }`}
            >
              <div className="quizDetailQuestionRow">
                <p className="quizDetailQuestionText">
                  <span className={`quizResultBadge ${q.is_correct ? "quizResultBadge--correct" : "quizResultBadge--wrong"}`}>
                    {q.is_correct ? "✓" : "✗"}
                  </span>
                  {index + 1}. {q.text}
                </p>
                <span className="quizResultCorrectChip">
                  Ans: {q.correct_choice}
                </span>
              </div>

              <div className={`quizResultAnswerPill ${q.is_correct ? "quizResultAnswerPill--correct" : "quizResultAnswerPill--wrong"}`}>
                {q.is_correct ? "✓" : "✗"} Your Answer: {q.selected_choice}
              </div>

              <div>
                <button
                  onClick={() => toggleExplanation(q.id)}
                  className={`quizResultExplainBtn ${openExplanation[q.id] ? "quizResultExplainBtn--open" : ""}`}
                >
                  {openExplanation[q.id] ? "Hide Explanation ▲" : "Show Explanation ▼"}
                </button>

                {openExplanation[q.id] && (
                  <div className="quizResultExplainBox">
                    <strong>Explanation:</strong>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Score row (no buttons here anymore) ── */}
        <div className="quizResultFooter">
          <p className="quizDetailScoreText">
            Score: {resultData.score} / {resultData.total_marks}
          </p>
        </div>

      </div>

      {/* ── Reattempt Confirmation Modal ── */}
      {showReattemptModal && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-box">
            <h3>Reattempt Quiz?</h3>
            <p>
              Starting a new attempt will <strong>permanently overwrite</strong> your
              current result. This action cannot be undone.
            </p>
            <div className="quiz-modal-actions">
              <button
                className="quiz-btn-cancel"
                onClick={() => setShowReattemptModal(false)}
              >
                Cancel
              </button>
              <button
                className="quiz-btn-exit"
                onClick={handleReattempt}
              >
                Yes, Reattempt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}