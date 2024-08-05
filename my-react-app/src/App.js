import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import FileUploadUserA from './FileUploadUserA';
import FileUploadUserB from './FileUploadUserB';
import { ChakraProvider, Box } from '@chakra-ui/react';
const App = () => {
  return (
    <ChakraProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload/user_a" element={<FileUploadUserA />} />
        <Route path="/upload/user_b" element={<FileUploadUserB />} />
      </Routes>
    </Router>
    </ChakraProvider>
  );
};

export default App;
