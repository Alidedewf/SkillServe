import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../../services/adminApi';

/**
 * ProtectedAdminRoute — охранник всех /admin/* маршрутов.
 * Читает единый 'token' из localStorage и проверяет role === 'admin'.
 * Если нет / просрочен / не admin → редирект на /login.
 */
const ProtectedAdminRoute = ({ children }) => {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedAdminRoute;
