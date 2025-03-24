import React, { useState } from 'react';
import { Box, Typography, Button, List, ListItem, Link } from '@mui/material';

function FileUploader({ onFilesSelected }) {
    const [files, setFiles] = useState([]);

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        console.log("FileUploader selected:", selected);
        setFiles(selected);
        onFilesSelected(selected);
    };

    return (
        <Box sx={{align:'center', p:3, border:1, borderRadius:2, borderColor:"grey.300", boxShadow:1}}>
            <Typography variant="h6" gutterBottom> Upload CSV Files </Typography>

            <Button variant="contained" component="label">
                Select Files
                <input
                    type="file"
                    accept=".csv"
                    multiple
                    hidden
                    onChange={handleFileChange}
                />
            </Button>

            <Typography variant="body2" color="textSecondary" mt={1}>
                If you need help exporting a CSV file,&nbsp;
                <Link href="/help/export">
                click here
                </Link>.
            </Typography>

            {files.length > 0 && (
            <Box mt={2}>
                <Typography variant="subtitle2">Selected Files:</Typography>
                <List dense>
                    {files.map((file) => (
                    <ListItem key={file.name}>{file.name}</ListItem>
                    ))}
                </List>
            </Box>
        )}
        </Box>
    );
}

export default FileUploader;