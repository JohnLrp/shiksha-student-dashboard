import api from "./apiClient";

/* ──────────────────────────────────────────────
   MOCK CONSTANTS
────────────────────────────────────────────── */
export const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Social Science",
];

export const TIME_SLOTS = [
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
];

export const DURATIONS = ["30 mins", "45 mins", "60 mins", "90 mins"];

export const MOCK_STUDENTS_DB = {
  STU101: "Rohit Kumar",
  STU102: "Priya Singh",
  STU103: "Aditi Sharma",
  STU104: "Sakshi Verma",
  STU105: "Ankit Yadav",
};

const MOCK_TEACHERS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Rahul Sir",
    subject: "Mathematics",
    sessions: 48,
    rating: 5,
    available: true,
    unavailableDays: 0,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Anita Ma’am",
    subject: "Science",
    sessions: 36,
    rating: 4,
    available: true,
    unavailableDays: 0,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Neha Ma’am",
    subject: "English",
    sessions: 29,
    rating: 4,
    available: false,
    unavailableDays: 2,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Arvind Sir",
    subject: "Social Science",
    sessions: 33,
    rating: 5,
    available: true,
    unavailableDays: 0,
  },
];

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
function pad(n) {
  return String(n).padStart(2, "0");
}

function to24HourTime(value) {
  if (!value) return "17:00:00";
  const parts = value.trim().split(" ");
  if (parts.length < 2) return "17:00:00";

  const [time, meridian] = parts;
  let [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "17:00:00";

  if (meridian.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridian.toUpperCase() === "AM" && hours === 12) hours = 0;

  return `${pad(hours)}:${pad(minutes)}:00`;
}

function parseDuration(value) {
  if (!value) return 60;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 60 : n;
}

function toIsoDate(value) {
  if (!value) {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }

  return `${new Date().getFullYear()}-04-04`;
}

function toBackendRequestPayload(data) {
  const student_ids = (data.students || []).filter((s) => s && s.trim());

  return {
    teacher_id: data.teacher?.id,
    subject: data.subject,
    scheduled_date: toIsoDate(data.date),
    scheduled_time: to24HourTime(data.timeSlot),
    duration_minutes: parseDuration(data.duration),
    session_type: (data.groupSize || 1) > 1 ? "group" : "one_on_one",
    group_strength: data.groupSize || 1,
    notes: data.note || "",
    student_ids,
  };
}

/* ──────────────────────────────────────────────
   STUDENT SESSION LISTS
────────────────────────────────────────────── */
export async function getSessions(tab = "scheduled") {
  const res = await api.get(`/private-sessions/student/?tab=${tab}`);
  return res.data;
}

/* ──────────────────────────────────────────────
   SESSION DETAIL
────────────────────────────────────────────── */
export async function getSessionDetail(sessionId) {
  const res = await api.get(`/private-sessions/${sessionId}/`);
  return res.data;
}

/* ──────────────────────────────────────────────
   REQUEST A NEW SESSION
────────────────────────────────────────────── */
export async function requestSession(data) {
  const payload = toBackendRequestPayload(data);
  const res = await api.post(`/private-sessions/request/`, payload);
  return res.data;
}

/* ──────────────────────────────────────────────
   STUDENT ACTIONS
────────────────────────────────────────────── */
export async function cancelSession(sessionId, reason = "") {
  const res = await api.post(`/private-sessions/${sessionId}/cancel/`, { reason });
  return res.data;
}

export async function confirmReschedule(sessionId) {
  const res = await api.post(`/private-sessions/${sessionId}/confirm-reschedule/`);
  return res.data;
}

export async function declineReschedule(sessionId, reason = "") {
  const res = await api.post(`/private-sessions/${sessionId}/decline-reschedule/`, {
    reason,
  });
  return res.data;
}

export async function leaveSession(sessionId) {
  const res = await api.post(`/private-sessions/${sessionId}/cancel/`, {
    reason: "Student left the session.",
  });
  return res.data;
}

/* ──────────────────────────────────────────────
   TEACHERS LIST
────────────────────────────────────────────── */
export async function getTeachers(subject = "") {
  try {
    const res = await api.get(`/accounts/teachers/`);
    const teachers = Array.isArray(res.data) ? res.data : [];

    const mapped = teachers.map((t, index) => ({
      id: t.id,
      name:
        t.name ||
        t.full_name ||
        t.teacher_name ||
        t.profile?.full_name ||
        t.email ||
        `Teacher ${index + 1}`,
      subject:
        t.subject ||
        t.subject_name ||
        t.teacher_profile?.subject_specialization ||
        "",
      sessions: t.sessions || t.private_sessions_count || 0,
      rating: Number(t.rating || t.teacher_profile?.rating || 4),
      available: t.available ?? true,
      unavailableDays: t.unavailableDays || 0,
    }));

    if (!subject) return mapped.length ? mapped : MOCK_TEACHERS;

    const filtered = mapped.filter((teacher) =>
      String(teacher.subject || "").toLowerCase().includes(subject.toLowerCase())
    );

    if (filtered.length) return filtered;
    if (mapped.length) return mapped;

    return MOCK_TEACHERS.filter(
      (teacher) => teacher.subject.toLowerCase() === subject.toLowerCase()
    );
  } catch (error) {
    console.warn("Teachers list endpoint failed, using mock teachers:", error);

    if (!subject) return MOCK_TEACHERS;

    return MOCK_TEACHERS.filter(
      (teacher) => teacher.subject.toLowerCase() === subject.toLowerCase()
    );
  }
}

export async function validateStudentId(studentId) {
  try {
    const res = await api.get(
      `/accounts/validate-student/?student_id=${encodeURIComponent(studentId)}`
    );
    return res.data;
  } catch {
    return { valid: false, name: MOCK_STUDENTS_DB[studentId] || null };
  }
}

/* ──────────────────────────────────────────────
   LIVEKIT
────────────────────────────────────────────── */
export async function getLiveKitToken(sessionId) {
  const res = await api.post(`/private-sessions/${sessionId}/join/`);
  return res.data;
}