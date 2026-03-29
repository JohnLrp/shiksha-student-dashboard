import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

export default function ParticipantsPanel() {
  const participants = useParticipants();
  const room = useRoomContext();

  const [open, setOpen] = useState(true);
  const [raisedHands, setRaisedHands] = useState({});

  useEffect(() => {
    const decoder = new TextDecoder();

    const handleData = (payload, participant) => {
      try {
        const msg = JSON.parse(decoder.decode(payload));

        const id = participant?.identity || msg.sender;
        if (!id) return;

        // ✋ RAISE HAND
        if (msg.type === "RAISE_HAND") {
          setRaisedHands((prev) => ({
            ...prev,
            [id]: true,
          }));
        }

        // 👇 LOWER HAND
        if (msg.type === "LOWER_HAND") {
          setRaisedHands((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }
      } catch {}
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  return (
    <div className="participants-wrapper">
      <div className="participants-header" onClick={() => setOpen(!open)}>
        <span>Participants</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="participants-count">{participants.length}</span>
          <svg
            className={`participants-chevron ${open ? "open" : ""}`}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className="participants-row">
          {participants.map((p) => {
            const displayName = p.name || p.identity;

            return (
              <div
                key={p.identity}
                className={`participant-card ${raisedHands[p.identity] ? "hand-raised" : ""}`}
              >
                <div className="participant-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="participant-name">
                  {displayName}
                  {raisedHands[p.identity] && (
                    <span className="raised-hand-icon"> ✋</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
