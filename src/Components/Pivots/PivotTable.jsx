import React from 'react';
import '../styling/PivotTable.css';
import {
  calculateAggregation,
  generatePivotData,
  getColumnKeys,
  initializeAggregationTrackers
} from '../../utils/pivotTable';

const PivotTable = ({ data = [], pivotConfig = { rows: [], columns: [], values: [] }, aggregationOptions = {} }) => {
  const { groupedData, rowFields, columnFields, valueFields } = generatePivotData(data, pivotConfig);
  const rowKeys = Object.keys(groupedData);
  const columnKeys = getColumnKeys(groupedData, rowKeys);
  const colAggregationTracker = initializeAggregationTrackers(columnKeys, valueFields);

  if (!data || data.length === 0) {
    return <div className="no-data">No data available. Please upload a file.</div>;
  }

  if ((!rowFields.length && !columnFields.length)) {
    return (
      <table className="pivot-table">
        <thead>
          <tr>{Object.keys(data[0] || {}).map((header, index) => <th key={index}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((value, colIndex) => <td key={colIndex}>{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="pivot-table-container">
      <div className="pivot-table-wrapper">
        <table className="pivot-table">
          <thead>
            <tr>
              <th rowSpan="2">{rowFields.join(', ')}</th>
              {columnKeys.map(colKey => (
                <th key={colKey} colSpan={valueFields.length}>{colKey || '(blank)'}</th>
              ))}
              {valueFields.map(valueField => (
                <th key={`gt-${valueField}`} rowSpan="2">
                  Grand Total ({aggregationOptions[valueField] || 'sum'}({valueField}))
                </th>
              ))}
            </tr>
            <tr>
              {columnKeys.map(colKey =>
                valueFields.map(valueField => (
                  <th key={`${colKey}-${valueField}`}>
                    {aggregationOptions[valueField] || 'sum'}({valueField})
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((rowKey, rowIndex) => {
              const rowValueTotals = {};
              valueFields.forEach(field => rowValueTotals[field] = 0);
  
              const rowCells = columnKeys.map(colKey =>
                valueFields.map(valueField => {
                  const method = aggregationOptions[valueField] || 'sum';
                  const cellData = groupedData[rowKey]?.[colKey];
                  let value = 0;
  
                  if (cellData) {
                    value = calculateAggregation(cellData.values, valueField, method);
                    rowValueTotals[valueField] += value;
                  }
  
                  const display = method === 'average' ? value.toFixed(2) : value;
                  return <td key={`${colKey}-${valueField}`}>{display}</td>;
                })
              ).flat();
  
              return (
                <tr key={rowIndex}>
                  <td className="row-header">{rowKey || '(blank)'}</td>
                  {rowCells}
                  {valueFields.map(valueField => (
                    <td key={`rt-${rowKey}-${valueField}`}>
                      <strong>{rowValueTotals[valueField]}</strong>
                    </td>
                  ))}
                </tr>
              );
            })}
  
            <tr className="grand-total-row">
              <td><strong>Grand Total</strong></td>
              {columnKeys.map(colKey =>
                valueFields.map(valueField => {
                  const method = aggregationOptions[valueField] || 'sum';
                  let columnTotal = 0;
  
                  rowKeys.forEach(rowKey => {
                    const cellData = groupedData[rowKey]?.[colKey];
                    if (cellData) {
                      columnTotal += calculateAggregation(cellData.values, valueField, method);
                    }
                  });
  
                  const display = method === 'average' 
                    ? (columnTotal / rowKeys.length).toFixed(2) 
                    : columnTotal;
                  return <td key={`ct-${colKey}-${valueField}`}><strong>{display}</strong></td>;
                })
              )}
              {valueFields.map(valueField => {
                const method = aggregationOptions[valueField] || 'sum';
                let grandTotal = 0;
  
                rowKeys.forEach(rowKey => {
                  columnKeys.forEach(colKey => {
                    const cellData = groupedData[rowKey]?.[colKey];
                    if (cellData) {
                      grandTotal += calculateAggregation(cellData.values, valueField, method);
                    }
                  });
                });
  
                const display = method === 'average'
                  ? (grandTotal / (rowKeys.length * columnKeys.length)).toFixed(2)
                  : grandTotal;
                return <td key={`gt-${valueField}`}><strong>{display}</strong></td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PivotTable;