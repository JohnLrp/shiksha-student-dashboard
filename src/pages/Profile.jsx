import { useState, useEffect } from "react";
import api from "../api/apiClient";
import "../styles/profile.css";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [avatarType, setAvatarType] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempAvatarType, setTempAvatarType] = useState(null);
  const [tempAvatarFile, setTempAvatarFile] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const [studentInfo, setStudentInfo] = useState(null);
  const [courses, setCourses] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ name: "", phone: "" });

  const emojis = [
    "😀", "😎", "🤓", "😊", "🥳", "😇", "🤩", "😍",
    "🦊", "🐱", "🐶", "🐼", "🦁", "🐯", "🐻", "🐨",
    "👨‍🎓", "👩‍🎓", "👨‍💻", "👩‍💻", "🧑‍🎨", "👨‍🔬", "👩‍🔬", "🧑‍🚀",
    "⭐", "🌟", "✨", "💫", "🔥", "💎", "🎯", "🎨",
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/accounts/me/");
      const data = res.data;

      setStudentInfo({
        name: data.profile.full_name,
        email: data.email,
        studentId: data.profile.student_id,
        phone: data.profile.phone,
      });

      setAvatar(data.profile.avatar);
      setAvatarType(data.profile.avatar_type);
      setCourses(data.enrollments || []);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditValues({ name: studentInfo.name, phone: studentInfo.phone });
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    try {
      const res = await api.patch("/accounts/me/", {
        username: editValues.name,
        profile: { full_name: editValues.name, phone: editValues.phone },
      });

      setStudentInfo({
        name: res.data.profile.full_name,
        email: res.data.email,
        studentId: res.data.profile.student_id,
        phone: res.data.profile.phone,
      });

      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed", err);
    }
  };

  const handleOpenPicker = () => {
    setTempAvatar(avatar);
    setTempAvatarType(avatarType);
    setShowPicker(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTempAvatarFile(file);
    setTempAvatar(URL.createObjectURL(file));
    setTempAvatarType("image");
  };

  const handleEmojiSelect = (emoji) => {
    setTempAvatar(emoji);
    setTempAvatarType("emoji");
  };

  const handleAvatarSave = async () => {
    try {
      if (tempAvatarType === "emoji") {
        await api.patch("/accounts/me/", {
          profile: { avatar_emoji: tempAvatar },
        });
      }

      if (tempAvatarType === "image" && tempAvatarFile) {
        const formData = new FormData();
        formData.append("avatar_image", tempAvatarFile);
        await api.patch("/accounts/me/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await fetchProfile();
      setShowPicker(false);
      setTempAvatar(null);
      setTempAvatarType(null);
      setTempAvatarFile(null);
    } catch (err) {
      console.error("Avatar update failed", err);
    }
  };

  const handlePickerCancel = () => {
    setShowPicker(false);
    setTempAvatar(null);
    setTempAvatarType(null);
    setTempAvatarFile(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="profilePage">
      <div className="profileCard">
        <div className="profileCard__content">

          {/* AVATAR */}
          <div className="profileCard__avatarWrap">
            <div className="profileCard__avatar" onClick={handleOpenPicker}>
              {avatar ? (
                <>
                  {avatarType === "emoji" ? (
                    <span className="profileCard__emoji">{avatar}</span>
                  ) : (
                    <img src={avatar} alt={studentInfo?.name} />
                  )}
                  <div className="profileCard__avatarOverlay">
                    <span className="profileCard__avatarEdit">Edit</span>
                  </div>
                </>
              ) : (
                <div className="profileCard__addImage">
                  <span className="profileCard__addIcon">+</span>
                  <span className="profileCard__addText">Add Image</span>
                </div>
              )}
            </div>

            {showPicker && (
              <div className="profileCard__picker">
                <div className="profileCard__pickerHeader">
                  <span>{avatar ? "Change Avatar" : "Choose Avatar"}</span>
                  <button className="profileCard__pickerClose" onClick={handlePickerCancel}>×</button>
                </div>

                <div className="profileCard__pickerPreview">
                  <div className="profileCard__previewCircle">
                    {tempAvatar ? (
                      tempAvatarType === "emoji" ? (
                        <span className="profileCard__previewEmoji">{tempAvatar}</span>
                      ) : (
                        <img src={tempAvatar} alt="Preview" className="profileCard__previewImg" />
                      )
                    ) : (
                      <span className="profileCard__previewPlaceholder">Preview</span>
                    )}
                  </div>
                </div>

                <div className="profileCard__pickerSection">
                  <p className="profileCard__pickerLabel">Upload Image</p>
                  <label className="profileCard__uploadBtn">
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    Choose File
                  </label>
                </div>

                <div className="profileCard__pickerSection">
                  <p className="profileCard__pickerLabel">Or Select Emoji</p>
                  <div className="profileCard__emojiGrid">
                    {emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        className={`profileCard__emojiBtn ${tempAvatar === emoji ? "profileCard__emojiBtn--selected" : ""}`}
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profileCard__pickerActions">
                  <button className="profileCard__cancelBtn" onClick={handlePickerCancel}>Cancel</button>
                  <button className="profileCard__saveBtn" onClick={handleAvatarSave} disabled={!tempAvatar}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="profileCard__info">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="profileCard__input profileCard__input--name"
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  placeholder="Name"
                />
                <div className="profileCard__detail">
                  <span className="profileCard__icon">✉</span>
                  <span>{studentInfo?.email}</span>
                </div>
                <div className="profileCard__detail">
                  <span className="profileCard__icon">◉</span>
                  <span>Student ID- {studentInfo?.studentId}</span>
                </div>
                <div className="profileCard__detail">
                  <span className="profileCard__icon">✆</span>
                  <input
                    type="tel"
                    className="profileCard__input"
                    value={editValues.phone}
                    onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                    placeholder="Phone"
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="profileCard__name">{studentInfo?.name}</h2>
                <div className="profileCard__detail">
                  <span className="profileCard__icon">✉</span>
                  <span>{studentInfo?.email}</span>
                </div>
                <div className="profileCard__detail">
                  <span className="profileCard__icon">◉</span>
                  <span>Student ID- {studentInfo?.studentId}</span>
                </div>
                <div className="profileCard__detail">
                  <span className="profileCard__icon">✆</span>
                  <span>{studentInfo?.phone}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="profileCard__editActions">
            <button className="profileCard__editCancelBtn" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="profileCard__editSaveBtn" onClick={handleEditSave}>Save</button>
          </div>
        ) : (
          <button className="profileCard__editBtn" onClick={handleEditClick}>EDIT</button>
        )}
      </div>

      {/* Courses Enrolled */}
      <div className="coursesSection">
        <div className="coursesSection__table">
          <div className="coursesSection__header">
            <span className="coursesSection__headerItem">COURSES ENROLLED</span>
            <span className="coursesSection__headerItem">BATCH CODE</span>
          </div>
          <div className="coursesSection__body">
            {courses.map((item) => (
              <div key={item.id} className="coursesSection__row">
                <span className="coursesSection__course">{item.course_title}</span>
                <span className="coursesSection__batch">{item.batch_code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
