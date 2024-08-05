import React, { useState } from 'react';
import { Button, Input, VStack, useToast } from '@chakra-ui/react';
import axios from 'axios';

const Register = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user_a'); // Default to 'user_a'
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Check if user already exists
      const response = await axios.get(`/api/users/${employeeId}`);
      if (response.status === 200) {
        toast({
          title: "Registration Failed",
          description: "Employee ID already exists.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
        return;
      }

      // Register the new user
      await axios.post('/api/users', { employeeId, password, role });

      toast({
        title: "Registration Successful",
        description: "You can now log in.",
        status: "success",
        duration: 2000,
        isClosable: true
      });

      // Clear inputs or navigate to login page
      setEmployeeId('');
      setPassword('');
      setRole('user_a');
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while registering.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Input
        placeholder="Employee ID"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
      />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        placeholder="Role (user_a or user_b)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <Button
        colorScheme="teal"
        width="full"
        onClick={handleRegister}
        isLoading={loading}
      >
        Register
      </Button>
    </VStack>
  );
};

export default Register;
