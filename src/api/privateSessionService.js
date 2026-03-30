/**
 * FILE: student_dashboard/src/api/privateSessionService.js
 * DEPLOYMENT READY — real API calls only
 */

import api from "./apiClient";

const privateSession = {

  // ── Sessions by tab ──
  async getSessions(tab) {
    const res = await api.get("/sessions/student/", { params: { tab } });
    return res.data;
  },

  // ── Session detail ──
  async getSessionDetail(id) {
    const res = await api.get(`/sessions/${id}/`);
    return res.data;
  },

  // ── Request a session ──
  async requestSession(payload) {
    const res = await api.post("/sessions/request/", payload);
    return res.data;
  },

  // ── Cancel ──
  async cancelSession(sessionId, reason = "") {
    const res = await api.post(`/sessions/${sessionId}/cancel/`, { reason });
    return res.data;
  },

  // ── Reschedule responses ──
  async confirmReschedule(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/confirm-reschedule/`);
    return res.data;
  },

  async declineReschedule(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/decline-reschedule/`);
    return res.data;
  },

  // ── Leave session ──
  async leaveSession(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/end/`);
    return res.data;
  },

  // ── Teachers list (for request form) ──
  async getTeachers(subject) {
    const res = await api.get("/auth/teachers/", { params: { subject } });
    return res.data;
  },

  // ── Validate student ID (for group form) ──
  async validateStudentId(studentId) {
    const res = await api.get(`/auth/student/${studentId}/validate/`);
    return res.data;
  },

  // ── LiveKit token ──
  async getLiveKitToken(sessionId) {
    const res = await api.post("/livekit/token/", { session_id: sessionId });
    return res.data;
  },

  // ── Constants ──
  SUBJECTS: ["Mathematics", "Science", "Physics", "Chemistry", "English", "History", "Biology"],
  TIME_SLOTS: ["3:00 p.m - 5:00 p.m", "5:00 p.m - 7:00 p.m", "7:00 p.m - 9:00 p.m"],
  DURATIONS: ["30 minutes", "60 minutes", "90 minutes"],
};

export default privateSession;