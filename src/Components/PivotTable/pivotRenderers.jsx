import React from "react";
import {
  formatHeader,
  getKeyStr,
  groupByLevel,
  countLeafCols,
  countLeafRows,
  formatNumber,
} from "./pivotUtils";

export const renderCell = ({
  type,
  value,
  key,
  span,
  className,
  rowSpan,
  isTotal,
  children,
}) => {
  const CellComponent = type === "th" ? "th" : "td";
  return (
    <CellComponent
      key={key}
      colSpan={span || 1}
      rowSpan={rowSpan || 1}
      className={`${className} ${isTotal ? "pivot-total-header" : ""}`}
    >
      {children || value}
    </CellComponent>
  );
};

export const renderColHeaders = ({
  colFields,
  colKeys,
  valFields,
  aggregateFuncs,
  rowFields,
}) => {
  const levels = colFields.length || 1;
  const headerRows = Array(levels + 1)
    .fill()
    .map(() => []);

  const buildHeaderMatrix = (keys, level = 0) => {
    const grouped = groupByLevel(keys, level);
    for (const val in grouped) {
      const group = grouped[val];
      headerRows[level].push({
        value: val,
        span: countLeafCols(group, level + 1, colFields) * valFields.length,
      });
      if (level + 1 < levels) buildHeaderMatrix(group, level + 1);
    }
  };

  buildHeaderMatrix(colKeys);

  headerRows[levels] = colKeys.flatMap(() =>
    valFields.map((val) => ({
      value: `${formatHeader(val)} (${aggregateFuncs[val]})`,
    }))
  );

  if (colFields.length > 0) {
    headerRows.forEach((row, i) => {
      const cells =
        i < levels
          ? [
              {
                value: i === 0 ? "Total" : "",
                span: valFields.length,
                isTotal: true,
              },
            ]
          : valFields.map((val) => ({
              value: `${formatHeader(val)} (${aggregateFuncs[val]})`,
              isTotal: true,
            }));
      row.push(...cells);
    });
  }

  return (
    <thead>
      {headerRows.map((row, rowIndex) => (
        <tr key={`header-row-${rowIndex}`} className="pivot-header-row">
          {rowIndex === 0 &&
            rowFields.map((field, j) =>
              renderCell({
                type: "th",
                key: `row-label-${j}`,
                value: formatHeader(field),
                rowSpan: headerRows.length,
                className: "pivot-row-label-header",
              })
            )}
          {row.map((cell, i) =>
            renderCell({
              type: "th",
              key: `header-${i}`,
              value: cell.value,
              span: cell.span,
              className: "pivot-col-header",
              isTotal: cell.isTotal,
            })
          )}
        </tr>
      ))}
    </thead>
  );
};

export const renderBody = ({
  rowFields,
  colFields,
  rowKeys,
  colKeys,
  valFields,
  pivot,
  rowTotals,
  colTotals,
  grandTotals,
}) => {
  const buildRows = (keys, level = 0) => {
    const grouped = groupByLevel(keys, level);
    const rows = [];

    for (const key in grouped) {
      const group = grouped[key];
      const rowspan = countLeafRows(group, level + 1, rowFields);

      if (level < rowFields.length - 1) {
        buildRows(group, level + 1).forEach((childRow, idx) => {
          if (idx === 0) {
            childRow.unshift(
              renderCell({
                type: "td",
                key: `${level}-${key}`,
                value: key,
                rowSpan: rowspan,
                className: `pivot-row-label pivot-row-label-level-${level}`,
              })
            );
          }
          rows.push(childRow);
        });
      } else {
        const rowKeyStr = getKeyStr(group[0]);
        const dataRow = [];

        colKeys.forEach((colKey) => {
          const colKeyStr = getKeyStr(colKey);
          valFields.forEach((val) => {
            const valNum = pivot[rowKeyStr]?.[colKeyStr]?.[val];
            dataRow.push(
              renderCell({
                type: "td",
                key: `${rowKeyStr}-${colKeyStr}-${val}`,
                value: valNum != null ? formatNumber(valNum) : "",
                className: "pivot-data-cell",
              })
            );
          });
        });

        if (colFields.length > 0) {
          valFields.forEach((val) => {
            const total = rowTotals[rowKeyStr]?.[val];
            dataRow.push(
              renderCell({
                type: "td",
                key: `${rowKeyStr}-total-${val}`,
                value: total != null ? formatNumber(total) : "",
                className: "pivot-row-total",
              })
            );
          });
        }

        rows.push([
          renderCell({
            type: "td",
            key: `${level}-${key}`,
            value: key,
            className: `pivot-row-label pivot-row-label-level-${level}`,
          }),
          ...dataRow,
        ]);
      }
    }

    return rows;
  };

  const totalRow = () => (
    <tr className="pivot-total-row">
      {rowFields.length > 0 &&
        renderCell({
          type: "td",
          key: "total-label",
          span: rowFields.length,
          className: "pivot-total-label",
          children: <strong>Total</strong>,
        })}
      {colKeys.flatMap((colKey) =>
        valFields.map((val) => {
          const value = colTotals[getKeyStr(colKey)]?.[val];
          return renderCell({
            type: "td",
            key: `total-${getKeyStr(colKey)}-${val}`,
            value: formatNumber(value),
            className: "pivot-column-total",
            children: <strong>{formatNumber(value)}</strong>,
          });
        })
      )}
      {colFields.length > 0 &&
        valFields.map((val) => {
          const gt = grandTotals[val];
          return renderCell({
            type: "td",
            key: `grand-${val}`,
            value: formatNumber(gt),
            className: "pivot-grand-total",
            children: <strong>{formatNumber(gt)}</strong>,
          });
        })}
    </tr>
  );

  const structuredRows = rowFields.length
    ? buildRows(rowKeys)
    : [
        [
          ...colKeys.flatMap((colKey) =>
            valFields.map((val) => {
              const total = colTotals[getKeyStr(colKey)]?.[val];
              return renderCell({
                type: "td",
                key: `val-${getKeyStr(colKey)}-${val}`,
                value: total != null ? formatNumber(total) : "",
                className: "pivot-data-cell",
              });
            })
          ),
          ...(colFields.length
            ? valFields.map((val) => {
                const gt = grandTotals[val];
                return renderCell({
                  type: "td",
                  key: `grand-${val}`,
                  value: gt != null ? formatNumber(gt) : "",
                  className: "pivot-grand-total",
                });
              })
            : []),
        ],
      ];

  return (
    <tbody>
      {structuredRows.map((cells, i) => (
        <tr key={`row-${i}`} className="pivot-data-row">
          {cells}
        </tr>
      ))}
      {totalRow()}
    </tbody>
  );
};