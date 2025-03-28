import React, { useState } from 'react';
import axios from 'axios';
import FileUploader from './FileUploader';
import { Button, Box, Typography, FormControlLabel, FormGroup, Checkbox, Switch, RadioGroup, Radio } from '@mui/material';
import { Link } from 'react-router-dom';

const MAIN_URL = "https://extractify-omwu.onrender.com"

function csvSafeJoin(arr) {
  return arr.map(cell => (cell == null ? '' : String(cell))).join('\t');
}


function MainApp() {
  const [files, setFiles] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [results, setResults] = useState([]);
  const [selectAllHeaders, setSelectAllHeaders] = useState({});

  const handleFilesSelected = async (selectedFiles) => {
    setFiles(selectedFiles);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await axios.post(`${MAIN_URL}/extract-headers/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const enriched = res.data.results.map(file => ({
        ...file,
        selectedHeaders: [],
        combine: false,
        combineKey: "",
        combineValues: []
      }));

      const selectAllMap = {};
      res.data.results.forEach(file => {
        selectAllMap[file.filename] = false;
      });
      
      setSelectAllHeaders(selectAllMap);
      setFileHeaders(enriched);
    } catch (err) {
      console.error("Header fetch failed:", err);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    const config = fileHeaders[0];
    if (config.selectedHeaders.length === 0) {
      alert("Please select at least one column to extract.");
      return;
    }

    config.selectedHeaders.forEach(col => formData.append("columns", col));
    console.log("Selected Headers Being Sent:", config.selectedHeaders);
    if (config.combine) {
      formData.append("combine", "true");
      formData.append("combineKey", config.combineKey);
      config.combineValues.forEach(val => formData.append("combineValues", val));
    } else {
      formData.append("combine", "false");
    }

    try {
      const res = await axios.post(`${MAIN_URL}/process-csv/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const processedResults = res.data.results || res.data;
      const wrapped = Array.isArray(processedResults) ? processedResults : [processedResults];
      setResults(wrapped);
    } catch (err) {
      console.error("Failed to process CSV files:", err);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: "#f9f9f9"}}>
      <Box sx={{maxWidth: 800, width: '70%', bgcolor: "white", borderRadius: 2,  overflowY: 'auto'}}>

        { /* title */ }
        <Typography variant="h3" gutterBottom align="center" fontWeight="bold" pb={8}>EXTRACTIFY</Typography>

        { /* file upload box */ }
        <FileUploader onFilesSelected={handleFilesSelected} />

        { /* file uploaded name */ }
        {fileHeaders.map((fileData, index) => (
          <Box key={fileData.filename} mt={4} borderTop={1} pt={2}>
            <Typography variant="h6">{fileData.filename}</Typography>

            { /* select columns box */ }
            <Typography>Select columns to extract:</Typography>
            <FormGroup row>
              {fileData.headers?.map((header) => (

                // headers checkbox
                <FormControlLabel
                  key={header}
                  control={<Checkbox name={`select-${fileData.filename}-${header}`} checked={fileData.selectedHeaders.includes(header)}
                    onChange={(e) => {
                      const updated = [...fileHeaders];
                      if (e.target.checked) {
                        updated[index].selectedHeaders.push(header);
                      } else {
                        updated[index].selectedHeaders = updated[index].selectedHeaders.filter(h => h !== header);
                      }
                      setFileHeaders(updated);
          
                      const allSelected = updated[index].selectedHeaders.length === fileData.headers.length;
                      setSelectAllHeaders(prev => ({
                        ...prev,
                        [fileData.filename]: allSelected
                      }));
                    }}
                  />}
                  label={header}
                />
              ))}

            </FormGroup>
            
            <FormGroup>
              { /* select all  box */ }
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectAllHeaders[fileData.filename] || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const updated = [...fileHeaders];
                      updated[index].selectedHeaders = checked ? [...fileData.headers] : [];
                      setFileHeaders(updated);
                      setSelectAllHeaders(prev => ({
                        ...prev,
                        [fileData.filename]: checked
                      }));
                    }}
                  />
                }
                label = "Select All"
              />
            </FormGroup>

            { /* combine rows switch */ }
            <FormControlLabel
              control={
                <Switch
                  name={`combine-${fileData.filename}`}
                  checked={fileData.combine}
                  onChange={(e) => {
                    const updated = [...fileHeaders];
                    updated[index].combine = e.target.checked;
                    setFileHeaders(updated);
                  }}
                />
              }
              label="Combine rows?"
            />

            { /* checklists for combining rows */ }
            {fileData.combine && (
              <Box mt={2}>
                { /* group checklist */ }
                <Typography variant="subtitle2" gutterBottom>Group by this column:</Typography>
                <RadioGroup
                  row
                  value={fileData.combineKey}
                  onChange={(e) => {
                    const updated = [...fileHeaders];
                    updated[index].combineKey = e.target.value;

                    // Optional: also remove it from value columns if it's there
                    updated[index].combineValues = updated[index].combineValues.filter(val => val !== e.target.value);

                    setFileHeaders(updated);
                  }}
                >
                  {fileData.headers.map((header) => (
                    <FormControlLabel
                      key={header}
                      value={header}
                      control={<Radio />}
                      label={header}
                    />
                  ))}
                </RadioGroup>
                
                { /* combine columns */ }
                <Typography variant="subtitle2" gutterBottom>Add values from these columns:</Typography>
                <FormGroup row>
                  {fileData.headers.filter((header) => header !== fileData.combineKey).map((header) => (
                    <FormControlLabel
                      key={header + '-val'}
                      control={<Checkbox name={`val-${fileData.filename}-${header}`} checked={fileData.combineValues.includes(header)}
                        onChange={(e) => {
                          const updated = [...fileHeaders];
                          if (e.target.checked) {
                            updated[index].combineValues.push(header);
                          } else {
                            updated[index].combineValues = updated[index].combineValues.filter(h => h !== header);
                          }
                          setFileHeaders(updated);
                        }}
                      />}
                      label={header}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
          </Box>
        ))}

        {fileHeaders.length > 0 && (
          <Box mt={4}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Process Files
            </Button>
          </Box>
        )}

        { /* output for normal table */ }
        {Array.isArray(results) && results.length > 0 && results.map((result, index) => (
          <Box key={result.filename || index} mt={5} p={2} border={1} borderRadius={2}>
            <Typography variant="h6">{result.filename}</Typography>

            {result.error ? (
              <Typography color="error">{result.error}</Typography>
            ) : (
              <>
                {Array.isArray(result.normal?.headers) && Array.isArray(result.normal?.rows) && result.normal.headers.length > 0 && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const text = csvSafeJoin(result.normal.headers) + '\n' +
                          result.normal.rows.map(row => csvSafeJoin(row)).join('\n');
                        navigator.clipboard.writeText(text);
                      }}
                    >
                      Copy
                    </Button>

                    <Typography variant="subtitle2" mt={2}>Normal Table</Typography>
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {csvSafeJoin(result.normal.headers)}
                      {'\n'}
                      {result.normal.rows.map(row => csvSafeJoin(row)).join('\n')}
                    </pre>
                  </>
                )}

                { /* output for combined table */ } 
                {Array.isArray(result.combined?.headers) && Array.isArray(result.combined?.rows) && result.combined.headers.length > 0 && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const text = csvSafeJoin(result.combined.headers) + '\n' +
                          result.combined.rows.map(row => csvSafeJoin(row)).join('\n');
                        navigator.clipboard.writeText(text);
                      }}
                      style={{ marginTop: "1rem" }}
                    >
                      Copy
                    </Button>

                    <Typography variant="subtitle2" mt={2}>Combined Table</Typography>
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                      {csvSafeJoin(result.combined.headers)}
                      {'\n'}
                      {result.combined.rows.map(row => csvSafeJoin(row)).join('\n')}
                    </pre>
                  </>
                )}
              </>
            )}
          </Box>
        ))}

        { /* help link */ }
        <Box mt={4}>
          <Typography variant="body2" color="textSecondary">
            If you need help pasting your results into Google Sheets or Excel,{' '}
            <Link to="/help/paste">
              click here
            </Link>.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default MainApp;