import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Text,
  Tabs,
  TabList,
  Tab,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  CheckboxGroup,
  Checkbox,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Spinner,
  Icon,
  useDisclosure,
  useToast,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Select,
  ModalFooter,
  Flex,
  RadioGroup,
  Radio, 
} from '@chakra-ui/react';
import { saveAs } from 'file-saver';
import { ImDownload3 } from 'react-icons/im';
import axios from 'axios';
import ResultsModal from './ResultsModal';
import { utils, write } from 'xlsx';
import { useOutsideClick } from '@chakra-ui/react';
import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { FaFileExport } from 'react-icons/fa';

const ExportDataBoxUserB = ({
  gradientBg,
  hoverBg,
  gradient,
  boxBg,
  TableType
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const toast = useToast();
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const [file, setFile] = useState(null);
  const [exportloading, setexportLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);
  const [Contactcolumns, setContactColumns] = useState([]);
  const [Companycolumns, setCompanyColumns] = useState([]);
  const [matchContactOnlyDomain, setMatchContactOnlyDomain] = useState(false);
  const [matchContactDomain, setMatchContactDomain] = useState(false);
  const [matchCompanyDomain, setMatchCompanyDomain] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchCompanyName, setMatchCompanyName] = useState(false);
  const [matchZIContactID, setMatchZIContactID] = useState(false);
  const [matchZICompanyID, setmatchZICompanyID] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('results');
  const [requiredColumns, setrequiredColumns] = useState([]); 
  const [excelColumns, setexcelColumns] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false); // For showing the modal
  const [mappedColumns, setMappedColumns] = useState({}); // For storing the user’s mapped columns
  const [radioValue, setRadioValue] = useState([]); 
  const [initialMappedColumns, setInitialMappedColumns] = useState({}); // Track initial auto-mappings





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
  const normalize = (str) => (typeof str === 'string' ? str.trim().toLowerCase().replace(/[\s_-]+/g, '') : '');

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

  const parsedColumns = await parseExcelFile(file);
  console.log('Parsed Columns:', parsedColumns);

  let updatedRequiredColumns = [];
  if (matchContactOnlyDomain) updatedRequiredColumns.push('domain');
  if (matchContactDomain) updatedRequiredColumns.push('domain', 'first_name', 'last_name');
  if (matchCompanyDomain) updatedRequiredColumns.push('domain');
  if (matchLinkedinUrl) updatedRequiredColumns.push('linkedin_url');
  if (matchZIContactID) updatedRequiredColumns.push('zi_contact_id');
  if (matchZICompanyID) updatedRequiredColumns.push('zi_company_id');
  if (matchCompanyName) updatedRequiredColumns.push('company_name');

  updatedRequiredColumns = [...new Set(updatedRequiredColumns)];
  setrequiredColumns(updatedRequiredColumns);
  setexcelColumns(parsedColumns);

  const initialMapping = {};

  updatedRequiredColumns.forEach((reqCol) => {
    const possibleMatches = predefinedColumnSets[reqCol] || [reqCol];

    let bestMatch = '';
    let highestSimilarity = 0;

    parsedColumns.forEach((excelCol) => {
      possibleMatches.forEach((altName) => {
        const similarity = stringSimilarity(String(altName), String(excelCol));
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = excelCol;
        }
      });
    });

    if (highestSimilarity >= 0.8) {
      initialMapping[reqCol] = bestMatch;
    }
  });

  setMappedColumns(initialMapping); // Store current mappings
  setInitialMappedColumns(initialMapping); // Store initial auto-mappings
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
      description: 'Each required column must be mapped to a unique Excel column.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
    return;
  }

  setIsModalOpen(false);
  setexportLoading(true);

  const startTime = Date.now();
  setUploadedFileName(file.name.replace(/\.[^/.]+$/, "") || 'results');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('table_type', TableType);
  formData.append('selected_columns', selectedColumns.join(','));
  formData.append('match_contact_only_domain', matchContactOnlyDomain);
  formData.append('match_contact_domain', matchContactDomain);
  formData.append('match_company_domain', matchCompanyDomain);
  formData.append('match_linkedin_url', matchLinkedinUrl);
  formData.append('match_zi_contact_id', matchZIContactID);
  formData.append('match_company_name', matchCompanyName);
  formData.append('column_mapping', JSON.stringify(reversedMapping));
  formData.append('match_zi_company_id', matchZICompanyID);
  console.log('sent_to_backend',JSON.stringify(reversedMapping))

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/upload/user_b`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const allResults = response.data.matches;
    setResults(allResults);
    setTotalPages(Math.ceil(allResults.length / 5));
    setCurrentPage(1);
    setDisplayedResults(allResults.slice(0, 5));
    onOpen();

    const endTime = Date.now();
    const timeTakenSeconds = ((endTime - startTime) / 1000).toFixed(2);

    toast({
      title: 'Success',
      description: `File processed successfully in ${timeTakenSeconds} seconds.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    let errorMessage = 'Failed to upload file.';

    if (error.response?.data?.error) {
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
    setexcelColumns([]);
    setMappedColumns([]);
    setrequiredColumns([]);
  }
};

