// ResultsModal.js
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Stack,
  Text,
  Flex,
} from '@chakra-ui/react';

const ResultsModal = ({
  isOpen,
  onClose,
  results,
  displayedResults,
  currentPage,
  totalPages,
  handlePageChange,
  handleExport,
  gradientBg,
  hoverBg,
  selectedOption,
  allContactColumns,
  selectedColumns,
  allCompanyColumns,
  ExporttableType
}) => {

  // Function to get all unique columns from results
  const getAllColumnsFromResults = () => {
    const allColumnsSet = new Set();

    results.forEach(result => {
      Object.keys(result).forEach(key => {
        allColumnsSet.add(key);
      });
    });

    return Array.from(allColumnsSet);
  };

  // Function to determine column order
  const sortedColumn = () => {
    let columnOrder = [];

    const resultColumns = getAllColumnsFromResults();

    if (ExporttableType === 'Company') {
      columnOrder = resultColumns;
    } else {
      if (selectedOption === 'Email') {
        columnOrder = ["ZoomInfo Contact ID", "First Name", "Last Name", "Website", "LinkedIn Contact Profile URL", "Email Address"];
      } else if (selectedOption === 'Phone') {
        columnOrder = ["ZoomInfo Contact ID", "First Name", "Last Name", "Website", "LinkedIn Contact Profile URL", "Mobile phone", "Direct Phone Number", "Company HQ Phone"];
      } else {
        columnOrder = resultColumns;
      }
    }

    // Define a preferred order for some columns
    const preferredOrder = ["domain", "first_name", "last_name", "company_name", "linkedin_url", "zi_contact_id"];

    // Combine preferred order with remaining columns
    const orderedColumns = [
      ...preferredOrder.filter(col => columnOrder.includes(col)),
      ...columnOrder.filter(col => !preferredOrder.includes(col)),
    ];

    // Return unique columns in order
    return Array.from(new Set(orderedColumns));
  };

  // Render data in the order defined by sortedColumn
  const renderDataInOrder = (rowData) => {
    const columnOrder = sortedColumn();
    return columnOrder.map((col) => (
      <Td key={col}>
        {rowData[col] !== undefined && rowData[col] !== null ? rowData[col] : '-'} {/* Handle missing values */}
      </Td>
    ));
  };

  const columnOrder = sortedColumn();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
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
                      {columnOrder.map((key) => (
                        <Th key={key}>{key}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {displayedResults.map((result, index) => (
                      <Tr key={index}>
                        {renderDataInOrder(result)}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {/* Pagination Controls */}
              <Stack spacing={4} direction="row" justify="center">
                <Button
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm" alignSelf="center">Page {currentPage} of {totalPages}</Text>
                <Button
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </Stack>

              {/* Export Button */}
              <Flex justifyContent="center">
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
                  maxW="250"
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
  );
};

export default ResultsModal;
