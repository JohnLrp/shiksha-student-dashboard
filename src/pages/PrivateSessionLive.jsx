import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import api from "../api/apiClient";
import ClassroomUI from "../components/live/ClassroomUI";

export default function PrivateSessionLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const joinSession = async () => {
      try {
        // Try the private session join endpoint first
        const res = await api.post(
          `/sessions/${id}/join/`,
          {},
          { signal: controller.signal }
        );
        setData(res.data);
      } catch (err) {
        if (err.name === "CanceledError") return;

        // Fallback: try the regular livestream join endpoint
        try {
          const res2 = await api.post(
            `/livestream/sessions/${id}/join/`,
            {},
            { signal: controller.signal }
          );
          setData(res2.data);
        } catch (err2) {
          if (err2.name === "CanceledError") return;
          console.error("Failed to join private session:", err2);
          setError(
            err2?.response?.data?.detail ||
            "Unable to join session. The session may not have started yet."
          );
        }
      }
    };

    joinSession();
    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2 style={{ color: "#1e293b", marginBottom: 12 }}>Unable to join session</h2>
        <p style={{ color: "#64748b", marginBottom: 24 }}>{error}</p>
        <button
          onClick={() => navigate("/private-sessions")}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "#3b5c7c", color: "#fff", fontWeight: 600,
            cursor: "pointer", marginRight: 12,
          }}
        >
          Back to Private Sessions
        </button>
        <button
          onClick={() => { setError(null); setData(null); }}
          style={{
            padding: "10px 24px", borderRadius: 8,
            border: "2px solid #94a3b8", background: "transparent",
            color: "#475569", fontWeight: 600, cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Joining private session...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={data.livekit_url}
      token={data.token}
      connect={true}
      video={data.role === "TEACHER"}
      audio={true}
      onDisconnected={() => navigate("/private-sessions")}
    >
      <ClassroomUI role={data.role?.toLowerCase() || "student"} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}