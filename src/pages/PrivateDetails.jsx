import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { getPrivateDetails, getPublicProfile } from "../utils/profileStorage";
import "../styles/privateDetails.css";

export default function PrivateDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const _priv = getPrivateDetails();
  const _pub  = getPublicProfile();

  const [avatar, setAvatar] = useState(null);
  const [avatarType, setAvatarType] = useState(null);
  const [username, setUsername] = useState(_pub.name || "");
  const [languages, setLanguages] = useState(_pub.languages ?? ["English", "Mizo"]);

  // Basic Details
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

        // API-owned fields
        setAvatar(p.avatar);
        setAvatarType(p.avatar_type);
        setStudentId(p.student_id || "");
        setEmail(d.email || "");
        setUsername(pub.name || p.full_name || d.username || "");
        setLanguages(pub.languages ?? p.languages ?? ["English", "Mizo"]);

        // User-editable fields: localStorage wins, API as fallback if never saved
        setFirstName(priv.firstName  ?? d.first_name  ?? p.first_name  ?? "");
        setLastName (priv.lastName   ?? d.last_name   ?? p.last_name   ?? "");
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
        setGuardianPhone(priv.guardianPhone ?? p.guardian_phone ?? "");
        setParentEmail  (priv.parentEmail   ?? p.parent_email  ?? "");
        setBoard       (priv.board        ?? p.board         ?? "");
        setSchoolName  (priv.schoolName   ?? p.school_name   ?? "");
        setClassName   (priv.className    ?? p.class_name    ?? "");
        setAcademicYear(priv.academicYear ?? p.academic_year ?? "");
      })
      .catch((err) => console.error("Failed to load profile", err));
  }, []);

  const val = (v) => v || null;


  return (
    <div className="pd">
      <div className="pd__container">

        {/* ── Header ── */}
        <div className="pd__header">
          <div className="pd__headerLeft">
            <div className="pd__avatar">
              {avatar ? (
                avatarType === "emoji"
                  ? <span className="pd__avatarEmoji">{avatar}</span>
                  : <img src={avatar} alt={username} />
              ) : (
                <span className="pd__avatarFallback">{username?.[0] || "?"}</span>
              )}
            </div>
            <div className="pd__headerInfo">
              <h2 className="pd__username">{username}</h2>
              <div className="pd__badges">
                <span className="pd__badge pd__badge--online">
                  <span className="pd__badgeDot" />
                  Online
                </span>
                <span className="pd__badge pd__badge--lang">
                  {languages.join(" & ")}
                </span>
              </div>
            </div>
          </div>
          <div className="pd__headerActions">
            <button className="pd__btn" onClick={() => navigate("/profile")}>Back</button>
            <button className="pd__btn" onClick={() => navigate("/profile/private-details/edit")}>Edit Profile</button>
          </div>
        </div>

        <hr className="pd__divider" />

        {/* ── Basic Details ── */}
        <div className="pd__body">

          <section className="pd__section">
            <h3 className="pd__sectionTitle">Basic Details</h3>
            <div className="pd__grid">
              <Field label="Username" value={val(username)} />
              <Field label="Student ID" value={val(studentId)} />
              <Field label="First Name" value={val(firstName)} />
              <Field label="Last Name" value={val(lastName)} />
              <Field label="Email" value={val(email)} />
              <Field label="Phone Number" value={val(phone)} />
              <Field label="Date of Birth" value={val(dob)} />
              <Field label="Gender" value={val(gender)} />
            </div>
          </section>

          {/* ── Address ── */}
          <section className="pd__section">
            <h3 className="pd__sectionTitle">Address</h3>
            <div className="pd__grid">
              <Field label="State" value={val(state)} />
              <Field label="District" value={val(district)} />
              <Field label="City" value={val(city)} />
              <Field label="Pin Code" value={val(pinCode)} />
            </div>
          </section>

          {/* ── Parent Information ── */}
          <section className="pd__section">
            <h3 className="pd__sectionTitle">Parent Information</h3>
            <div className="pd__grid">
              <Field label="Father's Name" value={val(fatherName)} />
              <Field label="Father's Phone" value={val(fatherPhone)} />
              <Field label="Mother's Name" value={val(motherName)} />
              <Field label="Mother's Phone" value={val(motherPhone)} />
              <Field label="Guardian's Name" value={val(guardianName)} />
              <Field label="Guardian's Phone" value={val(guardianPhone)} />
              <Field label="Parent/Guardian Email" value={val(parentEmail)} fullWidth />
            </div>
          </section>

          {/* ── Academic Information ── */}
          <section className="pd__section">
            <h3 className="pd__sectionTitle">Academic Information</h3>
            <div className="pd__grid">
              <Field label="Board" value={val(board)} fullWidth />
              <Field label="School name" value={val(schoolName)} />
              <Field label="Class" value={val(className)} />
              <Field label="Academic Year" value={val(academicYear)} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function Field({ label, value, fullWidth = false }) {
  return (
    <div className={`pd__field${fullWidth ? " pd__field--full" : ""}`}>
      <span className="pd__fieldLabel">{label}</span>
      <span className={`pd__fieldValue${!value ? " pd__fieldValue--empty" : ""}`}>
        {value || "Not entered"}
      </span>
    </div>
  );
}
