import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import "../styles/studyMaterial.css";

export default function StudyMaterialList() {
  const navigate = useNavigate();
  const [chaptersData, setChaptersData] = useState([]);

  useEffect(() => {
    const mockChaptersData = [
      { id: 1, name: "Chapter 1", date: "21/01/26", fileUrl: "#" },
      { id: 2, name: "Chapter 2", date: "22/01/26", fileUrl: "#" },
      { id: 3, name: "Chapter 3", date: "23/01/26", fileUrl: "#" },
      { id: 4, name: "Chapter 4", date: "26/01/26", fileUrl: "#" },
      { id: 5, name: "Chapter 5", date: "26/01/26", fileUrl: "#" },
    ];
    setChaptersData(mockChaptersData);
  }, []);

  const handleView = (chapter) => {
    window.open(chapter.fileUrl, "_blank");
  };

  const handleDownload = (chapter) => {
    const link = document.createElement("a");
    link.href = chapter.fileUrl;
    link.download = `${chapter.name}.pdf`;
    link.click();
  };

  return (
    <div className="studyMaterialPage">
      <button className="studyMaterialBack" onClick={() => navigate(-1)}>
        &lt; Back
      </button>

      <div className="studyMaterialHeaderBox">
        <PageHeader title="Subject Name" />
      </div>

      <div className="studyMaterialBodyBox">
        <div className="studyMaterialContent">

          {/* Desktop Table */}
          <div className="studyMaterialTableWrap">
            <table className="studyMaterialTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {chaptersData.map((chapter) => (
                  <tr key={chapter.id}>
                    <td>{chapter.name}</td>
                    <td>{chapter.date}</td>
                    <td className="studyMaterialActions">
                      <button className="studyMaterialViewBtn" onClick={() => handleView(chapter)}>
                        View
                      </button>
                      <button className="studyMaterialDownloadBtn" onClick={() => handleDownload(chapter)}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="studyMaterialMobile">
            <div className="studyMaterialMobileHeader">
              <span>Title</span>
              <span>Uploaded On</span>
            </div>

            {chaptersData.map((chapter) => (
              <div key={chapter.id} className="studyMaterialCard">
                <div className="studyMaterialCardTop">
                  <p className="studyMaterialCardTitle">{chapter.name}</p>
                  <p className="studyMaterialCardDate">{chapter.date}</p>
                </div>
                <div className="studyMaterialCardActions">
                  <button className="viewBtn" onClick={() => handleView(chapter)}>View</button>
                  <button className="downloadBtn" onClick={() => handleDownload(chapter)}>Download</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
