// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Login from './components/Login';
import Register from './components/Register';
import FileUploadUserA from './FileUploadUserA';
import FileUploadUserB from './FileUploadUserB';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './AuthContext';

const App = () => {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/upload/user_a" 
              element={
                <ProtectedRoute requiredRole="user_a">
                  <FileUploadUserA />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/upload/user_b" 
              element={
                <ProtectedRoute requiredRole="user_b">
                  <FileUploadUserB />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;
