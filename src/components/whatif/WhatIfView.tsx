import React, { useState, useEffect } from 'react';
import { useEnvironmentStore, useDeploymentStore, useAzureStore } from '../../stores';
import { generateBicepCode, runWhatIf } from '../../hooks/useTauri';
import type { WhatIfChangeType } from '../../types';
import { RefreshCw, Rocket, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const WhatIfView: React.FC = () => {
  const { currentEnvironment, setViewMode } = useEnvironmentStore();
  const { selectedSubscription } = useAzureStore();
  const { whatIfResult, setWhatIfResult, isRunningWhatIf, setIsRunningWhatIf } = useDeploymentStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunWhatIf = async () => {
    if (!currentEnvironment) return;

    try {
      setIsRunningWhatIf(true);
      setErrorMsg(null);

      const gen = await generateBicepCode(
        currentEnvironment.resources,
        currentEnvironment.resourceGroup,
        currentEnvironment.region
      );

      const result = await runWhatIf(
        gen.code,
        currentEnvironment.resourceGroup,
        selectedSubscription?.id || ''
      );

      setWhatIfResult(result);
      if (result.status === 'error' && result.error) {
        setErrorMsg(result.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.toString() || 'Failed to execute Azure What-If');
    } finally {
      setIsRunningWhatIf(false);
    }
  };

  useEffect(() => {
    if (!whatIfResult && !isRunningWhatIf) {
      handleRunWhatIf();
    }
  }, []);

  const changes = whatIfResult?.changes || [];
  const createCount = changes.filter((c) => c.changeType === 'Create').length;
  const modifyCount = changes.filter((c) => c.changeType === 'Modify').length;
  const deleteCount = changes.filter((c) => c.changeType === 'Delete').length;
  const noChangeCount = changes.filter((c) => c.changeType === 'NoChange').length;

  const getChangeBadge = (type: WhatIfChangeType) => {
    switch (type) {
      case 'Create':
        return <span className="badge badge-success"><Plus size={11} /> Create</span>;
      case 'Modify':
        return <span className="badge badge-warning"><Edit2 size={11} /> Modify</span>;
      case 'Delete':
        return <span className="badge badge-error"><Trash2 size={11} /> Delete</span>;
      default:
        return <span className="badge badge-neutral"><CheckCircle2 size={11} /> {type}</span>;
    }
  };

  return (
    <div className="whatif-container">
      <div className="whatif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Azure What-If Deployment Preview</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Predictive evaluation of cloud infrastructure delta before committing changes to Azure Resource Manager.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={handleRunWhatIf}
            disabled={isRunningWhatIf}
          >
            {isRunningWhatIf ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : <RefreshCw size={15} />}
            Refresh What-If
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setViewMode('deploy')}
          >
            <Rocket size={16} /> Proceed to Deploy
          </button>
        </div>
      </div>

      {isRunningWhatIf ? (
        <div className="empty-state" style={{ minHeight: '340px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', borderTopColor: '#10b981' }} />
          <h3 style={{ marginTop: '16px', color: '#fafafa', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
            Analyzing ARM Infrastructure Delta...
          </h3>
          <p style={{ maxWidth: '440px', fontSize: 'var(--text-sm)' }}>
            Comparing local Bicep topology against live Azure subscription state in <strong>{currentEnvironment?.region}</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* Large Summary Metric Panels */}
          <div className="whatif-summary">
            <div className="whatif-summary-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)' }}>
              <div className="count" style={{ color: '#10b981' }}>
                {createCount}
              </div>
              <div className="label">Resources to Create</div>
            </div>
            <div className="whatif-summary-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
              <div className="count" style={{ color: '#f59e0b' }}>
                {modifyCount}
              </div>
              <div className="label">Resources to Modify</div>
            </div>
            <div className="whatif-summary-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
              <div className="count" style={{ color: '#ef4444' }}>
                {deleteCount}
              </div>
              <div className="label">Resources to Delete</div>
            </div>
            <div className="whatif-summary-card">
              <div className="count" style={{ color: '#a1a1aa' }}>
                {noChangeCount}
              </div>
              <div className="label">Unchanged Live Resources</div>
            </div>
          </div>

          {errorMsg && (
            <div
              className="badge badge-warning"
              style={{
                display: 'block',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                fontSize: 'var(--text-sm)',
                whiteSpace: 'pre-wrap',
              }}
            >
              <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}

          {/* Change Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#fafafa' }}>
                Detailed Resource Provisioning Breakdown
              </h3>
              <span className="badge badge-neutral">
                Target Scope: ResourceGroup ({currentEnvironment?.resourceGroup})
              </span>
            </div>

            {changes.length === 0 ? (
              <div className="card" style={{ padding: '24px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                  All {currentEnvironment?.resources.length || 0} resources will be provisioned freshly in target resource group.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentEnvironment?.resources.map((res) => (
                    <div key={res.id} className="whatif-change-card">
                      <div className="whatif-change-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                        <Plus size={16} />
                      </div>
                      <div className="whatif-change-details" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4>{res.displayName || res.name}</h4>
                          <span className="badge badge-success"><Plus size={10} /> Create</span>
                        </div>
                        <p style={{ marginTop: '2px' }}><code>{res.name}</code> ({res.type})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              changes.map((c, idx) => (
                <div key={idx} className="whatif-change-card">
                  <div
                    className="whatif-change-icon"
                    style={{
                      backgroundColor:
                        c.changeType === 'Create'
                          ? 'rgba(16, 185, 129, 0.14)'
                          : c.changeType === 'Modify'
                          ? 'rgba(245, 158, 11, 0.14)'
                          : 'rgba(239, 68, 68, 0.14)',
                      color:
                        c.changeType === 'Create'
                          ? '#10b981'
                          : c.changeType === 'Modify'
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {c.changeType === 'Create' ? <Plus size={16} /> : c.changeType === 'Modify' ? <Edit2 size={16} /> : <Trash2 size={16} />}
                  </div>
                  <div className="whatif-change-details" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>{c.resourceId.split('/').pop()}</h4>
                      {getChangeBadge(c.changeType)}
                    </div>
                    <p style={{ marginTop: '2px' }}><code>{c.resourceId}</code></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
