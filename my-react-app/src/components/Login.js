import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, FormControl, FormLabel, Input, Stack, Text, useToast } from '@chakra-ui/react';
import AuthContext from '../AuthContext';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://192.168.1.125:8000/login/', {
        employee_id: employeeId,
        password: password,
      });
      const { user_type, employee_id } = response.data;
      login({ employeeId: employee_id, role: user_type });
      if (user_type === 'user_a') {
        navigate('/upload/user_a');
      } else if (user_type === 'user_b') {
        navigate('/upload/user_b');
      } else {
        setError('Unknown user type');
        toast({
          title: 'Error',
          description: 'Unknown user type',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError('Invalid credentials');
      toast({
        title: 'Error',
        description: 'Invalid credentials',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100vh" bg="gray.50">
      <Box p={6} borderWidth={1} borderRadius="md" boxShadow="lg" bg="white" width="100%" maxWidth="400px">
        <Stack spacing={4}>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            Login
          </Text>
          <form onSubmit={handleLogin}>
            <Stack spacing={4}>
              <FormControl id="employee_id" isRequired>
                <FormLabel>Employee ID</FormLabel>
                <Input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </FormControl>
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" width="full">
                Login
              </Button>
            </Stack>
          </form>
          {error && <Text color="red.500" textAlign="center">{error}</Text>}
          <Button 
            variant="link" 
            colorScheme="blue" 
            onClick={() => navigate('/register')}
          >
            Don't have an account? Register here
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Login;
