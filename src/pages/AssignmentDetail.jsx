import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import PageHeader from "../components/PageHeader";
import CompletedAssignment from "../components/CompletedAssignment";
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

  const handleOpenAttachment = () => {
    if (assignment?.attachment) {
      window.open(assignment.attachment, "_blank");
    }
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
        {/* ✅ FIXED */}
        <PageHeader title={assignment.subject_name || assignment.title} />
      </div>

      <div className="assignmentDetailBodyBox">
        <div className="assignmentDetailContent">

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
            <CompletedAssignment
              assignment={{
                title: assignment.title,

                // ✅ FIXED MAPPING
                subject: assignment.subject_name || "",
                chapter: assignment.chapter_name || "",
                teacher: assignment.teacher_name || "",

                description: assignment.description,

                // ✅ FIXED DATE
                assignedOn: assignment.assigned_on
                  ? new Date(assignment.assigned_on).toLocaleDateString("en-GB")
                  : "",

                dueDate: assignment.due_date
                  ? new Date(assignment.due_date).toLocaleDateString("en-GB")
                  : "",

                teacherFile: assignment.attachment
                  ? {
                      name: assignment.attachment.split("/").pop(),
                      size: "—",
                      url: assignment.attachment,
                    }
                  : null,

                submittedOn: formatSmallDate(submittedAt),

                submissionStatus: "On time",

                // ✅ FIXED FILE (NO FALLBACKS)
                submittedFile: assignment.submitted_file
                  ? {
                      name: assignment.submitted_file.split("/").pop(),
                      size: "—",
                      type: assignment.submitted_file.split(".").pop().toUpperCase(),
                      url: assignment.submitted_file,
                    }
                  : null,
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}