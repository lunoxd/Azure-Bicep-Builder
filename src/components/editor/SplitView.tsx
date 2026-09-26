import React from 'react';
import { VisualBuilder } from '../builder/VisualBuilder';
import { CodeEditor } from './CodeEditor';
import { useEnvironmentStore } from '../../stores';

export const SplitView: React.FC = () => {
  const { selectedResourceId, setSelectedResourceId } = useEnvironmentStore();

  return (
    <div className="split-view">
      <div className="split-view-left">
        <VisualBuilder />
      </div>
      <div className="split-view-divider" />
      <div className="split-view-right">
        <CodeEditor
          highlightedResourceId={selectedResourceId}
          onResourceSelect={(id) => setSelectedResourceId(id)}
        />
      </div>
    </div>
  );
};
