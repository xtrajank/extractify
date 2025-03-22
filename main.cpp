/*
Title: Extractify (Backend)
Author: Owen Rasor
Description: 

This C++ program processes CSV files through command-line input, extracts specified columns,
and optionally combines rows based on a grouping column.

Functionality Overview:
- Validates `.csv` file input.
- Parses and trims CSV headers and data rows.
- Extracts specified column values by header name.
- If headers are passed with a `*` prefix, the program aggregates rows (sums numeric values) based on a shared key.
- Displays both the original extracted data and (if applicable) the grouped/aggregated output in formatted tables.

Command-Line Usage:
- Input should be structured as:
  `./extractify file.csv Header1 Header2 ... *GroupColumn *ValueColumn1 *ValueColumn2 ...`
- The program first outputs the data in its raw column format.
- If any headers are passed with a `*`, it treats the first one as the key for grouping and the rest as numeric values to aggregate.

Output:
- A well-formatted "Normal Table" with raw data.
- If grouping is performed, a "Combined Table" showing aggregated values by group.

Notes:
- All file I/O and formatting is handled manually (no external CSV or table libraries).
- Input validation includes CSV file extension and basic numeric conversion checks.
*/

#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <set>
#include <map>
#include <iomanip>
#include <cstdint>
#include <cstring>

// validates input as a csv file
bool valid_file(const std::string& input) {
    std::string file_type;
    size_t dot_pos = input.rfind('.');   // position index of last '.' in file name

    if (dot_pos != std::string::npos) {
        file_type = input.substr(dot_pos);  // file_type = everything include and after the last '.'
    } else {
        return false;   // if this is not a file it will be false
    }

    if (file_type == ".csv") {
        return true;
    } else {
        return false;
    }
}

// trims trailing white space
std::string trim(const std::string& str) {
    size_t first = str.find_first_not_of(" \t\n\r");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\n\r");
    return str.substr(first, last - first + 1);
}

// get all the file headers
std::vector<std::string> extract_headers(const std::string& input_filename) {
    // only open file if is a valid csv
    if (valid_file(input_filename)) {
        std::ifstream input_file(input_filename);

        std::vector<std::string> headers_vector;
        // get the header line from file and store it as a vector
        if (input_file.is_open()) {
            std::string headers_line; 
            getline(input_file, headers_line); // gets the first line

            std::stringstream headers_ss(headers_line); // create a string stream for the line
            std::string header;
            while(getline(headers_ss, header, ',')) { // sepearte headers by comma
                headers_vector.push_back(header); // store in headers vector
            }
            
            input_file.close();
        } else {
            std::cerr << "Error: Unable to open file " << input_filename << std::endl;
            return {};
        }

        return headers_vector;
    } else {
        std::cerr << "Error: Could not extract headers from " << input_filename << std::endl;
        return {};
    }
}

// create map from columns
std::map<std::string, std::vector<std::string>> extract_columns(const std::string& input_filename, const std::vector<std::string>& input_header_names) {
    // only open file if is a valid csv
    if (valid_file(input_filename)) {
        std::ifstream input_file(input_filename);

        // parse file line by line
        if (input_file.is_open()) {
            // get headers
            std::string headers_line; 
            getline(input_file, headers_line); // gets the first line for headers

            std::stringstream headers_ss(headers_line); // create a string stream for the line
            std::string header;
            std::vector<std::string> headers_vector;
            std::vector<size_t> header_indices;
            size_t column_index = 0;
            while(getline(headers_ss, header, ',')) { // sepearte headers by comma
                // put only headers in map that are requested
                header = trim(header);
                auto find_header = std::find(input_header_names.begin(), input_header_names.end(), header);
                if (find_header != input_header_names.end()) {
                    header_indices.push_back(column_index);
                    headers_vector.push_back(header); // store in headers vector if specified
                }
                column_index++;
            }
            
            // create map item for each header specified with empty vector values
            std::map<std::string, std::vector<std::string>> columns;
            for (int i = 0; i < headers_vector.size(); i++) {
                columns[headers_vector[i]] = {};
            }

            // get columns for specified headers
            std::string columns_line;
            while(getline(input_file, columns_line)) {
                std::stringstream columns_ss(columns_line); // create stringstream for column line
                std::string cell;
                std::vector<std::string> columns_vector;
                while(getline(columns_ss, cell, ',')) {
                    columns_vector.push_back(trim(cell));
                }
                
                // store specified columns in proper value vector
                for (int i = 0; i < header_indices.size(); i++) {
                    columns[headers_vector[i]].push_back(columns_vector[header_indices[i]]);
                }
            }
        
            input_file.close();

            return columns;
        } else {
            std::cerr << "Error: Unable to open file " << input_filename << std::endl;
            return {};
        }
    } else {
        std::cerr << "Error: Could not extract columns from " << input_filename << std::endl;
        return {};
    }
}

// get all the header names wanted from inputs
std::vector<std::string> input_columns(const int& inputs_start, const size_t& num_inputs, char* inputs[]) {
    std::vector<std::string> input_columns_vector;
    for (int i = inputs_start; i < num_inputs + inputs_start; i++) {
        if (valid_file(inputs[i])) {
            continue;
        }

        input_columns_vector.push_back(inputs[i]);
    }
    return input_columns_vector;
}

// ensures the value can be converted to a double
bool is_valid_double(const std::string& str) {
    try {
        std::stod(str);
    } catch (...) {
        return false;
    }
    return true;
}

