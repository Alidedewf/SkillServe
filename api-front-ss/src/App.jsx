// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Импорт страниц
import LanguageSelection from './pages/user/LanguageSelection';
import Login from './pages/user/Login';
import ResetPassword from './pages/user/ResetPassword';
import VerifyCode from './pages/user/VerifyCode';
import Course from './pages/user/Course';   // пример домашней страниц
import ArchivedCourses from './pages/user/ArchivedCourses';
import ChangePassword from './pages/user/ChangePassword';
import Home from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import Notifications from './pages/user/Notifications';
import Certificates from './pages/user/Certificates';
import Rating from './pages/user/Rating';
import Resources from './pages/user/Resources';
import EditProfile from './pages/user/EditProfile';
import FAQ from './pages/user/FAQ';
import TextLessonPage from './pages/user/TextLessonPage'; 
import CoursePage from './pages/user/CoursePage';
import CourseLessonsPage from './pages/user/CourseLessonsPage';
import LessonPage from './pages/user/LessonPage';
import TestPage from './pages/user/TestPage';
import TestResultsPage from './pages/user/TestResultsPage';
// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';


const App = () => {
  return (
      <Router>
        <AnimatePresence>
          <Routes>
            <Route path="/" element={<LanguageSelection />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-code" element={<VerifyCode />} />
            <Route path="/courses" element={<Course />} />
            <Route path="/course/:id" element={<CourseLessonsPage />} />
            <Route path="/course/:courseID/lessons/:lessonID" element={<LessonPage />} />
            <Route path="/course/:courseID/test/:testID" element={<TestPage />} />
            <Route path="/course/:courseID/test/:testID/results" element={<TestResultsPage />} />

            <Route path="/archived-courses" element={<ArchivedCourses />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/rating" element={<Rating />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/lesson/:type/:id" element={<CoursePage />} />
            <Route path="/course/:id/lessons" element={<CourseLessonsPage />} />;  
            <Route path="/lesson/text/:id" element={<TextLessonPage />} />

            {/* Admin routes — доступ только при role: 'admin' в токене */}
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/courses" element={<ProtectedAdminRoute><AdminCourses /></ProtectedAdminRoute>} />
            <Route path="/admin/courses/:id" element={<ProtectedAdminRoute><AdminCourseEditor /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
          </Routes>
        </AnimatePresence>
      </Router>
  );
};

export default App;