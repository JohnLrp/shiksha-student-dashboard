import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import api from "../api";
import ClassroomUI from "../components/ClassroomUI";
import TeacherControls from "../components/TeacherControls";

export default function LiveSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const joinSession = async () => {
      try {
        const res = await api.post(
          `/livestream/sessions/${id}/join/`
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        alert("You cannot join this session.");
        navigate(-1);
      }
    };

    joinSession();
  }, [id, navigate]);

  if (!data) return <div style={{ padding: 20 }}>Joining session...</div>;

  return (
    <LiveKitRoom
      serverUrl={data.livekit_url}
      token={data.token}
      connect={true}
      video={data.role === "teacher"}
      audio={true}
    >
      <ClassroomUI role={data.role} />
      {data.role === "teacher" && <TeacherControls />}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}