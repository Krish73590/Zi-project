// LastActivities.js
import React from 'react';
import {
  Box,
  Text,
  Tabs,
  TabList,
  Tab,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const LastActivities = ({
  activities,
  handleTabChange,
  handlelogExport,
  gradientBg,
  hoverBg,
}) => {
  const gradient = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `;

  return (
    <Box p={5} pl={10}>
      <Text
        fontSize="4xl"
        fontWeight="bold"
        bgGradient="linear(to-r, teal.400, blue.400, pink.400)"
        bgClip="text"
        animation={`${gradient} 4s ease infinite`}
        backgroundSize="200% 200%"
        mb={8}
      >
        Last Activities
      </Text>
      <Tabs
        onChange={handleTabChange}
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
      <Box
        maxHeight="500px"
        maxWidth="1400px"
        overflowY="auto"
        overflowX="auto"
        mt={7}
        border="2px solid"
        borderColor="gray.300"
        rounded="lg"
      >
        <Table
          variant="striped"
          colorScheme="gray"
          minWidth="1000px"
        >
          <Thead position="sticky" top="0" bg="gray.100" zIndex="1">
            <Tr>
              <Th>Employee ID</Th>
              <Th>Import Time</Th>
              <Th>File Name</Th>
              <Th>Process Tag</Th>
              <Th>Counts</Th>
              <Th>Download</Th>
            </Tr>
          </Thead>
          <Tbody>
            {activities.map((activity) => (
              <Tr key={activity.import_time}>
                <Td>{activity.employee_id}</Td>
                <Td>{activity.import_time}</Td>
                <Td>{activity.file_name}</Td>
                <Td>{activity.process_tag}</Td>
                <Td>{activity.cnt}</Td>
                <Td>
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
                    onClick={() => handlelogExport(activity)}
                  >
                    Download
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default LastActivities;
