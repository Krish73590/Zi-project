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
  HStack,
  Divider,
  Select,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [Contactcolumns, setContactColumns] = useState([]);
  const [Companycolumns, setCompanyColumns] = useState([]);
  const [matchContactDomain, setMatchContactDomain] = useState(false);
  const [matchCompanyDomain, setMatchCompanyDomain] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);
  const [matchCompanyName, setMatchCompanyName] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchZIContactID, setMatchZIContactID] = useState(false);
  const [results, setResults] = useState([]);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  // const { isOpen: isPopoverOpen, onOpen: onPopoverOpen, onClose: onPopoverClose } = useDisclosure();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // State for Import functionality
  const [importFile, setImportFile] = useState(null);
  const [tableType, setTableType] = useState('Company');
  const [importMessages, setImportMessages] = useState([]);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const endpoint = tableType === 'Company' ? '/company-columns/' : '/contact-columns/';
        const response = await axios.get(`http://localhost:8000${endpoint}`);
        // Ensure unique columns
        const uniqueColumns = [...new Set(response.data.columns)];
        if (tableType === 'Company') {
          setCompanyColumns(uniqueColumns);
          console.log("Current tableType:", tableType);
          console.log("dfsfsd", uniqueColumns);
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
  }, [toast, tableType]);

  // useEffect(() => {
  //   if (selectAll) {
  //     setSelectedColumns(columns);
  //   }
  // }, [selectAll, columns]);

  // useEffect(() => {
  //   if (unselectAll) {
  //     setSelectedColumns([]);
  //   }
  // }, [unselectAll]);

  // useEffect(() => {
  //   if (selectedColumns.length === columns.length) {
  //     setSelectAll(false);
  //     setUnselectAll(false);
  //   } else if (selectedColumns.length === 0) {
  //     setSelectAll(false);
  //     setUnselectAll(true);
  //   } else {
  //     setSelectAll(false);
  //     setUnselectAll(false);
  //   }
  // }, [selectedColumns, columns]);

  useEffect(() => {
    if (tableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [ tableType]);

  useEffect(() => {
    if (tableType === 'Contact') {
      setSelectedColumns([]);
    }
  }, [ tableType]);

  useEffect(() => {
    if (selectAll && tableType === 'Contact') {
      setSelectedColumns(Contactcolumns);
    }
  }, [selectAll, Contactcolumns, tableType]);
  
  useEffect(() => {
    if (unselectAll && tableType === 'Contact') {
      setSelectedColumns([]);
    }
  }, [unselectAll, tableType]);

  useEffect(() => {
    if (tableType === 'Contact') {
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
  }, [selectedColumns, Contactcolumns, tableType]);
  
  useEffect(() => {
    if (selectAll && tableType === 'Company') {
      setSelectedColumns(Companycolumns);
    }
  }, [selectAll, Companycolumns, tableType]);
  
  useEffect(() => {
    if (unselectAll && tableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [unselectAll, tableType]);
  
  useEffect(() => {
    if (tableType === 'Company') {
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
  }, [selectedColumns, Companycolumns, tableType]);

  
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
    formData.append('table_type', tableType);
    if (tableType === 'Company') {
      formData.append('selected_columns', selectedColumns.join(','));
    } else {
      formData.append('selected_columns', selectedColumns.join(','));
    }
    formData.append('match_contact_domain', matchContactDomain);
    formData.append('match_company_domain', matchCompanyDomain);
    formData.append('match_linkedin_url', matchLinkedinUrl);
    formData.append('match_zi_contact_id', matchZIContactID);
    formData.append('match_company_name', matchCompanyName);

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/upload/user_b', formData, {
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

  const handleRemoveColumn = (columnToRemove) => {
    setSelectedColumns(prevColumns =>
      prevColumns.filter(col => col !== columnToRemove)
    );
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
  
          {/* File Upload Section */}
          <Box flex={1} p={4} borderWidth={1} borderRadius="lg">
            <Text fontSize="2xl" mb={4} fontWeight="bold">Export Data</Text>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel fontWeight="bold">Upload Excel File</FormLabel>
                <Input type="file" accept=".xlsx" onChange={handleFileChange} />
              </FormControl>
              <FormControl>
                <FormLabel fontWeight="bold">Select Table Type</FormLabel>
                <Select value={tableType} onChange={(e) => setTableType(e.target.value)}>
                  <option value="Company">Company</option>
                  <option value="Contact">Contact</option>
                </Select>
              </FormControl>
  
              {/* Column Selection */}
              {/* Conditional Rendering Based on Table Type */}
              {tableType === 'Company' ? (
                <>
                  <FormControl>
                    <FormLabel fontWeight="bold">Select Columns</FormLabel>
                    <Popover isOpen={isPopoverOpen} onOpen={() => setIsPopoverOpen(true)} onClose={() => setIsPopoverOpen(false)}>
                      <PopoverTrigger>
                        <Button colorScheme="teal" width="full">Select Columns</Button>
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
                  <Box border="1px" borderColor="gray.200" p={4} borderRadius="md">
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
                  <FormLabel fontWeight="bold">Select Columns</FormLabel>
                  <Popover isOpen={isPopoverOpen} onOpen={() => setIsPopoverOpen(true)} onClose={() => setIsPopoverOpen(false)}>
                    <PopoverTrigger>
                      <Button colorScheme="teal" width="full">Select Columns</Button>
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
                              setSelectedColumns(Contactcolumns);
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
                  <Box border="1px" borderColor="gray.200" p={4} borderRadius="md">
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
                        Match ZI Contact ID
                      </Checkbox>
                    </HStack>
                  </FormControl>
                </>
              )}
              <Button colorScheme="teal" onClick={handleSubmit}>Submit</Button>
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
  
  export default FileUpload;