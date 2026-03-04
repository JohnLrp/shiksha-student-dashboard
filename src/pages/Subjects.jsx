import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCourse } from "../contexts/CourseContext";
import api from "../api/apiClient";
import SubjectCard from "../components/SubjectCard";
import PageHeader from "../components/PageHeader";
import "../styles/subjects.css";

export default function Subjects() {
  const navigate = useNavigate();
  const { activeCourse, loading: courseLoading } = useCourse();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <PageHeader title="Subjects" />
      </div>

      <div className="subjectsBodyBox">
        <div className="subjectsGrid">
          {subjects.length === 0 ? (
            <div>No subjects found.</div>
          ) : (
            subjects.map((item) => (
              <SubjectCard
                key={item.id}
                img="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600"
                subject={item.name}
                teacher={
                  item.teachers?.length
                    ? item.teachers.map(t => t.name).join(", ")
                    : "No teacher assigned"
                }
                onClick={() => navigate(`/subjects/${item.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
