import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import "../styles/topSliderTabs.css";
export default function TopSliderTabs({ active, setActive }) {
  const tabs = [
    { id: "notify", label: "Notifications" },
    { id: "sessions", label: "Upcoming Classes" },
    { id: "assign", label: "Assignment" },
    { id: "quiz", label: "Quiz" },
    { id: "calendar", label: "Calendar" },
  ];

  const currentIndex = tabs.findIndex((t) => t.id === active);
  const currentTab = tabs[currentIndex];

  const goPrev = () => {
    if (currentIndex > 0) {
      setActive(tabs[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < tabs.length - 1) {
      setActive(tabs[currentIndex + 1].id);
    }
  };

  return (
    <div className="topSingleSlider">
      {/* LEFT ARROW */}
      <button
        className="singleArrow"
        onClick={goPrev}
        disabled={currentIndex === 0}
      >
        <HiChevronLeft />
      </button>

      {/* CENTER TITLE */}
      <div className="singleTitle">
        {currentTab.label}
      </div>

      {/* RIGHT ARROW */}
      <button
        className="singleArrow"
        onClick={goNext}
        disabled={currentIndex === tabs.length - 1}
      >
        <HiChevronRight />
      </button>
    </div>
  );
}
