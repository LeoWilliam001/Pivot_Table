export const getAvailableFields = (columns, pivotConfig) => {
    const usedFields = [
      ...pivotConfig.rows,
      ...pivotConfig.columns,
      ...pivotConfig.values,
      ...pivotConfig.filters,
    ];
    return columns.filter((col) => !usedFields.includes(col));
  };
  