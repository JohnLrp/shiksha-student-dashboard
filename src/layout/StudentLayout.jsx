import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/studentLayout.css";

export default function StudentLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="studentLayout">

      {/* Overlay (Mobile only) */}
      {menuOpen && (
        <div
          className="mobileOverlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`studentLayout__sidebar ${
          menuOpen ? "showSidebar" : ""
        }`}
      >
        <Sidebar />
      </div>

      {/* Right Section */}
      <div className="studentLayout__right">
        <Header
          toggleMenu={() => setMenuOpen(!menuOpen)}
          menuOpen={menuOpen}
        />
        <div className="studentLayout__page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
