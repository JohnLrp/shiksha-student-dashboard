import { useState } from "react";
import "../styles/pageHeader.css";

export default function PageHeader({ title, onSearch }) {
  const [term, setTerm] = useState("");

  const handleChange = (e) => {
    setTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleSubmit = () => {
    onSearch(term);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="pageHeader">
      <h2 className="pageHeaderTitle">{title}</h2>

      <div className="pageHeaderSearch">
        <input
          placeholder="Search..."
          value={term}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          className="pageHeaderSearchIcon"
          onClick={handleSubmit}
          aria-label="Search"
        >
          🔍
        </button>
      </div>
    </div>
  );
}
