import {
  HiBell,
  HiVideoCamera,
  HiClipboardList,
  HiQuestionMarkCircle,
  HiCalendar
} from "react-icons/hi";
import "../styles/bottomNav.css";

export default function BottomNav({ active, setActive }) {
  return (
    <nav className="bottomNav">
      <button className={active === "notify" ? "active" : ""} onClick={() => setActive("notify")}>
        <HiBell />
        <span>Notify</span>
      </button>

      <button className={active === "sessions" ? "active" : ""} onClick={() => setActive("sessions")}>
        <HiVideoCamera />
        <span>Sessions</span>
      </button>

      <button className={active === "assign" ? "active" : ""} onClick={() => setActive("assign")}>
        <HiClipboardList />
        <span>Assign</span>
      </button>

      <button className={active === "quiz" ? "active" : ""} onClick={() => setActive("quiz")}>
        <HiQuestionMarkCircle />
        <span>Quiz</span>
      </button>

      <button className={active === "calendar" ? "active" : ""} onClick={() => setActive("calendar")}>
        <HiCalendar />
        <span>Calendar</span>
      </button>
    </nav>
  );
}
