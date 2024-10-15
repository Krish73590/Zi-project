import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Tabs,
  Tab,
  TabList,
  Text,
  Icon,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Flex,
  useToast,
  VStack
} from '@chakra-ui/react';
import { ImDownload3 } from 'react-icons/im';
import { utils, read, write } from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'axios';

// Predefined import headers
const contactImportHeaders  = [
  "ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations"
 ]; 
 
 const companyImportHeaders = [
   "ZoomInfo Company ID","Company Name","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Employees","Employee Range","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Defunct Company","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Company Is Acquired","Company ID (Ultimate Parent)","Entity Name (Ultimate Parent)","Company ID (Immediate Parent)","Entity Name (Immediate Parent)","Relationship (Immediate Parent)"
 ];



const predefinedColumnSets = {
  "ZoomInfo Contact ID": ["zoominfo_contact_id", "zi_contact_id"],
  "First Name": ["first_name", "fname", "given_name"],
  "Last Name": ["last_name", "surname"],
  "Email Address": ["email", "email_address"],
  "Phone Number": ["phone", "mobile"],
  "ZoomInfo Company ID": ["zoominfo_company_id", "zi_company_id"],
  "Company Name": ["company_name", "organization"],
  "Website": ["website", "domain", "site"],
  "Founded Year": ["founded_year", "established_year"],
  "Revenue (in USD)": ["revenue", "annual_revenue"]
};

