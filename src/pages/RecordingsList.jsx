import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecordingCard from "../components/RecordingCard";
import PageHeader from "../components/PageHeader";
import "../styles/recordings.css";

export default function RecordingsList() {
  const navigate = useNavigate();
  const { id: subjectId } = useParams();

  const [recordingsData, setRecordingsData] = useState([]);

  useEffect(() => {
    const mockRecordingsData = [
      { id: 1, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 2, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 3, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 4, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 5, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 6, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 7, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
      { id: 8, subject: "Subject Name", sessionTitle: "Session Title/Topic", teacher: "Teacher Name", sessionDate: "Date & Time (Session date)" },
    ];
    setRecordingsData(mockRecordingsData);
  }, []);

  return (
    <div className="recordingsPage">
      <button className="recordingsBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="recordingsHeaderBox">
        <PageHeader title="Subject Name" />
      </div>

      <div className="recordingsBodyBox">
        <div className="recordingsGrid">
          {recordingsData.map((item) => (
            <RecordingCard
              key={item.id}
              {...item}
              onClick={() => navigate(`/subjects/recordings/${subjectId}/video/${item.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
