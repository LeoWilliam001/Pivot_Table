import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import '../styling/PivotFields.css';
import PivotFieldList from './PivotFieldList';
import usePivotDrag from '../../hooks/usePivotDrag';
import { getAvailableFields } from '../../utils/pivotUtils';

const PivotFields = ({ columns, pivotConfig, setPivotConfig, aggregationOptions, setAggregationOptions }) => {
  const { onDragEnd, handleAggregationChange } = usePivotDrag({
    columns,              
    pivotConfig,
    setPivotConfig,
    aggregationOptions,
    setAggregationOptions,
  });

  const availableFields = getAvailableFields(columns, pivotConfig);

  return (
    <div className="pivot-fields-container">
      {/* <h3>Pivot Table Fields</h3> */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="fields-section">

          {/* <div className="assigned-fields"> */}
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
                  aggregationOptions={aggregationOptions}
                  onAggChange={handleAggregationChange}
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
                />
              </div>
            </div>
          </div>
        {/* </div> */}
      </DragDropContext>
    </div>
  );
};

export default PivotFields;
