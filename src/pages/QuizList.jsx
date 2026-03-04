import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/apiClient";
import QuizCard from "../components/QuizCard";
import "../styles/quiz.css";

export default function QuizList() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tab || "pending");
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (!subjectId) return;

    async function fetchQuizzes() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/student/quizzes/", { params: { subject: subjectId } });

        const pending = [];
        const completed = [];

        res.data.forEach((quiz) => {
          if (quiz.status === "SUBMITTED") {
            completed.push(quiz);
          } else {
            pending.push(quiz);
          }
        });

        setPendingQuizzes(pending);
        setCompletedQuizzes(completed);
      } catch (err) {
        console.error("Failed to fetch quizzes:", err);
        setError("Failed to load quizzes.");
        setPendingQuizzes([]);
        setCompletedQuizzes([]);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizzes();
  }, [subjectId]);

  const quizzes = activeTab === "pending" ? pendingQuizzes : completedQuizzes;

  const handleQuizClick = (quiz) => {
    if (activeTab === "pending") {
      navigate(`/subjects/quiz/${subjectId}/take/${quiz.id}`);
    } else {
      navigate(`/subjects/quiz/${subjectId}/result/${quiz.id}`);
    }
  };

  if (loading) return <div>Loading quizzes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="quizListPage">
      <button className="quizBackHeader" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="quizListHeaderBox">
        <div className="quizListHeaderRow">
          <h2 className="quizListTitle">Quizzes</h2>
          <div className="quizSearch">
            <input placeholder="Search..." />
            <span className="quizSearchIcon">🔍</span>
          </div>
        </div>

        <div className="quizTabs">
          <button
            className={`quizTab ${activeTab === "pending" ? "quizTabActive" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingQuizzes.length})
          </button>
          <button
            className={`quizTab ${activeTab === "completed" ? "quizTabActive" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedQuizzes.length})
          </button>
        </div>
      </div>

      <div className="quizListBodyBox">
        <div className="quizGrid">
          {quizzes.length === 0 ? (
            <div>No quizzes found.</div>
          ) : (
            quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                title={quiz.title}
                teacher={quiz.teacher_name}
                deadline={new Date(quiz.due_date).toLocaleString()}
                isCompleted={activeTab === "completed"}
                onClick={() => handleQuizClick(quiz)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
