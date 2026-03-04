import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
import "../styles/quiz.css";

export default function QuizResult() {
  const navigate = useNavigate();
  const { quizId } = useParams();

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  if (error) return <div className="quizResultPage">{error}</div>;
  if (!resultData) return null;

  return (
    <div className="quizResultPage">
      <button className="quizResultBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="quizResultHeaderBox">
        <PageHeader title={resultData.subject_name} />
      </div>

      <div className="quizResultBodyBox">
        <div className="quizDetailInfo quizDetailInfo--result">
          <div className="quizDetailInfoLeft">
            <h3 className="quizDetailInfoTitle">{resultData.title}</h3>
            <p className="quizDetailInfoMeta">{resultData.teacher_name}</p>
            <p className="quizDetailInfoDue">
              Submitted: {new Date(resultData.submitted_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="quizDetailQuestions">
          {resultData.questions.map((q, index) => (
            <div key={q.id} className="quizDetailQuestion quizDetailQuestion--result">
              <div className="quizDetailQuestionRow">
                <p className="quizDetailQuestionText">
                  {index + 1}. {q.text}
                </p>
                <p className="quizDetailQuestionAnswer">
                  Ans: {q.correct_choice}
                </p>
              </div>
              <div className="quizDetailOptions quizDetailOptions--disabled">
                <div
                  className={`quizDetailOption ${
                    q.is_correct ? "quizDetailOption--selected" : ""
                  }`}
                >
                  <span className="quizDetailOptionText">
                    Your Answer: {q.selected_choice}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="quizDetailScore">
          <p className="quizDetailScoreText">
            Score: {resultData.score} / {resultData.total_marks}
          </p>
        </div>
      </div>
    </div>
  );
}
