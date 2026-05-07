import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import { BsChatDotsFill } from "react-icons/bs";

export default function ChatPanel({
  role,
  messages = [],
  participants = [],
  onSendMessage,
}) {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  const containerRef = useRef(null);

  /* ───────────────── AUTO SCROLL ───────────────── */
  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  /* ───────────────── SEND MESSAGE ───────────────── */
  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input.trim();

    setInput("");

    if (onSendMessage) {
      try {
        await onSendMessage(text);
      } catch (e) {
        console.error("sendMessage failed", e);
      }
    }
  };

  /* ───────────────── FORMAT TIME ───────────────── */
  const formatTime = (ts) => {
    if (!ts) return "";

    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-panel">

      {/* ───────────── TABS ───────────── */}
      <div className="chat-tabs">
        <button
          className={`chat-tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <BsChatDotsFill />
          Chat
        </button>

        <button
          className={`chat-tab ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          <HiUsers />
          Participants ({participants.length})
        </button>
      </div>

      {/* ───────────── CHAT VIEW ───────────── */}
      {activeTab === "chat" && (
        <>
          <div className="chat-messages" ref={containerRef}>

            {messages.length === 0 && (
              <div className="chat-empty">
                No messages yet.
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`chat-row ${msg.isMe ? "me" : "other"}`}
              >
                {!msg.isMe && (
                  <div className="chat-sender">
                    {msg.sender}
                  </div>
                )}

                <div
                  className={`chat-bubble ${
                    msg.isMe ? "me-bubble" : "other-bubble"
                  }`}
                >
                  <div className="chat-text">
                    {msg.text}
                  </div>

                  <div className="chat-time">
                    {formatTime(msg.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ───────────── INPUT ───────────── */}
          <div className="chat-input-area">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your message here"
              onKeyDown={(e) =>
                e.key === "Enter" && sendMessage()
              }
            />

            <button
              className="chat-send-btn"
              onClick={sendMessage}
            >
              <IoSend />
            </button>
          </div>
        </>
      )}

      {/* ───────────── PARTICIPANTS VIEW ───────────── */}
      {activeTab === "participants" && (
        <div className="participants-list">

          {participants.map((user, index) => (
            <div className="participant-card" key={index}>

              <div className="participant-avatar">
                {user.name?.charAt(0)}
              </div>

              <div className="participant-info">
                <div className="participant-name">
                  {user.name}
                </div>

                <div className="participant-role">
                  {user.role}
                </div>
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}