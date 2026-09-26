import React from 'react';
import { RESOURCE_TYPES } from '../../data/resources';
import type { ResourceType } from '../../types';

export const ResourcePalette: React.FC<{ onAddResource: (type: ResourceType) => void }> = ({ onAddResource }) => {
  const onDragStart = (event: React.DragEvent, nodeType: ResourceType) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="resource-palette">
      <div className="palette-header">Resource Library</div>
      {RESOURCE_TYPES.map((item) => (
        <div
          key={item.type}
          className="palette-item"
          draggable
          onDragStart={(e) => onDragStart(e, item.type)}
          onClick={() => onAddResource(item.type)}
          title={`Drag or click to add ${item.displayName}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '16px', color: item.color }}
          >
            {item.icon}
          </span>
          <span>{item.displayName}</span>
        </div>
      ))}
    </div>
  );
};
