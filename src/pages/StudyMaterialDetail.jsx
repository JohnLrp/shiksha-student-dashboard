import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/studyMaterialDetail.css";

export default function StudyMaterialDetail() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);

  useEffect(() => {
    api.get(`/materials/materials/${id}/`)
      .then((res) => setMaterial(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!material) return <p>Loading...</p>;

  return (
    <div className="smd-page">

      <button className="smd-back" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="smd-header">
        <h2>{material.subject_name || "Subject"}</h2>
      </div>

      <div className="smd-wrapper">

        {/* LEFT */}
        <div className="smd-left">

          <h3 className="smd-topic">{material.title}</h3>

          <p className="smd-chapter">
            {material.chapter_name || "Chapter"}
          </p>

          <div className="smd-note">
            <p className="smd-note-label">Note:</p>
            <div className="smd-note-box">
              {material.description || "No note provided"}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="smd-files-panel">

          <div className="smd-files-header">
            Files - {material.files?.length || 0}
          </div>

          {/* FLOATING COUNT BADGE */}
          <div className="smd-file-count">
            {material.files?.length || 0}
          </div>

          <div className="smd-files-list">

            {material.files?.map((file) => (
              <div key={file.id} className="smd-file-card">

                <div className="smd-file-info">
                  <div className="smd-file-icon">📄</div>

                  <div>
                    <p className="smd-file-name">{file.file_name}</p>
                    <span className="smd-file-size">20 MB</span>
                  </div>
                </div>

                <div className="smd-file-actions">
                  <button onClick={() => window.open(file.file_url)}>
                    View
                  </button>

                  <button onClick={() => window.open(file.file_url)}>
                    ⬇
                  </button>
                </div>

              </div>
            ))}

          </div>

        </div>

      </div>

    </div>
  );
}