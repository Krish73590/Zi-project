import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Stack,
  Tabs,
  TabList,
  Tab,
  Button,
  FormControl,
  FormLabel,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  CheckboxGroup,
  Checkbox,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  RadioGroup,
  Radio,
  Icon,
  Spinner,
  useColorModeValue,
  useToast,
  useDisclosure,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Select,
  ModalFooter,
  Flex 
} from '@chakra-ui/react';
import { ImDownload3 } from 'react-icons/im';
import { saveAs } from 'file-saver';
import axios from 'axios';
import ResultsModal from './ResultsModal';
import { utils, write } from 'xlsx';
import { useOutsideClick } from '@chakra-ui/react';
import { useRef } from 'react';
import * as XLSX from 'xlsx';

const ExportDataBoxUserA = ({
  gradient,
  gradientBg,
  hoverBg,
}) => {
  const contactExportHeaders  = ["domain",	"first_name",	"last_name",	"linkedin_url",	"zi_contact_id"]; 
  const companyExportHeaders = ["domain","company_name"];
  const toast = useToast();
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const [file, setFile] = useState(null);
  const boxBg = useColorModeValue("white", "gray.800"); // Move this inside the component
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); 
  const [exportloading, setexportLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [ExporttableType, setExportTableType] = useState('Company');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [Contactcolumns, setContactColumns] = useState([]);
  const [Companycolumns, setCompanyColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);
  const [matchContactOnlyDomain] = useState(false);
  const [matchContactDomain, setMatchContactDomain] = useState(false);
  const [matchCompanyDomain, setMatchCompanyDomain] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchCompanyName, setMatchCompanyName] = useState(false);
  const [matchZIContactID, setMatchZIContactID] = useState(false);
  const [matchZICompanyID, setmatchZICompanyID] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  // const columnOrder = ["domain","first_name","last_name","linkedin_url","zi_contact_id","ZoomInfo Contact ID", "First Name", "Last Name", "Website", "LinkedIn Contact Profile URL", "Email Address"];
  const [uploadedFileName, setUploadedFileName] = useState('results');
  const [requiredColumns, setrequiredColumns] = useState([]); 
  const [excelColumns, setexcelColumns] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false); // For showing the modal
  const [mappedColumns, setMappedColumns] = useState({}); // For storing the user’s mapped columns

  const handleExportTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setExportTableType(tabValues[index]);
  };

  const handleExportDownload = () => {
    let headers;

    if (ExporttableType === 'Contact') {
        headers = contactExportHeaders;
    } else if (ExporttableType === 'Company') {
        headers = companyExportHeaders;
    }

    // Create a worksheet
    const worksheet = utils.aoa_to_sheet([headers]);

    // Create a new workbook and append the worksheet
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate an Excel file (binary string)
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create a Blob from the Excel buffer
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Save the file
    saveAs(blob, `${ExporttableType}_export_sample_headers.xlsx`);

    // Show a toast notification
    toast({
        title: 'Download Started',
        description: 'Sample headers Excel file is being downloaded.',
        status: 'info',
        duration: 2000,
        isClosable: true,
    });
};

const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const columnHeaders = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0];
      resolve(columnHeaders);
      console.log(columnHeaders);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

const stringSimilarity = (str1, str2) => {
  const normalize = (str) => str.trim().toLowerCase().replace(/[\s_-]+/g, '');

  const a = normalize(str1);
  const b = normalize(str2);

  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : i))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j] + 1, // Deletion
            matrix[i][j - 1] + 1, // Insertion
            matrix[i - 1][j - 1] + 1 // Substitution
          );
      }
    }
  }

  const maxLen = Math.max(a.length, b.length);
  const distance = matrix[a.length][b.length];
  return (maxLen - distance) / maxLen; // Similarity score between 0 and 1
};

