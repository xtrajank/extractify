import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const ExportHelp = () => (
  <Box maxWidth="md" mx="auto" mt={5}>
    <Typography variant="h4" gutterBottom>
      How to Export CSV Files
    </Typography>

    <Typography variant="h6">Excel</Typography>
    <ul>
      <li>Go to <strong>File &gt; Export</strong></li>
      <li>Click <strong>Change File Type</strong></li>
      <li>In the Change File Type menu, find <strong>CSV UTF-8 (Comma delimited) (*.csv)</strong></li>
      <li>click <strong>Save As</strong></li>
    </ul>

    <Typography variant="h6">QuickBooks Online</Typography>
    <ul>
      <li>Open your report or customer/vendor list</li>
      <li>Click <strong>Export to Excel</strong></li>
      <li>Open the file in Excel and <strong>Save As</strong> a CSV file</li>
    </ul>

    <Typography variant="h6">Google Sheets</Typography>
    <ul>
      <li>Click <strong>File &gt; Download &gt; Comma-separated values (.csv, current sheet)</strong></li>
    </ul>

    <Button variant="contained" component={Link} to="/" sx={{ mt: 3 }}>
      Back to Home
    </Button>
  </Box>
);

export default ExportHelp;
