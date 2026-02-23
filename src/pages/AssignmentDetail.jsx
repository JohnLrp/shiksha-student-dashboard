import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/assignmentDetail.css";

export default function AssignmentDetail() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===============================
     FETCH ASSIGNMENT
  =============================== */

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await fetch(
          `/api/assignments/${assignmentId}/`,
          {
            credentials: "include", // important for cookie auth
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load assignment");
        }

        const data = await res.json();
        setAssignment(data);

        if (data.submission_status === "SUBMITTED") {
          setIsSubmitted(true);
          setSubmittedAt(
            data.submitted_at ? new Date(data.submitted_at) : null
          );
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load assignment.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  /* ===============================
     FILE UPLOAD
  =============================== */

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  /* ===============================
     SUBMIT ASSIGNMENT
  =============================== */

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch(
        `/api/assignments/${assignment.id}/submit/`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Submission failed");
      }

      const now = new Date();
      setIsSubmitted(true);
      setSubmittedAt(now);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleOpenFile = () => {
    if (assignment?.submitted_file) {
      window.open(assignment.submitted_file, "_blank");
    }
  };

  /* ===============================
     DATE FORMATTERS
  =============================== */

  const formatSubmittedTop = (dateObj) => {
    if (!dateObj) return "";
    const d = dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const t = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Submitted: ${d} / ${t}`;
  };

  const formatSmallDate = (dateObj) => {
    if (!dateObj) return "";
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ===============================
     LOADING & ERROR STATES
  =============================== */

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!assignment) return <div>Assignment not found.</div>;

  /* ===============================
     UI
  =============================== */

  return (
    <div className="assignmentDetailPage">
      <div className="assignmentTopBar">
        <button className="assignmentBack" onClick={() => navigate(-1)}>
          &lt; Back
        </button>
      </div>

      <div className="assignmentDetailBox">
        <div className="assignmentDetailHeader">
          <h2 className="assignmentDetailSubject">
            {assignment.title}
          </h2>
        </div>

        <div className="assignmentDetailContent">
          {/* LEFT */}
          <div className="assignmentDetailLeft">
            <div className="assignmentTitleRow">
              <h3 className="assignmentDetailTitle">
                Assignment
              </h3>

              {isSubmitted && (
                <p className="submittedTopText">
                  {formatSubmittedTop(submittedAt)}
                </p>
              )}
            </div>

            <p className="assignmentDetailDue">
              Due Date:{" "}
              {new Date(assignment.due_date).toLocaleDateString("en-GB")}
            </p>

            <div className="assignmentDetailDivider"></div>

            <p className="assignmentDetailLabel">
              Title: {assignment.title}
            </p>

            <p className="assignmentDetailDesc">
              Description: {assignment.description}
            </p>

            {assignment.attachment && (
              <div className="fileStrip">
                <div className="fileStripIcon">📄</div>
                <div className="fileStripName">
                  {assignment.attachment.split("/").pop()}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="assignmentDetailRight">
            <div className="yourWorkTop">
              <h4 className="assignmentDetailWorkTitle">
                Your Work
              </h4>

              {isSubmitted && (
                <span className="yourWorkDate">
                  {formatSmallDate(submittedAt)}
                </span>
              )}
            </div>

            {!isSubmitted ? (
              <>
                <label className="assignmentDetailUploadBtn">
                  <input type="file" hidden onChange={handleFileUpload} />
                  [Upload File]
                </label>

                <button
                  className="assignmentDetailSubmitBtn"
                  onClick={handleSubmit}
                  disabled={!uploadedFile}
                >
                  Submit
                </button>
              </>
            ) : (
              <>
                <button
                  className="openFileBtn"
                  onClick={handleOpenFile}
                >
                  [Open File]
                </button>

                <button className="submittedBtn" disabled>
                  Submitted
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}