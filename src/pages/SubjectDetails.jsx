import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/subjectDetails.css";

export default function SubjectDetails() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [subjectDetails, setSubjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeacherIndex, setActiveTeacherIndex] = useState(0);

  const touchStartX = useRef(null);

  useEffect(() => {
    // MOCK (replace with API)
    const mockSubjectDetails = {
      name: "Biology",
      teachers: [
        {
          id: 1,
          name: "Ms. Ruatfeli",
          display_role: "Teacher",
          qualification: "M.Sc",
          bio: "Specialist in Genetics and Molecular Biology.",
          rating: 4.6,
          photo:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        },
        {
          id: 2,
          name: "Mr. Lalrin",
          display_role: "Assistant",
          qualification: "B.Ed",
          bio: "Supports lab and practical sessions.",
          rating: 4.2,
          photo:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        },
      ],
      recordingsCount: 12,
      upcomingSessions: [],
      studyMaterialsCount: 8,
      assignments: { pending: 4, completed: 12, total: 16 },
      quizzes: { pending: 6, completed: 8, total: 14 },
    };

    setSubjectDetails(mockSubjectDetails);
    setLoading(false);
  }, [subjectId]);

  if (loading) return <div>Loading...</div>;
  if (!subjectDetails) return <div>No data found</div>;

  const teachers = subjectDetails.teachers || [];
  const activeTeacher = teachers[activeTeacherIndex];

  const nextTeacher = () => {
    setActiveTeacherIndex((prev) =>
      (prev + 1) % teachers.length
    );
  };

  const prevTeacher = () => {
    setActiveTeacherIndex((prev) =>
      prev === 0 ? teachers.length - 1 : prev - 1
    );
  };

  // Swipe logic
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) nextTeacher(); // swipe left
    if (diff < -50) prevTeacher(); // swipe right
  };

  return (
    <div className="subjectDetailsPage">
      <div className="subjectDetailsBox">
        <div className="subjectDetailsTop">
          <button className="backBtn" onClick={() => navigate(-1)}>
            &larr; Back
          </button>
        </div>

        <h1 className="subjectNameTitle">
          {subjectDetails.name}
        </h1>

        {/* ================= TEACHER CARD ================= */}
        <div
          className="teacherDetailsCard"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {teachers.length > 1 && (
            <button
              className="teacherArrow left"
              onClick={prevTeacher}
            >
              ◀
            </button>
          )}

          <div className="teacherLeft">
            <h3 className="teacherName">
              {activeTeacher?.name}
            </h3>

            <div className="teacherRoleBadge">
              {activeTeacher?.display_role}
            </div>

            <div className="teacherInfoGrid">
              <div className="teacherInfoRow">
                <span className="label">Qualification:</span>
                <span className="value">
                  {activeTeacher?.qualification}
                </span>
              </div>

              <div className="teacherInfoRow">
                <span className="label">Rating:</span>
                <span className="value">
                  {activeTeacher?.rating ?? "—"}
                </span>
              </div>

              <div className="teacherInfoRow">
                <span className="label">About:</span>
                <span className="value">
                  {activeTeacher?.bio}
                </span>
              </div>
            </div>
          </div>

          <div className="teacherRight">
            <img
              src={activeTeacher?.photo}
              alt={activeTeacher?.name}
              className="teacherPhoto"
            />
          </div>

          {teachers.length > 1 && (
            <button
              className="teacherArrow right"
              onClick={nextTeacher}
            >
              ▶
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {teachers.length > 1 && (
          <div className="teacherDots">
            {teachers.map((_, index) => (
              <span
                key={index}
                className={`dot ${
                  index === activeTeacherIndex
                    ? "activeDot"
                    : ""
                }`}
              />
            ))}
          </div>
        )}

        {/* ================= STATS SECTION ================= */}
        <div className="bottomGrid">
          <div className="assignQuizCard">
            <h2>Assignments</h2>
            <div className="metricsRow">
              <div>{subjectDetails.assignments.pending}</div>
              <div>{subjectDetails.assignments.completed}</div>
              <div>{subjectDetails.assignments.total}</div>
            </div>
          </div>

          <div className="assignQuizCard">
            <h2>Quiz</h2>
            <div className="metricsRow">
              <div>{subjectDetails.quizzes.pending}</div>
              <div>{subjectDetails.quizzes.completed}</div>
              <div>{subjectDetails.quizzes.total}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}