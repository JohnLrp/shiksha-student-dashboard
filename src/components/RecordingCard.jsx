import "../styles/recordings.css";

export default function RecordingCard({ subject, sessionTitle, teacher, sessionDate, thumbnail, onClick }) {
  return (
    <div className="recordingCard" onClick={onClick}>

      <div className="recordingCard__thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={sessionTitle} className="recordingCard__thumbImg" />
        ) : (
          <div className="recordingCard__thumbPlaceholder">🎬</div>
        )}
      </div>

      <div className="recordingCard__top">
        <p className="recordingCard__subject">{subject}</p>
        <p className="recordingCard__session">{sessionTitle}</p>
      </div>

      <p className="recordingCard__teacher">{teacher}</p>

      <div className="recordingCard__bottom">
        <p className="recordingCard__date">{sessionDate}</p>
      </div>

    </div>
  );
}