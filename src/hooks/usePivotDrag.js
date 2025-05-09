import { getAvailableFields } from '../utils/pivotUtils';

const usePivotDrag = ({ columns, pivotConfig, setPivotConfig, aggregationOptions, setAggregationOptions }) => {
  const onDragEnd = ({ source, destination }) => {
    // Return early if there's no destination or if dropped in the same position
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    // Handle reordering within the same list
    if (source.droppableId === destination.droppableId) {
      const list = [...pivotConfig[source.droppableId]];
      const [movedItem] = list.splice(source.index, 1);
      list.splice(destination.index, 0, movedItem);
      
      setPivotConfig({
        ...pivotConfig,
        [source.droppableId]: list
      });
      return;
    }

    // Handle moving between different lists
    const getList = (id) =>
      id === 'available'
        ? getAvailableFields(columns, pivotConfig)
        : [...pivotConfig[id]];

    const sourceList = getList(source.droppableId);
    const destList = getList(destination.droppableId);

    // Remove the item from the source list
    const [removed] = sourceList.splice(source.index, 1);

    // Check for duplicates when moving to a non-available list
    if (destination.droppableId !== 'available' && destList.includes(removed)) {
      return; // Don't allow duplicates across sections
    }
    
    // Add the item to the destination list
    destList.splice(destination.index, 0, removed);

    // Create the new pivot configuration
    const newConfig = { ...pivotConfig };
    
    // Update source list if it's not the available section
    if (source.droppableId !== 'available') {
      newConfig[source.droppableId] = sourceList;
    }
    
    // Update destination list if it's not the available section
    if (destination.droppableId !== 'available') {
      newConfig[destination.droppableId] = destList;
    }

    // Set default aggregation for values
    if (destination.droppableId === 'values' && !aggregationOptions[removed]) {
      setAggregationOptions({ ...aggregationOptions, [removed]: 'sum' });
    }

    setPivotConfig(newConfig);
  };

  const handleAggregationChange = (field, method) => {
    setAggregationOptions({ ...aggregationOptions, [field]: method });
  };

  return { onDragEnd, handleAggregationChange };
};

export default usePivotDrag;