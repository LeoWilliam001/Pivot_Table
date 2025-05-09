import { getAvailableFields } from '../utils/pivotUtils';

const usePivotDrag = ({ columns, pivotConfig, setPivotConfig, aggregationOptions, setAggregationOptions }) => {
  const onDragEnd = ({ source, destination }) => {
  
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

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

    const getList = (id) =>
      id === 'available'
        ? getAvailableFields(columns, pivotConfig)
        : [...pivotConfig[id]];

    const sourceList = getList(source.droppableId);
    const destList = getList(destination.droppableId);

    const [removed] = sourceList.splice(source.index, 1);

    if (destination.droppableId !== 'available' && destList.includes(removed)) {
      return;
    }
    
    destList.splice(destination.index, 0, removed);

    const newConfig = { ...pivotConfig };
    
    if (source.droppableId !== 'available') {
      newConfig[source.droppableId] = sourceList;
    }
    
    if (destination.droppableId !== 'available') {
      newConfig[destination.droppableId] = destList;
    }

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