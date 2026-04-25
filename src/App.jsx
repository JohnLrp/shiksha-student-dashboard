import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CourseProvider } from "./contexts/CourseContext";

import StudentLayout from "./layout/StudentLayout";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PrivateDetails from "./pages/PrivateDetails";
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
import StudyMaterialDetail from "./pages/StudyMaterialDetail";

import LiveSessionDetail from "./pages/LiveSessionDetail";
import LiveSessions from "./pages/LiveSessions";
import PrivateSessions from "./pages/PrivateSessions";
import PrivateSessionLive from "./pages/PrivateSessionLive";
import StudyGroups from "./pages/StudyGroups";
import StudyGroupLive from "./pages/StudyGroupLive";

import Quiz from "./pages/Quiz";
import Teachers from "./pages/Teachers";
import TeacherDetail from "./pages/TeacherDetail";
import MyCourseDetail from "./pages/MyCourseDetail";

function RequireStudentAuth({ children }) {
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <RequireStudentAuth>
                  <StudentLayout />
                </RequireStudentAuth>
              }
            >
              <Route index element={<Dashboard />} />

              <Route path="profile" element={<Profile />} />
              <Route path="private-details" element={<PrivateDetails />} />
              <Route path="change-password" element={<ChangePassword />} />

              <Route path="subjects" element={<Subjects />} />

              <Route
                path="subjects/:subjectId"
                element={<SubjectDetails />}
              />

              <Route
                path="assignments"
                element={<Subjects mode="assignments" />}
              />

              <Route
                path="subjects/:subjectId/assignments"
                element={<SubjectsAssignments />}
              />

              {/* ✅ DETAIL PAGE */}
              <Route
                path="study-material/view/:id"
                element={<StudyMaterialDetail />}
              />

              <Route
                path="subjects/:subjectId/assignments/:assignmentId"
                element={<AssignmentDetail />}
              />

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

              <Route
                path="subjects/recordings"
                element={<SubjectsRecordings />}
              />

              <Route
                path="subjects/recordings/:subjectId"
                element={<RecordingsList />}
              />

              <Route
                path="subjects/recordings/:subjectId/video/:videoId"
                element={<RecordingDetail />}
              />

              <Route
                path="study-material"
                element={<SubjectsStudyMaterial />}
              />

              {/* ✅ FIXED LIST ROUTE */}
              <Route
                path="study-material/list/:subjectId"
                element={<StudyMaterialList />}
              />

              <Route
                path="live-sessions"
                element={<LiveSessions />}
              />

              <Route
                path="live/:id"
                element={<LiveSessionDetail />}
              />

              <Route
                path="private-sessions"
                element={<PrivateSessions />}
              />

              <Route path="study-groups" element={<StudyGroups />} />

              <Route path="quiz" element={<Quiz />} />

              <Route path="teachers" element={<Teachers />} />
              <Route path="teachers/:id" element={<TeacherDetail />} />

              <Route path="my-courses/:courseId" element={<MyCourseDetail />} />
            </Route>

            <Route
              path="/private-session/live/:id"
              element={<PrivateSessionLive />}
            />

            <Route
              path="/study-group/live/:id"
              element={<StudyGroupLive />}
            />
          </Routes>
        </BrowserRouter>
      </CourseProvider>
    </AuthProvider>
  );
}