import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/quiz.css"; // reuse existing styles or create QuizAttempts.css

export default function QuizAttempts() {
  const navigate = useNavigate();
  const { subjectId, quizId } = useParams();

  const [attempts, setAttempts] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    async function fetchAttempts() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/quizzes/${quizId}/attempts/`); // adjust endpoint if different
        setAttempts(res.data.attempts ?? res.data);
        setQuizTitle(res.data.title ?? "");
      } catch (err) {
        console.error("Failed to load attempts:", err);
        setError("Unable to load attempts.");
      } finally {
        setLoading(false);
      }
    }
    fetchAttempts();
  }, [quizId]);

  const handleReattempt = async () => {
    try {
      await api.post(`/quizzes/${quizId}/start/`);
      navigate(`/subjects/quiz/${subjectId}/take/${quizId}`);
    } catch (err) {
      alert("Unable to start reattempt");
    }
  };

  if (loading) return <div className="quizResultPage">Loading attempts…</div>;
  if (error)   return <div className="quizResultPage">{error}</div>;

  return (
    <div className="quizResultPage">
      <button
        className="quizResultBack"
        onClick={() => navigate(`/subjects/quiz/${subjectId}`)}
      >
        &lt; Back
      </button>

      <div className="quizAttemptsHeader">
        <h2 className="quizAttemptsTitle">{quizTitle}</h2>
        <button className="quizResultReattemptBtn" onClick={handleReattempt}>
          Re-Attempt Quiz
        </button>
      </div>

      <div className="quizAttemptsTableWrapper">
        <table className="quizAttemptsTable">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Name</th>
              <th>Submitted On</th>
              <th>Time Taken</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  No attempts found.
                </td>
              </tr>
            ) : (
              attempts.map((attempt, idx) => (
                <tr key={attempt.id}>
                  <td>{idx + 1}</td>
                  <td>{attempt.student_name}</td>
                  <td>{new Date(attempt.submitted_at).toLocaleString()}</td>
                  <td>{attempt.time_taken}</td>
                  <td>{attempt.score}</td>
                  <td>
                    <button
                      className="quizAttemptsReviewBtn"
                      onClick={() =>
                        navigate(
                          `/subjects/quiz/${subjectId}/result/${quizId}?attempt=${attempt.id}`
                        )
                      }
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}