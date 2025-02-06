import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NotFound from "./pages/NotFound";
import SignUpForm from "./pages/signUp";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";  // Add this import
// import { useNavigate } from 'react-router-dom';

import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import SessionRequest from "./pages/SessionRequest";
import TeacherSessions from "./pages/TeacherSessions";
import ChatInterface from "./pages/learningPage";  // Add this import
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import TeacherStudents from "./pages/TeacherStudents";  // Add this import

// Placeholder components until they are implemented
const QuizManager = () => <div>Quiz Manager Page (Coming Soon)</div>;
// const ChatInterface = () => <div>Chat Interface Page (Coming Soon)</div>;
const Assignments = () => <div>Assignments Page (Coming Soon)</div>;
const LearningMaterials = () => <div>Learning Materials Page (Coming Soon)</div>;
const EditUser = () => <div>Edit User Page (Coming Soon)</div>;

function App() {
  return (
    <AuthProvider>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignUpForm />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Login />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/dashboard/student" element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher" element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/dashboard/student/:userId" element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/teacher/:userId" element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/admin/:userId" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/teacher-sessions" element={
              <ProtectedRoute>
                <TeacherSessions />
              </ProtectedRoute>
            } />
            <Route path="/teacher-students/:userId" element={
              <ProtectedRoute>
                <TeacherStudents />
              </ProtectedRoute>
            } />
            <Route path="/quiz-manager/:userId" element={
              <ProtectedRoute>
                <QuizManager />
              </ProtectedRoute>
            } />
            <Route path="/chatInterface/:userId" element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            } />
            <Route path="/assignments/:userId" element={
              <ProtectedRoute>
                <Assignments />
              </ProtectedRoute>
            } />
            <Route path="/learning-materials/:userId" element={
              <ProtectedRoute>
                <LearningMaterials />
              </ProtectedRoute>
            } />
            <Route path="/request-session/:userId" element={
              <ProtectedRoute>
                <SessionRequest />
              </ProtectedRoute>
            } />
            <Route path="/admin/edit-user/:adminId/:userId" element={
              <AdminRoute>
                <EditUser />
              </AdminRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </AuthProvider>
  );
}

export default App;
