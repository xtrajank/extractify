import React, { useState } from 'react';
import axios from 'axios';
import FileUploader from './components/FileUploader';
import { Button, Box, Typography, FormControlLabel, FormGroup, Checkbox, Switch } from '@mui/material';

const MAIN_URL = "http://localhost:8000"

function csvSafeJoin(arr) {
  return arr.map(cell => (cell == null ? '' : String(cell))).join('\t');
}


function App() {
  const [files, setFiles] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [results, setResults] = useState([]);

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
        selectedHeaders: file.headers || [],
        combine: false,
        combineKey: "",
        combineValues: []
      }));

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
    <Box maxWidth="md" mx="auto" mt={5}>
      <Typography variant="h4" gutterBottom>EXTRACTIFY</Typography>

      <FileUploader onFilesSelected={handleFilesSelected} />

      {fileHeaders.map((fileData, index) => (
        <Box key={fileData.filename} mt={4} borderTop={1} pt={2}>
          <Typography variant="h6">{fileData.filename}</Typography>

          <Typography>Select columns to extract:</Typography>
          <FormGroup row>
            {fileData.headers?.map((header) => (
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
                  }}
                />}
                label={header}
              />
            ))}
          </FormGroup>

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

          {fileData.combine && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>Group by this column:</Typography>
              <FormGroup row>
                {fileData.headers.map((header) => (
                  <FormControlLabel
                    key={header}
                    control={<Checkbox name={`key-${fileData.filename}-${header}`} checked={fileData.combineKey === header}
                      onChange={() => {
                        const updated = [...fileHeaders];
                        updated[index].combineKey = header;
                        setFileHeaders(updated);
                      }}
                    />}
                    label={header}
                  />
                ))}
              </FormGroup>

              <Typography variant="subtitle2" gutterBottom>Add values from these columns:</Typography>
              <FormGroup row>
                {fileData.headers.map((header) => (
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

      <Box mt={4}>
        <Typography variant="body2" color="textSecondary">
          If you need help pasting your results into Google Sheets or Excel,{' '}
          <a href="/help/paste" target="_blank" rel="noopener noreferrer">
            click here
          </a>.
        </Typography>
      </Box>
    </Box>
  );
}

export default App;