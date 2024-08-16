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
  VStack
} from '@chakra-ui/react';
import { saveAs } from 'file-saver';
import { ImDownload3 } from 'react-icons/im';
import axios from 'axios';
import ResultsModal from './ResultsModal';
import { utils, write } from 'xlsx';
import { useOutsideClick } from '@chakra-ui/react';
import { useRef } from 'react';
const ExportDataBoxUserB = ({
  gradientBg,
  hoverBg,
  gradient,
  boxBg,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const contactExportHeaders  = ["domain",	"first_name",	"last_name",	"linkedin_url",	"zi_contact_id"]; 
  const companyExportHeaders = ["domain","company_name"];
  const toast = useToast();
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const [file, setFile] = useState(null);
  const [exportloading, setexportLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [ExporttableType, setExportTableType] = useState('Company');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [unselectAll, setUnselectAll] = useState(false);
  const [Contactcolumns, setContactColumns] = useState([]);
  const [Companycolumns, setCompanyColumns] = useState([]);
  const [matchContactDomain, setMatchContactDomain] = useState(false);
  const [matchCompanyDomain, setMatchCompanyDomain] = useState(false);
  const [matchLinkedinUrl, setMatchLinkedinUrl] = useState(false);
  const [matchCompanyName, setMatchCompanyName] = useState(false);
  const [matchZIContactID, setMatchZIContactID] = useState(false);
  const allContactColumns = ["tbl_zoominfo_paid_id","ZoomInfo Contact ID","Last Name","First Name","Middle Name","Salutation","Suffix","Job Title","Job Title Hierarchy Level","Management Level","Job Start Date","Buying Committee","Job Function","Department","Company Division Name","Direct Phone Number","Email Address","Email Domain","Mobile phone","Last Job Change Type","Last Job Change Date","Previous Job Title","Previous Company Name","Previous Company ZoomInfo Company ID","Previous Company LinkedIn Profile","Highest Level of Education","Contact Accuracy Score","Contact Accuracy Grade","ZoomInfo Contact Profile URL","LinkedIn Contact Profile URL","Notice Provided Date","Person Street","Person City","Person State","Person Zip Code","Country","ZoomInfo Company ID","Company Name","Company Description","Website","Founded Year","Company HQ Phone","Fax","Ticker","Revenue (in 000s USD)","Revenue Range (in USD)","Est. Marketing Department Budget (in 000s USD)","Est. Finance Department Budget (in 000s USD)","Est. IT Department Budget (in 000s USD)","Est. HR Department Budget (in 000s USD)","Employees","Employee Range","Past 1 Year Employee Growth Rate","Past 2 Year Employee Growth Rate","SIC Code 1","SIC Code 2","SIC Codes","NAICS Code 1","NAICS Code 2","NAICS Codes","Primary Industry","Primary Sub-Industry","All Industries","All Sub-Industries","Industry Hierarchical Category","Secondary Industry Hierarchical Category","Alexa Rank","ZoomInfo Company Profile URL","LinkedIn Company Profile URL","Facebook Company Profile URL","Twitter Company Profile URL","Ownership Type","Business Model","Certified Active Company","Certification Date","Total Funding Amount (in 000s USD)","Recent Funding Amount (in 000s USD)","Recent Funding Round","Recent Funding Date","Recent Investors","All Investors","Company Street Address","Company City","Company State","Company Zip Code","Company Country","Full Address","Number of Locations","Query Name","created_date","Direct Phone Number_Country","Mobile phone_Country","db_file_name","Company HQ Phone_Country","File Name","Contact/Phone","Final Remarks","member_id","Project TAG","Full Name","Buying Group" ]
  const allCompanyColumns = ['tbl_zoominfo_company_paid_id',	'ZoomInfo Company ID',	'Company Name',	'Website',	'Founded Year',	'Company HQ Phone']
  const [uploadedFileName, setUploadedFileName] = useState('results');









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

    setUploadedFileName(file.name.replace(/\.[^/.]+$/, "") || 'results');

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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upload/user_a`, formData, {
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

  const handleExportTabChange = (index) => {
    const tabValues = ['Company', 'Contact']; // Map the index to your tab values
    setExportTableType(tabValues[index]);
  };

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const endpoint = ExporttableType === 'Company' ? '/company-columns/' : '/contact-columns/';
        const response = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`);
        // Ensure unique columns
        const uniqueColumns = [...new Set(response.data.columns)];
        if (ExporttableType === 'Company') {
          setCompanyColumns(uniqueColumns);
          console.log("Current tableType:", ExporttableType);
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
  }, [toast, ExporttableType]);



  useEffect(() => {
    if (ExporttableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [ ExporttableType]);

  useEffect(() => {
    if (ExporttableType === 'Contact') {
      setSelectedColumns([]);
    }
  }, [ ExporttableType]);

  useEffect(() => {
    if (selectAll && ExporttableType === 'Contact') {
      setSelectedColumns(Contactcolumns);
    }
  }, [selectAll, Contactcolumns, ExporttableType]);
  
  useEffect(() => {
    if (unselectAll && ExporttableType === 'Contact') {
      setSelectedColumns([]);
    }
  }, [unselectAll, ExporttableType]);

  useEffect(() => {
    if (ExporttableType === 'Contact') {
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
  }, [selectedColumns, Contactcolumns, ExporttableType]);
  
  useEffect(() => {
    if (selectAll && ExporttableType === 'Company') {
      setSelectedColumns(Companycolumns);
    }
  }, [selectAll, Companycolumns, ExporttableType]);
  
  useEffect(() => {
    if (unselectAll && ExporttableType === 'Company') {
      setSelectedColumns([]);
    }
  }, [unselectAll, ExporttableType]);
  
  useEffect(() => {
    if (ExporttableType === 'Company') {
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
  }, [selectedColumns, Companycolumns, ExporttableType]);

  const handleRemoveColumn = (col) => {
    setSelectedColumns(selectedColumns.filter(column => column !== col));
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
    saveAs(blob, `${uploadedFileName}_results.csv`);
  };

  const popoverRef = useRef();
    useOutsideClick({
      ref: popoverRef,
      handler: () => setIsPopoverOpen(false),
    });




  return (
    <>
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
        Export Data
      </Text>
      <Stack spacing={5}>
        <Tabs onChange={handleExportTabChange} defaultIndex={0} colorScheme="teal" variant="enclosed">
          <TabList>
            <Tab
              _selected={{
                bgGradient: gradientBg,
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Company
            </Tab>
            <Tab
              _selected={{
                bgGradient: gradientBg,
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Contact
            </Tab>
          </TabList>
        </Tabs>
        <Button
          onClick={handleExportDownload}
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
          Download {ExporttableType} Headers
        </Button>
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
        {ExporttableType === 'Company' ? (
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
                    Select {ExporttableType} Columns
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
              </VStack>
            </FormControl>
          </>
        ) : (
          <>
            <FormControl>
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
                    Select {ExporttableType} Columns
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
    allContactColumns={allContactColumns}
    selectedColumns={selectedColumns}
    allCompanyColumns={allCompanyColumns}
    ExporttableType={ExporttableType}
  />
</>
  );
};

export default ExportDataBoxUserB;
