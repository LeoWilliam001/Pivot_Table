export const formatHeader = (str) =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  
export const getKeyStr = (arr) => arr.map((k) => k ?? "Total").join("|");

export const getUniqueKeys = (data, fields) => {
  const map = new Map();
  data.forEach((row) => {
    const key = fields.map((f) => row[f] ?? "Total");
    const keyStr = getKeyStr(key);
    map.set(keyStr, key);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.join("|").localeCompare(b.join("|"))
  );
};

export const preprocessDateFields = (data, fields) => {
  return data.map((row) => {
    const newRow = { ...row };
    fields.forEach((field) => {
      const val = row[field];
      const date = new Date(val);
      if (val && !isNaN(date)) {
        newRow[`${field}_Year`] = date.getFullYear();
        newRow[`${field}_Month`] = date.getMonth() + 1;
        newRow[`${field}_Day`] = date.getDate();
      }
    });
    return newRow;
  });
};

export const cleanNumericValue = (value) => {
  if (typeof value === "string") {
    const cleanedValue = value.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanedValue);
  }
  return parseFloat(value);
};

export const groupByLevel = (keys, level) =>
  keys.reduce((res, key) => {
    const val = key[level] ?? "Total";
    (res[val] = res[val] || []).push(key);
    return res;
  }, {});

export const countLeafCols = (group, level, colFields) =>
  level >= colFields.length
    ? 1
    : Object.values(groupByLevel(group, level)).reduce(
        (sum, g) => sum + countLeafCols(g, level + 1, colFields),
        0
      );

export const countLeafRows = (group, level, rowFields) =>
  level >= rowFields.length
    ? group.length
    : Object.values(groupByLevel(group, level)).reduce(
        (sum, g) => sum + countLeafRows(g, level + 1, rowFields),
        0
      );

export const formatNumber = (num) =>
  num == null ? "" : Number.isInteger(num) ? num : num.toFixed(2);

export const calculateTotal = (values, aggFunc) => {
  if (!values.length) return null;
  if (aggFunc === "sum") return values.reduce((a, b) => a + (b || 0), 0);
  if (aggFunc === "avg") return values.reduce((a, b) => a + b, 0) / values.length;
  if (aggFunc === "count") return values.length;
  if (aggFunc === "min") return Math.min(...values);
  if (aggFunc === "max") return Math.max(...values);
  return null;
};