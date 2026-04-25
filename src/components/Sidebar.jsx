console.log("=== MY NEW SIDEBAR ===");
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";
import logo from "../assets/Vector.svg";
import { useCourse } from "../contexts/CourseContext";

// icons
import { FiHome } from "react-icons/fi";
import { MdDashboardCustomize } from "react-icons/md";
import { BsBook } from "react-icons/bs";
import { BiVideo } from "react-icons/bi";
import { FaClipboardList, FaBookOpen, FaGraduationCap } from "react-icons/fa";
import { RiLiveLine, RiLockLine, RiGroupLine } from "react-icons/ri";
import { FaChalkboardTeacher } from "react-icons/fa";
import { AiOutlineFileDone, AiOutlineClose } from "react-icons/ai";
import { IoChevronDown } from "react-icons/io5";

console.log("SIDEBAR LOADED - NEW VERSION");
export default function Sidebar({ setMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { courses, activeCourse, selectCourse } = useCourse();
  const [coursesOpen, setCoursesOpen] = useState(false);

  const isSubjectsActive =
    location.pathname.startsWith("/subjects") ||
    location.pathname.startsWith("/assignments") ||
    location.pathname.startsWith("/study-material");

  return (
    <aside className="sidebar">
      <div className="sidebar__top">

        {/* Brand */}
        <div className="sidebar__brand">
          <img src={logo} alt="Logo" className="sidebar__logoCircle" />
          <div>
            <h2 className="sidebar__title">ShikshaCom</h2>
            <p className="sidebar__tagline">
              Empowerment Through Education
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          className="sidebar__closeBtn"
          onClick={() => setMenuOpen(false)}
          type="button"
          aria-label="Close sidebar"
        >
          <AiOutlineClose />
        </button>
      </div>

      <nav className="sidebar__nav">

        {/* Dashboard */}
        <NavLink
          className="sidebar__link"
          to="/"
          end
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar__icon">
            <MdDashboardCustomize />
          </span>
          Dashboard
        </NavLink>

        {/* Subjects */}
        <NavLink
          className="sidebar__link"
          to="/subjects"
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar__icon">
            <BsBook />
          </span>
          Subjects
        </NavLink>

        {isSubjectsActive && (
          <div className="sidebar__subMenu">

            {/* Assignments */}
            <NavLink
              className="sidebar__subLink"
              to="/assignments"
              onClick={() => setMenuOpen(false)}
            >
              <FaClipboardList /> <span>Assignments</span>
            </NavLink>

            {/* Quiz */}
            <NavLink
              className="sidebar__subLink"
              to="/subjects/quiz"
              onClick={() => setMenuOpen(false)}
            >
              <AiOutlineFileDone /> <span>Quiz</span>
            </NavLink>

            {/* Recordings */}
            <NavLink
              className="sidebar__subLink"
              to="/subjects/recordings"
              onClick={() => setMenuOpen(false)}
            >
              <BiVideo /> <span>Recordings</span>
            </NavLink>

            {/* Study Material */}
            <NavLink
              className="sidebar__subLink"
              to="/study-material"
              onClick={() => setMenuOpen(false)}
            >
              <FaBookOpen /> <span>Study Material</span>
            </NavLink>

          </div>
        )}

        {/* My Courses */}
        {courses && courses.length > 0 && (
          <>
            <button
              type="button"
              className="sidebar__link sidebar__courseToggle"
              onClick={() => setCoursesOpen((v) => !v)}
              aria-expanded={coursesOpen}
            >
              <span className="sidebar__icon">
                <FaGraduationCap />
              </span>
              <span className="sidebar__courseLabel">My Courses</span>
              <IoChevronDown
                className={`sidebar__chev ${coursesOpen ? "sidebar__chev--open" : ""}`}
              />
            </button>

            {coursesOpen && (
              <div className="sidebar__subMenu">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`sidebar__subLink sidebar__courseItem ${
                      activeCourse?.id === c.id ? "active" : ""
                    }`}
                    onClick={() => {
                      selectCourse(c.id);
                      navigate(`/my-courses/${c.id}`);
                      setMenuOpen(false);
                    }}
                  >
                    <BsBook />
                    <span>{c.title}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Live sessions */}
        <NavLink
          className="sidebar__link"
          to="/live-sessions"
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar__icon">
            <RiLiveLine />
          </span>
          Live Sessions
        </NavLink>

        {/* Private Sessions */}
        <NavLink
          className="sidebar__link"
          to="/private-sessions"
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar__icon">
            <RiLockLine />
          </span>
          Private Sessions
        </NavLink>

        {/* Study Groups */}
        <NavLink
          className="sidebar__link"
          to="/study-groups"
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar__icon">
            <RiGroupLine />
          </span>
          Study Groups
        </NavLink>

        {/* Teachers */}
        <NavLink
          className="sidebar__link"
          to="/teachers"
          onClick={() => setMenuOpen(false)}
        >
          <span className="sidebar__icon">
            <FaChalkboardTeacher />
          </span>
          Teachers
        </NavLink>

      </nav>
      <div className="sidebar__bottom">
        <a
          href={import.meta.env.VITE_HOME_URL || "https://shikshacom.com"}
          className="sidebar__homeBtn"
        >
          <FiHome />
          Return to Homepage
        </a>
      </div>
    </aside>
  );
}