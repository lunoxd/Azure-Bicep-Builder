import React, { useState } from 'react';
import { useEnvironmentStore, useUIStore } from '../../stores';
import { AZURE_REGIONS } from '../../data/resources';
import type { Environment } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X } from 'lucide-react';

export const NewEnvironmentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { environments, setEnvironments, setCurrentEnvironment } = useEnvironmentStore();
  const { setActiveNav } = useUIStore();

  const [name, setName] = useState('production-env');
  const [description, setDescription] = useState('Primary production cloud topology');
  const [resourceGroup, setResourceGroup] = useState('rg-production-eastus');
  const [region, setRegion] = useState('eastus');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newEnv: Environment = {
      id: uuidv4(),
      name,
      description,
      subscription: 'Active Subscription',
      subscriptionId: '',
      resourceGroup,
      region,
      resources: [],
      moduleVersions: { network: '1.1.0', storage: '1.0.0' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };

    setEnvironments([...environments, newEnv]);
    setCurrentEnvironment(newEnv);
    setActiveNav('environments');
    onClose();
  };

  return (
    <div className="env-form-overlay">
      <div className="env-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2>Create New Environment</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-fields">
            <div className="input-group">
              <label className="input-label">Environment Name</label>
              <input
                className="input"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setResourceGroup(`rg-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}-${region}`);
                }}
                placeholder="e.g. staging-core"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <input
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Purpose of this environment"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Azure Target Region</label>
              <select
                className="input"
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setResourceGroup(`rg-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${e.target.value}`);
                }}
              >
                {AZURE_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.value})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Azure Resource Group Name</label>
              <input
                className="input"
                required
                value={resourceGroup}
                onChange={(e) => setResourceGroup(e.target.value)}
                placeholder="e.g. rg-production-eastus"
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              <Plus size={12} /> Create Environment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
