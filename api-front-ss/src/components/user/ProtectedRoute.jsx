import React from 'react';
import { Navigate } from 'react-router-dom';
import { decodeToken } from '../../services/adminApi';

/**
 * ProtectedRoute — защитник пользовательских маршрутов.
 * Проверяет наличие валидного и неистекшего токена.
 * Если токен отсутствует или истек, перенаправляет на /login.
 */
const ProtectedRoute = ({ children }) => {
  const decoded = decodeToken();
  const isExpired = decoded && decoded.exp ? (decoded.exp * 1000 < Date.now()) : true;

  if (!decoded || isExpired) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
