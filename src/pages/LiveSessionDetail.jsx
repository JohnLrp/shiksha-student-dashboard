import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import api from "../api/apiClient";
import ClassroomUI from "../components/live/ClassroomUI";
import TeacherControls from "../components/live/TeacherControls";

export default function LiveSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const joinSession = async () => {
      try {
        const res = await api.post(
          `/livestream/sessions/${id}/join/`,
          {},
          { signal: controller.signal }
        );
        setData(res.data);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err);
          const message =
            err?.response?.data?.detail || "You cannot join this session.";
          alert(message);
          navigate("/live-sessions");
        }
      }
    };

    joinSession();
    return () => controller.abort();
  }, [id, navigate]);

  if (!data) return <div style={{ padding: 20 }}>Joining session...</div>;

  const isPresenter = data.role === "PRESENTER";

  return (
    <LiveKitRoom
      serverUrl={data.livekit_url}
      token={data.token}
      connect={true}
      video={isPresenter}
      audio={true}
    >
      <ClassroomUI role={data.role} sessionId={id} />
      {isPresenter && <TeacherControls />}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