const frontendColumnNames = {
  domain: 'Domain',
  first_name: 'First Name',
  last_name: 'Last Name',
  linkedin_url: 'LinkedIn URL',
  zi_contact_id: 'ZoomInfo Contact ID',
  zi_company_id: 'ZoomInfo Company ID',
  company_name: 'Company Name',
};

  useEffect(() => {
    // Reset all the state whenever TableType changes
    setMatchCompanyDomain(false);
    setMatchCompanyName(false);
    setmatchZICompanyID(false);
    setMatchZIContactID(false);
    setMatchContactDomain(false);
    setMatchContactOnlyDomain(false);
    setMatchLinkedinUrl(false);
    setSelectedColumns([]);
    setSelectAll(false);
    setUnselectAll(false);
  }, [TableType]);  // Dependency on TableType


  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const endpoint = TableType === 'Company' ? '/company-columns/' : '/contact-columns/';
        const response = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`);
        // Ensure unique columns
        const uniqueColumns = [...new Set(response.data.columns)];
        if (TableType === 'Company') {
          setCompanyColumns(uniqueColumns);
        } else {
          setContactColumns(uniqueColumns);
        }
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

    fetchColumns();
  }, [toast, TableType]);



  useEffect(() => {
    if (TableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [ TableType]);

  useEffect(() => {
    if (TableType === 'Contact') {
      setSelectedColumns([]);
    }
  }, [ TableType]);

  useEffect(() => {
    if (selectAll && TableType === 'Contact') {
      setSelectedColumns(Contactcolumns);
    }
  }, [selectAll, Contactcolumns, TableType]);
  
  useEffect(() => {
    if (unselectAll && TableType === 'Contact') {
      setSelectedColumns([]);
    }
  }, [unselectAll, TableType]);

  useEffect(() => {
    if (TableType === 'Contact') {
      if (selectedColumns.length === Contactcolumns.length) {
        setSelectAll(false);
        setUnselectAll(false);
      } else if (selectedColumns.length === 0) {
        setSelectAll(false);
        setUnselectAll(true);
      } else {
        setSelectAll(false);
        setUnselectAll(false);
      }
    }
  }, [selectedColumns, Contactcolumns, TableType]);
  
  useEffect(() => {
    if (selectAll && TableType === 'Company') {
      setSelectedColumns(Companycolumns);
    }
  }, [selectAll, Companycolumns, TableType]);
  
  useEffect(() => {
    if (unselectAll && TableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [unselectAll, TableType]);
  
  useEffect(() => {
    if (TableType === 'Company') {
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
    }
  }, [selectedColumns, Companycolumns, TableType]);

  const handleRemoveColumn = (col) => {
    // Remove the selected column
    const updatedColumns = selectedColumns.filter(column => column !== col);
    
    // Update the selectedColumns state
    setSelectedColumns(updatedColumns);
  
    // Predefined column sets for email and phone
    const emailSet = new Set([
      'ZoomInfo Contact ID', 'First Name', 'Last Name', 
      'Website', 'LinkedIn Contact Profile URL', 
      'Company Name', 'ZoomInfo Company ID', 'Email Address'
    ]);
  
    const phoneSet = new Set([
      'ZoomInfo Contact ID', 'First Name', 'Last Name', 
      'Website', 'LinkedIn Contact Profile URL', 
      'Company Name', 'ZoomInfo Company ID', 
      'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'
    ]);
  
    // Check if the remaining selected columns match emailSet or phoneSet
    if (
      updatedColumns.length === emailSet.size && 
      updatedColumns.every((val) => emailSet.has(val))
    ) {
      setRadioValue('email');  // If it matches emailSet, set radio to 'email'
    } else if (
      updatedColumns.length === phoneSet.size && 
      updatedColumns.every((val) => phoneSet.has(val))
    ) {
      setRadioValue('phone');  // If it matches phoneSet, set radio to 'phone'
    } else {
      setRadioValue('other');  // If it doesn't match either, set radio to 'other'
    }
  };
  

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * 5;
    const endIndex = newPage * 5;
    setDisplayedResults(results.slice(startIndex, endIndex));
  };

  const handleExport = (format) => {
    if (!results || results.length === 0) {
      return; // No results to export
    }
  
    if (format === 'csv') {
      // Export as CSV
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
  
    } else if (format === 'xlsx') {
      // Export as XLSX
      const worksheet = XLSX.utils.json_to_sheet(results);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
      const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${uploadedFileName}_results.xlsx`);
    }
  };

  const popoverRef = useRef();
    useOutsideClick({
      ref: popoverRef,
      handler: () => setIsPopoverOpen(false),
    });




  return (
    <>
    <Box flex={1} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" bg={boxBg}
     w="100%"           // Ensures it takes the full width of the parent
     minW="700px"       // Prevents shrinking below this width
     maxW="700px"       // Prevents growing larger than this width
     >
      <Text
        fontSize="4xl"
        fontWeight="bold"
        bgGradient="linear(to-r, teal.400, blue.400, pink.400)"
        bgClip="text"
        animation={`${gradient} 4s ease infinite`}
        backgroundSize="200% 200%"
        mb={8}
      >
      <Icon as={FaFileExport} mr={2} color="teal.500" boxSize={6} />  Export {TableType} Data
      </Text>
      <Stack spacing={5}>
        <FormControl>
          <FormLabel
            fontWeight="bold"
            fontSize="lg"
            color="teal.600"
            mb={3}
          >
            Upload Excel/CSV File
          </FormLabel>
          <Box
            borderWidth={1}
            borderRadius="lg"
            borderColor="teal.300"
            padding={3}
            bg="gray.50"
            _hover={{ bg: 'gray.100' }}
          >
            <Input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              padding={2}
              border="none"
              _focusVisible={{ outline: 'none' }}
            />
          </Box>
        </FormControl>
        {/* Column Selection */}
        {TableType === 'Company' ? (
          <>
            <FormControl>
              <Popover isOpen={isPopoverOpen} onOpen={() => setIsPopoverOpen(true)} onClose={() => setIsPopoverOpen(false)} closeOnBlur={true}>
                <PopoverTrigger>
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
                    maxW="fit-content"
                    transition="all 0.2s ease-in-out"
                    _focus={{ boxShadow: 'outline' }}
                  >
                    Select {TableType} Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent ref={popoverRef}
                 borderRadius="md"
                 boxShadow="md"
                 borderWidth="1px"
                 borderColor="gray.200"
                 maxHeight="400px"
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
              <RadioGroup
                value={radioValue} // Track which radio is selected
                onChange={(value) => {
                  setRadioValue(value);
                  if (value === 'email') {
                    setSelectedColumns([
                      'ZoomInfo Contact ID', 'First Name', 'Last Name', 
                      'Website', 'LinkedIn Contact Profile URL', 
                      'Company Name', 'ZoomInfo Company ID', 'Email Address'
                    ]);
                  } else if (value === 'phone') {
                    setSelectedColumns([
                      'ZoomInfo Contact ID', 'First Name', 'Last Name', 
                      'Website', 'LinkedIn Contact Profile URL', 
                      'Company Name', 'ZoomInfo Company ID', 
                      'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'
                    ]);
                  }
                  setSelectAll(false);
                  setUnselectAll(false);
                }}
              >
                <Stack direction="row" spacing={8} mb={6}>
                  <Radio value="email">Email</Radio>
                  <Radio value="phone">Phone</Radio>
                  <Radio value="other">Other</Radio>
                </Stack>
              </RadioGroup>
              <Popover isOpen={isPopoverOpen} onOpen={() => setIsPopoverOpen(true)} onClose={() => setIsPopoverOpen(false)}>
                <PopoverTrigger>
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
                    maxW="fit-content"
                  >
                    Select {TableType} Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent ref={popoverRef}
                borderRadius="md"
                boxShadow="md"
                borderWidth="1px"
                borderColor="gray.200"
                maxHeight="400px" // Increase height for more options
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
                          setSelectedColumns(Contactcolumns);
                        } else if (values.includes('unselectAll')) {
                          setUnselectAll(true);
                          setSelectedColumns([]);
                        } else {
                          setSelectAll(false);
                          setUnselectAll(false);
                          setSelectedColumns(values);
                        }
                        setSelectedColumns(values);

                      // Switch to "Other" if the selected columns don't match predefined sets
                      const emailSet = new Set([
                        'ZoomInfo Contact ID', 'First Name', 'Last Name', 
                        'Website', 'LinkedIn Contact Profile URL', 
                        'Company Name', 'ZoomInfo Company ID', 'Email Address'
                      ]);

                      const phoneSet = new Set([
                        'ZoomInfo Contact ID', 'First Name', 'Last Name', 
                        'Website', 'LinkedIn Contact Profile URL', 
                        'Company Name', 'ZoomInfo Company ID', 
                        'Mobile phone', 'Direct Phone Number', 'Company HQ Phone'
                      ]);

                      if (
                        values.length === emailSet.size && 
                        values.every((val) => emailSet.has(val))
                      ) {
                        setRadioValue('email');
                      } else if (
                        values.length === phoneSet.size && 
                        values.every((val) => phoneSet.has(val))
                      ) {
                        setRadioValue('phone');
                      } else {
                        setRadioValue('other');
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
                              setSelectedColumns(Contactcolumns);
                            } else {
                              setSelectAll(false);
                              setSelectedColumns(prev => prev.filter(col => !Contactcolumns.includes(col)));
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
                              setSelectedColumns(prev => prev.filter(col => !Contactcolumns.includes(col)));
                            }
                          }}
                        >
                          Unselect All
                        </Checkbox>
                        {Contactcolumns.map((column) => (
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
                  isChecked={matchContactOnlyDomain}
                  onChange={() => setMatchContactOnlyDomain(!matchContactOnlyDomain)}
                >
                  Match Only Domain
                </Checkbox>
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
                  Match ZI Contact ID
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
      {exportloading ? <Spinner size="sm" /> : `Export ${TableType} Data`}
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

              const initialValue = initialMappedColumns[requiredColumn]; // Initial auto-mapped value
              const currentValue = mappedColumns[requiredColumn]; // Current value selected by the user

              const isAutoMapped = !!initialValue;
              const isModified = isAutoMapped && currentValue !== initialValue;
              const isUserMapped = !isAutoMapped && !!currentValue;

              let starColor = '';
              if (isModified) starColor = 'orange';
              else if (isUserMapped) starColor = 'green';
              else if (isAutoMapped) starColor = '#3182ce';

              const showStar = currentValue && currentValue !== '';

              // Get the frontend-friendly column name
              const displayName = frontendColumnNames[requiredColumn] || requiredColumn;

              return (
                <Flex key={requiredColumn} alignItems="center">
                  <Box w="40%" pr={4}>
                    <FormLabel fontWeight="bold" fontSize="sm" color="gray.600">
                      {displayName}
                      {showStar && (
                        <span
                          style={{
                            color: starColor,
                            marginLeft: '8px',
                            fontWeight: 'bold',
                          }}
                        >
                          ★
                        </span>
                      )}
                    </FormLabel>
                  </Box>

                  <Box w="60%">
                    <Select
                      placeholder="Select a column"
                      size="md"
                      bg="white"
                      value={mappedColumns[requiredColumn] || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setMappedColumns((prev) => ({
                          ...prev,
                          [requiredColumn]: newValue,
                        }));
                      }}
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
        <Box mt={4} p={2} bg="gray.50" borderRadius="md">
          <Box pl={5} mt={2} mb={2}>
          <Text fontSize="sm" color="gray.500">
            <li>
              <span style={{ color: '#3182ce', fontWeight: 'bold' }}>★</span> represents automatically mapped columns.
            </li>
            <li>
              <span style={{ color: 'orange', fontWeight: 'bold' }}>★</span> represents a modified match of auto-mapped columns.
            </li>
            <li>
              <span style={{ color: 'green', fontWeight: 'bold' }}>★</span> represents manually mapped columns .
            </li>
            </Text>
          </Box>
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
    selectedColumns={selectedColumns}
  />
</>
  );
};

export default ExportDataBoxUserB;
