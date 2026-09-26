import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEnvironmentStore, useUIStore } from '../../stores';
import { ResourceNode } from './ResourceNode';
import { ResourcePalette } from './ResourcePalette';
import { PropertiesPanel } from './PropertiesPanel';
import { getResourceTypeInfo } from '../../data/resources';
import type { ResourceType, Resource } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { ShieldCheck, Maximize2, RefreshCw } from 'lucide-react';

const nodeTypes = {
  azureResource: ResourceNode,
};

export const VisualBuilder: React.FC = () => {
  const {
    currentEnvironment,
    addResource,
    updateResource,
    selectedResourceId,
    setSelectedResourceId,
    addDependency,
  } = useEnvironmentStore();

  const { setRegionReplicationOpen } = useUIStore();

  // Convert environment resources to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!currentEnvironment) return [];
    return currentEnvironment.resources.map((res) => ({
      id: res.id,
      type: 'azureResource',
      position: res.position || { x: 100, y: 100 },
      data: res as any,
      selected: res.id === selectedResourceId,
    }));
  }, [currentEnvironment, selectedResourceId]);

  // Convert resource dependencies to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!currentEnvironment) return [];
    const edges: Edge[] = [];
    currentEnvironment.resources.forEach((res) => {
      res.dependsOn.forEach((targetId) => {
        edges.push({
          id: `e-${res.id}-${targetId}`,
          source: targetId,
          target: res.id,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
          },
        });
      });
    });
    return edges;
  }, [currentEnvironment]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addDependency(params.target, params.source);
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2.5 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#3b82f6',
              },
            },
            eds
          )
        );
      }
    },
    [addDependency, setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedResourceId(node.id);
    },
    [setSelectedResourceId]
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      updateResource(node.id, { position: node.position });
    },
    [updateResource]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type') as ResourceType;
      if (!type) return;

      const typeInfo = getResourceTypeInfo(type);
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      const baseName = typeInfo?.shortName.toLowerCase() || 'res';
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const newResource: Resource = {
        id: uuidv4(),
        type,
        name: `${baseName}${randomSuffix}`,
        displayName: typeInfo?.displayName || 'Resource',
        properties: { ...(typeInfo?.defaultProperties || {}) },
        dependsOn: [],
        position,
        moduleVersion: typeInfo?.availableVersions?.[0] || '1.0.0',
      };

      addResource(newResource);
      setSelectedResourceId(newResource.id);
    },
    [addResource, setSelectedResourceId]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleAddFromPaletteClick = (type: ResourceType) => {
    const typeInfo = getResourceTypeInfo(type);
    const baseName = typeInfo?.shortName.toLowerCase() || 'res';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newResource: Resource = {
      id: uuidv4(),
      type,
      name: `${baseName}${randomSuffix}`,
      displayName: typeInfo?.displayName || 'Resource',
      properties: { ...(typeInfo?.defaultProperties || {}) },
      dependsOn: [],
      position: { x: 220 + Math.random() * 120, y: 160 + Math.random() * 120 },
      moduleVersion: typeInfo?.availableVersions?.[0] || '1.0.0',
    };

    addResource(newResource);
    setSelectedResourceId(newResource.id);
  };

  const handleAutoLayout = () => {
    if (!currentEnvironment) return;
    currentEnvironment.resources.forEach((r, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      updateResource(r.id, {
        position: { x: 80 + col * 280, y: 80 + row * 220 },
      });
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <ResourcePalette onAddResource={handleAddFromPaletteClick} />

      <div
        style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {/* Top Canvas Action Bar */}
        <div
          style={{
            height: '48px',
            padding: '0 16px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 10px' }}>
              <ShieldCheck size={13} /> Architecture Validated
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {currentEnvironment?.resources.length || 0} Connected ARM Resources
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleAutoLayout}
              title="Auto-organize resource nodes into clean grid"
            >
              <RefreshCw size={12} /> Auto Layout
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRegionReplicationOpen(true)}
              title="Test multi-region compatibility"
            >
              <Maximize2 size={12} /> Replicate Topology
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="rgba(255, 255, 255, 0.04)" gap={18} variant={BackgroundVariant.Dots} />
            <Controls />
            <MiniMap
              nodeColor={() => '#3b82f6'}
              maskColor="rgba(9, 9, 11, 0.85)"
            />
          </ReactFlow>
        </div>
      </div>

      <PropertiesPanel />
    </div>
  );
};
