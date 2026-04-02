import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCourse } from "../contexts/CourseContext";
import SubjectCard from "../components/SubjectCard";
import PageHeader from "../components/PageHeader";
import api from "../api/apiClient";
import "../styles/subjects.css";

export default function SubjectsStudyMaterial() {

  const navigate = useNavigate();
  const { activeCourse } = useCourse();

  const [subjects, setSubjects] = useState([]);

  useEffect(() => {

    if (!activeCourse) return;

    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/courses/${activeCourse.id}/subjects/`);
        setSubjects(res.data);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };

    fetchSubjects();

  }, [activeCourse]);

  const handleSubjectClick = (id) => {
    navigate(`/study-material/list/${id}`);
  };

  return (
    <div className="subjectsPage">

      <div className="subjectsHeaderBox">
        <PageHeader title="Study Material" />
      </div>

      <div className="subjectsBodyBox">
        <div className="subjectsGrid">

          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              img="https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600"
              subject={subject.name}
              teacher={
                subject.teachers?.length
                  ? subject.teachers.map(t => t.name).join(", ")
                  : "No teacher assigned"
              }
              onClick={() => handleSubjectClick(subject.id)}
            />
          ))}

        </div>
      </div>

    </div>
  );
}