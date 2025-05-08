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
    filters: [],
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
        dateNF: 'dd-mm-yyyy',
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

      const processedData = jsonData.map((row) => {
        const formattedRow = { ...row };
        Object.keys(formattedRow).forEach((key) => {
          const value = formattedRow[key];
          if (value instanceof Date && !isNaN(value)) {
            formattedRow[key] = value.toISOString().split('T')[0];
          }
        });
        return formattedRow;
      });

      setData(processedData);

      const numericFields = Object.keys(processedData[0] || {}).filter(
        (key) => typeof processedData[0][key] === 'number'
      );

      const initialAggregation = {};
      numericFields.forEach((field) => {
        initialAggregation[field] = 'sum';
      });

      setPivotConfig({
        rows: [],
        columns: [],
        values: numericFields,
        filters: [],
      });

      setAggregationOptions(initialAggregation);
    };

    if (file) reader.readAsBinaryString(file);
  };

  return (
    <div className="upload-container">
      <div className="upload-section">
        <label htmlFor="fileUpload" className="upload-button">
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
