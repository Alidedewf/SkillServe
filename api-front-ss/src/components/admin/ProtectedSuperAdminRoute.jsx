import React from 'react';
import { Navigate } from 'react-router-dom';
import { isSuperAdminAuthenticated } from '../../services/adminApi';

/**
 * ProtectedSuperAdminRoute — охранник всех /superadmin/* маршрутов.
 * Проверяет наличие токена и роль === 'SUPER_ADMIN'.
 * Если не пройдено → редирект на /login (или /admin/login).
 */
const ProtectedSuperAdminRoute = ({ children }) => {
  if (!isSuperAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedSuperAdminRoute;
