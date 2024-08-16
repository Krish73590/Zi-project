import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Stack, 
  Text, 
  useToast,
  Grid, 
  GridItem 
} from '@chakra-ui/react';
import axios from 'axios';

const Register = () => {
  const [employee_id, setEmployee_id] = useState('');
  const [password, setPassword] = useState('');
  const [employee_name, setEmployee_name] = useState('');
  const [first_name, setFirst_name] = useState('');
  const [last_name, setLast_name] = useState('');
  const [email, setEmail] = useState('');
  const [date_of_birth, setDate_of_birth] = useState('');
  const [date_of_join, setDate_of_join] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [blood_group, setBlood_group] = useState('');
  const [mobile_no, setMobile_no] = useState('');
  const [role, setrole] = useState('user_a');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {

      // Register the new user with role 'user_a'
      await axios.post(`${process.env.REACT_APP_API_URL}/register/`, { 
        employee_id,
        employee_name,
        first_name,
        last_name,
        email,
        password,
        date_of_birth,
        date_of_join,
        designation,
        department,
        blood_group,
        mobile_no,
        role
      });

      toast({
        title: "Registration Successful",
        description: "You can now log in.",
        status: "success",
        duration: 2000,
        isClosable: true
      });

      // Navigate to login page
      navigate('/login');
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
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh" 
      bg="gray.50"
      p={4}
    >
      <Box 
        p={8} 
        borderWidth={1} 
        borderRadius="md" 
        boxShadow="lg" 
        bg="white"
        width="full" 
        maxWidth="800px"
      >
        <Stack spacing={6}>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            Register
          </Text>
          <form onSubmit={handleRegister}>
            <Stack spacing={4}>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl id="employee_name" isRequired>
                    <FormLabel>Employee Name</FormLabel>
                    <Input 
                      type="text" 
                      value={employee_name} 
                      onChange={(e) => setEmployee_name(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="employee_id" isRequired>
                    <FormLabel>Employee ID</FormLabel>
                    <Input 
                      type="text" 
                      value={employee_id} 
                      onChange={(e) => setEmployee_id(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl id="first_name" isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input 
                      type="text" 
                      value={first_name} 
                      onChange={(e) => setFirst_name(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="last_name" isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input 
                      type="text" 
                      value={last_name} 
                      onChange={(e) => setLast_name(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl id="email" isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="password" isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl id="date_of_birth" isRequired>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input 
                      type="date" 
                      value={date_of_birth} 
                      onChange={(e) => setDate_of_birth(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="date_of_join" isRequired>
                    <FormLabel>Date of Join</FormLabel>
                    <Input 
                      type="date" 
                      value={date_of_join} 
                      onChange={(e) => setDate_of_join(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl id="designation" isRequired>
                    <FormLabel>Designation</FormLabel>
                    <Input 
                      type="text" 
                      value={designation} 
                      onChange={(e) => setDesignation(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="department" isRequired>
                    <FormLabel>Department</FormLabel>
                    <Input 
                      type="text" 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl id="blood_group" isRequired>
                    <FormLabel>Blood Group</FormLabel>
                    <Input 
                      type="text" 
                      value={blood_group} 
                      onChange={(e) => setBlood_group(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl id="mobile_no" isRequired>
                    <FormLabel>Mobile No</FormLabel>
                    <Input 
                      type="text" 
                      value={mobile_no} 
                      onChange={(e) => setMobile_no(e.target.value)} 
                    />
                  </FormControl>
                </GridItem>
              </Grid>
              <Button 
                type="submit" 
                colorScheme="teal" 
                width="full"
                isLoading={loading}
              >
                Register
              </Button>
            </Stack>
          </form>
          <Button 
            variant="link" 
            colorScheme="blue" 
            onClick={() => navigate('/login')}
          >
            Already have an account? Login
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default Register;
