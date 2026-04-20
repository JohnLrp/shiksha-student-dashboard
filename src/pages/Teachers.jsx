import { useEffect, useState } from "react";
import api from "../api/apiClient";
import "../styles/teachers.css";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/accounts/teachers/")
      .then((res) => setTeachers(res.data || []))
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load teachers"))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? teachers.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.subject || "").toLowerCase().includes(q) ||
          (t.qualification || "").toLowerCase().includes(q)
      )
    : teachers;

  if (loading) return <div className="teachers-loading">Loading teachers...</div>;
  if (error) return <div className="teachers-error">{error}</div>;

  return (
    <div className="teachers-page">
      <div className="teachers-header">
        <h1>Teachers</h1>
        <input
          className="teachers-search"
          type="text"
          placeholder="Search by name, subject, or qualification"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="teachers-empty">No teachers found.</div>
      ) : (
        <div className="teachers-grid">
          {filtered.map((t) => (
            <div key={t.id} className="teacher-card">
              <div className="teacher-card__avatar">
                {t.avatar ? (
                  typeof t.avatar === "string" && t.avatar.length <= 4 ? (
                    <span className="teacher-card__emoji">{t.avatar}</span>
                  ) : (
                    <img src={t.avatar} alt={t.name} />
                  )
                ) : (
                  <span className="teacher-card__fallback">
                    {t.name?.[0]?.toUpperCase() || "T"}
                  </span>
                )}
              </div>
              <div className="teacher-card__info">
                <h3 className="teacher-card__name">{t.name}</h3>
                {t.subject && <p className="teacher-card__subject">{t.subject}</p>}
                {t.qualification && (
                  <p className="teacher-card__qual">{t.qualification}</p>
                )}
                {t.rating != null && (
                  <p className="teacher-card__rating">★ {t.rating.toFixed(1)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
