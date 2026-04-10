import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import api from "../api/apiClient";
import "../styles/recordingDetail.css";

export default function RecordingDetail() {
  const navigate = useNavigate();
  const { videoId } = useParams();

  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecording = async () => {
      try {
        const res = await api.get(`/courses/recordings/${videoId}/`);
        setVideoData(res.data);
      } catch (err) {
        console.error("Failed to load recording", err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) fetchRecording();
  }, [videoId]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading video...</div>;
  }

  if (!videoData) {
    return <div style={{ padding: 20 }}>Video not found.</div>;
  }

  const videoUrl = `https://iframe.mediadelivery.net/embed/${import.meta.env.VITE_BUNNY_LIBRARY_ID || "615730"}/${videoData.bunny_video_id}`;

  return (
    <div className="recordingDetailPage">

      <button
        className="recordingDetailBack"
        onClick={() => navigate(-1)}
      >
        &lt; Back
      </button>

      <div className="recordingDetailHeaderBox">
        <PageHeader title={videoData.title} />
      </div>

      <div className="recordingDetailBodyBox">

        <div className="recordingDetailPlayer">
          <div className="recordingDetailVideo">

            <iframe
              src={videoUrl}
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="recordingDetailVideoElement"
              title={videoData.title}
            />

          </div>
        </div>

        <div className="recordingDetailInfo">

          <div className="recordingDetailInfoLeft">
            <p className="recordingDetailInfoTitle">
              {videoData.title}
            </p>

            <p className="recordingDetailInfoTeacher">
              Teacher
            </p>
          </div>

          <div className="recordingDetailInfoRight">

            <p className="recordingDetailInfoDate">
              Date Recorded:<br />
              {videoData.session_date || "N/A"}
            </p>

            <p className="recordingDetailInfoDuration">
              Video Duration:<br />
              {videoData.duration_seconds
                ? `${Math.floor(videoData.duration_seconds / 60)} min`
                : "N/A"}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}