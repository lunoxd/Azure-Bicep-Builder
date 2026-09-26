import React from 'react';
import { useEnvironmentStore } from '../../stores';
import { getResourceTypeInfo } from '../../data/resources';
import { X, Trash2, Plus, Info, Settings, Layers, Hash } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const { currentEnvironment, selectedResourceId, updateResource, removeResource, setSelectedResourceId } = useEnvironmentStore();

  if (!currentEnvironment || !selectedResourceId) {
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#a1a1aa" />
            <h3>Resource Inspector</h3>
          </div>
        </div>
        <div className="empty-state">
          <Info size={32} color="#71717a" />
          <h4 style={{ color: '#fafafa', fontSize: 'var(--text-sm)', fontWeight: 600 }}>No Resource Selected</h4>
          <p style={{ fontSize: 'var(--text-xs)', maxWidth: '240px', lineHeight: 1.5 }}>
            Click on any node in the architecture diagram to configure its Azure properties, SKUs, and networking.
          </p>
        </div>
      </div>
    );
  }

  const resource = currentEnvironment.resources.find((r) => r.id === selectedResourceId);
  if (!resource) return null;

  const typeInfo = getResourceTypeInfo(resource.type);

  const handlePropertyChange = (key: string, value: any) => {
    updateResource(resource.id, {
      properties: {
        ...resource.properties,
        [key]: value,
      },
    });
  };

  const handleSubnetChange = (index: number, field: 'name' | 'addressPrefix', val: string) => {
    const subnets = [...(resource.properties.subnets || [])];
    subnets[index] = { ...subnets[index], [field]: val };
    handlePropertyChange('subnets', subnets);
  };

  const handleAddSubnet = () => {
    const subnets = [...(resource.properties.subnets || [])];
    subnets.push({ name: `snet-tier-${subnets.length + 1}`, addressPrefix: `10.0.${subnets.length + 1}.0/24` });
    handlePropertyChange('subnets', subnets);
  };

  const handleRemoveSubnet = (index: number) => {
    const subnets = (resource.properties.subnets || []).filter((_: any, i: number) => i !== index);
    handlePropertyChange('subnets', subnets);
  };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: `${typeInfo?.color || '#10b981'}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: typeInfo?.color || '#10b981' }}>
              {typeInfo?.icon}
            </span>
          </div>
          <div>
            <h3>{resource.displayName || resource.name}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {resource.type}
            </span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSelectedResourceId(null)}
          title="Close properties panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="properties-body">
        {/* Core Metadata */}
        <div className="input-group">
          <label className="input-label">Display Name</label>
          <input
            className="input"
            value={resource.displayName || ''}
            onChange={(e) => updateResource(resource.id, { displayName: e.target.value })}
            placeholder="Display Name"
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <Hash size={11} style={{ display: 'inline', marginRight: '3px' }} />
            ARM Identifier Name
          </label>
          <input
            className="input"
            value={resource.name}
            onChange={(e) => updateResource(resource.id, { name: e.target.value })}
            placeholder="e.g. stappproduction01"
          />
        </div>

        {/* Module Version Selector */}
        {typeInfo?.availableVersions && typeInfo.availableVersions.length > 0 && (
          <div className="input-group">
            <label className="input-label">
              <Layers size={11} style={{ display: 'inline', marginRight: '3px' }} />
              Bicep Module Release
            </label>
            <select
              className="input"
              value={resource.moduleVersion || typeInfo.availableVersions[0]}
              onChange={(e) => updateResource(resource.id, { moduleVersion: e.target.value })}
            >
              {typeInfo.availableVersions.map((v) => (
                <option key={v} value={v}>
                  v{v} (Verified Release)
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ height: '1px', background: 'var(--border-primary)', margin: '8px 0' }} />

        {/* Type-Specific Properties */}
        {resource.type === 'Microsoft.Network/virtualNetworks' && (
          <>
            <div className="input-group">
              <label className="input-label">CIDR Address Space</label>
              <input
                className="input"
                value={resource.properties.addressSpace || '10.0.0.0/16'}
                onChange={(e) => handlePropertyChange('addressSpace', e.target.value)}
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Configured Subnets</label>
                <button className="btn btn-secondary btn-sm" onClick={handleAddSubnet}>
                  <Plus size={12} /> Add Subnet
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {(resource.properties.subnets || []).map((sub: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      className="input"
                      value={sub.name}
                      placeholder="Subnet Name"
                      onChange={(e) => handleSubnetChange(idx, 'name', e.target.value)}
                    />
                    <input
                      className="input"
                      value={sub.addressPrefix}
                      placeholder="CIDR"
                      onChange={(e) => handleSubnetChange(idx, 'addressPrefix', e.target.value)}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveSubnet(idx)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {resource.type === 'Microsoft.Storage/storageAccounts' && (
          <>
            <div className="input-group">
              <label className="input-label">Redundancy Replication SKU</label>
              <select
                className="input"
                value={resource.properties.sku || 'Standard_LRS'}
                onChange={(e) => handlePropertyChange('sku', e.target.value)}
              >
                <option value="Standard_LRS">Standard_LRS (Locally Redundant Storage)</option>
                <option value="Standard_GRS">Standard_GRS (Geo-Redundant Storage)</option>
                <option value="Standard_ZRS">Standard_ZRS (Zone-Redundant Storage)</option>
                <option value="Premium_LRS">Premium_LRS (High-Throughput SSD)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Default Access Tier</label>
              <select
                className="input"
                value={resource.properties.accessTier || 'Hot'}
                onChange={(e) => handlePropertyChange('accessTier', e.target.value)}
              >
                <option value="Hot">Hot (Frequently Accessed Assets)</option>
                <option value="Cool">Cool (Infrequently Accessed Data)</option>
              </select>
            </div>
          </>
        )}

        {resource.type === 'Microsoft.Web/serverfarms' && (
          <>
            <div className="input-group">
              <label className="input-label">App Service SKU & Tier</label>
              <select
                className="input"
                value={resource.properties.skuTier || 'Basic'}
                onChange={(e) => handlePropertyChange('skuTier', e.target.value)}
              >
                <option value="Free">Free Tier (F1)</option>
                <option value="Shared">Shared Tier (D1)</option>
                <option value="Basic">Basic Tier (B1/B2/B3)</option>
                <option value="Standard">Standard Tier (S1/S2/S3 - Auto-scale)</option>
                <option value="PremiumV3">Premium V3 (P1v3/P2v3 - Dedicated)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Operating System</label>
              <select
                className="input"
                value={resource.properties.os || 'Linux'}
                onChange={(e) => handlePropertyChange('os', e.target.value)}
              >
                <option value="Linux">Linux (Container & Native Runtimes)</option>
                <option value="Windows">Windows (.NET Framework / Native)</option>
              </select>
            </div>
          </>
        )}

        {resource.type === 'Microsoft.Web/sites' && (
          <>
            <div className="input-group">
              <label className="input-label">Application Runtime Stack</label>
              <select
                className="input"
                value={resource.properties.runtime || 'NODE|18-lts'}
                onChange={(e) => handlePropertyChange('runtime', e.target.value)}
              >
                <option value="NODE|18-lts">Node.js 18 LTS</option>
                <option value="NODE|20-lts">Node.js 20 LTS</option>
                <option value="PYTHON|3.11">Python 3.11</option>
                <option value="DOTNETCORE|8.0">.NET 8.0 LTS</option>
                <option value="JAVA|17-java17">Java 17 LTS</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Hosting App Service Plan</label>
              <select
                className="input"
                value={resource.dependsOn.find((id) =>
                  currentEnvironment.resources.some((r) => r.id === id && r.type === 'Microsoft.Web/serverfarms')
                ) || ''}
                onChange={(e) => {
                  const planId = e.target.value;
                  const currentDeps = resource.dependsOn.filter(
                    (id) => !currentEnvironment.resources.some((r) => r.id === id && r.type === 'Microsoft.Web/serverfarms')
                  );
                  updateResource(resource.id, {
                    dependsOn: planId ? [...currentDeps, planId] : currentDeps,
                  });
                }}
              >
                <option value="">-- None (Standalone) --</option>
                {currentEnvironment.resources
                  .filter((r) => r.type === 'Microsoft.Web/serverfarms')
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.displayName || plan.name}
                    </option>
                  ))}
              </select>
            </div>
          </>
        )}

        {resource.type === 'Microsoft.KeyVault/vaults' && (
          <div className="input-group">
            <label className="input-label">Key Vault Tier</label>
            <select
              className="input"
              value={resource.properties.sku || 'standard'}
              onChange={(e) => handlePropertyChange('sku', e.target.value)}
            >
              <option value="standard">Standard (Software-Protected Secrets & Keys)</option>
              <option value="premium">Premium (FIPS 140-2 Level 2 HSM Keys)</option>
            </select>
          </div>
        )}

        {resource.type === 'Microsoft.DBforPostgreSQL/flexibleServers' && (
          <>
            <div className="input-group">
              <label className="input-label">Database SKU Tier</label>
              <select
                className="input"
                value={resource.properties.skuTier || 'Burstable'}
                onChange={(e) => handlePropertyChange('skuTier', e.target.value)}
              >
                <option value="Burstable">Burstable (Standard_B1ms / Standard_B2s)</option>
                <option value="GeneralPurpose">General Purpose (Standard_D2s_v3)</option>
                <option value="MemoryOptimized">Memory Optimized (Standard_E2s_v3)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">PostgreSQL Major Version</label>
              <select
                className="input"
                value={resource.properties.version || '16'}
                onChange={(e) => handlePropertyChange('version', e.target.value)}
              >
                <option value="16">PostgreSQL 16 (Latest)</option>
                <option value="15">PostgreSQL 15</option>
                <option value="14">PostgreSQL 14</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Allocated Storage (GB)</label>
              <input
                className="input"
                type="number"
                value={resource.properties.storageSizeGB || 32}
                onChange={(e) => handlePropertyChange('storageSizeGB', e.target.value)}
              />
            </div>
          </>
        )}

        {/* Action Controls */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={() => {
              removeResource(resource.id);
              setSelectedResourceId(null);
            }}
          >
            <Trash2 size={15} /> Remove Resource
          </button>
        </div>
      </div>
    </div>
  );
};
