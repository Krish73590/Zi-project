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
  ModalFooter,
  Spinner,
  useDisclosure,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  CheckboxGroup,
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
  TagCloseButton,
  HStack
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);
  const [matchDomain, setMatchDomain] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchLastName, setMatchLastName] = useState(false);
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null); // Track user type
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPopoverOpen, onOpen: onPopoverOpen, onClose: onPopoverClose } = useDisclosure();

  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const response = await axios.get('http://localhost:8000/user-type/');
        setUserType(response.data.user_type); // 'User A' or 'User B'
      } catch (error) {
        console.error('Error fetching user type:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch user type.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login'); // Redirect to login if user type cannot be fetched
      }
    };

    fetchUserType();
  }, [toast, navigate]);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const response = await axios.get('http://localhost:8000/columns/');
        const uniqueColumns = [...new Set(response.data.columns)];
        setColumns(uniqueColumns);
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
  }, [toast]);

  useEffect(() => {
    if (selectAll) {
      setSelectedColumns(columns);
    }
  }, [selectAll, columns]);

  useEffect(() => {
    if (unselectAll) {
      setSelectedColumns([]);
    }
  }, [unselectAll]);

  useEffect(() => {
    if (selectedColumns.length === columns.length) {
      setSelectAll(false);
      setUnselectAll(false);
    } else if (selectedColumns.length === 0) {
      setSelectAll(false);
      setUnselectAll(true);
    } else {
      setSelectAll(false);
      setUnselectAll(false);
    }
  }, [selectedColumns, columns]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
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
    formData.append('selected_columns', selectedColumns.join(','));
    formData.append('match_domain', matchDomain);
    formData.append('match_linkedin_url', matchLinkedinUrl);
    formData.append('match_last_name', matchLastName);

    const uploadUrl = userType === 'User B' ? 'http://localhost:8000/upload/user-b/' : 'http://localhost:8000/upload/user-a/';

    setLoading(true);
    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const allResults = response.data.matches;
      setResults(allResults);
      setTotalPages(Math.ceil(allResults.length / 10));
      setCurrentPage(1);
      setDisplayedResults(allResults.slice(0, 10));
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
    const startIndex = (newPage - 1) * 10;
    const endIndex = newPage * 10;
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

  const handleRemoveColumn = (columnToRemove) => {
    setSelectedColumns(prevColumns =>
      prevColumns.filter(col => col !== columnToRemove)
    );
  };

  return (
    <VStack spacing={6} p={4} align="stretch">
      <Stack spacing={4}>
        {/* File Upload Section */}
        <FormControl>
          <FormLabel htmlFor="file-upload" fontWeight="bold">Upload Excel File</FormLabel>
          <Input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} />
        </FormControl>

        {/* Column Selection */}
        <FormControl>
          <FormLabel htmlFor="select-columns" fontWeight="bold">Select Columns</FormLabel>
          <Popover isOpen={isPopoverOpen} onOpen={onPopoverOpen} onClose={onPopoverClose}>
            <PopoverTrigger>
              <Button id="select-columns" colorScheme="teal" width="full">
                {'Select Columns'}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverBody>
                <CheckboxGroup
                  colorScheme="teal"
                  value={selectedColumns}
                  onChange={(values) => {
                    if (values.includes('all')) {
                      setSelectedColumns(columns);
                    } else {
                      setSelectedColumns(values);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <Checkbox key={column} value={column}>{column}</Checkbox>
                  ))}
                </CheckboxGroup>
                <HStack spacing={4} mt={4}>
                  <Button onClick={() => setSelectAll(true)}>Select All</Button>
                  <Button onClick={() => setUnselectAll(true)}>Unselect All</Button>
                </HStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </FormControl>

        {/* Matching Criteria */}
        <FormControl>
          <FormLabel fontWeight="bold">Match Criteria</FormLabel>
          <Checkbox isChecked={matchDomain} onChange={(e) => setMatchDomain(e.target.checked)}>
            Domain
          </Checkbox>
          <Checkbox isChecked={matchLinkedinUrl} onChange={(e) => setMatchLinkedinUrl(e.target.checked)}>
            LinkedIn URL
          </Checkbox>
          <Checkbox isChecked={matchLastName} onChange={(e) => setMatchLastName(e.target.checked)}>
            Last Name
          </Checkbox>
        </FormControl>

        <Button colorScheme="teal" width="full" onClick={handleSubmit} isLoading={loading}>
          Upload and Match
        </Button>

        {/* Export Button */}
        {results.length > 0 && (
          <Button colorScheme="teal" width="full" onClick={handleExport}>
            Export Results as CSV
          </Button>
        )}

        {/* Results Pagination */}
        {results.length > 0 && (
          <Stack spacing={4}>
            <HStack spacing={4} justify="center">
              <Button onClick={() => handlePageChange(currentPage - 1)} isDisabled={currentPage === 1}>
                Previous
              </Button>
              <Text>Page {currentPage} of {totalPages}</Text>
              <Button onClick={() => handlePageChange(currentPage + 1)} isDisabled={currentPage === totalPages}>
                Next
              </Button>
            </HStack>
          </Stack>
        )}
      </Stack>

      {/* Results Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Matched Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {results.length === 0 ? (
              <Text>No results found</Text>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <TableCaption>Matched Data</TableCaption>
                  <Thead>
                    <Tr>
                      {Object.keys(results[0] || {}).map(key => (
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
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" onClick={handleExport}>Export as CSV</Button>
            <Button onClick={onClose} ml={3}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default FileUpload;
