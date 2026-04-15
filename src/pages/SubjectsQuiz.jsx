import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/apiClient";
import SubjectCard from "../components/SubjectCard";
import PageHeader from "../components/PageHeader";
import "../styles/subjects.css";

export default function SubjectsQuiz() {
  const navigate = useNavigate();

  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subjectImages = {
    science: "/images/sci.jpeg",
    mathematics: "/images/Math.png",
    math: "/images/Math.png",
    english: "/images/eng.jpeg",
    hindi: "/images/hindi.png",
    civics: "/images/Civics.jpg",
    history: "/images/history.jpeg",
    geography: "/images/geography.jpg",
    economics: "/images/eco.jpeg",
    chemistry: "/images/chem.jpeg",
    physics: "/images/phys.jpeg",
    biology: "/images/bio.jpeg",
    sociology: "/images/sociology.jpeg",
    accountancy: "/images/accountancy.jpeg",
    "business studies": "/images/business study.jpeg",
    "political science": "/images/polSci.jpeg",
  };

  function getSubjectImage(subjectName) {
    const normalized = subjectName?.toLowerCase().trim() || "";

    const matchedKey = Object.keys(subjectImages).find((key) =>
      normalized.includes(key)
    );

    return matchedKey ? subjectImages[matchedKey] : "/images/sci.jpeg";
  }

  useEffect(() => {
    async function fetchSubjects() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/student/quiz-subjects/");
        setSubjectData(res.data);
      } catch (err) {
        console.error("Failed to fetch quiz subjects:", err);
        setError("Failed to load quiz subjects.");
        setSubjectData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  if (loading) return <div>Loading quiz subjects...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="subjectsPage">
      <div className="subjectsHeaderBox">
        <PageHeader title="Quiz" />
      </div>

      <div className="subjectsBodyBox">
        <div className="subjectsGrid">
          {subjectData.length === 0 ? (
            <div>No quiz subjects available.</div>
          ) : (
            subjectData.map((item) => (
              <SubjectCard
                key={item.id}
                img={getSubjectImage(item.subject)}
                subject={item.subject}
                teacher={item.teacher}
                onClick={() => navigate(`/subjects/quiz/${item.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}