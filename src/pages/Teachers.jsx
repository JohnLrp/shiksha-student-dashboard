import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/teachers.css";

export default function Teachers() {
  const navigate = useNavigate();
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

      <div className="teachers-container">
        {filtered.length === 0 ? (
          <div className="teachers-empty">No teachers found.</div>
        ) : (
          <div className="teachers-list">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                className="teacher-row"
                onClick={() => navigate(`/teachers/${t.id}`)}
              >
                <div className="teacher-row__avatar">
                  {t.avatar ? (
                    typeof t.avatar === "string" && t.avatar.length <= 4 ? (
                      <span className="teacher-row__emoji">{t.avatar}</span>
                    ) : (
                      <img src={t.avatar} alt={t.name} />
                    )
                  ) : (
                    <span className="teacher-row__fallback">
                      {t.name?.[0]?.toUpperCase() || "T"}
                    </span>
                  )}
                </div>
                <div className="teacher-row__info">
                  <div className="teacher-row__name">{t.name}</div>
                  <div className="teacher-row__meta">
                    {t.subject && <span>{t.subject}</span>}
                    {t.qualification && <span> • {t.qualification}</span>}
                  </div>
                </div>
                {t.rating != null && (
                  <div className="teacher-row__rating">★ {t.rating.toFixed(1)}</div>
                )}
                <span className="teacher-row__chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