const predefinedColumnSets = {
  domain: ['domain', 'website', 'site', 'web_address'],
  first_name: ['first_name', 'fname', 'given_name', 'first', 'First Name'],
  last_name: ['last_name', 'surname', 'Last Name', 'last', 'Last Name'],
  linkedin_url: ['linkedin_url', 'linkedin', 'linkedin_profile', 'linkedin_contact','LinkedIn Contact Profile URL'],
  zi_contact_id: ['zi_contact_id', 'contact_id', 'zoominfo_contact_id', 'ZoomInfo Contact ID'],
  zi_company_id: ['zi_company_id', 'company_id', 'zoominfo_company_id','ZoomInfo Company ID'],
  company_name: ['company_name', 'company', 'organization', 'business_name','Company Name'],
};


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

  // Parse the Excel file to get the column headers
  const parsedColumns = await parseExcelFile(file);
  console.log('Parsed Columns:', parsedColumns);

  // Define the required columns dynamically based on conditions
  let updatedRequiredColumns = [];
  if (matchContactOnlyDomain) updatedRequiredColumns.push('domain');
  if (matchContactDomain) updatedRequiredColumns.push('domain', 'first_name', 'last_name');
  if (matchCompanyDomain) updatedRequiredColumns.push('domain');
  if (matchLinkedinUrl) updatedRequiredColumns.push('linkedin_url');
  if (matchZIContactID) updatedRequiredColumns.push('zi_contact_id');
  if (matchZICompanyID) updatedRequiredColumns.push('zi_company_id');
  if (matchCompanyName) updatedRequiredColumns.push('company_name');

  // Remove duplicates from the required columns
  updatedRequiredColumns = [...new Set(updatedRequiredColumns)];

  // Set the required and parsed columns in state (React state updates asynchronously)
  setrequiredColumns(updatedRequiredColumns);
  setexcelColumns(parsedColumns);

  console.log('Required Columns:', updatedRequiredColumns);

  // Initialize mapping
  const initialMapping = {};

  updatedRequiredColumns.forEach((reqCol) => {
    const possibleMatches = predefinedColumnSets[reqCol] || [reqCol]; // Get possible names

    let bestMatch = '';
    let highestSimilarity = 0;

    parsedColumns.forEach((excelCol) => {
      possibleMatches.forEach((altName) => {
        const similarity = stringSimilarity(altName, excelCol);
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = excelCol;
        }
      });
    });

    // Only map if similarity score is above a threshold (e.g., 0.8)
    if (highestSimilarity >= 0.8) {
      initialMapping[reqCol] = bestMatch;
    }
  });

  console.log('Initial Mapping:', initialMapping);

  // Ensure the mapping is correctly set in state
  setMappedColumns(initialMapping);

  // Open the modal for user review (after mapping is complete)
  setIsModalOpen(true);
};


