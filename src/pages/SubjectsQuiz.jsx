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
  "science": "/images/sci.jpeg",
  "mathematics": "/images/Math.png",

  "english (it so happened)": "/images/eng.jpeg",
  "english (grammar)": "/images/eng.jpeg",
  "english (honeydew)": "/images/eng.jpeg",
  "english (hornbill)": "/images/eng.jpeg",
  "english (vistas)": "/images/eng.jpeg",
  "english (flamingo)": "/images/eng.jpeg",
  "english (first flight)": "/images/eng.jpeg",
  "english (footprints without feet)": "/images/eng.jpeg",
  "english (snapshots)": "/images/eng.jpeg",

  "4a: english – honeydew (main reader)": "/images/eng.jpeg",
  "4a: english – main reader (beehive)": "/images/eng.jpeg",
  "4b: english – it so happened (supplementary reader)": "/images/eng.jpeg",
  "4b: english – supplementary (moments)": "/images/eng.jpeg",
  "4a: english – main reader (first flight)": "/images/eng.jpeg",
  "4b: english – supplementary (footprints without feet)": "/images/eng.jpeg",

  "hindi - vasant iii + grammar (mil)": "/images/hindi.png",
  "hindi (aroh i)": "/images/hindi.png",
  "hindi (aroh ii)": "/images/hindi.png",
  "hindi (kishtiji ii)": "/images/hindi.png",
  "hindi (kritika ii)": "/images/hindi.png",
  "hindi (vitan i)": "/images/hindi.png",
  "hindi (vitan ii)": "/images/hindi.png",
  "hindi (grammer)": "/images/hindi.png",

  "social science (civics)": "/images/Civics.jpg",
  "social science (history)": "/images/history.jpeg",
  "social science (geography)": "/images/geography.jpg",
  "social science (economics)": "/images/eco.jpeg",

  "3a: social science - history (our pasts iii)": "/images/history.jpeg",
  "3b: social science – geography (resources and development)": "/images/geography.jpg",
  "3c: social science - civics (social and political life iii)": "/images/Civics.jpg",

  "3a: social science – history": "/images/history.jpeg",
  "3b: social science – geography": "/images/geography.jpg",
  "3c: social science – civics": "/images/Civics.jpg",
  "3d: social science – economics": "/images/eco.jpeg",

  "history": "/images/history.jpeg",
  "geography (india)": "/images/geography.jpg",
  "geography (india - physical, social and economic)": "/images/history.jpeg",
  "geography (physical)": "/images/history.jpeg",
  "geography (human)": "/images/geography.jpg",

  "economics": "/images/eco.jpeg",
  "economics (indian economic development)": "/images/eco.jpeg",
  "economics (microeconomics)": "/images/eco.jpeg",

  "political science (indian constitution)": "/images/polSci.jpeg",
  "political science (political theory)": "/images/polSci.jpeg",
  "political science (indian since independence)": "/images/polSci.jpeg",
  "political science (contemporary world)": "/images/polSci.jpeg",

  "accountancy": "/images/accountancy.jpeg",
  "business studies": "/images/business study.jpeg",

  "chemistry": "/images/chem.jpeg",
  "physics": "/images/phys.jpeg",
  "biology": "/images/bio.jpeg",

  "sociology": "/images/sociology.jpeg",
};

  function getSubjectImage(subjectName) {
  const normalized = subjectName
    ?.toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim() || "";

  const normalizedMap = Object.entries(subjectImages).map(([key, value]) => [
    key.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim(),
    value,
  ]);

  const matched = normalizedMap
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => normalized.includes(key));

  return matched ? matched[1] : "/images/default.png";
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