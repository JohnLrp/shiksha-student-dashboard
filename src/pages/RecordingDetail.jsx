import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import "../styles/recordingDetail.css";

export default function RecordingDetail() {
  const navigate = useNavigate();
  const { videoId } = useParams();

  const videoData = {
    subject: "Subject Name",
    title: "Linear Equations",
    teacher: "Sir Zodina",
    dateRecorded: "22 Jan 2026",
    dayTime: "Wednesday, 1:00 pm (IST)",
    duration: "1:40:26",
    videoUrl: "",
  };

  return (
    <div className="recordingDetailPage">
      <button className="recordingDetailBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="recordingDetailHeaderBox">
        <PageHeader title={`${videoData.subject} - ${videoId}`} />
      </div>

      <div className="recordingDetailBodyBox">
        <div className="recordingDetailPlayer">
          <div className="recordingDetailVideo">
            <video
              controls
              className="recordingDetailVideoElement"
              poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
            >
              {videoData.videoUrl && <source src={videoData.videoUrl} type="video/mp4" />}
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        <div className="recordingDetailInfo">
          <div className="recordingDetailInfoLeft">
            <p className="recordingDetailInfoTitle">
              [Title] "{videoData.title}"
            </p>
            <p className="recordingDetailInfoTeacher">
              By:<br />
              {videoData.teacher}
            </p>
          </div>
          <div className="recordingDetailInfoRight">
            <p className="recordingDetailInfoDate">
              Date Recorded:<br />
              {videoData.dateRecorded}<br />
              {videoData.dayTime}
            </p>
            <p className="recordingDetailInfoDuration">
              Video Duration:<br />
              {videoData.duration}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
