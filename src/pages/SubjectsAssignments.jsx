import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import AssignmentPendingCard from "../components/AssignmentPendingCard";
import AssignmentCompletedCard from "../components/AssignmentCompletedCard";
import "../styles/assignmentPending.css";

export default function SubjectsAssignments() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [activeTab, setActiveTab] = useState("pending");
  const [pendingData, setPendingData] = useState([]);
  const [completedData, setCompletedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!subjectId) return;

    async function fetchAssignments() {
      try {
        setLoading(true);
        setError(null);

        // FIX: removed /api prefix
        const res = await api.get(`/assignments/subject/${subjectId}/`);

        const pending = [];
        const completed = [];

        (res.data || []).forEach((assignment) => {
          if (assignment.status === "SUBMITTED") {
            completed.push(assignment);
          } else {
            pending.push(assignment);
          }
        });

        setPendingData(pending);
        setCompletedData(completed);
      } catch (err) {
        console.error("Assignment fetch error:", err);
        setError("Failed to load assignments.");
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [subjectId]);

  if (loading) return <div>Loading assignments...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="assignmentPage">
      <button className="assignmentBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="assignmentHeaderBox">
        <div className="assignmentHeaderRow">
          <h2 className="assignmentSubjectTitle">Assignments</h2>

          <div className="assignmentSearch">
            <input
              placeholder="Search..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="assignmentSearchIcon">🔍</span>
          </div>
        </div>

        <div className="assignmentTabs">
          <button
            className={`assignmentTab ${
              activeTab === "pending" ? "assignmentTab--active" : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingData.length})
          </button>

          <button
            className={`assignmentTab ${
              activeTab === "completed" ? "assignmentTab--active" : ""
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedData.length})
          </button>
        </div>
      </div>

      <div className="assignmentBodyBox">
        <div className="assignmentGrid">
          {activeTab === "pending" &&
            pendingData
              .filter((item) =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item) => (
                <AssignmentPendingCard
                  key={item.id}
                  id={item.id}
                  subjectId={subjectId}
                  title={item.title}
                  deadline={new Date(item.due_date).toLocaleString()}
                />
              ))}

          {activeTab === "completed" &&
            completedData
              .filter((item) =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((item) => (
                <AssignmentCompletedCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  completedDate="Submitted"
                />
              ))}
        </div>
      </div>
    </div>
  );
}