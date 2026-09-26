import React, { useState } from 'react';
import { useEnvironmentStore, useUIStore } from '../../stores';
import { AZURE_REGIONS } from '../../data/resources';
import { checkRegionCompatibility } from '../../hooks/useTauri';
import type { RegionCompatibility, Environment } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { X, Globe, CheckCircle2, AlertTriangle, AlertCircle, Info, Lightbulb } from 'lucide-react';
import { AppleSpinner } from '../common/AppleSpinner';

export const RegionReplicationModal: React.FC = () => {

  const { currentEnvironment, environments, setEnvironments, setCurrentEnvironment } = useEnvironmentStore();
  const { regionReplicationOpen, setRegionReplicationOpen } = useUIStore();

  const [targetRegion, setTargetRegion] = useState<string>('westeurope');
  const [compatResult, setCompatResult] = useState<RegionCompatibility | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  if (!regionReplicationOpen || !currentEnvironment) return null;

  const handleCheckCompatibility = async (region: string) => {
    setTargetRegion(region);
    setIsChecking(true);
    try {
      const res = await checkRegionCompatibility(currentEnvironment.resources, region);
      setCompatResult(res);
    } catch (err) {
      console.error('Failed to check region compatibility:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReplicate = () => {
    if (!currentEnvironment) return;

    const replicatedEnv: Environment = {
      ...currentEnvironment,
      id: uuidv4(),
      name: `${currentEnvironment.name}-${targetRegion}`,
      resourceGroup: `${currentEnvironment.resourceGroup}-${targetRegion}`,
      region: targetRegion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastDeployedAt: undefined,
      status: 'draft',
      resources: currentEnvironment.resources.map((r) => {
        let updatedProps = { ...r.properties };
        const warning = compatResult?.warnings.find((w) => w.resourceId === r.id);
        if (warning && warning.autoFix) {
          if (r.type === 'Microsoft.DBforPostgreSQL/flexibleServers') {
            updatedProps.skuName = warning.autoFix;
          } else if (r.type === 'Microsoft.KeyVault/vaults') {
            updatedProps.sku = warning.autoFix;
          }
        }
        return {
          ...r,
          id: uuidv4(),
          properties: updatedProps,
        };
      }),
    };

    setEnvironments([...environments, replicatedEnv]);
    setCurrentEnvironment(replicatedEnv);
    setRegionReplicationOpen(false);
  };

  return (
    <div className="replication-modal">
      <div className="replication-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#10b981" />
            <h2>Replicate Environment to Region</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setRegionReplicationOpen(false)}>
            <X size={14} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: '16px' }}>
          Recreate <strong style={{ color: '#fafafa' }}>{currentEnvironment.name}</strong> in a secondary Azure region with automated SKU and feature compatibility verification.
        </p>

        <div className="input-group" style={{ marginBottom: '16px' }}>
          <label className="input-label">Target Destination Region</label>
          <select
            className="input"
            value={targetRegion}
            onChange={(e) => handleCheckCompatibility(e.target.value)}
          >
            {AZURE_REGIONS.filter((r) => r.value !== currentEnvironment.region).map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} ({r.value})
              </option>
            ))}
          </select>
        </div>

        {/* Compatibility Report */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>
            Regional Compatibility Analysis
          </h4>

          {isChecking ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
              <AppleSpinner size={14} />
              Verifying SKU matrices across Azure regions...
            </div>
          ) : compatResult && compatResult.warnings.length > 0 ? (

            compatResult.warnings.map((w, idx) => (
              <div key={idx} className={`region-warning severity-${w.severity}`}>
                <div style={{ marginTop: '2px' }}>
                  {w.severity === 'error' ? (
                    <AlertCircle size={15} color="#ef4444" />
                  ) : w.severity === 'warning' ? (
                    <AlertTriangle size={15} color="#f59e0b" />
                  ) : (
                    <Info size={15} color="#38bdf8" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', color: '#fafafa' }}>
                    {w.resourceName} ({w.resourceType})
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-secondary)' }}>{w.message}</div>
                  {w.autoFix && (
                    <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Lightbulb size={11} /> Auto-adjust recommendation: <code>{w.autoFix}</code>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="badge badge-success" style={{ padding: '8px 12px', width: '100%', justifyContent: 'flex-start' }}>
              <CheckCircle2 size={13} /> 100% Region Compatible — All SKUs are fully available in {targetRegion}.
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setRegionReplicationOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleReplicate}>
            Create Region Replica
          </button>
        </div>
      </div>
    </div>
  );
};
