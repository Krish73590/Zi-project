import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImportDataBox from './components/ImportDataBox';
import LastActivities from './components/LastActivities';
import ExportDataBoxUserA from './components/ExportDataBoxUserA'; 
import ExportDataBoxUserB from './components/ExportDataBoxUserB'; 
import {
  Box,
  Stack,
  useToast,
  VStack,
  Divider,
  useColorModeValue,
  keyframes,
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver'; 
import * as XLSX from 'xlsx';
import AuthContext from './AuthContext'; 
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
const Platform = () => {
  const toast = useToast();
  const [logtableType, setlogTableType] = useState('Company');
  const [activities, setActivities] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout(); // Clear user data from context and local storage
    navigate('/'); // Redirect to login page
  };
  

  useEffect(() => {
    // console.log(`Fetching data for tableType: ${logtableType}`);
    axios.get(`${process.env.REACT_APP_API_URL}/user/last-activities/?table_type=${logtableType}`)
      .then(response => {
        // console.log('Data fetched:', response.data);
        setActivities(response.data);
      })
      .catch(error => {
        console.error('Error fetching activities:', error);
      });
  }, [logtableType]);

  const handlelogExport = async (activity) => {
    try {
      // const processTimeStr = activity.process_time.toString();
      const response = await axios.get(`${process.env.REACT_APP_API_URL}${activity.download_link}`);
      // console.log(response)
      // Convert response data to XLSX
      const data = response.data; // Data from API
      // console.log(data)
      // Create a workbook and add a worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Create a blob and save it
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${activity.file_name.replace('.xlsx', '').replace('.csv', '')}_${activity.process_time.toString()}.xlsx`);

    } catch (error) {
      console.error('Error downloading the data:', error);
      // Display error to the user
      if (error.response) {
        toast({
          title: 'Download Error',
          description: error.response.data.error || 'Failed to download data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.request) {
        toast({
          title: 'Network Error',
          description: 'No response from the server. Please check your connection.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while downloading data.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleLogTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setlogTableType(tabValues[index]);
  };



  const boxBg = useColorModeValue("white", "gray.800");

  const gradientBg = useColorModeValue(
      "linear(to-r, teal.500, blue.500)",
      "linear(to-r, teal.300, blue.300)"
    );
  const hoverBg = useColorModeValue(
      "linear(to-r, teal.600, blue.600)",
      "linear(to-r, teal.400, blue.400)"
    );
  const gradient = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `;

  



  
 
  return (<>
    <Header user={user} handleLogout={handleLogout} />
    <Box mt="80px"> 
      <VStack spacing={6} p={4} align="stretch">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
        <ImportDataBox
            gradientBg={gradientBg}
            hoverBg={hoverBg}
            boxBg={boxBg}
            gradient={gradient}
          />
        <Divider orientation={{ base: 'horizontal', md: 'vertical' }} />
        {user?.role === 'user_a'?<ExportDataBoxUserA
        gradientBg={gradientBg}
        hoverBg={hoverBg}
        gradient={gradient}
        />: <ExportDataBoxUserB
        gradientBg="linear(to-r, teal.400, blue.400)"
        hoverBg="linear(to-r, teal.500, blue.500)"
        gradient="rotate(45deg, teal.500, blue.500)"
        boxBg="gray.50"
      />
      }
        
      </Stack>
        <LastActivities
        activities={activities}
        handleTabChange={handleLogTabChange}
        handlelogExport={handlelogExport}
        gradientBg={gradientBg}
        hoverBg={hoverBg}
      />
      </VStack> </Box></>
  );
};

export default Platform;
