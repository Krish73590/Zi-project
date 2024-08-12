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
  const [importloading, setimportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const toast = useToast();
  const [ImporttableType, setImportTableType] = useState('Company');
  const [logtableType, setlogTableType] = useState('Company');
  const [activities, setActivities] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout(); // Clear user data from context and local storage
    navigate('/'); // Redirect to login page
  };
  

  const contactImportHeaders  = [
    "ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations"
   ]; 
   
   const companyImportHeaders = [
     "ZoomInfo Company ID","Company Name","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Employees","Employee Range","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Defunct Company","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Company Is Acquired","Company ID (Ultimate Parent)","Entity Name (Ultimate Parent)","Company ID (Immediate Parent)","Entity Name (Immediate Parent)","Relationship (Immediate Parent)"
   ];

    const handleImportDownload = () => {
      let headers;
      if (ImporttableType === 'Contact') {
        headers = contactImportHeaders;
      } else if (ImporttableType === 'Company') {
        headers = companyImportHeaders;
      } 

      // const headers = ImporttableType === 'Contact' ? contactHeaders : companyHeaders;
      const csvRows = [];
      const headersRow = headers.join(',');
      csvRows.push(headersRow);
  
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      saveAs(blob, `${ImporttableType}_import_sample_headers.csv`);
      
      toast({
        title: 'Download Started',
        description: 'Sample headers CSV file is being downloaded.',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    };

  
  useEffect(() => {
    console.log(`Fetching data for tableType: ${logtableType}`);
    axios.get(`http://localhost:8000/user/last-activities/?table_type=${logtableType}`)
      .then(response => {
        console.log('Data fetched:', response.data);
        setActivities(response.data);
      })
      .catch(error => {
        console.error('Error fetching activities:', error);
      });
  }, [logtableType]);

  const handlelogExport = async (activity) => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/user/download-activity/`, {
        params: {
          employee_id: activity.employee_id,
          import_time: activity.import_time,
          table_type: logtableType // Adjust as needed
        }
      });

      // Convert response data to XLSX
      const data = response.data.results; // Data from API

      // Create a workbook and add a worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Create a blob and save it
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${activity.file_name.replace('.xlsx', '').replace('.csv', '')}_${activity.import_time}.xlsx`);

    } catch (error) {
      console.error('Error downloading the data:', error);
    }
  };

  const handleLogTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setlogTableType(tabValues[index]);
  };

  const handleImportTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setImportTableType(tabValues[index]);
  };



  const handleImportFileChange = (e) => setImportFile(e.target.files[0]);
  const handleImportSubmit = async () => {
    if (!importFile) {
      toast({
        title: 'Error',
        description: 'Please upload a file for import.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('files', importFile);
    formData.append('table_type', ImporttableType);

    setimportLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast({
        title: 'Success',
        description: response.data.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to import data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setimportLoading(false);
    }
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
            handleImportTabChange={handleImportTabChange}
            handleImportDownload={handleImportDownload}
            handleImportFileChange={handleImportFileChange}
            handleImportSubmit={handleImportSubmit}
            importloading={importloading}
            ImporttableType={ImporttableType}
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
