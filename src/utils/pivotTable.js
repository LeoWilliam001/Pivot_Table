export const calculateAggregation = (values, field, method) => {
  switch (method) {
    case 'sum':
      return values
        .reduce((sum, val) => sum + (Number(val[field]) || 0), 0)
        .toFixed(2);
    case 'average':
      const sum = values.reduce((sum, val) => sum + (Number(val[field]) || 0), 0);
      return values.length ? (sum / values.length).toFixed(2) : '0.00';
    case 'count':
      return values.length.toFixed(2); // Count is converted to a string with two decimal places
    case 'min':
      return Math.min(...values.map(val => Number(val[field]) || 0)).toFixed(2);
    case 'max':
      return Math.max(...values.map(val => Number(val[field]) || 0)).toFixed(2);
    default:
      return values
        .reduce((sum, val) => sum + (Number(val[field]) || 0), 0)
        .toFixed(2);
  }
};

  
  export const generatePivotData = (data, pivotConfig) => {
    if (!data || data.length === 0) return { groupedData: {}, rowFields: [], columnFields: [], valueFields: [] };
  
    const groupedData = data.reduce((acc, item) => {
      const rowKey = (pivotConfig.rows || []).map(field => item[field]).join('|');
      const colKey = (pivotConfig.columns || []).map(field => item[field]).join('|');
  
      if (!acc[rowKey]) acc[rowKey] = {};
      if (!acc[rowKey][colKey]) acc[rowKey][colKey] = { values: [] };
      acc[rowKey][colKey].values.push(item);
  
      return acc;
    }, {});
  
    return {
      groupedData,
      rowFields: pivotConfig.rows || [],
      columnFields: pivotConfig.columns || [],
      valueFields: pivotConfig.values || []
    };
  };
  
  export const getColumnKeys = (groupedData, rowKeys) => {
    const columnKeysSet = new Set();
    rowKeys.forEach(rowKey => {
      Object.keys(groupedData[rowKey] || {}).forEach(colKey => columnKeysSet.add(colKey));
    });
    return Array.from(columnKeysSet);
  };
  
  export const initializeAggregationTrackers = (columnKeys, valueFields) => {
    const trackers = {};
    columnKeys.forEach(colKey => {
      valueFields.forEach(valueField => {
        trackers[`${colKey}-${valueField}`] = {
          sum: 0,
          count: 0,
          min: Infinity,
          max: -Infinity
        };
      });
    });
    return trackers;
  };