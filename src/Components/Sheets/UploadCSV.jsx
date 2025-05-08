import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import PivotFields from '../Pivots/PivotFields';
import PivotTable from '../Pivots/PivotTable';
import '../styling/UploadCSV.css';

const UploadCSV = () => {
  const [data, setData] = useState([]);
  const [pivotConfig, setPivotConfig] = useState({
    rows: [],
    columns: [],
    values: [],
    filters: []
  });
  const [aggregationOptions, setAggregationOptions] = useState({});

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const binaryStr = evt.target.result;
      const workbook = XLSX.read(binaryStr, { 
        type: 'binary',
        cellDates: true, 
        dateNF: 'dd-mm-yyyy' 
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      console.log(sheet);
      // First get raw data to identify date columns
      const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });
      // console.log(jsonData);
      
      // Process data with normalized dates
      const processedData = jsonData.map(row => {
        const processedRow = {...row};
        Object.keys(processedRow).forEach(key => {
          const value = processedRow[key];
          
          // Handle Excel serial dates (numbers)
          if (typeof value === 'number' && value > 10000 && value < 2958465) {
            processedRow[key] = excelSerialToDate(value).toISOString().split('T')[0];
            console.log(processedRow[key]);
          }
          // Handle string dates with mixed separators
          else if (typeof value === 'string') {
            const normalizedDate = normalizeDateString(value);
            if (normalizedDate) {
              processedRow[key] = normalizedDate;
            }
          }
        });
        return processedRow;
      });

      setData(processedData);
      
      // Initialize with numeric fields as values (excluding dates)
      const numericFields = Object.keys(processedData[0] || {}).filter(
        key => typeof processedData[0][key] === 'number' && 
              !isExcelDate(processedData[0][key])
      );
      
      const initialAggregation = {};
      numericFields.forEach(field => {
        initialAggregation[field] = 'sum';
      });

      setPivotConfig({
        rows: [],
        columns: [],
        values: numericFields,
        filters: []
      });
      setAggregationOptions(initialAggregation);
    };

    if (file) reader.readAsBinaryString(file);
  };

  // Helper functions
  function excelSerialToDate(serial) {
    const excelEpoch = new Date(1899, 11, 30);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + (serial - 1) * millisecondsPerDay);
  }

  function isExcelDate(value) {
    return typeof value === 'number' && value >= 1 && value <= 2958465;
  }

  function normalizeDateString(dateString) {
    // Skip if not a date-like string
    if (typeof dateString !== 'string') return null;
    
    // Try different date formats
    const formats = [
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,     // D-M-YYYY or DD-MM-YYYY
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,     // YYYY-M-D or YYYY-MM-DD
      /^(\w{3})[-/](\d{1,2})[-/](\d{4})$/,       // Mon-DD-YYYY
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/,     // D-M-YY or DD-MM-YY
    ];
    

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const parts = match.slice(1);
        // Convert to YYYY-MM-DD format
        if (match[0].includes('Mon')) {
          const monthMap = { Jan: '01', Feb: '02', Mar: '03', /* ... */ };
          return `${parts[2]}-${monthMap[parts[0]]}-${parts[1].padStart(2, '0')}`;
        } else if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY-MM-DD
        } else {
          return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY → YYYY-MM-DD
        }
      }
    }
    
    // If no format matched, return original value
    return dateString;
  }

  return (
    <div className="upload-container">
      <div className="upload-section">
        <label htmlFor="fileUpload" className='upload-button'>
          Upload Excel File
        </label>
        <input
          type="file"
          id="fileUpload"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {data.length > 0 && (
        <div className="pivot-container">
          <PivotFields 
            columns={Object.keys(data[0])} 
            pivotConfig={pivotConfig}
            setPivotConfig={setPivotConfig}
            aggregationOptions={aggregationOptions}
            setAggregationOptions={setAggregationOptions}
          />
          <PivotTable 
            data={data} 
            pivotConfig={pivotConfig}
            aggregationOptions={aggregationOptions}
          />
        </div>
      )}
    </div>
  );
};

export default UploadCSV;