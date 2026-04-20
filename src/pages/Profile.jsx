import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
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
      const [meRes, spRes] = await Promise.all([
        api.get("/accounts/me/"),
        api.get("/accounts/student/profile/"),
      ]);
      const me = meRes.data;
      const sp = spRes.data;

      setStudentInfo({
        name: sp.name || me.profile.full_name,
        email: sp.email || me.email,
        studentId: sp.student_id || me.profile.student_id,
        phone: sp.phone || me.profile.phone,
        gender: sp.gender,
        dateOfBirth: sp.date_of_birth,
        state: sp.state,
        district: sp.district,
        city: sp.city_town,
        pinCode: sp.pin_code,
        currentClass: sp.current_class,
        stream: sp.stream,
        board: sp.board,
        schoolName: sp.school_name,
      });

      setAvatar(sp.photo || me.profile.avatar);
      setAvatarType(me.profile.avatar_type);
      setCourses(me.enrollments || []);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditValues({ name: studentInfo.name || "", phone: studentInfo.phone || "" });
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    try {
      await api.patch("/accounts/me/", {
        username: editValues.name,
        profile: { full_name: editValues.name, phone: editValues.phone },
      });
      await fetchProfile();
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

  if (loading) return <div className="profileLoading">Loading...</div>;

  const metaBits = [
    studentInfo?.currentClass && `Class ${studentInfo.currentClass}`,
    studentInfo?.stream,
    studentInfo?.board?.toUpperCase(),
  ].filter(Boolean);

  const locationBits = [studentInfo?.city, studentInfo?.district, studentInfo?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="profilePage">
      <div className="profileContainer">
        <div className="profileHeader">
          <div className="profileHeader__left">
            <div className="profileHeader__avatarWrap">
              <div className="profileHeader__avatar" onClick={handleOpenPicker} style={{ cursor: "pointer" }}>
                {avatar ? (
                  avatarType === "emoji" ? (
                    <span className="profileHeader__avatarEmoji">{avatar}</span>
                  ) : (
                    <img src={avatar} alt={studentInfo?.name} />
                  )
                ) : (
                  <span className="profileHeader__avatarFallback">
                    {studentInfo?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
                <div className="profileHeader__avatarOverlay">Edit</div>
              </div>

              {showPicker && (
                <div className="avatarPicker">
                  <div className="avatarPicker__header">
                    <span>{avatar ? "Change Avatar" : "Choose Avatar"}</span>
                    <button className="avatarPicker__close" onClick={handlePickerCancel}>×</button>
                  </div>

                  <div className="avatarPicker__preview">
                    <div className="avatarPicker__previewCircle">
                      {tempAvatar ? (
                        tempAvatarType === "emoji" ? (
                          <span className="avatarPicker__previewEmoji">{tempAvatar}</span>
                        ) : (
                          <img src={tempAvatar} alt="Preview" className="avatarPicker__previewImg" />
                        )
                      ) : (
                        <span className="avatarPicker__previewPlaceholder">Preview</span>
                      )}
                    </div>
                  </div>

                  <div className="avatarPicker__section">
                    <p className="avatarPicker__label">Upload Image</p>
                    <label className="avatarPicker__uploadBtn">
                      <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                      Choose File
                    </label>
                  </div>

                  <div className="avatarPicker__section">
                    <p className="avatarPicker__label">Or Select Emoji</p>
                    <div className="avatarPicker__emojiGrid">
                      {emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          className={`avatarPicker__emojiBtn ${tempAvatar === emoji ? "avatarPicker__emojiBtn--selected" : ""}`}
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="avatarPicker__actions">
                    <button className="avatarPicker__cancelBtn" onClick={handlePickerCancel}>Cancel</button>
                    <button className="avatarPicker__saveBtn" onClick={handleAvatarSave} disabled={!tempAvatar}>Save</button>
                  </div>
                </div>
              )}
            </div>

            <div className="profileHeader__info">
              <h2 className="profileHeader__name">{studentInfo?.name}</h2>
              {metaBits.length > 0 && (
                <div className="profileHeader__metaRow">
                  <span>• {metaBits.join(" • ")}</span>
                </div>
              )}
              {studentInfo?.schoolName && (
                <div className="profileHeader__metaRow">
                  <span>• {studentInfo.schoolName}</span>
                </div>
              )}
              {studentInfo?.studentId && (
                <div className="profileHeader__metaRow">
                  <span>• Student ID: {studentInfo.studentId}</span>
                </div>
              )}
              {studentInfo?.email && (
                <div className="profileHeader__metaRow">
                  <span>• {studentInfo.email}</span>
                </div>
              )}
              {studentInfo?.phone && (
                <div className="profileHeader__metaRow">
                  <span>• {studentInfo.phone}</span>
                </div>
              )}
              {locationBits && (
                <div className="profileHeader__metaRow">
                  <span>• {locationBits}{studentInfo?.pinCode ? ` - ${studentInfo.pinCode}` : ""}</span>
                </div>
              )}
              <div className="profileHeader__badges">
                <span className="profileBadge profileBadge--online">
                  <span className="profileBadge__dot" />
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="profileHeader__actions">
            <div className="profileHeader__editBtns">
              <button className="profileBtn profileBtn--outline" onClick={handleEditClick}>
                Edit
              </button>
            </div>
            <button
              className="profileBtn profileBtn--outline profileBtn--private"
              onClick={() => navigate("/private-details")}
            >
              Private Details
            </button>
          </div>
        </div>
      </div>

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

      {isEditing && (
        <div className="editModal__backdrop" onClick={() => setIsEditing(false)}>
          <div className="editModal" onClick={(e) => e.stopPropagation()}>
            <div className="editModal__header">
              <h3 className="editModal__title">Edit Profile</h3>
              <button className="editModal__close" onClick={() => setIsEditing(false)}>×</button>
            </div>
            <div className="editModal__body">
              <div className="editModal__field">
                <label className="editModal__label">Name</label>
                <input
                  type="text"
                  className="editModal__input"
                  value={editValues.name}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                />
              </div>
              <div className="editModal__field">
                <label className="editModal__label">Phone</label>
                <input
                  type="tel"
                  className="editModal__input"
                  value={editValues.phone}
                  onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="editModal__footer">
              <button className="editModal__cancelBtn" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="editModal__saveBtn" onClick={handleEditSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
