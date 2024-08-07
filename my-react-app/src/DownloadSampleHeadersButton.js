import React, { useState } from 'react';
import { Box, Text, Button, useToast, RadioGroup, Radio, Stack } from '@chakra-ui/react'; 
// import { IconName } from "react-icons/fc"; 
// import { FcDownload } from "react-icons/fc"; 
import { ImDownload3 } from "react-icons/im";
import { saveAs } from 'file-saver';

const contactHeaders  = [
  "ZoomInfo Contact ID",
  "Last Name",
  "First Name",
  "Middle Name",
  "Salutation",
  "Suffix",
  "Job Title",
  "Job Title Hierarchy Level",
  "Management Level",
  "Job Start Date",
  "Job Function",
  "Department",
  "Company Division Name",
  "Direct Phone Number",
  "Email Address",
  "Email Domain",
  "Mobile phone",
  "Last Job Change Type",
  "Last Job Change Date",
  "Previous Job Title",
  "Previous Company Name",
  "Previous Company ZoomInfo Company ID",
  "Previous Company LinkedIn Profile",
  "Highest Level of Education",
  "Contact Accuracy Score",
  "Contact Accuracy Grade",
  "ZoomInfo Contact Profile URL",
  "LinkedIn Contact Profile URL",
  "Notice Provided Date",
  "Person Street",
  "Person City",
  "Person State",
  "Person Zip Code",
  "Country",
  "ZoomInfo Company ID",
  "Company Name",
  "Company Description",
  "Website",
  "Founded Year",
  "Company HQ Phone",
  "Fax",
  "Ticker",
  "Revenue (in 000s USD)",
  "Revenue Range (in USD)",
  "Est. Marketing Department Budget (in 000s USD)",
  "Est. Finance Department Budget (in 000s USD)",
  "Est. IT Department Budget (in 000s USD)",
  "Est. HR Department Budget (in 000s USD)",
  "Employees",
  "Employee Range",
  "Past 1 Year Employee Growth Rate",
  "Past 2 Year Employee Growth Rate",
  "SIC Code 1",
  "SIC Code 2",
  "SIC Codes",
  "NAICS Code 1",
  "NAICS Code 2",
  "NAICS Codes",
  "Primary Industry",
  "Primary Sub-Industry",
  "All Industries",
  "All Sub-Industries",
  "Industry Hierarchical Category",
  "Secondary Industry Hierarchical Category",
  "Alexa Rank",
  "ZoomInfo Company Profile URL",
  "LinkedIn Company Profile URL",
  "Facebook Company Profile URL",
  "Twitter Company Profile URL",
  "Ownership Type",
  "Business Model",
  "Certified Active Company",
  "Certification Date",
  "Total Funding Amount (in 000s USD)",
  "Recent Funding Amount (in 000s USD)",
  "Recent Funding Round",
  "Recent Funding Date",
  "Recent Investors",
  "All Investors",
  "Company Street Address",
  "Company City",
  "Company State",
  "Company Zip Code",
  "Company Country",
  "Full Address",
  "Number of Locations"
]; 

const companyHeaders = [
  "ZoomInfo Company ID",
  "Company Name",
  "Website",
  "Founded Year",
  "Company HQ Phone",
  "Fax",
  "Ticker",
  "Revenue (in 000s USD)",
  "Revenue Range (in USD)",
  "Employees",
  "Employee Range",
  "SIC Code 1",
  "SIC Code 2",
  "SIC Codes",
  "NAICS Code 1",
  "NAICS Code 2",
  "NAICS Codes",
  "Primary Industry",
  "Primary Sub-Industry",
  "All Industries",
  "All Sub-Industries",
  "Industry Hierarchical Category",
  "Secondary Industry Hierarchical Category",
  "Alexa Rank",
  "ZoomInfo Company Profile URL",
  "LinkedIn Company Profile URL",
  "Facebook Company Profile URL",
  "Twitter Company Profile URL",
  "Ownership Type",
  "Business Model",
  "Certified Active Company",
  "Certification Date",
  "Defunct Company",
  "Total Funding Amount (in 000s USD)",
  "Recent Funding Amount (in 000s USD)",
  "Recent Funding Round",
  "Recent Funding Date",
  "Recent Investors",
  "All Investors",
  "Company Street Address",
  "Company City",
  "Company State",
  "Company Zip Code",
  "Company Country",
  "Full Address",
  "Number of Locations",
  "Company Is Acquired",
  "Company ID (Ultimate Parent)",
  "Entity Name (Ultimate Parent)",
  "Company ID (Immediate Parent)",
  "Entity Name (Immediate Parent)",
  "Relationship (Immediate Parent)"
];

const DownloadSampleHeadersButton = () => {
  const [headerType, setHeaderType] = useState('contact');
  const toast = useToast();

  const handleDownload = () => {
    const headers = headerType === 'contact' ? contactHeaders : companyHeaders;
    const csvRows = [];
    const headersRow = headers.join(',');
    csvRows.push(headersRow);

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    saveAs(blob, `${headerType}_sample_headers.csv`);

    toast({
      title: 'Download Started',
      description: 'Sample headers CSV file is being downloaded.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box flex={1} p={4} borderWidth={1} borderRadius="lg">
      <Text fontSize="lg" mb={4} fontWeight="bold">Download Sample Headers</Text>
      <RadioGroup onChange={setHeaderType} value={headerType}>
        <Stack direction="row">
          <Radio value="contact">Contact</Radio>
          <Radio value="company">Company</Radio>
        </Stack>
      </RadioGroup>
      <Button colorScheme="blue" rightIcon={<ImDownload3 colorScheme='white' />} mt={4} onClick={handleDownload}>
        Download
      </Button>
    </Box>
  );
  
};

export default DownloadSampleHeadersButton;
