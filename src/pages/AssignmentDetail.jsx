import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
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

  useEffect(() => {
    if (!assignmentId) return;

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/assignments/${assignmentId}/`);
        const data = res.data;

        setAssignment(data);

        if (data.submission_status === "SUBMITTED") {
          setIsSubmitted(true);
          setSubmittedAt(
            data.submitted_at ? new Date(data.submitted_at) : null
          );
        } else {
          setIsSubmitted(false);
          setSubmittedAt(null);
        }
      } catch (err) {
        console.error("Assignment detail error:", err);
        setError(err.response?.data?.detail || "Unable to load assignment.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      await api.post(`/assignments/${assignment.id}/submit/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const res = await api.get(`/assignments/${assignmentId}/`);
      const updated = res.data;

      setAssignment(updated);
      setIsSubmitted(true);
      setSubmittedAt(
        updated.submitted_at ? new Date(updated.submitted_at) : new Date()
      );
      setUploadedFile(null);
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.response?.data?.detail || "Submission failed.");
    }
  };

  // ✅ FIX: open student submitted file
  const handleOpenFile = () => {
    if (assignment?.submitted_file) {
      window.open(assignment.submitted_file, "_blank");
    }
  };

  // ✅ FIX: open teacher attachment
  const handleOpenAttachment = () => {
    if (assignment?.attachment) {
      window.open(assignment.attachment, "_blank");
    }
  };

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!assignment) return <div>Assignment not found.</div>;

  return (
    <div className="assignmentDetailPage">
      <button className="assignmentDetailBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="assignmentDetailHeaderBox">
        <PageHeader title={assignment.subject || assignment.title} />
      </div>

      <div className="assignmentDetailBodyBox">
        <div className="assignmentDetailContent">

          {/* LEFT SIDE */}
          <div className="assignmentDetailLeft">
            <div className="assignmentTitleRow">
              <h3 className="assignmentDetailTitle">Assignment</h3>

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

            <div className="assignmentDetailDivider" />

            <p className="assignmentDetailLabel">
              Title: {assignment.title}
            </p>

            <p className="assignmentDetailDesc">
              Description: {assignment.description}
            </p>

            {/* ✅ FIX: clickable teacher file */}
            {assignment.attachment && (
              <div className="fileStrip" onClick={handleOpenAttachment}>
                <div className="fileStripIcon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M14 2H6C5.46 2 4 3.46 4 4V20C4 21.53 5.46 22 6 22H18C19.53 22 20 20.53 20 20V8L14 2Z"
                      stroke="#444"
                      strokeWidth="2"
                    />
                    <path d="M14 2V8H20" stroke="#444" strokeWidth="2" />
                  </svg>
                </div>

                <div className="fileStripName">
                  {assignment.attachment.split("/").pop()}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="assignmentDetailRight">
            <div className="yourWorkTop">
              <h4 className="assignmentDetailWorkTitle">Your Work</h4>

              {isSubmitted && (
                <span className="yourWorkDate">
                  {formatSmallDate(submittedAt)}
                </span>
              )}
            </div>

            {!isSubmitted ? (
              <>
                {/* ✅ FIX: show selected file name */}
                <label className="assignmentDetailUploadBtn">
                  <input type="file" hidden onChange={handleFileUpload} />
                  {uploadedFile ? uploadedFile.name : "[Upload File]"}
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
                <button className="openFileBtn" onClick={handleOpenFile}>
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