import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/QuizDetail.css";

const S = {
  NOT_VISITED:     "nv",
  NOT_ANSWERED:    "na",
  ANSWERED:        "ans",
  MARKED:          "mk",
  MARKED_ANSWERED: "mka",
};

const palClass = (status) => {
  switch (status) {
    case S.ANSWERED:        return "answered";
    case S.MARKED:          return "marked";
    case S.MARKED_ANSWERED: return "marked-answered";
    case S.NOT_ANSWERED:    return "not-answered";
    default:                return "not-visited";
  }
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export default function QuizDetail() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [quizData, setQuizData]           = useState(null);
  const [answers, setAnswers]             = useState({});
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState(null);
  const [timeLeft, setTimeLeft]           = useState(null);
  const [palette, setPalette]             = useState({});
  const [showExitModal, setShowExitModal] = useState(false);

  const answersRef   = useRef({});
  const submittedRef = useRef(false);
  const durationRef  = useRef(null);
  const startTimeRef = useRef(null);

  // ── fetch + start ────────────────────────────────────────────────────────
  useEffect(() => {
    async function initQuiz() {
      try {
        setLoading(true);
        setError(null);
        try { await api.post(`/quizzes/${quizId}/start/`); }
        catch (err) { console.error("Start quiz failed:", err.response?.data); }

        const res = await api.get(`/quizzes/${quizId}/`);
        setQuizData(res.data);

        const init = {};
        res.data.questions.forEach((q, i) => {
          init[q.id] = i === 0 ? S.NOT_ANSWERED : S.NOT_VISITED;
        });
        setPalette(init);

        durationRef.current = (res.data.time_limit_minutes || 5) * 60;

        let st = localStorage.getItem(`quiz_${quizId}_start`);
        if (!st) {
          st = Date.now();
          localStorage.setItem(`quiz_${quizId}_start`, String(st));
        } else {
          st = parseInt(st, 10);
        }
        startTimeRef.current = st;

        const elapsed = Math.floor((Date.now() - st) / 1000);
        setTimeLeft(Math.max(0, durationRef.current - elapsed));
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    }
    if (quizId) initQuiz();
  }, [quizId]);

  // ── auto-submit ───────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    try {
      const formatted = Object.entries(answersRef.current).map(([q, c]) => ({
        question: q, selected_choice: c,
      }));
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
      localStorage.removeItem(`quiz_${quizId}_start`);
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) { console.error("Auto submit failed", err); }
  }, [quizId, subjectId, navigate]);

  // ── timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (durationRef.current === null || startTimeRef.current === null) return;
    const interval = setInterval(() => {
      const elapsed   = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = durationRef.current - elapsed;
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        if (!submittedRef.current) { submittedRef.current = true; handleAutoSubmit(); }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [handleAutoSubmit]);

  const fmtTime = (s) => {
    const h   = String(Math.floor(s / 3600)).padStart(2, "0");
    const m   = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  // ── navigation ────────────────────────────────────────────────────────────
  const goTo = (idx) => {
    const qId = quizData.questions[idx].id;
    setPalette(p => ({
      ...p,
      [qId]: p[qId] === S.NOT_VISITED ? S.NOT_ANSWERED : p[qId],
    }));
    setCurrentIndex(idx);
  };

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: choiceId };
      answersRef.current = updated;
      return updated;
    });
    setPalette(p => ({
      ...p,
      [questionId]: S.ANSWERED,
    }));
  };

  const handleClearResponse = () => {
    const qId = quizData.questions[currentIndex].id;
    setAnswers(prev => {
      const n = { ...prev };
      delete n[qId];
      answersRef.current = n;
      return n;
    });
    setPalette(p => ({ ...p, [qId]: S.NOT_ANSWERED }));
  };

  const handlePrevious = () => { if (currentIndex > 0) goTo(currentIndex - 1); };
  const handleNext     = () => { if (currentIndex < quizData.questions.length - 1) goTo(currentIndex + 1); };

  const handleExitQuiz = () => {
    localStorage.removeItem(`quiz_${quizId}_start`);
    navigate(`/subjects/quiz/${subjectId}`);
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allAnswered) {
      setError("Please answer all questions before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const formatted = Object.entries(answers).map(([q, c]) => ({
        question: q, selected_choice: c,
      }));
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
      localStorage.removeItem(`quiz_${quizId}_start`);
      submittedRef.current = true;
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="quiz-center">Loading quiz…</div>;
  if (!quizData) return null;

  const q           = quizData.questions[currentIndex];
  const qLen        = quizData.questions.length;
  const allAnswered = quizData.questions.every(qq => answers[qq.id] !== undefined);

  return (
    <div className="quiz-page">

      {/* TOP BAR */}
      <div className="quiz-top-bar">
        <button className="quiz-back-btn" onClick={() => setShowExitModal(true)}>
          ← Back
        </button>
        <span className="quiz-title">{quizData.title}</span>
      </div>

      {/* BODY */}
      <div className="quiz-body">

        {/* LEFT — question panel */}
        <div className="quiz-q-panel">

          {error && <div className="quiz-error-box">{error}</div>}

          <h2 className="quiz-q-heading">Question {currentIndex + 1}.</h2>
          <p className="quiz-q-text">{q.text}</p>

          {/* Options with A/B/C/D labels */}
          <div className="quiz-options">
            {q.choices.map((choice, ci) => (
              <label
                key={choice.id}
                className={`quiz-opt-row ${answers[q.id] === choice.id ? "selected" : ""}`}
              >
                <span className="quiz-opt-letter">{OPTION_LABELS[ci]}</span>
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  checked={answers[q.id] === choice.id}
                  onChange={() => handleAnswerChange(q.id, choice.id)}
                />
                {choice.text}
              </label>
            ))}
          </div>

          {/* Explanation (if available) */}
          {q.explanation && (
            <div className="quiz-explanation">
              <strong>Explanation:</strong> {q.explanation}
            </div>
          )}

          {/* Action bar — Clear Response + Previous / Next */}
          <div className="quiz-action-bar">
            <button className="quiz-btn-clear" onClick={handleClearResponse}>
              Clear Response
            </button>

            <div className="quiz-nav-btns">
              <button
                className="quiz-btn-prev"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ◄ Previous
              </button>
              <button
                className="quiz-btn-next"
                onClick={handleNext}
                disabled={currentIndex === qLen - 1}
              >
                Next ►
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT — sidebar */}
        <div className="quiz-sidebar">

          {/* Timer */}
          <div className="quiz-timer">
            <div className="quiz-timer-label">Time Limit:</div>
            <div className="quiz-timer-value">
              {timeLeft !== null ? fmtTime(timeLeft) : "--:--:--"}
            </div>
            <div className="quiz-timer-sub">(minutes)</div>
          </div>

          {/* Palette grid */}
          <div className="quiz-palette-grid">
            {quizData.questions.map((pq, idx) => (
              <button
                key={pq.id}
                className={`quiz-pal-btn ${palClass(palette[pq.id])} ${idx === currentIndex ? "active" : ""}`}
                onClick={() => goTo(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Score */}
          <div className="quiz-score-box">
            <div className="quiz-score-label">Score:</div>
            <div className="quiz-score-value">
              {Object.keys(answers).length}/{qLen}
            </div>
          </div>

          {/* Submit */}
          <button
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>

        </div>
      </div>

      {/* EXIT MODAL */}
      {showExitModal && (
        <div className="quiz-modal-overlay">
          <div className="quiz-modal-box">
            <h3>Exit Quiz?</h3>
            <p>
              You are currently attempting this quiz.
              <br /><br />
              ⚠️ Your progress will be lost if you exit.
            </p>
            <div className="quiz-modal-actions">
              <button className="quiz-btn-cancel" onClick={() => setShowExitModal(false)}>
                Cancel
              </button>
              <button className="quiz-btn-exit" onClick={handleExitQuiz}>
                Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}