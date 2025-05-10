import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwt');

  if (!token) {
    console.log('Токен отсутствует. Перенаправление на /auth');
    return <Navigate to="/auth" />;
  }

  return children;
};

export default ProtectedRoute;