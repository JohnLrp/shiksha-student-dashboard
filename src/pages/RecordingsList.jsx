import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecordingCard from "../components/RecordingCard";
import PageHeader from "../components/PageHeader";
import api from "../api/apiClient";
import "../styles/recordings.css";

export default function RecordingsList() {
  const navigate = useNavigate();
  const { subjectId } = useParams(); // ✅ FIXED

  const [recordingsData, setRecordingsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const res = await api.get(`/courses/subjects/${subjectId}/recordings/`);
        setRecordingsData(res.data || []);
      } catch (err) {
        console.error("Failed to load recordings", err);
      }
    };

    if (subjectId) fetchRecordings();
  }, [subjectId]);

  const filteredRecordings = recordingsData.filter((item) =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="recordingsPage">
      <button className="recordingsBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="recordingsHeaderBox">
        <PageHeader title="Subject Recordings" onSearch={setSearchTerm} />
      </div>

      <div className="recordingsBodyBox">
        <div className="recordingsGrid">
          {filteredRecordings.map((item) => (
            <RecordingCard
              key={item.id}
              subject="Session"
              sessionTitle={item.title}
              teacher="Teacher"
              sessionDate={item.session_date}
              onClick={() =>
                navigate(`/subjects/recordings/${subjectId}/video/${item.id}`)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
