# Extractify (Backend)

**Author:** Owen Rasor  
**Description:** A command-line C++ utility that extracts, filters, and optionally aggregates data from CSV files.

---

## Overview

Extractify simplifies the process of working with CSV files by allowing users to:
- Select specific columns by header name
- Combine rows with matching keys and sum numeric values
- Display well-formatted output in the terminal

---

## Features

- CSV file validation  
- Header-based column selection  
- Row grouping and aggregation using a key  
- Clean, aligned output formatting  
- Trims whitespace from cell values  
- Error handling for invalid inputs or conversion issues

---

## Usage

### Command Format

```bash
./extractify file.csv Header1 Header2 ... *GroupColumn *ValueColumn1 *ValueColumn2 ...
