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

        if (
          data.submission_status === "SUBMITTED" ||
          data.status === "SUBMITTED"
        ) {
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

  const handleOpenFile = () => {
    const fileUrl =
      assignment?.submitted_file ||
      assignment?.file ||
      assignment?.submission_file;

    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

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

          {/* LEFT SIDE (UNCHANGED) */}
          {!isSubmitted && (
            <div className="assignmentDetailLeft">
              <div className="assignmentTitleRow">
                <h3 className="assignmentDetailTitle">Assignment</h3>
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

              {assignment.attachment && (
                <div className="fileStrip" onClick={handleOpenAttachment}>
                  <div className="fileStripIcon">📄</div>
                  <div className="fileStripName">
                    {assignment.attachment.split("/").pop()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RIGHT SIDE */}
          {!isSubmitted ? (
            <div className="assignmentDetailRight">
              <div className="yourWorkTop">
                <h4 className="assignmentDetailWorkTitle">Your Work</h4>
              </div>

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
            </div>
          ) : (
            /* ================= NEW COMPLETED UI ================= */
            <div className="completedGrid">

              {/* LEFT CARD */}
              <div className="completedCard">
                <p className="completedBadge">✓ Completed</p>

                <h3 className="completedTitle">{assignment.title}</h3>

                <p className="completedMeta">
                  {assignment.chapter || "Chapter"} — {assignment.subject || "Subject"}
                </p>

                <p className="completedDesc">
                  {assignment.description}
                </p>
              </div>

              {/* CENTER CARD */}
              <div className="completedCard completedCard--center">
                <h4 className="completedSectionTitle">Assignment Details</h4>

                <div className="completedDetailsGrid">
                  <div>
                    <span>Assigned on</span>
                    <p>
                      {new Date(
                        assignment.created_at || assignment.due_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <span>Due date</span>
                    <p>{new Date(assignment.due_date).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <span>Subject</span>
                    <p>{assignment.subject || "-"}</p>
                  </div>

                  <div>
                    <span>Teacher</span>
                    <p>{assignment.teacher || "-"}</p>
                  </div>
                </div>

                {assignment.attachment && (
                  <div
                    className="completedFileRow"
                    onClick={handleOpenAttachment}
                  >
                    <span className="fileIcon">📄</span>
                    <span className="fileName">
                      {assignment.attachment.split("/").pop()}
                    </span>
                    <button className="viewBtn">View</button>
                  </div>
                )}
              </div>

              {/* RIGHT CARD */}
              <div className="completedCard">
                <h4 className="completedSectionTitle">Your Submission</h4>

                <p className="submissionDate">
                  Submitted on {formatSmallDate(submittedAt)}
                </p>

                <p className="submissionStatus">On time</p>

                <button className="openFileBtn" onClick={handleOpenFile}>
                  View Submitted File
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}