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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const subjectImages = {
  "Mathematics": "/images/class8-math.png",
  
};
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

  if (loading) return <div>Loading subjects...</div>;
  if (!activeCourse) return <div>No course selected.</div>;

  return (
    <div className="subjectsPage">
      <div className="subjectsHeaderBox">
        <PageHeader
          title={mode === "assignments" ? "Select Subject" : "Subjects"}
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
                img={subjectImages[subject.name] || "/images/default.png"}
                subject={subject.name}
                teacher={
                  subject.teachers?.length
                    ? subject.teachers.map((t) => t.name).join(", ")
                    : "No teacher assigned"
                }
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