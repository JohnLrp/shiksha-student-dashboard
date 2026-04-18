import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { getPublicProfile, savePublicProfile } from "../utils/profileStorage";
import "../styles/editProfile.css";

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avatar, setAvatar] = useState(null);
  const [avatarType, setAvatarType] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempAvatarType, setTempAvatarType] = useState(null);
  const [tempAvatarFile, setTempAvatarFile] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const emojis = [
    "😀", "😎", "🤓", "😊", "🥳", "😇", "🤩", "😍",
    "🦊", "🐱", "🐶", "🐼", "🦁", "🐯", "🐻", "🐨",
    "👨‍🎓", "👩‍🎓", "👨‍💻", "👩‍💻", "🧑‍🎨", "👨‍🔬", "👩‍🔬", "🧑‍🚀",
    "⭐", "🌟", "✨", "💫", "🔥", "💎", "🎯", "🎨",
  ];

  // Initialise directly from localStorage so previously saved content
  // appears immediately — no async wait needed.
  const _stored = getPublicProfile();
  const [name, setName] = useState(_stored.name || "");
  const [className, setClassName] = useState("Class 12 - Science");
  const [board, setBoard] = useState("CBSE");
  const [studentId, setStudentId] = useState("");
  const [about, setAbout] = useState(_stored.about ?? "");
  const [subjects, setSubjects] = useState(_stored.subjects ?? []);
  const [hobbies, setHobbies] = useState(_stored.hobbies ?? []);
  const [languages, setLanguages] = useState(_stored.languages ?? []);

  const [newSubject, setNewSubject] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  useEffect(() => {
    // Only the API-owned fields (name, avatar, class, board, studentId)
    // need to come from the network. The editable sections are already
    // populated from localStorage above.
    api.get("/accounts/me/")
      .then((res) => {
        const d = res.data;
        const stored = getPublicProfile();
        setName(stored.name || d.profile.full_name || "");
        setClassName(d.profile.class_name || "Class 12 - Science");
        setBoard(d.profile.board || "CBSE");
        setStudentId(d.profile.student_id || "");
        setAvatar(d.profile.avatar);
        setAvatarType(d.profile.avatar_type);
      })
      .catch((err) => console.error("Failed to load profile", err))
      .finally(() => setLoading(false));
  }, []);

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
        await api.patch("/accounts/me/", { profile: { avatar_emoji: tempAvatar } });
        setAvatar(tempAvatar);
        setAvatarType("emoji");
      }
      if (tempAvatarType === "image" && tempAvatarFile) {
        const formData = new FormData();
        formData.append("avatar_image", tempAvatarFile);
        await api.patch("/accounts/me/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setAvatar(URL.createObjectURL(tempAvatarFile));
        setAvatarType("image");
      }
    } catch (err) {
      console.error("Avatar update failed", err);
    } finally {
      setShowPicker(false);
      setTempAvatar(null);
      setTempAvatarType(null);
      setTempAvatarFile(null);
    }
  };

  const handlePickerCancel = () => {
    setShowPicker(false);
    setTempAvatar(null);
    setTempAvatarType(null);
    setTempAvatarFile(null);
  };

  const handleSave = async () => {
    setSaving(true);
    // Save locally first — this is the source of truth for the profile view.
    // The API patch is best-effort; localStorage always gets written.
    savePublicProfile({ about, subjects, hobbies, languages, name });
    try {
      await api.patch("/accounts/me/", {
        username: name,
        profile: { full_name: name },
      });
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
      navigate("/profile");
    }
  };

  const addSubject = () => {
    if (newSubject.trim()) {
      setSubjects((p) => [...p, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      setHobbies((p) => [...p, newHobby.trim()]);
      setNewHobby("");
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setLanguages((p) => [...p, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  if (loading) return <div className="ep__loading">Loading...</div>;

  return (
    <div className="ep">
      <div className="ep__container">

        {/* ── Header ── */}
        <div className="ep__header">
          <div className="ep__headerLeft">

            {/* Avatar */}
            <div className="ep__avatarWrap">
              <div className="ep__avatar" onClick={handleOpenPicker}>
                {avatar ? (
                  <>
                    {avatarType === "emoji"
                      ? <span className="ep__avatarEmoji">{avatar}</span>
                      : <img src={avatar} alt={name} />}
                    <div className="ep__avatarOverlay"><span>Edit</span></div>
                  </>
                ) : (
                  <>
                    <span className="ep__avatarFallback">{name?.[0] || "?"}</span>
                    <div className="ep__avatarOverlay"><span>Add</span></div>
                  </>
                )}
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
                        tempAvatarType === "emoji"
                          ? <span className="avatarPicker__previewEmoji">{tempAvatar}</span>
                          : <img src={tempAvatar} alt="Preview" className="avatarPicker__previewImg" />
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

            {/* Name + meta */}
            <div className="ep__headerInfo">
              <div className="ep__nameRow">
                <input
                  className="ep__nameInput"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <button className="ep__nameClear" onClick={() => setName("")}>x</button>
              </div>
              <div className="ep__metaRow">
                <span>• {className}</span>
                <span>• {board}</span>
              </div>
              <div className="ep__metaRow">
                <span>• {studentId}</span>
              </div>
            </div>
          </div>

          {/* Cancel / Save */}
          <div className="ep__headerActions">
            <button className="ep__cancelBtn" onClick={() => navigate("/profile")}>Cancel</button>
            <button className="ep__saveBtn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <hr className="ep__divider" />

        {/* ── About ── */}
        <div className="ep__section">
          <h3 className="ep__sectionTitle">About</h3>
          <textarea
            className="ep__textarea"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell something about yourself..."
          />
        </div>

        <hr className="ep__divider" />

        {/* ── Interests ── */}
        <div className="ep__section">
          <h3 className="ep__sectionTitle">Interests</h3>
          <div className="ep__interestsGrid">

            {/* Subjects */}
            <div className="ep__interestsCol">
              <h4 className="ep__colTitle">Subjects</h4>
              {subjects.map((s, i) => (
                <div key={i} className="ep__item">
                  <span>• {s}</span>
                  <button
                    className="ep__removeBtn"
                    onClick={() => setSubjects(subjects.filter((_, idx) => idx !== i))}
                  >
                    x
                  </button>
                </div>
              ))}
              <div className="ep__addRow">
                <span className="ep__addBullet">•</span>
                <input
                  className="ep__addInput"
                  placeholder="Add Subject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubject()}
                />
                <button className="ep__addBtn" onClick={addSubject}>+ Add</button>
              </div>
            </div>

            {/* Hobbies */}
            <div className="ep__interestsCol">
              <h4 className="ep__colTitle">Hobbies</h4>
              {hobbies.map((h, i) => (
                <div key={i} className="ep__item">
                  <span>• {h}</span>
                  <button
                    className="ep__removeBtn"
                    onClick={() => setHobbies(hobbies.filter((_, idx) => idx !== i))}
                  >
                    x
                  </button>
                </div>
              ))}
              <div className="ep__addRow">
                <span className="ep__addBullet">•</span>
                <input
                  className="ep__addInput"
                  placeholder="Add Hobby"
                  value={newHobby}
                  onChange={(e) => setNewHobby(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHobby()}
                />
                <button className="ep__addBtn" onClick={addHobby}>+ Add</button>
              </div>
            </div>
          </div>
        </div>

        <hr className="ep__divider" />

        {/* ── Languages ── */}
        <div className="ep__section">
          <h3 className="ep__sectionTitle">Languages</h3>
          {languages.map((l, i) => (
            <div key={i} className="ep__item ep__item--narrow">
              <span>• {l}</span>
              <button
                className="ep__removeBtn"
                onClick={() => setLanguages(languages.filter((_, idx) => idx !== i))}
              >
                x
              </button>
            </div>
          ))}
          <div className="ep__addRow">
            <span className="ep__addBullet">•</span>
            <input
              className="ep__addInput"
              placeholder="Add Language"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLanguage()}
            />
            <button className="ep__addBtn" onClick={addLanguage}>+ Add</button>
          </div>
        </div>

        <hr className="ep__divider" />
      </div>
    </div>
  );
}
