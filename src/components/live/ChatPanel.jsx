import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { useEffect, useRef, useState } from "react";

export default function ChatPanel({ role }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleData = (payload, participant) => {
      const text = new TextDecoder().decode(payload);

      try {
        const msg = JSON.parse(text);
        if (msg.type === "raise-hand") return; // don't show in chat
      } catch {}

      const displayName = participant?.name || participant?.identity || "Unknown";

      setMessages((prev) => [
        ...prev,
        { sender: displayName, text },
      ]);
    };

    room.on("dataReceived", handleData);
    return () => room.off("dataReceived", handleData);
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      const encoder = new TextEncoder();
      await localParticipant.publishData(encoder.encode(input), {
        reliable: true,
      });

      setMessages((prev) => [...prev, { sender: "You", text: input }]);
      setInput("");
    } catch (e) {
      console.error("❌ sendMessage failed", e);
      alert("Message send failed (permission/token issue)");
    }
  };

  const raiseHand = async () => {
    const message = {
      type: "raise-hand",
      sender: localParticipant?.identity || "unknown",
    };

    try {
      const encoder = new TextEncoder();
      await localParticipant.publishData(
        encoder.encode(JSON.stringify(message)),
        { reliable: true }
      );
      console.log("raise-hand sent", message);
    } catch (e) {
      console.error(" raise-hand failed", e);
      alert("Raise hand failed (permission/token issue)");
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">Chat</div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender === "You" ? "chat-bubble--me" : ""}`}>
            <span className="chat-name">{msg.sender}</span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {role === "student" && (
          <button className="raise-hand-btn" onClick={raiseHand} title="Raise hand">
            ✋
          </button>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button className="chat-send-btn" onClick={sendMessage} title="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
