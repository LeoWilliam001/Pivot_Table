import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const PivotFieldList = ({ fields, droppableId, aggregationOptions = {}, onAggChange = () => {} }) => (
  <Droppable droppableId={droppableId}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`field-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
      >
        {fields.map((field, index) => (
          <Draggable key={field} draggableId={field} index={index}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`field-item ${snapshot.isDragging ? 'dragging' : ''}`}
              >
                {field}
                {droppableId === 'values' && (
                  <select
                    value={aggregationOptions[field] || 'sum'}
                    onChange={(e) => onAggChange(field, e.target.value)}
                    className="aggregation-select"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="sum">Sum</option>
                    <option value="average">Average</option>
                    <option value="count">Count</option>
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                  </select>
                )}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

export default PivotFieldList;
