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

  const generateHierarchicalColumns = () => {
    if (!columnFields || columnFields.length <= 1) {
      const columnKeys = getColumnKeys(groupedData, rowKeys);
      return {
        uniqueTopValues: [],
        uniqueSecondValues: [],
        hierarchicalColumns: columnKeys.map(colKey => ({
          key: colKey,
          display: colKey || '(blank)'
        }))
      };
    }

    const columnValues = {};
    columnFields.forEach(field => {
      columnValues[field] = new Set();
    });

    data.forEach(row => {
      columnFields.forEach(field => {
        columnValues[field].add(row[field] || '(blank)');
      });
    });

    const topLevelField = columnFields[0];
    const secondLevelField = columnFields[1];

    const uniqueTopValues = Array.from(columnValues[topLevelField]);
    const uniqueSecondValues = Array.from(columnValues[secondLevelField]);

    const hierarchicalColumns = [];
    uniqueTopValues.forEach(topValue => {
      uniqueSecondValues.forEach(secondValue => {
        hierarchicalColumns.push({
          key: `${topValue}|${secondValue}`,
          topLevel: topValue,
          secondLevel: secondValue,
          display: `${topValue}|${secondValue}`
        });
      });
    });

    return { uniqueTopValues, uniqueSecondValues, hierarchicalColumns };
  };

  const { uniqueTopValues, uniqueSecondValues, hierarchicalColumns } = generateHierarchicalColumns();
  const columnKeys = hierarchicalColumns.map(col => col.key);
  const colAggregationTracker = initializeAggregationTrackers(columnKeys, valueFields);

  return (
    <div className="pivot-table-container">
      <table className="pivot-table">
        <thead>
          {columnFields.length > 1 ? (
            <>
              <tr>
                <th rowSpan="3">{rowFields.join(', ')}</th>
                {uniqueTopValues.map(topValue => (
                  <th key={topValue} colSpan={uniqueSecondValues.length * valueFields.length}>{topValue}</th>
                ))}
                {valueFields.map(valueField => (
                  <th key={`gt-${valueField}`} rowSpan="3">
                    Grand Total ({aggregationOptions[valueField] || 'sum'}({valueField}))
                  </th>
                ))}
              </tr>
              <tr>
                {uniqueTopValues.map(topValue => 
                  uniqueSecondValues.map(secondValue => (
                    <th key={`${topValue}-${secondValue}`} colSpan={valueFields.length}>{secondValue}</th>
                  ))
                )}
              </tr>
              <tr>
                {hierarchicalColumns.map(column => 
                  valueFields.map(valueField => (
                    <th key={`${column.key}-${valueField}`}>
                      {aggregationOptions[valueField] || 'sum'}({valueField})
                    </th>
                  ))
                )}
              </tr>
            </>
          ) : (
            <>
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
            </>
          )}
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

                const display = method === 'average' ? value.toFixed(2) : value.toFixed(2);
                return <td key={`${colKey}-${valueField}`}>{display}</td>;
              })
            ).flat();

            return (
              <tr key={rowIndex}>
                <td className="row-header">{rowKey || '(blank)'}</td>
                {rowCells}
                {valueFields.map(valueField => (
                  <td key={`rt-${rowKey}-${valueField}`}>
                    <strong>{rowValueTotals[valueField].toFixed(2)}</strong>
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
                  : columnTotal.toFixed(2);
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
                : grandTotal.toFixed(2);
              return <td key={`gt-${valueField}`}><strong>{display}</strong></td>;
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PivotTable;