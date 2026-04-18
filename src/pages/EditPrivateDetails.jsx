import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiLock, FiCalendar, FiChevronDown } from "react-icons/fi";
import api from "../api/apiClient";
import { getPrivateDetails, savePrivateDetails, getPublicProfile } from "../utils/profileStorage";
import "../styles/editPrivateDetails.css";

export default function EditPrivateDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const _priv = getPrivateDetails();
  const _pub  = getPublicProfile();

  const [avatar, setAvatar] = useState(null);
  const [avatarType, setAvatarType] = useState(null);
  const [languages, setLanguages] = useState(_pub.languages ?? ["English", "Mizo"]);

  // Basic Details
  const [username, setUsername] = useState(_pub.name || "");
  const [studentId, setStudentId] = useState("");
  const [firstName, setFirstName] = useState(_priv.firstName ?? "");
  const [lastName, setLastName] = useState(_priv.lastName ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(_priv.phone ?? "");
  const [dob, setDob] = useState(_priv.dob ?? "");
  const [gender, setGender] = useState(_priv.gender ?? "");

  // Address
  const [state, setState] = useState(_priv.state ?? "");
  const [district, setDistrict] = useState(_priv.district ?? "");
  const [city, setCity] = useState(_priv.city ?? "");
  const [pinCode, setPinCode] = useState(_priv.pinCode ?? "");

  // Parent Information
  const [fatherName, setFatherName] = useState(_priv.fatherName ?? "");
  const [fatherPhone, setFatherPhone] = useState(_priv.fatherPhone ?? "");
  const [motherName, setMotherName] = useState(_priv.motherName ?? "");
  const [motherPhone, setMotherPhone] = useState(_priv.motherPhone ?? "");
  const [guardianName, setGuardianName] = useState(_priv.guardianName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(_priv.guardianPhone ?? "");
  const [parentEmail, setParentEmail] = useState(_priv.parentEmail ?? "");

  // Academic Information
  const [board, setBoard] = useState(_priv.board ?? "");
  const [schoolName, setSchoolName] = useState(_priv.schoolName ?? "");
  const [className, setClassName] = useState(_priv.className ?? "");
  const [academicYear, setAcademicYear] = useState(_priv.academicYear ?? "");

  useEffect(() => {
    const priv = getPrivateDetails();
    const pub  = getPublicProfile();
    api.get("/accounts/me/")
      .then((res) => {
        const d = res.data;
        const p = d.profile || {};
        setAvatar(p.avatar);
        setAvatarType(p.avatar_type);
        setUsername(pub.name || p.full_name || d.username || "");
        setStudentId(p.student_id || "");
        setFirstName(priv.firstName  ?? d.first_name  ?? p.first_name  ?? "");
        setLastName (priv.lastName   ?? d.last_name   ?? p.last_name   ?? "");
        setEmail    (d.email || "");
        setPhone    (priv.phone      ?? p.phone       ?? "");
        setDob      (priv.dob        ?? p.date_of_birth ?? "");
        setGender   (priv.gender     ?? p.gender      ?? "");
        setState    (priv.state      ?? p.state       ?? "");
        setDistrict (priv.district   ?? p.district    ?? "");
        setCity     (priv.city       ?? p.city        ?? "");
        setPinCode  (priv.pinCode    ?? p.pin_code    ?? "");
        setFatherName   (priv.fatherName    ?? p.father_name   ?? "");
        setFatherPhone  (priv.fatherPhone   ?? p.father_phone  ?? "");
        setMotherName   (priv.motherName    ?? p.mother_name   ?? "");
        setMotherPhone  (priv.motherPhone   ?? p.mother_phone  ?? "");
        setGuardianName (priv.guardianName  ?? p.guardian_name ?? "");
        setGuardianPhone(priv.guardianPhone ?? p.guardian_phone?? "");
        setParentEmail  (priv.parentEmail   ?? p.parent_email  ?? "");
        setBoard       (priv.board        ?? p.board        ?? "");
        setSchoolName  (priv.schoolName   ?? p.school_name  ?? "");
        setClassName   (priv.className    ?? p.class_name   ?? "");
        setAcademicYear(priv.academicYear ?? p.academic_year ?? "");
        setLanguages(pub.languages ?? p.languages ?? ["English", "Mizo"]);
      })
      .catch((err) => console.error("Failed to load profile", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    savePrivateDetails({
      firstName, lastName, phone, dob, gender,
      state, district, city, pinCode,
      fatherName, fatherPhone, motherName, motherPhone,
      guardianName, guardianPhone, parentEmail,
      board, schoolName, className, academicYear,
    });
    try {
      await api.patch("/accounts/me/", {
        first_name: firstName,
        last_name: lastName,
        profile: {
          phone,
          date_of_birth: dob,
          gender,
          state,
          district,
          city,
          pin_code: pinCode,
          father_name: fatherName,
          father_phone: fatherPhone,
          mother_name: motherName,
          mother_phone: motherPhone,
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          parent_email: parentEmail,
          board,
          school_name: schoolName,
          class_name: className,
          academic_year: academicYear,
        },
      });
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
      navigate("/profile/private-details");
    }
  };


  return (
    <div className="epd">
      <div className="epd__container">

        {/* ── Header ── */}
        <div className="epd__header">
          <div className="epd__headerLeft">
            <div className="epd__avatar">
              {avatar ? (
                avatarType === "emoji"
                  ? <span className="epd__avatarEmoji">{avatar}</span>
                  : <img src={avatar} alt={username} />
              ) : (
                <span className="epd__avatarFallback">{username?.[0] || "?"}</span>
              )}
            </div>
            <div className="epd__headerInfo">
              <h2 className="epd__username">{username}</h2>
              <div className="epd__badges">
                <span className="epd__badge epd__badge--online">
                  <span className="epd__badgeDot" />Online
                </span>
                <span className="epd__badge epd__badge--lang">
                  {languages.join(" & ")}
                </span>
              </div>
            </div>
          </div>
          <div className="epd__headerActions">
            <button className="epd__btn epd__btn--cancel" onClick={() => navigate("/profile/private-details")}>
              Cancel
            </button>
            <button className="epd__btn epd__btn--save" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <hr className="epd__divider" />

        <div className="epd__body">

          {/* ── Basic Details ── */}
          <section className="epd__section">
            <h3 className="epd__sectionTitle">Basic Details</h3>
            <div className="epd__grid">
              <TextField label="Username" value={username} onChange={setUsername} />
              <LockedField label="Student ID" value={studentId} />
              <TextField label="First Name" value={firstName} onChange={setFirstName} />
              <TextField label="Last Name" value={lastName} onChange={setLastName} />
              <LockedField label="Email" value={email} />
              <TextField label="Phone Number" value={phone} onChange={setPhone} />
              <DateField label="Date of Birth" value={dob} onChange={setDob} />
              <SelectField
                label="Gender"
                value={gender}
                onChange={setGender}
                options={["Male", "Female", "Other", "Prefer not to say"]}
              />
            </div>
          </section>

          {/* ── Address ── */}
          <section className="epd__section">
            <h3 className="epd__sectionTitle">Address</h3>
            <div className="epd__grid">
              <SelectField
                label="State"
                value={state}
                onChange={setState}
                options={[
                  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
                  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
                  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
                  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
                  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
                ]}
              />
              <SelectField
                label="District"
                value={district}
                onChange={setDistrict}
                options={["Aizawl", "Lunglei", "Champhai", "Kolasib", "Lawngtlai", "Mamit", "Serchhip", "Saitual"]}
              />
              <TextField label="City" value={city} onChange={setCity} />
              <TextField label="Pin Code" value={pinCode} onChange={setPinCode} />
            </div>
          </section>

          {/* ── Parent Information ── */}
          <section className="epd__section">
            <h3 className="epd__sectionTitle">Parent Information</h3>
            <div className="epd__grid">
              <TextField label="Father's Name" value={fatherName} onChange={setFatherName} />
              <TextField label="Father's Phone" value={fatherPhone} onChange={setFatherPhone} />
              <TextField label="Mother's Name" value={motherName} onChange={setMotherName} />
              <TextField label="Mother's Phone" value={motherPhone} onChange={setMotherPhone} />
              <TextField label="Guardian's Name" value={guardianName} onChange={setGuardianName} />
              <TextField label="Guardian's Phone" value={guardianPhone} onChange={setGuardianPhone} />
              <TextField label="Parent/Guardian Email" value={parentEmail} onChange={setParentEmail} fullWidth />
            </div>
          </section>

          {/* ── Academic Information ── */}
          <section className="epd__section">
            <h3 className="epd__sectionTitle">Academic Information</h3>
            <div className="epd__grid">
              <SelectField
                label="Board"
                value={board}
                onChange={setBoard}
                options={["CBSE","ICSE","MBSE (Mizoram Board of School Education)","State Board","IB","IGCSE"]}
                fullWidth
              />
              <TextField label="School name" value={schoolName} onChange={setSchoolName} />
              <SelectField
                label="Class"
                value={className}
                onChange={setClassName}
                options={["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"]}
              />
              <TextField label="Academic Year" value={academicYear} onChange={setAcademicYear} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

/* ── Reusable field components ── */

function TextField({ label, value, onChange, fullWidth = false }) {
  return (
    <div className={`epd__field${fullWidth ? " epd__field--full" : ""}`}>
      <span className="epd__fieldLabel">{label}</span>
      <div className="epd__fieldRow">
        <input
          className="epd__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        {value && (
          <button className="epd__fieldIcon epd__fieldIcon--clear" onClick={() => onChange("")}>
            <FiX size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function LockedField({ label, value }) {
  return (
    <div className="epd__field">
      <span className="epd__fieldLabel">{label}</span>
      <div className="epd__fieldRow">
        <span className="epd__inputLocked">{value || "—"}</span>
        <span className="epd__fieldIcon epd__fieldIcon--lock">
          <FiLock size={13} />
        </span>
      </div>
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div className="epd__field">
      <span className="epd__fieldLabel">{label}</span>
      <div className="epd__fieldRow">
        <input
          className="epd__input epd__input--date"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="epd__fieldIcon epd__fieldIcon--date">
          <FiCalendar size={13} />
        </span>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, fullWidth = false }) {
  return (
    <div className={`epd__field${fullWidth ? " epd__field--full" : ""}`}>
      <span className="epd__fieldLabel">{label}</span>
      <div className="epd__fieldRow epd__fieldRow--select">
        <select
          className="epd__select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select {label}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <span className="epd__fieldIcon epd__fieldIcon--chevron">
          <FiChevronDown size={14} />
        </span>
      </div>
    </div>
  );
}
