console.log("=== MY NEW SIDEBAR ===");
import { NavLink, useLocation } from "react-router-dom";
import "../styles/sidebar.css";
import logo from "../assets/Vector.svg";

// icons
import { FiHome } from "react-icons/fi";
import { MdDashboardCustomize } from "react-icons/md";
import { BsBook } from "react-icons/bs";
import { BiVideo } from "react-icons/bi";
import { FaClipboardList, FaBookOpen } from "react-icons/fa";
import { RiLiveLine, RiLockLine } from "react-icons/ri";
import { AiOutlineFileDone, AiOutlineClose } from "react-icons/ai";

console.log("SIDEBAR LOADED - NEW VERSION");
export default function Sidebar({ setMenuOpen }) {
  const location = useLocation();

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

      </nav>
      <div className="sidebar__bottom">
        <a
          href="https://shikshacom.com"
          className="sidebar__homeBtn"
        >
          <FiHome />
          Return to Homepage
        </a>
      </div>
    </aside>
  );
}