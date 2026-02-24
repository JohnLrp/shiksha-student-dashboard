import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SubjectCard from "../components/SubjectCard";
import "../styles/subjects.css";

export default function SubjectsQuiz() {
  const navigate = useNavigate();

  // State for data (future backend data)
  const [subjectData, setSubjectData] = useState([]);

  // Mock data (simulates backend response)
 useEffect(() => {
  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/student/quiz-subjects/", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch subjects");

      const data = await res.json();
      setSubjectData(data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchSubjects();
}, []);



  return (
    <div className="subjectsPage">
      <div className="subjectsBox">
        <div className="subjectsHeader">
          <h2 className="subjectsTitle">Subjects (Quiz)</h2>

          <div className="subjectsSearch">
            <input placeholder="Search..." />
            <span className="subjectsSearchIcon">🔍</span>
          </div>
        </div>

        <div className="subjectsGrid">
          {subjectData.map((item) => (
            <SubjectCard
              key={item.id}
              {...item}
              onClick={() => navigate(`/subjects/quiz/${item.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}