#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <set>
#include <unordered_map>
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
std::unordered_map<std::string, std::vector<std::string>> extract_columns(const std::string& input_filename, const std::vector<std::string>& input_header_names) {
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
                auto find_header = std::find(input_header_names.begin(), input_header_names.end(), header);
                if (find_header != input_header_names.end()) {
                    header_indices.push_back(column_index);
                    headers_vector.push_back(header); // store in headers vector if specified
                }
                column_index++;
            }
            
            // create map item for each header specified with empty vector values
            std::unordered_map<std::string, std::vector<std::string>> columns;
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
                    columns_vector.push_back(cell);
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
std::vector<std::string> input_columns(size_t num_inputs, char* inputs[]) {
    std::vector<std::string> input_columns_vector;
    for (int i = 1; i < num_inputs; i++) {
        if (valid_file(inputs[i])) {
            continue;
        }

        if (inputs[i][0] != '\"' && inputs[i][strlen(inputs[i])] == '\"') {
            std::cerr << "Error: " << inputs[i] << " missing both \".";
        } else if (inputs[i][0] == '\"') {
            std::cerr << "Error: " << inputs[i] << " missing beginning \".";
        } else if (inputs[i][strlen(inputs[i])] == '\"') {
            std::cerr << "Error: " << inputs[i] << " missing ending \".";
        }

        input_columns_vector.push_back(inputs[i]);
    }

    return input_columns_vector;
}

// sum up column

// output columns

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "No input provided." << std::endl;
        return 1;
    }

    extract_headers(argv[1]);
    extract_columns(argv[1], input_columns(argc, argv));

    /*for (const auto& [key, vec] : extract_columns(argv[1], input_columns(argc, argv))) {
        std::cout << key << ": ";
        for (std::string val : vec) {
            std::cout << val << " ";
        }
        std::cout << std::endl;
    }*/

    return 0;
}
