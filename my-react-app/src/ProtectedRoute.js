import React, { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AuthContext from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { employee_id } = useParams(); // Get the dynamic route parameter

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if the user’s employee_id matches the route’s employee_id
  if (user.employee_id !== employee_id) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
