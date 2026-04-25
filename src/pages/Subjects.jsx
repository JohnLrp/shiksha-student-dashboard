import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCourse } from "../contexts/CourseContext";
import api from "../api/apiClient";
import SubjectCard from "../components/SubjectCard";
import PageHeader from "../components/PageHeader";
import "../styles/subjects.css";

export default function Subjects({ mode }) {
  const navigate = useNavigate();
  const { activeCourse, loading: courseLoading } = useCourse();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);  // ← fixed typo (setaLoading → setLoading)
  const [searchTerm, setSearchTerm] = useState("");
  const [taskCounts, setTaskCounts] = useState({});
  const [taskCountsReady, setTaskCountsReady] = useState(false);

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ← removed subjectImages entirely

  useEffect(() => {
    if (courseLoading) return;

    if (!activeCourse) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    async function fetchSubjects() {
      try {
        const res = await api.get(`/courses/${activeCourse.id}/subjects/`);
        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects", err);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, [activeCourse, courseLoading]);

  useEffect(() => {
    if (mode !== "assignments" || subjects.length === 0) return;

    async function fetchTaskCounts() {
      const results = await Promise.allSettled(
        subjects.map(async (subject) => {
          const res = await api.get(`/assignments/subject/${subject.id}/`);
          const assignments = res.data || [];
          const pending = assignments.filter((a) => a.status !== "SUBMITTED").length;
          const completed = assignments.filter((a) => a.status === "SUBMITTED").length;
          return { id: subject.id, pending, completed };
        })
      );
      const counts = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          counts[result.value.id] = { pending: result.value.pending, completed: result.value.completed };
        }
      });
      setTaskCounts(counts);
      setTaskCountsReady(true);
    }

    fetchTaskCounts();
  }, [subjects, mode]);

  if (loading) return <div>Loading subjects...</div>;
  if (!activeCourse) return <div>No course selected.</div>;

  return (
    <div className="subjectsPage">
      <div className="subjectsHeaderBox">
        <PageHeader
          title={mode === "assignments" ? "Assignments" : "Subjects"}
          onSearch={setSearchTerm}
        />
      </div>

      <div className="subjectsBodyBox">
        <div className="subjectsGrid">
          {filteredSubjects.length === 0 ? (
            <div>No subjects found.</div>
          ) : (
            filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                img={subject.image || "/images/default.png"}  // ← changed
                subject={subject.name}
                teacher={
                  subject.teachers?.length
                    ? subject.teachers.map((t) => t.name).join(", ")
                    : "No teacher assigned"
                }
                pendingCount={mode === "assignments" && taskCountsReady ? (taskCounts[subject.id]?.pending ?? 0) : undefined}
                completedCount={mode === "assignments" && taskCountsReady ? (taskCounts[subject.id]?.completed ?? 0) : undefined}
                onClick={() =>
                  mode === "assignments"
                    ? navigate(`/subjects/${subject.id}/assignments`)
                    : navigate(`/subjects/${subject.id}`)
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}