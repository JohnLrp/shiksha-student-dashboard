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
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ NEW STATES (added)
  const [showModal, setShowModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

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

  // ✅ MODIFIED CLICK HANDLER
  const handleQuizClick = (quiz) => {
    if (activeTab === "pending") {
      setSelectedQuiz(quiz);
      setShowModal(true);
    } else {
 navigate(`/subjects/quiz/${subjectId}/attempts/${quiz.id}`);
    }
  };

  // ✅ CONFIRM FUNCTION (added)
  const confirmStartQuiz = () => {
    navigate(`/subjects/quiz/${subjectId}/take/${selectedQuiz.id}`);
    setShowModal(false);
  };

  if (loading) return <div>Loading quizzes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="quizListPage">
      <button className="quizBackHeader" onClick={() => navigate(`/subjects/quiz`)}>
  &lt; Back
</button>

      <div className="quizListHeaderBox">
        <div className="quizListHeaderRow">
          <h2 className="quizListTitle">Quizzes</h2>
          <div className="quizSearch">
            <input placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
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
          {(() => {
            const filtered = quizzes.filter((quiz) =>
              quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return filtered.length === 0 ? (
              <div>{searchTerm ? "No matching quizzes." : "No quizzes found."}</div>
            ) : (
              filtered.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  title={quiz.title}
                  teacher={quiz.teacher_name}
                  deadline={new Date(quiz.due_date).toLocaleString()}
                  isCompleted={activeTab === "completed"}
                  onClick={() => handleQuizClick(quiz)}
                />
              ))
            );
          })()}
        </div>
      </div>

      {/* ✅ MODAL UI (added) */}
      {showModal && (
        <div className="quizModalOverlay">
          <div className="quizModalBox">
            <h3>Start Quiz?</h3>
            <p>
              You are about to start <b>{selectedQuiz?.title}</b>
              <br /><br />
              ⏱ Time will start immediately  
              <br />
              🚫 You cannot pause the quiz
            </p>

            <div className="quizModalActions">
              <button className="startBtn" onClick={confirmStartQuiz}>
                Start
              </button>
              <button className="cancelBtn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}