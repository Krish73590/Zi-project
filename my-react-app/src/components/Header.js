import React from 'react';
import { Flex, Text, Menu, MenuButton, Button, MenuList, MenuItem, Box } from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";

const Header = ({ user, handleLogout }) => (
  <Flex
    position="fixed"
    top={0}
    width="100%"
    alignItems="center"
    justifyContent="space-between"
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="md"
    p={4}
    zIndex="1000"
  >
    {/* Empty Box to balance the layout */}
    <Box flex="1" />

    {/* Centered Text */}
    <Text
      fontSize={{ base: "2xl", md: "3xl" }}
      fontWeight="medium"
      color="gray.800"
      textAlign="center"
      ml="4%"
    >
      iA-ZI Data Platform
    </Text>
    <Box flex="1" />
    {/* Menu for user actions */}
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        bgGradient="linear(to-r, teal.400, blue.400)"
        _hover={{ bgGradient: "linear(to-r, teal.500, blue.500)" }}
        _focus={{ boxShadow: "outline" }}
      >
        <Flex alignItems="center">
          <Text color="white" fontWeight="medium">
            {user?.employeeId || 'Loading...'}
          </Text>
        </Flex>
      </MenuButton>
      <MenuList>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </MenuList>
    </Menu>

    {/* Another empty Box to balance the layout */}
    
  </Flex>
);

export default Header;
