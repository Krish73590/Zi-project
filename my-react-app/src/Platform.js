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
  Flex,
  Text,
  Button,
  Tabs,
  TabList,
  Tab,
  Heading,
  Icon,
  TabIndicator 
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver'; 
import * as XLSX from 'xlsx';
import AuthContext from './AuthContext'; 
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaAddressBook } from 'react-icons/fa';

const Platform = () => {
  const toast = useToast();
  // const [TableType, setTableType] = useState('Company');
  const [activities, setActivities] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  // const [action, setAction] = useState('Export'); // Default action to 'Export'
  const [selectedTab, setSelectedTab] = useState({ action: 'Export', tableType: 'Contact' });

  // const [dataType, setDataType] = useState('Company'); // 'company' or 'contact'
  const handleLogout = () => {
    logout(); // Clear user data from context and local storage
    navigate('/'); // Redirect to login page
  };


  useEffect(() => {
    // console.log(`Fetching data for tableType: ${logtableType}`);
    axios.get(`${process.env.REACT_APP_API_URL}/user/last-activities/?table_type=${selectedTab.tableType}`)
      .then(response => {
        // console.log('Data fetched:', response.data);
        setActivities(response.data);
      })
      .catch(error => {
        console.error('Error fetching activities:', error);
      });
  }, [selectedTab.tableType]);

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

  // const handleTableTypeChange = (index) => {
  //   const tabValues = ['Company', 'Contact']; // Map the index to your tab values
  //   setTableType(tabValues[index]);
  // };



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

  const handleTabChange = (index) => {
    const tabOptions = [
      { action: 'Export', tableType: 'Contact' },
      { action: 'Export', tableType: 'Company' },
      { action: 'Import', tableType: 'Contact' },
      { action: 'Import', tableType: 'Company' },
    ];
    setSelectedTab(tabOptions[index]);
  };
  
 
  return (<>
    {/* <Header user={user} handleLogout={handleLogout} /> */}        
    
      <Box mt="90px">
          <Header user={user} handleLogout={handleLogout} />

      <Flex direction={{ base: 'column', md: 'row' }} justify="center" gap={10} align="center">
        
        {/* First set of Tabs: Export/Import */}
        <Box width={{ base: '100%', md: '100%' }}>
        <Tabs onChange={handleTabChange} defaultIndex={0} position='relative' variant='unstyled' align="center" isFitted>
          <TabList>
            <Tab fontSize="lg" fontWeight="bold"> 
              <Icon as={FaAddressBook} mr={2} /> Contact - Export 
            </Tab>
            <Tab fontSize="lg" fontWeight="bold">
              <Icon as={FaBuilding} mr={2} /> Company - Export
            </Tab>
            <Tab fontSize="lg" fontWeight="bold">
              <Icon as={FaAddressBook} mr={2} /> Contact - Import
            </Tab>
            <Tab fontSize="lg" fontWeight="bold">
              <Icon as={FaBuilding} mr={2} /> Company - Import
            </Tab>
          </TabList>
          {/* <TabIndicator mt='-1.5px' height='5px' bg='blue.500' borderRadius='5px' /> */}
          <TabIndicator
      mt='-1.5px'
      height='5px'
      borderRadius='5px'
      bgGradient="linear(to-r, teal.400, blue.400, pink.400)" // Use your gradient here
      backgroundSize="200% 200%" // To make the gradient move
      animation={`${gradient} 4s ease infinite`} // Apply the existing animation
    />
          </Tabs>
        </Box>
      </Flex>
        <VStack spacing={6} p={4}  align="stretch">
          <VStack spacing={6} p={4}  align="center" w="50%" mx="auto">

          {selectedTab.action === 'Export' ? (
             <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
             {user?.role === 'user_a' ? (
               <ExportDataBoxUserA gradientBg={gradientBg} hoverBg={hoverBg} boxBg={boxBg} gradient={gradient} />
             ) : (
               <ExportDataBoxUserB
               gradientBg={gradientBg}
                 hoverBg={hoverBg}
                 gradient={gradient}
                 boxBg={boxBg}
                 TableType={selectedTab.tableType}
               />
             )}
           </Stack>
            
          ) : (
            <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
            <ImportDataBox gradientBg={gradientBg} hoverBg={hoverBg} boxBg={boxBg} gradient={gradient} TableType={selectedTab.tableType} />
          </Stack>
          )}
          </VStack>
      <Divider orientation={{ base: 'horizontal', md: 'vertical' }} />
        <LastActivities
        activities={activities}
        handleTabChange={handleTabChange}
        handlelogExport={handlelogExport}
        gradientBg={gradientBg}
        hoverBg={hoverBg}
      />
      </VStack> </Box></>
  );
};

export default Platform;
