import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getResourceTypeInfo } from '../../data/resources';
import type { Resource } from '../../types';

interface ResourceNodeProps {
  data: Resource;
  selected?: boolean;
}

export const ResourceNode = memo(({ data, selected }: ResourceNodeProps) => {
  const typeInfo = getResourceTypeInfo(data.type);
  const icon = typeInfo?.icon || 'category';
  const color = typeInfo?.color || '#10b981';

  return (
    <div
      className={`resource-node ${selected ? 'selected' : ''}`}
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      {data.moduleVersion && (
        <div className="resource-node-version">v{data.moduleVersion}</div>
      )}

      <div className="resource-node-header">
        <div
          className="resource-node-icon"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {icon}
          </span>
        </div>
        <div>
          <div className="resource-node-title">{data.displayName || data.name}</div>
          <div className="resource-node-type">{typeInfo?.displayName || data.type}</div>
        </div>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
        <code>{data.name}</code>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
});

ResourceNode.displayName = 'ResourceNode';
