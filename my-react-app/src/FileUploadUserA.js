import React, { useState, useEffect } from 'react';
import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Box,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Spinner,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  RadioGroup,
  Radio,
  Divider,
  Wrap,
  WrapItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  CheckboxGroup,
  TabList,
  Tab,
  Tabs,
  Flex,useColorModeValue, Icon,keyframes
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver'; 
import * as XLSX from 'xlsx';
import { ImDownload3 } from "react-icons/im";

const FileUploadUserA = () => {
  // State for Export functionality
  const [file, setFile] = useState(null);
  const [Contactcolumns, setContactColumns] = useState([]);
  const [Companycolumns, setCompanyColumns] = useState([]);
  const [selectedOption, setSelectedOption] = useState(''); // 'Email' or 'Phone'
  const [matchContactDomain, setMatchContactDomain] = useState(false);
  const [matchCompanyDomain, setMatchCompanyDomain] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchCompanyName, setMatchCompanyName] = useState(false);
  const [matchZIContactID, setMatchZIContactID] = useState(false);
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importloading, setimportLoading] = useState(false);
  const [exportloading, setexportLoading] = useState(false);
  // State for Import functionality
  const [importFile, setImportFile] = useState(null);

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [ImporttableType, setImportTableType] = useState('Company');
  const [ExporttableType, setExportTableType] = useState('Company');
  const [logtableType, setlogTableType] = useState('Company');

  const [activities, setActivities] = useState([]);


  const contactImportHeaders  = [
    "ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations"
   ]; 
   
   const companyImportHeaders = [
     "ZoomInfo Company ID","Company Name","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Employees","Employee Range","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Defunct Company","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Company Is Acquired","Company ID (Ultimate Parent)","Entity Name (Ultimate Parent)","Company ID (Immediate Parent)","Entity Name (Immediate Parent)","Relationship (Immediate Parent)"
   ];

   const contactExportHeaders  = [
    "domain",	"first_name",	"last_name",	"linkedin_url",	"zi_contact_id"
  ]; 
   
   const companyExportHeaders = [
     "domain","company_name"
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

    const handleExportDownload = () => {
      let headers;
      
      if (ExporttableType === 'Contact') {
        headers = contactExportHeaders;
      } else if (ExporttableType === 'Company') {
        headers = companyExportHeaders;
      }

      // const headers = ImporttableType === 'Contact' ? contactHeaders : companyHeaders;
      const csvRows = [];
      const headersRow = headers.join(',');
      csvRows.push(headersRow);
  
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      saveAs(blob, `${ExporttableType}_export_sample_headers.csv`);
      
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

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleOptionChange = (value) => {
    setSelectedOption(value);
    if (value === 'Email') {
      setContactColumns(['ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Email Address']);
    } else if (value === 'Phone') {
      setContactColumns(['ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone']);


    }
  };



  useEffect(() => {
    const fetchCompanyColumns = async () => {
      try {
        // const response = await axios.get('http://localhost:8000/company-columns/');
        // // Ensure unique columns
        // const uniqueCompanyColumns = [...new Set(response.data.columns)];
        setCompanyColumns(['tbl_zoominfo_company_paid_id',	'ZoomInfo Company ID',	'Company Name',	'Website',	'Founded Year',	'Company HQ Phone']);
      } catch (error) {
        console.error('Error fetching columns:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch columns.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchCompanyColumns();
  }, [toast]);

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

  const handleTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setlogTableType(tabValues[index]);
  };

  const handleExportTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setExportTableType(tabValues[index]);
  };

  const handleImportTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setImportTableType(tabValues[index]);
  };


  useEffect(() => {
    if (ExporttableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [ ExporttableType]);

  useEffect(() => {
    if (selectAll) {
      setSelectedColumns(Companycolumns);
    }
  }, [selectAll, Companycolumns]);

  useEffect(() => {
    if (unselectAll) {
      setSelectedColumns([]);
    }
  }, [unselectAll]);

  useEffect(() => {
    if (selectedColumns.length === Companycolumns.length) {
      setSelectAll(false);
      setUnselectAll(false);
    } else if (selectedColumns.length === 0) {
      setSelectAll(false);
      setUnselectAll(true);
    } else {
      setSelectAll(false);
      setUnselectAll(false);
    }
  }, [selectedColumns, Companycolumns]);


  const handleExportSubmit = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please upload a file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

     const formData = new FormData();
    formData.append('file', file);
    formData.append('table_type', ExporttableType);
    if (ExporttableType === 'Company') {
      formData.append('selected_columns', selectedColumns.join(','));
    } else {
      formData.append('selected_columns', Contactcolumns.join(','));
    }
    formData.append('match_contact_domain', matchContactDomain);
    formData.append('match_company_domain', matchCompanyDomain);
    formData.append('match_linkedin_url', matchLinkedinUrl);
    formData.append('match_zi_contact_id', matchZIContactID);
    formData.append('match_company_name', matchCompanyName);

    setexportLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/upload/user_a', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const allResults = response.data.matches;
      setResults(allResults);
      setTotalPages(Math.ceil(allResults.length / 5));
      setCurrentPage(1);
      setDisplayedResults(allResults.slice(0, 5));
      onOpen();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setexportLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * 5;
    const endIndex = newPage * 5;
    setDisplayedResults(results.slice(startIndex, endIndex));
  };

  const handleExport = () => {
    const csvRows = [];
    const headers = Object.keys(results[0] || {}).join(',');
    csvRows.push(headers);

    results.forEach(result => {
      const row = Object.values(result).map(value => `"${value}"`).join(',');
      csvRows.push(row);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    saveAs(blob, 'results.csv');
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

  const handleRemoveColumn = (col) => {
    setSelectedColumns(selectedColumns.filter(column => column !== col));
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
    <Flex
  position="fixed"
  top={0}
  width="100%"
  alignItems="center"
  justifyContent="center"
  bg="gray.200"
  zIndex="1000" // Ensures it stays on top of other content
  >
  <Text fontSize="4xl" fontWeight="bold" textAlign="center">
    ZoomInfo Data Platform
  </Text>
  </Flex>
    <Box mt="80px"> 
      <VStack spacing={6} p={4} align="stretch">
        <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
        <Box flex={1} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" bg={boxBg} >
        <Text
          fontSize="4xl"
          fontWeight="bold"
          bgGradient="linear(to-r, teal.400, blue.400, pink.400)"
          bgClip="text"
          animation={`${gradient} 4s ease infinite`}
          backgroundSize="200% 200%"
          mb={8}
        >
          Import Data
        </Text>

        <Stack spacing={5}>
          <Tabs
            onChange={handleImportTabChange}
            defaultIndex={0}
            colorScheme="teal"
            variant="enclosed"
          >
            <TabList>
              <Tab
                _selected={{
                  bgGradient: gradientBg,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Company
              </Tab>
              <Tab
                _selected={{
                  bgGradient: gradientBg,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Contact
              </Tab>
            </TabList>
          </Tabs>

          <Button
            onClick={handleImportDownload}
            size="md" // Use "md" for a more standard size
            bgGradient={gradientBg}
            color="white"
            _hover={{ bgGradient: hoverBg }}
            _active={{ bgGradient: hoverBg }}
            borderRadius="full"
            boxShadow="md"
            rightIcon={<Icon as={ImDownload3} boxSize={5} />}
            px={6} // Set horizontal padding
            py={3} // Set vertical padding
            maxW="fit-content" // Constrain button width to its content
          >
            Download {ImporttableType} Headers
          </Button>

          <FormControl>
            <FormLabel
              fontWeight="bold"
              fontSize="lg"
              color="teal.600"
              mb={3} // Add some space below the label
            >
              Upload Excel/CSV File
            </FormLabel>
            <Box
              borderWidth={1}
              borderRadius="lg"
              borderColor="teal.300"
              padding={3}
              bg="gray.50"
              _hover={{ bg: "gray.100" }} // Slight color change on hover
            >
              <Input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleImportFileChange}
                padding={2}
                border="none"
                _focusVisible={{ outline: "none" }} // Remove default focus outline
              />
            </Box>
          </FormControl>

          <Button
            onClick={handleImportSubmit}
            size="md" // Use "md" for a more standard size
            bgGradient={gradientBg}
            isDisabled={importloading}
            rightIcon={importloading && <Spinner size="sm" />}
            color="white"
            _hover={{ bgGradient: hoverBg }}
            _active={{ bgGradient: hoverBg }}
            borderRadius="full"
            boxShadow="md"
            px={6} // Set horizontal padding
            py={3} // Set vertical padding
            maxW="300" // Constrain button width to its content
          >
            {importloading ? "Importing..." : `Import ${ImporttableType} Data`}
          </Button>
        </Stack>
      </Box>

        <Divider orientation={{ base: 'horizontal', md: 'vertical' }} />

        <Box flex={1} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" bg={boxBg} >
        <Text
              fontSize="4xl"
              fontWeight="bold"
              bgGradient="linear(to-r, teal.400, blue.400, pink.400)"
              bgClip="text"
              animation={`${gradient} 4s ease infinite`}
              backgroundSize="200% 200%"
              mb={8}
            >
              Export Data
            </Text>
          <Stack spacing={5}>
          <Tabs
            onChange={handleExportTabChange}
            defaultIndex={0}
            colorScheme="teal"
            variant="enclosed"
            >
          <TabList>
              <Tab
                _selected={{
                  bgGradient: gradientBg,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Company
              </Tab>
              <Tab
                _selected={{
                  bgGradient: gradientBg,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Contact
              </Tab>
            </TabList>
            </Tabs>
            <Button onClick={handleExportDownload}
            size="md" // Use "md" for a more standard size
            bgGradient={gradientBg}
            color="white"
            _hover={{ bgGradient: hoverBg }}
            _active={{ bgGradient: hoverBg }}
            borderRadius="full"
            boxShadow="md"
            rightIcon={<Icon as={ImDownload3} boxSize={5} />}
            px={6} // Set horizontal padding
            py={3} // Set vertical padding
            maxW="fit-content">
              Download {ExporttableType} Headers
            </Button>
            {/* <DownloadSampleHeadersButton /> */}
            <FormControl>
            <FormLabel
              fontWeight="bold"
              fontSize="lg"
              color="teal.600"
              mb={3} // Add some space below the label
            >
              Upload Excel/CSV File
            </FormLabel>
            <Box
              borderWidth={1}
              borderRadius="lg"
              borderColor="teal.300"
              padding={3}
              bg="gray.50"
              _hover={{ bg: "gray.100" }} // Slight color change on hover
            >
              <Input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                padding={2}
                border="none"
                _focusVisible={{ outline: "none" }} // Remove default focus outline
              />
            </Box>
          </FormControl> 

            {/* Conditional Rendering Based on Table Type */}
            {ExporttableType === 'Company' ? (
              <>
                <FormControl>
                  <Popover isOpen={isPopoverOpen} onOpen={() => setIsPopoverOpen(true)} onClose={() => setIsPopoverOpen(false)}>
                    <PopoverTrigger>
                      <Button
                      size="md" // Use "md" for a more standard size
                      bgGradient={gradientBg}
                      color="white"
                      _hover={{ bgGradient: hoverBg }}
                      _active={{ bgGradient: hoverBg }}
                      borderRadius="full"
                      boxShadow="md"
                      px={6} // Set horizontal padding
                      py={3} // Set vertical padding
                      maxW="fit-content">Select {ExporttableType} Columns</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverArrow />
                      <PopoverBody>
                        <CheckboxGroup
                          colorScheme="blue"
                          value={selectedColumns}
                          onChange={(values) => {
                            if (values.includes('selectAll')) {
                              setSelectAll(true);
                              setSelectedColumns(Companycolumns);
                            } else if (values.includes('unselectAll')) {
                              setUnselectAll(true);
                              setSelectedColumns([]);
                            } else {
                              setSelectAll(false);
                              setUnselectAll(false);
                              setSelectedColumns(values);
                            }
                          }}
                        >
                          <Stack spacing={2}>
                            <Checkbox
                              value="selectAll"
                              isChecked={selectAll}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  setSelectAll(true);
                                  setSelectedColumns(Companycolumns);
                                } else {
                                  setSelectAll(false);
                                  setSelectedColumns(prev => prev.filter(col => !Companycolumns.includes(col)));
                                }
                              }}
                            >
                              Select All
                            </Checkbox>
                            <Checkbox
                              value="unselectAll"
                              isChecked={unselectAll}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  setUnselectAll(true);
                                  setSelectedColumns([]);
                                } else {
                                  setUnselectAll(false);
                                  setSelectedColumns(prev => prev.filter(col => !Companycolumns.includes(col)));
                                }
                              }}
                            >
                              Unselect All
                            </Checkbox>
                            {Companycolumns.map((column) => (
                              <Checkbox
                                key={column}
                                value={column}
                                isChecked={selectedColumns.includes(column)}
                                onChange={(e) => {
                                  const columnName = e.target.value;
                                  if (e.target.checked) {
                                    setSelectedColumns(prevSelected => [...prevSelected, columnName]);
                                    setUnselectAll(false);
                                  } else {
                                    setSelectedColumns(prevSelected => prevSelected.filter(col => col !== columnName));
                                  }
                                }}
                              >
                                {column}
                              </Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <Box border="1px" borderColor="gray.200" p={4} borderRadius="md" maxHeight="10rem" overflowY="auto">
                  <Text fontWeight="bold">Currently Selected Columns:</Text>
                  <Wrap spacing={2} mt={2}>
                    {Array.from(new Set(selectedColumns)).length > 0 ? (
                      Array.from(new Set(selectedColumns)).map(col => (
                        <WrapItem key={col}>
                          <Tag size='md' borderRadius='full' variant='solid' colorScheme='green'>
                            <TagLabel>{col}</TagLabel>
                            <TagCloseButton onClick={() => handleRemoveColumn(col)} />
                          </Tag>
                        </WrapItem>
                      ))
                    ) : (
                      <Text>No columns selected</Text>
                    )}
                  </Wrap>
                </Box>
                <FormControl>
              <HStack spacing={4}>
                <Checkbox
                  isChecked={matchCompanyDomain}
                  onChange={() => setMatchCompanyDomain(!matchCompanyDomain)}
                >
                  Match Domain
                </Checkbox>
                <Checkbox
                  isChecked={matchCompanyName}
                  onChange={() => setMatchCompanyName(!matchCompanyName)}
                >
                  Match Company Name
                </Checkbox>
              </HStack>
            </FormControl>
              </>
            ) : (
              <>
                <FormControl>
                  <FormLabel fontWeight="bold">Select Option</FormLabel>
                  <RadioGroup onChange={handleOptionChange} value={selectedOption}>
                    <Stack spacing={4}>
                      <Radio value="Email">Email</Radio>
                      <Radio value="Phone">Phone</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
                <Box border="1px" borderColor="gray.200" p={4} borderRadius="md">
                  <Text fontWeight="bold">Currently Selected Columns:</Text>
                  <Wrap spacing={2} mt={2}>
                    {Contactcolumns.length > 0 ? (
                      Contactcolumns.map(col => (
                        <WrapItem key={col}>
                          <Tag size='md' borderRadius='full' variant='solid' bg='#36C2CE' color='white' _hover={{ bg: '#478CCF' }}>
                            <TagLabel>{col}</TagLabel>
                            <TagCloseButton onClick={() => handleRemoveColumn(col)} />
                          </Tag>
                        </WrapItem>
                      ))
                    ) : (
                      <Text>No columns selected</Text>
                    )}
                  </Wrap>
                </Box>
                <FormControl>
              <HStack spacing={4}>
                <Checkbox
                  isChecked={matchContactDomain}
                  onChange={() => setMatchContactDomain(!matchContactDomain)}
                >
                  Match Domain
                </Checkbox>
                <Checkbox
                  isChecked={matchLinkedinUrl}
                  onChange={() => setMatchLinkedinUrl(!matchLinkedinUrl)}
                >
                  Match LinkedIn URL
                </Checkbox>
                <Checkbox
                  isChecked={matchZIContactID}
                  onChange={() => setMatchZIContactID(!matchZIContactID)}
                >
                  Match ZoomInfo Contact ID
                </Checkbox>
              </HStack>
            </FormControl>
              </>
            )}
            
            
            <Button size="md" // Use "md" for a more standard size
                      bgGradient={gradientBg}
                      color="white"
                      _hover={{ bgGradient: hoverBg }}
                      _active={{ bgGradient: hoverBg }}
                      borderRadius="full"
                      boxShadow="md"
                      px={6} // Set horizontal padding
                      py={3} // Set vertical padding
                      maxW="225"
                      onClick={handleExportSubmit} isDisabled={exportloading}>
              {exportloading ? <Spinner size="sm" /> : `Export ${ExporttableType} Data`}
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Results Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl"  maxHeight = {1}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Matching Results</ModalHeader>
            <ModalCloseButton />
            <ModalBody maxHeight="65vh" overflowY="auto">
              {results.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {/* Table for Displaying Results */}
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          {Object.keys(results[0] || {}).map((key) => (
                            <Th key={key}>{key}</Th>
                          ))}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {displayedResults.map((result, index) => (
                          <Tr key={index}>
                            {Object.values(result).map((value, i) => (
                              <Td key={i}>{value}</Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
  
                  {/* Pagination Controls */}
                  <Stack spacing={4} direction="row" justify="center">
                  <Button
                      size = "sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      isDisabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm" alignSelf="center">Page {currentPage} of {totalPages}</Text>
                    <Button
                      size = "sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      isDisabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </Stack>
  
                  {/* Export Button */}
                  <Flex justifyContent="center">
                    <Button
                      size="md" // Use "md" for a more standard size
                      bgGradient={gradientBg}
                      color="white"
                      _hover={{ bgGradient: hoverBg }}
                      _active={{ bgGradient: hoverBg }}
                      borderRadius="full"
                      boxShadow="md"
                      px={6} // Set horizontal padding
                      py={3} // Set vertical padding
                      maxW="250" // Set maximum width
                      onClick={handleExport}
                    >
                      Export All Records
                    </Button>
                  </Flex>
                </VStack>
              ) : (
                <Text>No results to display.</Text>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
        <Box p={5} pl={10}>
        {/* <Heading mb={4}>Last Activities</Heading> */}
        <Text fontSize="4xl"
                fontWeight="bold"
                bgGradient="linear(to-r, teal.400, blue.400, pink.400)"
                bgClip="text"
                animation={`${gradient} 4s ease infinite`}
                backgroundSize="200% 200%"
                mb={8}>Last Activities</Text>
      <Tabs
            onChange={handleTabChange}
            defaultIndex={0}
            colorScheme="teal"
            variant="enclosed"
            >
          <TabList>
              <Tab
                _selected={{
                  bgGradient: gradientBg,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Company
              </Tab>
              <Tab
                _selected={{
                  bgGradient: gradientBg,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Contact
              </Tab>
            </TabList>
            </Tabs>
    <Box
      maxHeight="500px"
      maxWidth="1400px"
      overflowY="auto"
      overflowX="auto"
      mt={7}
      border="2px solid"
      borderColor="gray.300"
      rounded="lg"
    >
      <Table
        variant="striped"
        colorScheme="gray"
        minWidth="1000px"
      >
        <Thead position="sticky" top="0" bg="gray.100" zIndex="1">
        <Tr>
            <Th>Employee ID</Th>
            <Th>Import Time</Th>
            <Th>File Name</Th>
            <Th>Process Tag</Th>
            <Th>Counts</Th>
            <Th>Download</Th>
          </Tr>
        </Thead>
        <Tbody>
          {activities.map(activity => (
            <Tr key={activity.import_time}>
              <Td>{activity.employee_id}</Td>
              <Td>{activity.import_time}</Td>
              <Td>{activity.file_name}</Td>
              <Td>{activity.process_tag}</Td>
              <Td>{activity.cnt}</Td>
              <Td>
                <Button size="md" // Use "md" for a more standard size
                      bgGradient={gradientBg}
                      color="white"
                      _hover={{ bgGradient: hoverBg }}
                      _active={{ bgGradient: hoverBg }}
                      borderRadius="full"
                      boxShadow="md"
                      px={6} // Set horizontal padding
                      py={3} // Set vertical padding
                      maxW="250" // Set maximum width
                      onClick={() => handlelogExport(activity)}>
                  Download
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
    </Box>
      </VStack> </Box></>
  );
};

export default FileUploadUserA;
