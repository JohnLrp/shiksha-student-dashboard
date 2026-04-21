import "../styles/recordings.css";

export default function RecordingCard({ sessionTitle, teacher, sessionDate, thumbnail, onClick }) {
  return (
    <div className="recordingCard" onClick={onClick}>

      <div className="recordingCard__thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={sessionTitle} className="recordingCard__thumbImg" />
        ) : (
          <div className="recordingCard__thumbPlaceholder">🎬</div>
        )}
        <div className="recordingCard__overlay">
          <p className="recordingCard__session">{sessionTitle}</p>
          <p className="recordingCard__teacher">{teacher}</p>
          <p className="recordingCard__date">{sessionDate}</p>
        </div>
      </div>

    </div>
  );
}