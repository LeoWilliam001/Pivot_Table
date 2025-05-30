import { useMemo } from "react";
import {
  getKeyStr,
  getUniqueKeys,
  preprocessDateFields,
  cleanNumericValue,
  calculateTotal,
} from "./pivotUtils";

export const usePivotData = (rawData, pivotConfig, aggregationOptions) => {
  const {
    rows: rowFields = [],
    columns: colFields = [],
    values: measures = [],
  } = pivotConfig;

  const {
    pivot,
    rowKeys,
    colKeys,
    valFields,
    aggregateFuncs,
    rowTotals,
    colTotals,
    grandTotals,
  } = useMemo(() => {
    if (!rawData.length) {
      return {
        pivot: {},
        rowKeys: [],
        colKeys: [],
        valFields: [],
        aggregateFuncs: {},
        rowTotals: {},
        colTotals: {},
        grandTotals: {},
      };
    }

    const valFields = measures.map((m) => m);
    const aggregateFuncs = measures.reduce(
      (acc, m) => ({
        ...acc,
        [m]: (aggregationOptions[m] || "sum")
          .toLowerCase() 
          .replace("average", "avg"),
      }),
      {}
    );

    const allFields = [...rowFields, ...colFields];
    const dateFields = [
      ...new Set(allFields.map((f) => f.split("_")[0])),
    ].filter((base) => rawData[0]?.[base] && !rawData[0]?.[`${base}_Year`]);

    const processedData = preprocessDateFields(rawData, dateFields);

    const rowKeys = rowFields.length
      ? getUniqueKeys(processedData, rowFields)
      : [["Total"]];
    const colKeys = colFields.length
      ? getUniqueKeys(processedData, colFields)
      : [["Total"]];

    const pivot = {};
    const avgStore = {};
    const minStore = {};
    const maxStore = {};

    processedData.forEach((row) => {
      const rowKey = rowFields.length
        ? rowFields.map((f) => row[f] ?? "Total")
        : ["Total"];
      const colKey = colFields.length
        ? colFields.map((f) => row[f] ?? "Total")
        : ["Total"];

      const rowStr = getKeyStr(rowKey);
      const colStr = getKeyStr(colKey);

      if (!pivot[rowStr]) pivot[rowStr] = {};
      if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};

      valFields.forEach((valField) => {
        const aggFunc = aggregateFuncs[valField] || "sum";
        const rawVal = row[valField];
        const value = cleanNumericValue(rawVal);
        const isValid = !isNaN(value);

        if (aggFunc === "avg") {
          if (!avgStore[rowStr]) avgStore[rowStr] = {};
          if (!avgStore[rowStr][colStr]) avgStore[rowStr][colStr] = {};
          if (!avgStore[rowStr][colStr][valField])
            avgStore[rowStr][colStr][valField] = [];
          if (isValid) avgStore[rowStr][colStr][valField].push(value);
        } else if (aggFunc === "sum") {
          pivot[rowStr][colStr][valField] =
            (pivot[rowStr][colStr][valField] || 0) + (isValid ? value : 0);
        } else if (aggFunc === "count") {
          pivot[rowStr][colStr][valField] =
            (pivot[rowStr][colStr][valField] || 0) + 1;
        } else if (aggFunc === "min") {
          if (!minStore[rowStr]) minStore[rowStr] = {};
          if (!minStore[rowStr][colStr]) minStore[rowStr][colStr] = {};
          minStore[rowStr][colStr][valField] = Math.min(
            minStore[rowStr][colStr][valField] || value,
            value
          );
        } else if (aggFunc === "max") {
          if (!maxStore[rowStr]) maxStore[rowStr] = {};
          if (!maxStore[rowStr][colStr]) maxStore[rowStr][colStr] = {};
          maxStore[rowStr][colStr][valField] = Math.max(
            maxStore[rowStr][colStr][valField] || value,
            value
          );
        }
      });
    });

    for (const rowStr in avgStore) {
      for (const colStr in avgStore[rowStr]) {
        for (const valField in avgStore[rowStr][colStr]) {
          const values = avgStore[rowStr][colStr][valField];
          const sum = values.reduce((acc, v) => acc + v, 0);
          pivot[rowStr][colStr][valField] = values.length > 0 ? sum / values.length : 0;
        }
      }
    }
    for (const rowStr in minStore) {
      for (const colStr in minStore[rowStr]) {
        for (const valField in minStore[rowStr][colStr]) {
          pivot[rowStr][colStr][valField] = minStore[rowStr][colStr][valField];
        }
      }
    }
    for (const rowStr in maxStore) {
      for (const colStr in maxStore[rowStr]) {
        for (const valField in maxStore[rowStr][colStr]) {
          pivot[rowStr][colStr][valField] = maxStore[rowStr][colStr][valField];
        }
      }
    }

    const rowTotals = {};
    rowKeys.forEach((rowKey) => {
      const rowKeyStr = getKeyStr(rowKey);
      rowTotals[rowKeyStr] = {};
      valFields.forEach((valField) => {
        const values = colKeys
          .map((colKey) => pivot[rowKeyStr]?.[getKeyStr(colKey)]?.[valField])
          .filter((v) => v != null && !isNaN(v));
        rowTotals[rowKeyStr][valField] = calculateTotal(values, aggregateFuncs[valField]);
      });
    });

    const colTotals = {};
    colKeys.forEach((colKey) => {
      const colKeyStr = getKeyStr(colKey);
      colTotals[colKeyStr] = {};
      valFields.forEach((valField) => {
        const values = rowKeys
          .map((rowKey) => pivot[getKeyStr(rowKey)]?.[colKeyStr]?.[valField])
          .filter((v) => v != null && !isNaN(v));
        colTotals[colKeyStr][valField] = calculateTotal(values, aggregateFuncs[valField]);
      });
    });

    const grandTotals = {};
    valFields.forEach((valField) => {
      const values = colKeys.flatMap((colKey) =>
        rowKeys
          .map((rowKey) => pivot[getKeyStr(rowKey)]?.[getKeyStr(colKey)]?.[valField])
          .filter((v) => v != null && !isNaN(v))
      );
      grandTotals[valField] = calculateTotal(values, aggregateFuncs[valField]);
    });

    return {
      pivot,
      rowKeys,
      colKeys,
      valFields,
      aggregateFuncs,
      rowTotals,
      colTotals,
      grandTotals,
    };
  }, [rawData, rowFields, colFields, measures, aggregationOptions]);

  return {
    pivot,
    rowKeys,
    colKeys,
    valFields,
    aggregateFuncs,
    rowTotals,
    colTotals,
    grandTotals,
  };
};