import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const PasteHelp = () => (
  <Box maxWidth="md" mx="auto" mt={5}>
    <Typography variant="h4" gutterBottom>
      How to Paste Extracted Data into Google Sheets and Excel
    </Typography>

    <Typography variant="h6">Google Sheets</Typography>
    <ul>
      <li>Click on cell desired starting cell</li>
      <li>Paste (cmd + V on Mac / ctrl + V on Windows)</li>
      <li>Click the clipboard icon</li>
      <li>Select <strong>Split text to columns</strong></li>
    </ul>

    <Typography variant="h6">Excel</Typography>
    <ul>
      <li>Click on cell desired starting cell</li>
      <li>Paste</li>
      <li>Click on clipboard icon</li>
      <li>Click <strong>Use Text Import Wizard...</strong></li>
      <li>Click <strong>Finish</strong></li>
    </ul>

    <Button variant="contained" component={Link} to="/" sx={{ mt: 3 }}>
      Back to Home
    </Button>
  </Box>
);

export default PasteHelp;
