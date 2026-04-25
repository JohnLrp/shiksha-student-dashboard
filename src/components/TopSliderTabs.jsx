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
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentTab = tabs[safeIndex];

  const goPrev = () => {
    const prevIndex = safeIndex === 0 ? tabs.length - 1 : safeIndex - 1;
    setActive(tabs[prevIndex].id);
  };

  const goNext = () => {
    const nextIndex = safeIndex === tabs.length - 1 ? 0 : safeIndex + 1;
    setActive(tabs[nextIndex].id);
  };

  return (
    <div className="topSingleSlider">
      <button className="singleArrow" onClick={goPrev}>
        <HiChevronLeft />
      </button>

      <div className="singleTitle">{currentTab.label}</div>

      <button className="singleArrow" onClick={goNext}>
        <HiChevronRight />
      </button>
    </div>
  );
}