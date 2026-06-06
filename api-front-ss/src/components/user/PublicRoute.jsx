import React from 'react';
import { Navigate } from 'react-router-dom';
import { decodeToken } from '../../services/adminApi';

/**
 * PublicRoute — запрещает доступ авторизованным пользователям к страницам входа/регистрации.
 * Если пользователь уже вошел в систему, перенаправляет на /home (или /admin для админов).
 */
const PublicRoute = ({ children }) => {
  const decoded = decodeToken();
  const isExpired = decoded && decoded.exp ? (decoded.exp * 1000 < Date.now()) : true;

  if (decoded && !isExpired) {
    const role = String(decoded.role).toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;
