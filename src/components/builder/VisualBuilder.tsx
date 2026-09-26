import React, { useCallback } from 'react';
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
import { ShieldCheck, Maximize2, RefreshCw, FolderArchive, Edit3, Check } from 'lucide-react';

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
    updateEnvironmentField,
  } = useEnvironmentStore();

  const { setRegionReplicationOpen } = useUIStore();
  const [editingRg, setEditingRg] = React.useState(false);
  const [rgInputValue, setRgInputValue] = React.useState(currentEnvironment?.resourceGroup || '');

  React.useEffect(() => {
    if (currentEnvironment?.resourceGroup) {
      setRgInputValue(currentEnvironment.resourceGroup);
    }
  }, [currentEnvironment?.resourceGroup]);

  const handleSaveRg = () => {
    if (rgInputValue.trim()) {
      updateEnvironmentField('resourceGroup', rgInputValue.trim());
    }
    setEditingRg(false);
  };

  // Synchronize React Flow nodes only when resources or environment change, without thrashing state
  const envId = currentEnvironment?.id;
  const resKey = currentEnvironment?.resources.map((r) => `${r.id}:${r.name}:${r.position?.x}:${r.position?.y}`).join('|') || '';

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  React.useEffect(() => {
    if (!currentEnvironment) {
      setNodes([]);
      setEdges([]);
      return;
    }

    setNodes((prev) =>
      currentEnvironment.resources.map((res) => {
        const existing = prev.find((n) => n.id === res.id);
        return {
          id: res.id,
          type: 'azureResource',
          position: res.position || existing?.position || { x: 100, y: 100 },
          data: res as any,
          selected: res.id === selectedResourceId,
        };
      })
    );

    const newEdges: Edge[] = [];
    currentEnvironment.resources.forEach((res) => {
      res.dependsOn.forEach((targetId) => {
        newEdges.push({
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
    setEdges(newEdges);
  }, [envId, resKey, selectedResourceId, setNodes, setEdges]);

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
            minHeight: '48px',
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 4,
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Resource Group Lifecycle Boundary Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#18181b',
                border: '1px solid #27272a',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              <FolderArchive size={14} style={{ color: '#a1a1aa' }} />
              <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>Resource Group:</span>
              {editingRg ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={rgInputValue}
                    onChange={(e) => setRgInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRg();
                      if (e.key === 'Escape') setEditingRg(false);
                    }}
                    autoFocus
                    style={{
                      background: '#09090b',
                      border: '1px solid #3b82f6',
                      color: '#fafafa',
                      fontSize: '12px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveRg}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center' }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#fafafa', fontWeight: 600, fontFamily: 'monospace' }}>
                    {currentEnvironment?.resourceGroup || 'rg-default-eastus'}
                  </span>
                  <button
                    onClick={() => setEditingRg(true)}
                    title="Change Resource Group container"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', padding: '2px' }}
                  >
                    <Edit3 size={11} />
                  </button>
                </div>
              )}
            </div>

            <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 10px' }}>
              <ShieldCheck size={13} /> targetScope = 'resourceGroup'
            </span>

            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {currentEnvironment?.resources.length || 0} Grouped Resources • {currentEnvironment?.region || 'eastus'}
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
