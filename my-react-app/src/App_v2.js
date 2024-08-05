// src/App.js

import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import FileUpload from './FileUpload';

const App = () => {
  return (
    <ChakraProvider>
      <Box p={4}>
        <FileUpload />
      </Box>
    </ChakraProvider>
  );
};

export default App;
