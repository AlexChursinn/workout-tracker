import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwt');

  if (!token) {
    console.log('Токен отсутствует. Перенаправление на /login');
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;