// adds rows together where row names are the same. first char must = * to be recognized as a combine rows
std::map<std::string, std::map<std::string, double>> combine_rows(const std::map<std::string, std::vector<std::string>>& columns, const std::string& key_col_input, const std::vector<std::string>& value_col_inputs) {
    std::map<std::string, std::map<std::string, double>> combined_map;
    std::map<std::string, double> common_rows;
    std::vector<std::string> col_value;

    const auto& keys = columns.at(key_col_input); // ie Stores
    size_t num_rows = keys.size();

    for (size_t i = 0; i < num_rows; i++) {
        const std::string& key = keys[i];

        for (const std::string& col_name : value_col_inputs) {
            if (i >= columns.at(col_name).size()) continue;

            const std::string& val_str = columns.at(col_name)[i];
            try {
                double value = std::stod(val_str);
                combined_map[key][col_name] += value;
            } catch (...) {
                std::cerr << "Error: Cannot convert values in " << col_name << " to doubles." << std::endl;
                return {};
            }
        }
    }

    return combined_map;
}

// calculate column widths
std::map<std::string, size_t> calculate_column_widths(const std::vector<std::string>& headers, const std::map<std::string, std::vector<std::string>>& columns) {

    std::map<std::string, size_t> col_widths;

    for (const auto& header : headers) {
        size_t max_width = header.length();
        for (const auto& cell : columns.at(header)) {
            if (cell.length() > max_width) {
                max_width = cell.length();
            }
        }
        col_widths[header] = max_width + 5;
    }

    return col_widths;
}


// output columns not combined
void output_normal(std::ostream& os, const std::string& table_name, const std::vector<std::string>& headers, const std::map<std::string, std::vector<std::string>>& columns) {
    auto col_widths = calculate_column_widths(headers, columns);

    // headers
    for (const auto& header : headers) {
        os << std::left << std::setw(col_widths[header]) << header;  // added spacing
    }
    os << "\n\n";

    // get row count
    size_t row_count = columns.begin()->second.size();

    // print rows
    for (size_t i = 0; i < row_count; i++) {
        for (const auto& header : headers) {
            const std::string& cell = columns.at(header)[i];
            os << std::left << std::setw(col_widths[header]) << cell;  // added spacing
        }
        os << "\n";
    }

    os << "Row count: " << row_count << '\n';    
}

// output combined columns
void output_combined(std::ostream& os, const std::string& table_name, const std::string& group_col_name, const std::vector<std::string>& value_col_names, const std::map<std::string, std::map<std::string, double>>& combined) {
    // print centered table name
    std::map<std::string, size_t> col_widths;
    col_widths[group_col_name] = group_col_name.size();
    for (const auto& col : value_col_names) {
        col_widths[col] = col.size();
    }

    for (const auto& [group, values_map] : combined) {
        col_widths[group_col_name] = std::max(col_widths[group_col_name], group.size());
        for (const auto& col : value_col_names) {
            std::ostringstream oss;
            oss << std::fixed << std::setprecision(2) << values_map.at(col);
            col_widths[col] = std::max(col_widths[col], oss.str().size());
        }
    }

    os << table_name << "\n\n";

    // print column headers
    os << std::setw(col_widths[group_col_name] + 5) << std::left << group_col_name;
    for (const auto& col : value_col_names) {
        os << std::setw(col_widths[col] + 5) << std::left << col;
    }
    os << "\n\n";

    // print combined rows
    size_t row_count = 0;
    for (const auto& [group, values_map] : combined) {
        os << std::setw(col_widths[group_col_name] + 2) << std::left << group;
        for (const auto& col : value_col_names) {
            double val = values_map.count(col) ? values_map.at(col) : 0.0;
            os << std::setw(col_widths[group_col_name] + 2) << std::left << std::fixed << std::setprecision(2) << val;
        }
        os << "\n";
        row_count++;
    }
    os << "Row count: " << row_count << '\n';
}


int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "No input provided." << std::endl;
        return 1;
    }
    
    // find file indices
    for (int i = 1; i < argc; i++) {
        if (valid_file(argv[i])) {
            size_t curr_index = i + 1;
            while(curr_index < argc && !valid_file(argv[curr_index]) && argv[curr_index][0] != '*') {
                curr_index++;
            }
            size_t num_inputs = curr_index - (i + 1);
            //extract_headers(argv[i]);
            auto selected_headers = input_columns(i + 1, num_inputs, argv);
            auto columns = extract_columns(argv[i], selected_headers);
            
            // output columns
            output_normal(std::cout, "Normal Table", selected_headers, columns);

            if (argc > (i + num_inputs + 1) && !valid_file(argv[i + num_inputs + 1])) {
                // get key column input
                size_t current_index = i + num_inputs + 1;
                std::string combine_key = argv[current_index] + 1;
                current_index++;

                // get value column inputs
                std::vector<std::string> combine_inputs_vec;
                while (current_index < argc && argv[current_index][0] == '*') {
                    std::string input = argv[current_index] + 1;
                    combine_inputs_vec.push_back(input);
                    current_index++;
                }

                // combine rows
                auto combined = combine_rows(columns, combine_key, combine_inputs_vec);

                // output combine rows
                output_combined(std::cout, "Combined Table", combine_key, combine_inputs_vec, combined);
            }
        }
    }

    return 0;
}
