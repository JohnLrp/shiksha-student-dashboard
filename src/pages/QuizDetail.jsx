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

export default function QuizDetail() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [quizData, setQuizData]         = useState(null);
  const [answers, setAnswers]           = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState(null);
  const [timeLeft, setTimeLeft]         = useState(null);
  const [palette, setPalette]           = useState({});

  const answersRef   = useRef({});
  const submittedRef = useRef(false);
  const durationRef  = useRef(null);
  const startTimeRef = useRef(null);

  // ── start quiz + fetch ───────────────────────────────────────────────────
  useEffect(() => {
    async function initQuiz() {
      try {
        setLoading(true);
        setError(null);

        // call start endpoint first
        try {
          await api.post(`/quizzes/${quizId}/start/`);
        } catch (err) {
          console.error("Start quiz failed:", err.response?.data);
        }

        const res = await api.get(`/quizzes/${quizId}/`);
        setQuizData(res.data);

        // init palette
        const init = {};
        res.data.questions.forEach((q, i) => {
          init[q.id] = i === 0 ? S.NOT_ANSWERED : S.NOT_VISITED;
        });
        setPalette(init);

        // init timer refs
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

  // ── auto-submit (stable with useCallback) ────────────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    try {
      const formatted = Object.entries(answersRef.current).map(([q, c]) => ({
        question: q, selected_choice: c,
      }));
      await api.post(`/student/quizzes/${quizId}/submit/`, { answers: formatted });
      localStorage.removeItem(`quiz_${quizId}_start`);
      navigate(`/subjects/quiz/${subjectId}/result/${quizId}`);
    } catch (err) {
      console.error("Auto submit failed", err);
    }
  }, [quizId, subjectId, navigate]);

  // ── timer (runs once, no reload loop) ────────────────────────────────────
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
      [questionId]:
        p[questionId] === S.MARKED || p[questionId] === S.MARKED_ANSWERED
          ? S.MARKED_ANSWERED : S.ANSWERED,
    }));
  };

  const handleMarkForReview = () => {
    const qId = quizData.questions[currentIndex].id;
    setPalette(p => ({ ...p, [qId]: answers[qId] ? S.MARKED_ANSWERED : S.MARKED }));
    if (currentIndex < quizData.questions.length - 1) goTo(currentIndex + 1);
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

  // ── manual submit ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allAnswered) { setError("Please answer all questions before submitting."); return; }
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
      console.log("FULL ERROR:", err.response?.data);
      setError(err.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── guards ────────────────────────────────────────────────────────────────
  if (loading) return <div className="quiz-center">Loading quiz…</div>;
  if (!quizData) return null;

  const q           = quizData.questions[currentIndex];
  const qLen        = quizData.questions.length;
  const allAnswered = quizData.questions.every(qq => answers[qq.id] !== undefined);

  return (
    <div className="quiz-page">

      {/* ── TOP BAR ── */}
      <div className="quiz-top-bar">
        <div className="quiz-top-left">
          <button className="quiz-back-btn" onClick={() => navigate(`/subjects/quiz/${subjectId}`)}>
            ← Back
          </button>
          <span className="quiz-title">{quizData.title}</span>
        </div>
        <div className="quiz-top-meta">
          <span className="quiz-meta-chip">Max Mark: <b>{quizData.max_mark ?? 1}</b></span>
          <span className="quiz-meta-chip">Negative: <b>{quizData.negative_mark ?? 0}</b></span>
          <span className="quiz-meta-chip">Subject: <b>{quizData.subject_name}</b></span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="quiz-body">

        {/* LEFT: question panel */}
        <div className="quiz-q-panel">
          {error && <div className="quiz-error-box">{error}</div>}

          <div className="quiz-q-header">
            <span className="quiz-q-num">Q.{currentIndex + 1}</span>
            <span className="quiz-q-meta">
              {quizData.teacher_name} &nbsp;|&nbsp; Due: {new Date(quizData.due_date).toLocaleString()}
            </span>
          </div>

          <p className="quiz-q-text">{q.text}</p>

          <div className="quiz-opt-label">Options</div>
          {q.choices.map(choice => (
            <label
              key={choice.id}
              className={`quiz-opt-row${answers[q.id] === choice.id ? " selected" : ""}`}
            >
              <input
                type="radio"
                name={`q_${q.id}`}
                checked={answers[q.id] === choice.id}
                onChange={() => handleAnswerChange(q.id, choice.id)}
              />
              {choice.text}
            </label>
          ))}

          <div className="quiz-btn-row">
            <button className="quiz-btn-mark"  onClick={handleMarkForReview}>Mark for Review & Next</button>
            <button className="quiz-btn-clear" onClick={handleClearResponse}>Clear Response</button>
            <button className="quiz-btn-prev"  onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}>◀ Previous</button>
            {currentIndex < qLen - 1
              ? <button className="quiz-btn-next" onClick={() => goTo(currentIndex + 1)}>Save & Next ▶</button>
              : <button className="quiz-btn-next" onClick={handleSubmit} disabled={submitting || !allAnswered}>
                  {submitting ? "Submitting…" : "Submit"}
                </button>
            }
          </div>
        </div>

        {/* RIGHT: sidebar */}
        <div className="quiz-sidebar">

          <div className="quiz-timer-box">
            <div className="quiz-timer-label">Time Left</div>
            <div className="quiz-timer-value">{timeLeft !== null ? fmtTime(timeLeft) : "--:--:--"}</div>
          </div>

          <div className="quiz-legend-box">
            {[
              ["#4caf50", "Answered"],
              ["#fff",    "Not Answered"],
              ["#bdbdbd", "Not Visited"],
              ["#9c27b0", "Marked for Review"],
              ["#9c27b0", "Answered & Marked"],
            ].map(([bg, lbl]) => (
              <div key={lbl} className="quiz-legend-row">
                <span className="quiz-legend-dot"
                  style={{ background: bg, border: bg === "#fff" ? "1px solid #aaa" : "none" }} />
                <span style={{ fontSize: 11 }}>{lbl}</span>
              </div>
            ))}
          </div>

          <div className="quiz-palette-header">Questions Palette</div>
          <div className="quiz-palette">
            {quizData.questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => goTo(i)}
                className={`quiz-pal-btn ${palClass(palette[qq.id])}${i === currentIndex ? " current" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            className="quiz-btn-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}