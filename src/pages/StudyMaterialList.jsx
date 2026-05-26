import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import "../styles/studyMaterial.css";
import api from "../api/apiClient";

export default function StudyMaterialList() {

  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [chaptersData, setChaptersData] = useState([]);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {

    if (!subjectId) return;

    api.get(`/materials/subjects/${subjectId}/materials/`)
      .then((res) => {

        const materials = res.data.map((item) => ({
          id: item.id,
          chapter: item.chapter_title || "No chapter",
          topic: item.title,
          date: new Date(item.created_at).toLocaleDateString(),
          dateRaw: new Date(item.created_at),
          filesCount: item.files?.length || 0,
          isNew: (Date.now() - new Date(item.created_at)) < 7 * 24 * 60 * 60 * 1000,
        }));

        setChaptersData(materials);

      })
      .catch((err) => {
        console.error("Failed to fetch study materials:", err);
      });

  }, [subjectId]);

  const handleView = (item) => {
    setLoadingId(item.id);
    setTimeout(() => {
      setLoadingId(null);
      navigate(`/study-material/view/${item.id}`);
    }, 300);
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => d * -1);
    } else {
      setSortCol(col);
      setSortDir(1);
    }
  };

  const handleRowClick = (id) => {
    setHighlightedRow(id);
    setTimeout(() => setHighlightedRow(null), 800);
  };

  const getSortArrow = (col) => {
    if (sortCol !== col) return "↕";
    return sortDir === 1 ? "↑" : "↓";
  };

  const sorted = (arr) => {
    if (!sortCol) return arr;
    return [...arr].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === "date") { va = a.dateRaw; vb = b.dateRaw; }
      if (sortCol === "filesCount") { va = Number(va); vb = Number(vb); }
      if (va < vb) return -sortDir;
      if (va > vb) return sortDir;
      return 0;
    });
  };

  const filteredChapters = sorted(chaptersData);

  return (
    <div className="studyMaterialPage">

      <button
        className="studyMaterialBack"
        onClick={() => navigate(-1)}
      >
        &lt; Back
      </button>

      <div className="studyMaterialHeaderBox">
        <PageHeader title="Study Material" />
      </div>

      <div className="studyMaterialBodyBox">
        <div className="studyMaterialContent">

          {/* Desktop Table */}
          <div className="studyMaterialTableWrap">
            <table className="studyMaterialTable">

              <thead>
                <tr>
                  {[
                    { label: "Chapter",     col: "chapter"    },
                    { label: "Topic",       col: "topic"      },
                    { label: "Upload Date", col: "date"       },
                    { label: "Files",       col: "filesCount" },
                  ].map(({ label, col }) => (
                    <th
                      key={col}
                      className={sortCol === col ? "sorted" : ""}
                      onClick={() => handleSort(col)}
                    >
                      {label}
                      <span className="sortArrow">{getSortArrow(col)}</span>
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredChapters.length === 0 ? (
                  <tr className="emptyRow">
                    <td colSpan={5}>
                      <div className="emptyState">
                        <div className="emptyIcon">📭</div>
                        <p>No materials found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredChapters.map((item, i) => (
                    <tr
                      key={item.id}
                      className={`studyMaterialRow ${highlightedRow === item.id ? "highlighted" : ""}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => handleRowClick(item.id)}
                    >
                      <td>
                        {item.chapter}
                        {item.isNew && <span className="newBadge">NEW</span>}
                      </td>
                      <td>{item.topic}</td>
                      <td>{item.date}</td>
                      <td className="filesBadgeCell">
                        <span className="filesBadge">{item.filesCount}</span>
                      </td>
                      <td className="studyMaterialActions">
                        <button
                          className={`studyMaterialViewBtn ${loadingId === item.id ? "loading" : ""}`}
                          onClick={(e) => { e.stopPropagation(); handleView(item); }}
                        >
                          {loadingId === item.id ? "Opening..." : "View"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

          {/* Mobile Cards */}
          <div className="studyMaterialMobile">

            <div className="studyMaterialMobileHeader">
              <span>Topic</span>
              <span>Date</span>
            </div>

            {filteredChapters.length === 0 ? (
              <div className="emptyState">
                <div className="emptyIcon">📭</div>
                <p>No materials match your search</p>
              </div>
            ) : (
              filteredChapters.map((item, i) => (
                <div
                  key={item.id}
                  className="studyMaterialCard"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="studyMaterialCardTop">
                    <p className="studyMaterialCardTitle">
                      {item.topic}
                      {item.isNew && <span className="newBadge">NEW</span>}
                    </p>
                    <p className="studyMaterialCardDate">{item.date}</p>
                  </div>

                  <div className="studyMaterialCardChapter">
                    {item.chapter}
                  </div>

                  <div className="studyMaterialCardActions">
                    <span className="filesBadgeMobile">{item.filesCount} file{item.filesCount !== 1 ? "s" : ""}</span>
                    <button
                      className={`viewBtn ${loadingId === item.id ? "loading" : ""}`}
                      onClick={() => handleView(item)}
                    >
                      {loadingId === item.id ? "Opening..." : "View"}
                    </button>
                  </div>

                </div>
              ))
            )}

          </div>

        </div>
      </div>

    </div>
  );
}