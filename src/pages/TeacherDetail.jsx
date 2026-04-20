import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/teachers.css";

export default function TeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/accounts/teachers/")
      .then((res) => {
        const t = (res.data || []).find((x) => String(x.id) === String(id));
        if (!t) setError("Teacher not found");
        else setTeacher(t);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load teacher"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="teachers-loading">Loading...</div>;
  if (error) return <div className="teachers-error">{error}</div>;
  if (!teacher) return null;

  return (
    <div className="teacher-detail-page">
      <button className="teacher-detail__back" onClick={() => navigate(-1)}>← Back</button>

      <div className="teacher-detail__card">
        <div className="teacher-detail__avatar">
          {teacher.avatar ? (
            typeof teacher.avatar === "string" && teacher.avatar.length <= 4 ? (
              <span className="teacher-detail__emoji">{teacher.avatar}</span>
            ) : (
              <img src={teacher.avatar} alt={teacher.name} />
            )
          ) : (
            <span className="teacher-detail__fallback">
              {teacher.name?.[0]?.toUpperCase() || "T"}
            </span>
          )}
        </div>
        <h1 className="teacher-detail__name">{teacher.name}</h1>
        {teacher.subject && <p className="teacher-detail__subject">{teacher.subject}</p>}
        {teacher.qualification && (
          <p className="teacher-detail__qual">{teacher.qualification}</p>
        )}
        {teacher.rating != null && (
          <p className="teacher-detail__rating">★ {teacher.rating.toFixed(1)}</p>
        )}
      </div>
    </div>
  );
}
