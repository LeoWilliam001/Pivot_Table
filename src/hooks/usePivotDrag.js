import { getAvailableFields } from '../utils/pivotUtils';

const usePivotDrag = ({ columns, pivotConfig, setPivotConfig, aggregationOptions, setAggregationOptions }) => {
  const onDragEnd = ({ source, destination }) => {
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const getList = (id) =>
      id === 'available'
        ? getAvailableFields(columns, pivotConfig)
        : [...pivotConfig[id]];

    const sourceList = getList(source.droppableId);
    const destList = getList(destination.droppableId);

    const [removed] = sourceList.splice(source.index, 1);
    destList.splice(destination.index, 0, removed);

    const newConfig = {
      ...pivotConfig,
      ...(source.droppableId !== 'available' && { [source.droppableId]: sourceList }),
      ...(destination.droppableId !== 'available' && { [destination.droppableId]: destList })
    };

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
