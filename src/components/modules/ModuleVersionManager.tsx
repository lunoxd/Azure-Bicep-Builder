import React from 'react';
import { useEnvironmentStore } from '../../stores';
import { RESOURCE_TYPES } from '../../data/resources';
import { ShieldCheck, CheckCircle2, Package } from 'lucide-react';

export const ModuleVersionManager: React.FC = () => {
  const { currentEnvironment, updateResource, updateEnvironmentField } = useEnvironmentStore();

  if (!currentEnvironment) {
    return (
      <div className="empty-state">
        <Package size={32} color="#71717a" />
        <h3>No Active Environment Selected</h3>
        <p>Select or create an environment to manage its Bicep module versions.</p>
      </div>
    );
  }

  const handleGlobalVersionChange = (moduleKey: string, version: string) => {
    const updated = {
      ...currentEnvironment.moduleVersions,
      [moduleKey]: version,
    };
    updateEnvironmentField('moduleVersions', updated);
  };

  const handleResourceVersionChange = (resourceId: string, version: string) => {
    updateResource(resourceId, { moduleVersion: version });
  };

  return (
    <div style={{ padding: '28px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#fafafa' }}>Bicep Module Version Governance</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>
          Pin explicit, verified Bicep module releases to ensure deterministic and reproducible deployments across
          teams and regions.
        </p>
      </div>

      {/* Environment-Level Module Versions */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fafafa', marginBottom: '14px' }}>
          Environment Baseline Module Versions
        </h3>

        <div className="dashboard-grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#38bdf8' }}>hub</span>
                <strong style={{ fontSize: 'var(--text-sm)' }}>Network Module</strong>
              </div>
              <span className="badge badge-success"><ShieldCheck size={11} /> Verified</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Standardized VNet, Subnet CIDR layout, and NSG baseline policies.
            </p>
            <div className="input-group">
              <label className="input-label">Pinned Release</label>
              <select
                className="input"
                value={currentEnvironment.moduleVersions['network'] || '1.1.0'}
                onChange={(e) => handleGlobalVersionChange('network', e.target.value)}
              >
                <option value="1.1.0">v1.1.0 (Latest - Multi-subnet CIDR)</option>
                <option value="1.0.0">v1.0.0 (Legacy single-subnet)</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>hard_drive</span>
                <strong style={{ fontSize: 'var(--text-sm)' }}>Storage Module</strong>
              </div>
              <span className="badge badge-success"><ShieldCheck size={11} /> Verified</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              StorageV2 account with HTTPS enforcement and TLS 1.2 minimum.
            </p>
            <div className="input-group">
              <label className="input-label">Pinned Release</label>
              <select
                className="input"
                value={currentEnvironment.moduleVersions['storage'] || '1.0.0'}
                onChange={(e) => handleGlobalVersionChange('storage', e.target.value)}
              >
                <option value="1.0.0">v1.0.0 (Current Standard)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Resource-Specific Overrides */}
      <section>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fafafa', marginBottom: '14px' }}>
          Resource-Specific Module Version Bindings
        </h3>

        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ background: '#18181b', borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ padding: '10px 14px' }}>Resource Name</th>
                <th style={{ padding: '10px 14px' }}>Type</th>
                <th style={{ padding: '10px 14px' }}>Module Version</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentEnvironment.resources.map((r) => {
                const typeInfo = RESOURCE_TYPES.find((t) => t.type === r.type);
                const versions = typeInfo?.availableVersions || ['1.0.0'];
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: typeInfo?.color || '#10b981' }}>
                          {typeInfo?.icon}
                        </span>
                        {r.displayName || r.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      <code>{r.type}</code>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        className="input"
                        style={{ width: 'auto', padding: '3px 22px 3px 8px', fontSize: '11px' }}
                        value={r.moduleVersion || versions[0]}
                        onChange={(e) => handleResourceVersionChange(r.id, e.target.value)}
                      >
                        {versions.map((v) => (
                          <option key={v} value={v}>
                            v{v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-success">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
