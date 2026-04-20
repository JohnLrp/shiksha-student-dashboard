import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { useCourse } from "../contexts/CourseContext";
import { useAuth } from "../contexts/AuthContext";
import "../styles/header.css";
import NotificationBell from "./NotificationBell";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100";

export default function Header({ toggleMenu, menuOpen }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";

  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  const { courses, activeCourse, selectCourse } = useCourse();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const renderAvatar = (size = "small") => {
    const isSmall = size === "small";

    if (user?.profile?.avatar_type === "emoji") {
      return (
        <span className={isSmall ? "header__avatarEmoji" : "header__profileEmoji"}>
          {user.profile.avatar}
        </span>
      );
    }

    if (user?.profile?.avatar_type === "image") {
      return (
        <img
          src={user.profile.avatar}
          alt="Profile"
          className={isSmall ? "header__avatarImg" : "header__profileImg"}
        />
      );
    }

    return (
      <img
        src={DEFAULT_AVATAR}
        alt="Profile"
        className={isSmall ? "header__avatarImg" : "header__profileImg"}
      />
    );
  };

  const rawName = user?.profile?.full_name || user?.email || "Student";
  const firstName = rawName.includes("@")
    ? rawName.split("@")[0]
    : rawName.trim().split(" ")[0];
  const displayName = `Hi, ${firstName}`;

  return (
    <header className="header">
      <div className="header__hamburger" onClick={toggleMenu}>
        {menuOpen ? <HiOutlineX size={26} /> : <HiOutlineMenu size={26} />}
      </div>

      {isDashboard && (
        <div className="header__left">
          <h3 className="header__title">Welcome Back</h3>
          <p className="header__subtitle">Let's learn something new today</p>
        </div>
      )}

      <div className="header__courseWrap" ref={dropdownRef}>
        <button
          className="header__btn"
          onClick={() => setOpen((prev) => !prev)}
        >
          {activeCourse?.title || "Select Course"}
          <span className={`header__chevron ${open ? "header__chevron--up" : ""}`}>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {open && (
          <div className="header__dropdown">
            {courses.map((course) => (
              <div
                key={course.id}
                className="header__dropdownItem"
                onClick={() => {
                  selectCourse(course.id);
                  setOpen(false);
                }}
              >
                {course.title}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header__right" ref={profileRef}>
        <NotificationBell />

        <div
          className="header__avatar"
          onClick={() => setProfileOpen((prev) => !prev)}
        >
          {renderAvatar("small")}
        </div>

        {profileOpen && (
          <div className="header__profileDropdown">
            <div className="header__profileHeader">
              <p className="header__profileName">{displayName}</p>
              <div className="header__profileImgWrap">
                {renderAvatar("large")}
              </div>
            </div>

            <div className="header__profileDivider" />

            <div className="header__profileMenu">
              <div
                className="header__profileItem"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
              >
                <span>Profile</span>
                <span className="header__profileArrow">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path
                      d="M1.5 1L6.5 6L1.5 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              <div
                className="header__profileItem"
                onClick={() => {
                  setProfileOpen(false);
                  window.location.href =
                    import.meta.env.VITE_HOME_URL || "https://shikshacom.com/";
                }}
              >
                <span>Return to Homepage</span>
                <span className="header__profileArrow">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path
                      d="M1.5 1L6.5 6L1.5 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              <div
                className="header__profileItem"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/change-password");
                }}
              >
                <span>Change Password</span>
                <span className="header__profileArrow">
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path
                      d="M1.5 1L6.5 6L1.5 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              <div
                className="header__profileItem header__profileLogout"
                onClick={handleLogout}
              >
                <span>Logout</span>
                <span className="header__logoutIcon">⊳</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}