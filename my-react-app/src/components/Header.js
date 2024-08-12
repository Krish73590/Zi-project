import React from 'react';
import { Flex, Text, Menu, MenuButton, Button, MenuList, MenuItem, Icon} from '@chakra-ui/react';
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
    boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
    p={4}
    zIndex="1000"
  >
    <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="medium" color="gray.800">
      ZoomInfo Data Platform
    </Text>
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
  </Flex>
);

export default Header;
