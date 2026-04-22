import { useParticipants, useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

export default function ParticipantsPanel({ raisedHands = {}, onLowerHand }) {
  const participants = useParticipants();
  const room = useRoomContext();
  const [open, setOpen] = useState(true);

  // Sort: presenter first, then by name
  const sorted = [...participants].sort((a, b) => {
    const getMeta = (p) => { try { return JSON.parse(p.metadata || "{}"); } catch { return {}; } };
    const aPresenter = getMeta(a).role === "presenter" ? 1 : 0;
    const bPresenter = getMeta(b).role === "presenter" ? 1 : 0;
    return bPresenter - aPresenter;
  });

  return (
    <div className="participants-wrapper">
      <div className="participants-header" onClick={() => setOpen(!open)}>
        <span>Participants</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="participants-count">{participants.length}</span>
          <svg className={"participants-chevron" + (open ? " open" : "")}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className="participants-row">
          {sorted.map((p) => {
            const meta = (() => { try { return JSON.parse(p.metadata || "{}"); } catch { return {}; } })();
            const isPresenter = meta.role === "presenter";
            const handRaised = raisedHands[p.identity];
            const displayName = p.name || p.identity;

            return (
              <div key={p.identity} className={"participant-card" + (handRaised ? " hand-raised" : "")}>
                <div className="participant-avatar" style={{ background: isPresenter ? "var(--ls-brand, #1a9e9e)" : undefined }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="participant-name" style={{ flex: 1 }}>
                  <span>{displayName}</span>
                  {isPresenter && (
                    <span style={{ fontSize: 9, marginLeft: 5, color: "var(--ls-brand, #1a9e9e)", fontWeight: 700, textTransform: "uppercase" }}>
                      Teacher
                    </span>
                  )}
                </div>
                {handRaised && (
                  <span
                    className="raised-hand-icon"
                    title={onLowerHand ? "Lower hand" : "Hand raised"}
                    style={{
                      cursor: onLowerHand ? "pointer" : "default",
                      fontSize: 16,
                      marginLeft: 6,
                    }}
                    onClick={() => onLowerHand && onLowerHand(p.identity)}
                  >✋</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
