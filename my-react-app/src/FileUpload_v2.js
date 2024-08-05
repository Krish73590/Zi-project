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
  TagLeftIcon,
  TagRightIcon,
  TagCloseButton,
  HStack
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);
  const [matchDomain, setMatchDomain] = useState(false);
  const [matchFirstName, setMatchFirstName] = useState(false);
  const [matchLastName, setMatchLastName] = useState(false);
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPopoverOpen, onOpen: onPopoverOpen, onClose: onPopoverClose } = useDisclosure();

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const response = await axios.get('http://localhost:8000/columns/');
        // Ensure unique columns
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
    formData.append('match_first_name', matchFirstName);
    formData.append('match_last_name', matchLastName);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/upload/', formData, {
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
          <FormLabel fontWeight="bold">Upload Excel File</FormLabel>
          <Input type="file" accept=".xlsx" onChange={handleFileChange} />
        </FormControl>

        {/* Column Selection */}
        <FormControl>
          <FormLabel fontWeight="bold">Select Columns</FormLabel>
          <Popover isOpen={isPopoverOpen} onOpen={onPopoverOpen} onClose={onPopoverClose}>
            <PopoverTrigger>
              <Button colorScheme="teal" width="full">
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
                    if (values.includes('selectAll')) {
                      setSelectAll(true);
                      setSelectedColumns(columns);
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
                          setSelectedColumns(columns);
                        } else {
                          setSelectAll(false);
                          setSelectedColumns(prev => prev.filter(col => !columns.includes(col)));
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
                          setSelectedColumns(prev => prev.filter(col => !columns.includes(col)));
                        }
                      }}
                    >
                      Unselect All
                    </Checkbox>
                    {columns.map((column) => (
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

        {/* Display Selected Columns */}
        <Box border="1px" borderColor="gray.200" p={4} borderRadius="md">
          <Text fontWeight="bold">Currently Selected Columns:</Text>
          <HStack  spacing={2} mt={2}>
            {Array.from(new Set(selectedColumns)).length > 0 ? (
              Array.from(new Set(selectedColumns)).map(col => (
                <Tag
                    size='md'
                    key={col}
                    borderRadius='full'
                    variant='solid'
                    colorScheme='green'
                >
                    <TagLabel>{col}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveColumn(col)} />
                </Tag>
                ))
            ) : (
              <Text>No columns selected</Text>
            )}
          </HStack >
        </Box>

        {/* Match Conditions */}
        <FormControl>
          <FormLabel fontWeight="bold">Match Conditions</FormLabel>
          <Stack spacing={2}>
            <Checkbox isChecked={matchDomain} onChange={(e) => setMatchDomain(e.target.checked)}>
              Match Domain
            </Checkbox>
            <Checkbox isChecked={matchFirstName} onChange={(e) => setMatchFirstName(e.target.checked)}>
              Match First Name
            </Checkbox>
            <Checkbox isChecked={matchLastName} onChange={(e) => setMatchLastName(e.target.checked)}>
              Match Last Name
            </Checkbox>
          </Stack>
        </FormControl>

        {/* Submit Button */}
        <Button colorScheme="teal" onClick={handleSubmit} isDisabled={loading} isFullWidth>
          {loading ? <Spinner size="sm" /> : 'Upload and Match'}
        </Button>
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

export default FileUpload;
