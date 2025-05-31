import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import '../styling/PivotFields.css'; // Make sure this path is correct
import PivotFieldList from './PivotFieldList';
import usePivotDrag from '../../hooks/usePivotDrag';
// Assuming getAvailableFields and formatHeader are in the same or linked utils file
import { getAvailableFields, formatHeader } from '../../utils/pivotUtils'; 


const PivotFields = ({ columns, pivotConfig, setPivotConfig, aggregationOptions, setAggregationOptions }) => {
  const { onDragEnd, handleAggregationChange } = usePivotDrag({
    columns,              
    pivotConfig,
    setPivotConfig,
    aggregationOptions,
    setAggregationOptions,
  });

  // Ensure 'columns' is passed consistently or renamed to 'allFields' if it represents all possible fields
  // For clarity, if 'columns' prop to PivotFields is meant to be the list of ALL raw data fields
  // then renaming it or clarifying its role might be helpful.
  // Assuming 'columns' here refers to the full list of selectable fields.
  const availableFields = getAvailableFields(columns, pivotConfig);

  return (
    <div className="pivot-fields-container">
      <DragDropContext onDragEnd={onDragEnd}>
        {/* The fields-section acts as a wrapper, good for consistent padding/margins */}
        <div className="fields-section">
          <div className="fields-grid">
              <div>
                <h4>Available Fields</h4>
                <PivotFieldList fields={availableFields} droppableId="available" />
              </div>

              <div>
                <h4>Rows</h4>
                <PivotFieldList
                  fields={pivotConfig.rows}
                  droppableId="rows"
                  // No aggregation select needed for rows/columns usually
                />
              </div>

              <div>
                <h4>Columns</h4>
                <PivotFieldList fields={pivotConfig.columns} droppableId="columns" />
              </div>

              <div>
                <h4>Values</h4>
                <PivotFieldList
                  fields={pivotConfig.values}
                  droppableId="values"
                  aggregationOptions={aggregationOptions}
                  onAggChange={handleAggregationChange}
                  // It's good practice to pass possible aggregation types here if they vary
                  // For example: possibleAggregations={['sum', 'avg', 'count']}
                />
              </div>
            </div>
          </div>
      </DragDropContext>
    </div>
  );
};

export default PivotFields;