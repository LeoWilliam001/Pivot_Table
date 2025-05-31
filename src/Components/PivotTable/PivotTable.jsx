import React from "react";
import "../styling/PivotTable.css";
import { usePivotData } from "./usePivotData";
import { renderColHeaders, renderBody } from "./pivotRenderers";

const PivotTable = ({
  data: rawData = [],
  pivotConfig = { rows: [], columns: [], values: [] },
  aggregationOptions = {},
}) => {
  const { rows: rowFields = [], columns: colFields = [] } = pivotConfig;

  const { pivot, rowKeys, colKeys, valFields, aggregateFuncs, rowTotals, colTotals, grandTotals, } = usePivotData(rawData, pivotConfig, aggregationOptions);

  if (!rawData.length || (rowFields.length === 0 && colFields.length === 0)) {
    return null;
  }

  return (
    <div className="pivot-table-container">
      <table className="pivot-table">
        {renderColHeaders({ colFields, colKeys, valFields, aggregateFuncs, rowFields, })}
        {renderBody({ rowFields, colFields, rowKeys, colKeys, valFields, pivot, rowTotals, colTotals, grandTotals, })}
      </table>
    </div>
  );
};

export default React.memo(PivotTable);