import React, { useState } from 'react';
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
  ModalFooter,
  Spinner,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Tag,
  TagLabel,
  HStack,
  RadioGroup,
  Radio,
  Divider,
  Select,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const FileUploadUserA = () => {
  // State for Export functionality
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedOption, setSelectedOption] = useState(''); // 'Email' or 'Phone'
  const [matchDomain, setMatchDomain] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchZIContactID, setMatchZIContactID] = useState(false);
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // State for Import functionality
  const [importFile, setImportFile] = useState(null);
  const [tableType, setTableType] = useState('Company');
  const [importMessages, setImportMessages] = useState([]);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Export handlers
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleOptionChange = (value) => {
    setSelectedOption(value);
    if (value === 'Email') {
      setColumns(['ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Email Address']);
    } else if (value === 'Phone') {
      setColumns(['ZoomInfo Contact ID', 'First Name', 'Last Name', 'Website', 'LinkedIn Contact Profile URL', 'Mobile phone', 'Direct Phone Number', 'Company HQ Phone']);
    }
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

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_columns', columns.join(','));
    formData.append('match_domain', matchDomain);
    formData.append('match_linkedin_url', matchLinkedinUrl);
    formData.append('match_zi_contact_id', matchZIContactID);

    setLoading(true);
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
      setLoading(false);
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

  // Import handlers
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
    formData.append('table_type', tableType);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportMessages(response.data.file_messages);
      toast({
        title: 'Success',
        description: 'Data imported successfully.',
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
      setLoading(false);
    }
  };

  return (
    <VStack spacing={6} p={4} align="stretch">
      <Stack direction={{ base: 'column', md: 'row' }} spacing={8}>
        {/* Import Section */}
        <Box flex={1} p={4} borderWidth={1} borderRadius="lg">
          <Text fontSize="2xl" mb={4} fontWeight="bold">Import Data</Text>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Upload Excel/CSV File</FormLabel>
              <Input type="file" accept=".xlsx,.csv" onChange={handleImportFileChange} />
            </FormControl>
            <FormControl>
              <FormLabel fontWeight="bold">Select Table Type</FormLabel>
              <Select value={tableType} onChange={(e) => setTableType(e.target.value)}>
                <option value="Company">Company</option>
                <option value="Contact">Contact</option>
              </Select>
            </FormControl>
            <Button colorScheme="teal" onClick={handleImportSubmit} isDisabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Import Data'}
            </Button>
            {importMessages.length > 0 && (
              <Box mt={4}>
                <Text fontWeight="bold">Import Messages:</Text>
                {importMessages.map((msg, index) => (
                  <Text key={index}>{msg}</Text>
                ))}
              </Box>
            )}
          </Stack>
        </Box>

        <Divider orientation={{ base: 'horizontal', md: 'vertical' }} />

        {/* Export Section */}
        <Box flex={1} p={4} borderWidth={1} borderRadius="lg">
          <Text fontSize="2xl" mb={4} fontWeight="bold">Export Data</Text>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel fontWeight="bold">Upload Excel File</FormLabel>
              <Input type="file" accept=".xlsx" onChange={handleFileChange} />
            </FormControl>
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
                {columns.length > 0 ? (
                  columns.map(col => (
                    <WrapItem key={col}>
                      <Tag
                        size='md'
                        key={col}
                        borderRadius='full'
                        variant='solid'
                        colorScheme='green'
                      >
                        <TagLabel>{col}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))
                ) : (
                  <Text>No columns selected</Text>
                )}
              </Wrap>
            </Box>
            <Stack spacing={2} mt={4}>
            <Checkbox isChecked={matchDomain} onChange={(e) => setMatchDomain(e.target.checked)}>
              Match Domain, First Name and Last Name
            </Checkbox>
            <Checkbox isChecked={matchLinkedinUrl} onChange={(e) => setMatchLinkedinUrl(e.target.checked)}>
              Match Linkedin URL
            </Checkbox>
            <Checkbox isChecked={matchZIContactID} onChange={(e) => setMatchZIContactID(e.target.checked)}>
              Match ZI Contact ID
            </Checkbox>
            </Stack>
            <Button colorScheme="teal" onClick={handleExportSubmit} isDisabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Submit'}
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Results Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Matching Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {results.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {/* Table for Displaying Results */}
                <TableContainer>
                  <Table variant="simple">
                    <TableCaption>Showing {displayedResults.length} of {results.length} records</TableCaption>
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
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Text>Page {currentPage} of {totalPages}</Text>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </Stack>

                {/* Export Button */}
                <Button colorScheme="blue" onClick={handleExport}>
                  Export All Records
                </Button>
              </VStack>
            ) : (
              <Text>No results to display.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default FileUploadUserA;
