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
  hoverBg
}) => {
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
