import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CourseProvider } from "./contexts/CourseContext";

import StudentLayout from "./layout/StudentLayout";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";

import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";

import SubjectsAssignments from "./pages/SubjectsAssignments";
import AssignmentDetail from "./pages/AssignmentDetail";

import SubjectsQuiz from "./pages/SubjectsQuiz";
import QuizList from "./pages/QuizList";
import QuizDetail from "./pages/QuizDetail";
import QuizResult from "./pages/QuizResult";

import SubjectsRecordings from "./pages/SubjectsRecordings";
import RecordingsList from "./pages/RecordingsList";
import RecordingDetail from "./pages/RecordingDetail";

import SubjectsStudyMaterial from "./pages/SubjectsStudyMaterial";
import StudyMaterialList from "./pages/StudyMaterialList";

import LiveSessionDetail from "./pages/LiveSessionDetail";
import LiveSessions from "./pages/LiveSessions";

import Quiz from "./pages/Quiz";

export default function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StudentLayout />}>

              {/* Dashboard */}
              <Route index element={<Dashboard />} />

              {/* Profile */}
              <Route path="profile" element={<Profile />} />
              <Route path="change-password" element={<ChangePassword />} />

              {/* Subjects list */}
              <Route path="subjects" element={<Subjects />} />

              {/* ===== ASSIGNMENTS ===== */}
              {/* ===== ASSIGNMENTS ===== */}
<Route
  path="subjects/:subjectId/assignments"
  element={<SubjectsAssignments />}
/>

<Route
  path="subjects/:subjectId/assignments/:assignmentId"
  element={<AssignmentDetail />}
/>

              {/* ===== QUIZ ===== */}
              <Route path="subjects/quiz" element={<SubjectsQuiz />} />
              <Route
                path="subjects/quiz/:subjectId"
                element={<QuizList />}
              />
              <Route
                path="subjects/quiz/:subjectId/take/:quizId"
                element={<QuizDetail />}
              />
              <Route
                path="subjects/quiz/:subjectId/result/:quizId"
                element={<QuizResult />}
              />

              {/* ===== RECORDINGS ===== */}
              <Route
                path="subjects/recordings"
                element={<SubjectsRecordings />}
              />
              <Route
                path="subjects/recordings/:subjectId/video/:videoId"
                element={<RecordingDetail />}
              />
              <Route
                path="subjects/recordings/:subjectId"
                element={<RecordingsList />}
              />

              {/* ===== STUDY MATERIAL ===== */}
             <Route
  path="study-material"
  element={<SubjectsStudyMaterial />}
/>

<Route
  path="study-material/:subjectId"
  element={<StudyMaterialList />}
/>

              {/* ===== GENERIC SUBJECT ROUTE LAST ===== */}
              <Route
                path="subjects/:subjectId"
                element={<SubjectDetails />}
              />

              {/* ===== LIVE SESSIONS ===== */}
              <Route
                path="live-sessions"
                element={<LiveSessions />}
              />

              {/* 🔥 THIS IS THE IMPORTANT FIX */}
              <Route
                path="live/:id"
                element={<LiveSessionDetail />}
              />

              {/* Global Quiz */}
              <Route path="quiz" element={<Quiz />} />

            </Route>
          </Routes>
        </BrowserRouter>
      </CourseProvider>
    </AuthProvider>
  );
}