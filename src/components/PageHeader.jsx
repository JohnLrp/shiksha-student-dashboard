import "../styles/pageHeader.css";

export default function PageHeader({ title }) {
  return (
    <div className="pageHeader">
      <h2 className="pageHeaderTitle">{title}</h2>

      <div className="pageHeaderSearch">
        <input placeholder="Search..." />
        <span className="pageHeaderSearchIcon">🔍</span>
      </div>
    </div>
  );
}