const handleMappingSubmit = async () => {
  // Close the modal and start the export process
  const reversedMapping = {};
  for (const [requiredColumn, selectedExcelColumn] of Object.entries(mappedColumns)) {
    reversedMapping[selectedExcelColumn] = requiredColumn;
  }
  console.log('Reversed Column Mapping:', reversedMapping);

  const mappedValues = Object.values(reversedMapping);
  const uniqueMappedValues = new Set(mappedValues);

  if (uniqueMappedValues.size !== mappedValues.length) {
    toast({
      title: 'Error',
      description: 'Each required column must be mapped to a unique excel column.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return;
  }


  setIsModalOpen(false);
  setexportLoading(true);


    setUploadedFileName(file.name.replace(/\.[^/.]+$/, "") || 'results');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_type', ExporttableType);
    if (ExporttableType === 'Company') {
      formData.append('selected_columns', selectedColumns.join(','));
    } else {
      formData.append('selected_columns', Contactcolumns.join(','));
    }
    formData.append('match_contact_only_domain', matchContactOnlyDomain);
    formData.append('match_contact_domain', matchContactDomain);
    formData.append('match_company_domain', matchCompanyDomain);
    formData.append('match_linkedin_url', matchLinkedinUrl);
    formData.append('match_zi_contact_id', matchZIContactID);
    formData.append('match_company_name', matchCompanyName);
    formData.append('column_mapping', JSON.stringify(reversedMapping));
    formData.append('match_zi_company_id', matchZICompanyID);
    
    setexportLoading(true);
    const startTime = Date.now();

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upload/user_a`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      let allResults = response.data.matches;

     // Filter results based on selected options
     if (selectedOption === 'Email') {
      allResults = allResults.filter(result => result['Email Address']);
    } else if (selectedOption === 'Phone') {
      allResults = allResults.filter(result => 
        result['Mobile phone'] || 
        result['Direct Phone Number'] || 
        result['Company HQ Phone']
      );
    }
      // const allResults = response.data.matches;
      setResults(allResults);
      setTotalPages(Math.ceil(allResults.length / 5));
      setCurrentPage(1);
      setDisplayedResults(allResults.slice(0, 5));
      onOpen();
      const endTime = Date.now();
      const timeTakenSeconds = ((endTime - startTime) / 1000).toFixed(2);
      // Show success toast with time taken
      toast({
        title: 'Success',
        description: `File processed successfully in ${timeTakenSeconds} seconds.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      // console.log(error)
      console.error('Error uploading file:', error);
    let errorMessage = 'Failed to upload file.';

    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    const endTime = Date.now();
    const timeTakenSeconds = ((endTime - startTime) / 1000).toFixed(2);
    toast({
      title: 'Error',
      description: `${errorMessage} (Time taken: ${timeTakenSeconds} seconds)`,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setexportLoading(false);
  }
};

  const handleRemoveColumn = (col) => {
    setSelectedColumns(selectedColumns.filter(column => column !== col));
  };


  const handleOptionChange = (value) => {
    setSelectedOption(value);
    if (value === 'Email') {
      setContactColumns(['ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Company Name', 'ZoomInfo Company ID', 'Email Address']);
    } else if (value === 'Phone') {
      setContactColumns(['ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Company Name', 'ZoomInfo Company ID', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone']);
    }
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


  useEffect(() => {
    const fetchCompanyColumns = async () => {
      try {
        // const response = await axios.get('http://localhost:8000/company-columns/');
        // // Ensure unique columns
        // const uniqueCompanyColumns = [...new Set(response.data.columns)];
        setCompanyColumns(['tbl_zoominfo_company_paid_id',	'ZoomInfo Company ID',	'Company Name',	'Website',	'Company HQ Phone','Revenue (in 000s USD)',	'Revenue Range (in USD)',	'Employees',	'Employee Range','Primary Industry','Primary Sub-Industry','All Sub-Industries']);
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
    saveAs(blob, `${uploadedFileName}_results.csv`);
  };

  const popoverRef = useRef();
    useOutsideClick({
      ref: popoverRef,
      handler: () => setIsPopoverOpen(false),
    });

    // const allContactColumns = ["tbl_zoominfo_paid_id","ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Buying Committee","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Query Name","created_date","Direct Phone Number_Country","Mobile phone_Country","db_file_name","Company HQ Phone_Country","File Name","Contact/Phone","Final Remarks","member_id","Project TAG","Full Name","Buying Group" ]
    // const allCompanyColumns = ['tbl_zoominfo_company_paid_id',	'ZoomInfo Company ID',	'Company Name',	'Website',	'Founded Year',	'Company HQ Phone']


    





  return (
    <>
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
                      maxW="fit-content"
                      transition="all 0.2s ease-in-out"
                      _focus={{ boxShadow: 'outline' }}
                    >
                        Select {ExporttableType} Columns</Button>
                    </PopoverTrigger>
                    <PopoverContent ref={popoverRef}
                    borderRadius="md"
                    boxShadow="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    maxHeight="400px" // Increase height for more options
                    overflowY="auto"
                    p={4} // Add padding inside the popover
                    >
                      <PopoverArrow />
                      <PopoverBody maxHeight="300px" overflowY="auto">
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
              <VStack align="start">
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
                <Checkbox
                  isChecked={matchZICompanyID}
                  onChange={() => setmatchZICompanyID(!matchZICompanyID)}
                >
                  Match ZoomInfo Company ID
                </Checkbox>
              </VStack>
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
              <VStack align="start">
                <Checkbox
                  isChecked={matchContactDomain}
                  onChange={() => setMatchContactDomain(!matchContactDomain)}
                >
                  Match Domain, First Name & Last Name
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
                <Checkbox
                  isChecked={matchZICompanyID}
                  onChange={() => setmatchZICompanyID(!matchZICompanyID)}
                >
                  Match ZoomInfo Company ID
                </Checkbox>
                <Checkbox
                  isChecked={matchCompanyName}
                  onChange={() => setMatchCompanyName(!matchCompanyName)}
                >
                  Match Company Name
                </Checkbox>
              </VStack>
            </FormControl>
              </>
            )}
            
            
            <Button
      size="md"
      bgGradient={gradientBg}
      color="white"
      _hover={{ bgGradient: hoverBg }}
      _active={{ bgGradient: hoverBg }}
      borderRadius="full"
      boxShadow="md"
      px={6}
      py={3}
      maxW="225"
      onClick={handleExportSubmit}
      isDisabled={exportloading}
    >
      {exportloading ? <Spinner size="sm" /> : `Export ${ExporttableType} Data`}
    </Button>

    {isModalOpen && (
  <Modal onClose={() => setIsModalOpen(false)} isOpen={isModalOpen} size="lg">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Map Columns</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Box as="form" pt={4}>
          <VStack spacing={6} align="stretch">
            {requiredColumns.map((requiredColumn) => {
              const usedColumns = Object.values(mappedColumns).filter(
                (value) => value && value !== mappedColumns[requiredColumn]
              );

              const availableColumns = excelColumns.filter(
                (col) => !usedColumns.includes(col)
              );

              return (
                <Flex key={requiredColumn} alignItems="center">
                  <Box w="40%" pr={4}>
                    <FormLabel fontWeight="bold" fontSize="sm" color="gray.600">
                      {requiredColumn}
                    </FormLabel>
                  </Box>

                  <Box w="60%">
                    <Select
                      placeholder="Select a column"
                      size="md"
                      bg="white"
                      value={mappedColumns[requiredColumn] || ''}
                      onChange={(e) =>
                        setMappedColumns((prev) => ({
                          ...prev,
                          [requiredColumn]: e.target.value,
                        }))
                      }
                    >
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </Select>
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button
          colorScheme="blue"
          mr={3}
          onClick={handleMappingSubmit}
          isDisabled={!Object.keys(mappedColumns).length}
        >
          Next
        </Button>
        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
          Cancel
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)}
          </Stack>
        </Box>
         {/* Results Modal */}
      <ResultsModal
      isOpen={isOpen}
      onClose={onClose}
      results={results}
      displayedResults={displayedResults}
      currentPage={currentPage}
      totalPages={totalPages}
      handlePageChange={handlePageChange}
      handleExport={handleExport}
      gradientBg={gradientBg}
      hoverBg={hoverBg}
      selectedOption={selectedOption}
      selectedColumns={selectedColumns}
    />
  </>
  );
};

export default ExportDataBoxUserA;
