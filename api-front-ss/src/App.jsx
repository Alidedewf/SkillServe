// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Импорт страниц
import LanguageSelection from './pages/user/LanguageSelection';
import Login from './pages/user/Login';
import ResetPassword from './pages/user/ResetPassword';
import VerifyCode from './pages/user/VerifyCode';
import Course from './pages/user/Course';   
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
import CourseLessonsPage from './pages/user/CourseLessonsPage';
import LessonPage from './pages/user/LessonPage';
import TestPage from './pages/user/TestPage';
import TestResultsPage from './pages/user/TestResultsPage';
// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminMenu from './pages/admin/AdminMenu';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import ProtectedSuperAdminRoute from './components/admin/ProtectedSuperAdminRoute';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import SuperAdminRestaurants from './pages/admin/SuperAdminRestaurants';
import MenuPage from './pages/user/MenuPage';
import NotFound from './pages/user/NotFound';

import ProtectedRoute from './components/user/ProtectedRoute';
import PublicRoute from './components/user/PublicRoute';

const App = () => {
  return (
      <Router>
        <AnimatePresence>
          <Routes>
            {/* Публичные маршруты (доступны только гостям) */}
            <Route path="/" element={<PublicRoute><LanguageSelection /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/verify-code" element={<PublicRoute><VerifyCode /></PublicRoute>} />

            {/* Приватные пользовательские маршруты (доступны только авторизованным) */}
            <Route path="/courses" element={<ProtectedRoute><Course /></ProtectedRoute>} />
            <Route path="/course/:id" element={<ProtectedRoute><CourseLessonsPage /></ProtectedRoute>} />
            <Route path="/course/:courseID/lessons/:lessonID" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
            <Route path="/course/:courseID/test/:testID" element={<ProtectedRoute><TestPage /></ProtectedRoute>} />
            <Route path="/course/:courseID/test/:testID/results" element={<ProtectedRoute><TestResultsPage /></ProtectedRoute>} />

            <Route path="/archived-courses" element={<ProtectedRoute><ArchivedCourses /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/rating" element={<ProtectedRoute><Rating /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />

            {/* Admin routes — доступ только при role: 'admin' в токене */}
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/courses" element={<ProtectedAdminRoute><AdminCourses /></ProtectedAdminRoute>} />
            <Route path="/admin/courses/:id" element={<ProtectedAdminRoute><AdminCourseEditor /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
            <Route path="/admin/achievements" element={<ProtectedAdminRoute><AdminAchievements /></ProtectedAdminRoute>} />
            <Route path="/admin/menu" element={<ProtectedAdminRoute><AdminMenu /></ProtectedAdminRoute>} />

            {/* SuperAdmin routes — доступ только для SUPER_ADMIN */}
            <Route path="/superadmin" element={<ProtectedSuperAdminRoute><SuperAdminDashboard /></ProtectedSuperAdminRoute>} />
            <Route path="/superadmin/restaurants" element={<ProtectedSuperAdminRoute><SuperAdminRestaurants /></ProtectedSuperAdminRoute>} />

            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Router>
  );
};

export default App;