const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const headers = utils.sheet_to_json(firstSheet, { header: 1 })[0];
      resolve(headers);
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
const ImportDataBox = ({
  gradientBg,
  hoverBg,
  boxBg,
  gradient
}) => {
  const toast = useToast();
  const [excelColumns, setExcelColumns] = useState([]);
  const [requiredColumns, setRequiredColumns] = useState([]);
  const [mappedColumns, setMappedColumns] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importloading, setImportLoading] = useState(false);
  const [initialMappedColumns, setInitialMappedColumns] = useState({}); // Track initial auto-mappings
  const [ImporttableType, setImportTableType] = useState('Company');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [availableColumnsForConfirmation, setAvailableColumnsForConfirmation] = useState([]);

  const handleImportTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setImportTableType(tabValues[index]);
  };
  const handleImportDownload = () => {
    const headers =
      ImporttableType === 'Contact' ? contactImportHeaders : companyImportHeaders;
    const worksheet = utils.aoa_to_sheet([headers]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${ImporttableType}_import_sample_headers.xlsx`);
    toast({
      title: 'Download Started',
      description: 'Sample headers Excel file is being downloaded.',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };


  const handleImportSubmit = async () => {
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
  setImportLoading(true);

  try {
    const parsedColumns = await parseExcelFile(file);
    // Ensure unique headers
    setExcelColumns(parsedColumns);
    // console.log('Parsed Columns:', parsedColumns);
    console.log(ImporttableType);
    let updatedRequiredColumns = [];
    if (ImporttableType === 'Contact') updatedRequiredColumns.push(...contactImportHeaders);
    if (ImporttableType === 'Company') updatedRequiredColumns.push(...companyImportHeaders);

    updatedRequiredColumns = [...new Set(updatedRequiredColumns)];
    setRequiredColumns(updatedRequiredColumns);
    setExcelColumns(parsedColumns)

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
    setMappedColumns(initialMapping);
    console.log('mappedColumns',mappedColumns);
    setInitialMappedColumns(initialMapping); // Store initial auto-mappings
    setIsModalOpen(true);
  } catch (error) {
    console.error('Error parsing file:', error);
    toast({
      title: 'Error',
      description: 'Failed to parse the uploaded file.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setImportLoading(false);
  }
};

const handleMappingSubmit = () => {
  // Get used columns from the mapped columns
  const usedColumns = Object.values(mappedColumns).filter(Boolean);

  // Find available columns that are not used in the mapping
  const availableColumns = excelColumns.filter((col) => !usedColumns.includes(col));

  // If there are available columns, open the confirmation modal
  if (availableColumns.length > 0) {
    setAvailableColumnsForConfirmation(availableColumns);
    setIsConfirmationOpen(true); // Open the confirmation modal
    return;
  }

  // If no available columns, proceed directly with submission
  handleConfirmProceed();
};


const submitMapping = async () => {
  const reversedMapping = {};
  for (const [requiredColumn, selectedExcelColumn] of Object.entries(mappedColumns)) {
    reversedMapping[selectedExcelColumn] = requiredColumn;
  }

  const formData = new FormData();
  formData.append('table_type', ImporttableType);
  formData.append('column_mapping', JSON.stringify(reversedMapping));
  formData.append('file', file);
  console.log('sent_to_backend',JSON.stringify(reversedMapping))
  setImportLoading(true);
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/import/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    toast({
      title: 'Success',
      description: `${response.data.message}. File processed successfully.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  } catch (error) {
    console.error('Error importing data:', error);
    // Extract and display specific error messages
    if (error.response) {
      toast({
        title: 'Import Error',
        description: error.response.data.error || 'Failed to import data.',
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
        description: 'An unexpected error occurred during data import.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  } finally {
    setImportLoading(false);
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


  const handleConfirmProceed = () => {
    setIsConfirmationOpen(false); // Close the confirmation modal
    setIsModalOpen(false);
    submitMapping(); // Call the submission function
  };
  
  const handleOpenConfirmation = () => {
    setIsConfirmationOpen(false); // Close confirmation and stay in the modal
  };

  return (
    <Box flex={1} p={6} borderWidth={1} borderRadius="lg" boxShadow="lg" bg={boxBg}>
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
          size="md"
          bgGradient={gradientBg}
          color="white"
          _hover={{ bgGradient: hoverBg }}
          _active={{ bgGradient: hoverBg }}
          borderRadius="full"
          boxShadow="md"
          rightIcon={<Icon as={ImDownload3} boxSize={5} />}
          px={6}
          py={3}
          maxW="fit-content"
        >
          Download {ImporttableType} Headers
        </Button>

        <FormControl>
        <FormLabel
            fontWeight="bold"
            fontSize="lg"
            color="teal.600"
            mb={3}
          >Upload Excel/CSV File</FormLabel>
          <Box
            borderWidth={1}
            borderRadius="lg"
            borderColor="teal.300"
            padding={3}
            bg="gray.50"
            _hover={{ bg: "gray.100" }}
          >
          <Input type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files[0])} padding={2}
              border="none"
              _focusVisible={{ outline: "none" }} />
              </Box>
        </FormControl>
        
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
      onClick={handleImportSubmit}
      isDisabled={importloading}
    >
      {importloading ? <Spinner size="sm" /> : `Import ${ImporttableType} Data`}
    </Button>
      </Stack>
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
              <span style={{ color: '#3182ce', fontWeight: 'bold' }}>★</span> Columns marked with a star were auto-mapped using similarity logic.
            </li>
            <li>
              <span style={{ color: 'orange', fontWeight: 'bold' }}>★</span> If changed, the star will turn orange.
            </li>
            <li>
              <span style={{ color: 'green', fontWeight: 'bold' }}>★</span> If mapped manually, the star will turn green.
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

{isConfirmationOpen && (
  <Modal isOpen={isConfirmationOpen} onClose={handleOpenConfirmation}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Confirm Available Columns</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text fontSize="lg" mb={4}>
          The following columns are available but not mapped. Are you sure you want to proceed?
        </Text>
        <VStack align="start" spacing={2}>
          {availableColumnsForConfirmation.map((col) => (
            <Text key={col}>- {col}</Text>
          ))}
        </VStack>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="red" mr={3} onClick={handleOpenConfirmation}>
          Back to Mapping
        </Button>
        <Button
          colorScheme="green"
          onClick={handleConfirmProceed}
          isLoading={importloading} // Show loading spinner if in progress
        >
          Proceed Anyway
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)}


    </Box>
  );
};

export default ImportDataBox;