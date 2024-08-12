// ImportDataBox.js
import React from 'react';
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
  useBreakpointValue
} from '@chakra-ui/react';
import { ImDownload3 } from 'react-icons/im';
import { keyframes } from '@emotion/react';

const ImportDataBox = ({
  handleImportTabChange,
  handleImportDownload,
  handleImportFileChange,
  handleImportSubmit,
  importloading,
  ImporttableType,
  gradientBg,
  hoverBg,
  boxBg,
  gradient
}) => {
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
          >
            Upload Excel/CSV File
          </FormLabel>
          <Box
            borderWidth={1}
            borderRadius="lg"
            borderColor="teal.300"
            padding={3}
            bg="gray.50"
            _hover={{ bg: "gray.100" }}
          >
            <Input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleImportFileChange}
              padding={2}
              border="none"
              _focusVisible={{ outline: "none" }}
            />
          </Box>
        </FormControl>

        <Button
          onClick={handleImportSubmit}
          size="md"
          bgGradient={gradientBg}
          isDisabled={importloading}
          rightIcon={importloading && <Spinner size="sm" />}
          color="white"
          _hover={{ bgGradient: hoverBg }}
          _active={{ bgGradient: hoverBg }}
          borderRadius="full"
          boxShadow="md"
          px={6}
          py={3}
          maxW="300"
        >
          {importloading ? "Importing..." : `Import ${ImporttableType} Data`}
        </Button>
      </Stack>
    </Box>
  );
};

export default ImportDataBox;
