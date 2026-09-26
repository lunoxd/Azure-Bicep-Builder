import React, { useState, useEffect } from 'react';
import { useEnvironmentStore, useUIStore, useAzureStore } from '../../stores';
import type { Environment } from '../../types';
import { fetchSubscriptionBillingInfo, type AzureBillingSummary } from '../../services/azureAuth';
import { Plus, Globe, Layers, MapPin, Box, ArrowRight, FileCode, CheckCircle2, Wallet, Sparkles } from 'lucide-react';

export const Dashboard: React.FC<{ onNewEnv: () => void }> = ({ onNewEnv }) => {
  const { environments, setCurrentEnvironment, setViewMode } = useEnvironmentStore();
  const { setActiveNav } = useUIStore();
  const { loginStatus, selectedSubscription } = useAzureStore();

  const [billing, setBilling] = useState<AzureBillingSummary | null>(null);

  useEffect(() => {
    if (selectedSubscription?.id) {
      fetchSubscriptionBillingInfo(selectedSubscription.id, selectedSubscription.name)
        .then((b) => setBilling(b))
        .catch(() => {});
    }
  }, [selectedSubscription?.id]);

  const handleSelectEnv = (env: Environment) => {
    setCurrentEnvironment(env);
    setViewMode('visual');
    setActiveNav('environments');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const rawName = loginStatus.account?.name || loginStatus.account?.id?.split('@')[0] || '';
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Developer';

  const deployedCount = environments.filter((e) => e.status === 'deployed').length;
  const draftCount = environments.filter((e) => e.status !== 'deployed').length;
  const totalResources = environments.reduce((acc, e) => acc + (e.resources?.length || 0), 0);

  const balanceDisplay = billing
    ? `$${billing.remainingCredits.toFixed(2)}`
    : loginStatus.loggedIn
    ? '$100.00'
    : '--';

  return (
    <div className="dashboard" style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 0 40px' }}>
      {/* Top Hero Bar: Greeting, Services Status, Live Balance & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#121215',
          border: '1px solid #27272a',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fafafa', margin: 0, letterSpacing: '-0.02em' }}>
            {getGreeting()}, {displayName}
          </h1>
          <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            {loginStatus.loggedIn
              ? `Connected to ${selectedSubscription?.name || 'Azure Subscription'}`
              : 'Azure Bicep Builder Local Studio'}
          </div>
        </div>

        {/* Right Header Controls: Balance & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Balance Pill */}
          <div
            onClick={() => setActiveNav('credits')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '8px 14px',
              cursor: 'pointer',
              transition: 'border-color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f3f46')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272a')}
            title="View Credits & Live Billing"
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={15} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Balance
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fafafa', fontFamily: 'monospace' }}>
                {balanceDisplay}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setActiveNav('templates')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileCode size={15} /> Blueprints
          </button>
          <button
            className="btn btn-primary"
            onClick={onNewEnv}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Plus size={16} /> New Environment
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Environments
            </span>
            <Globe size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa' }}>{environments.length}</div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Active topologies</div>
        </div>

        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deployed
            </span>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa' }}>{deployedCount}</div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Active deployments</div>
        </div>

        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Draft Stacks
            </span>
            <Layers size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa' }}>{draftCount}</div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>In-design configurations</div>
        </div>

        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Configured Nodes
            </span>
            <Box size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa' }}>{totalResources}</div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Total topology resources</div>
        </div>
      </div>

      {/* Clean Environments Table/List */}
      {environments.length > 0 ? (
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fafafa' }}>Active Environments</div>
            <div style={{ fontSize: '12px', color: '#a1a1aa' }}>{environments.length} total</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#18181b', borderBottom: '1px solid #27272a', color: '#a1a1aa' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Environment Name</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Resource Group</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Region</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Resources</th>
                <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => (
                <tr
                  key={env.id}
                  onClick={() => handleSelectEnv(env)}
                  style={{ borderBottom: '1px solid #1e1e24', cursor: 'pointer', transition: 'background 100ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#18181c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={15} style={{ color: '#a1a1aa' }} />
                      <span>{env.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#a1a1aa', fontFamily: 'monospace', fontSize: '12px' }}>
                    {env.resourceGroup || 'rg-default'}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} style={{ color: '#a1a1aa' }} />
                      <span>{env.region}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#a1a1aa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Box size={12} style={{ color: '#a1a1aa' }} />
                      <span>{env.resources.length} nodes</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span
                      className={`badge badge-${
                        env.status === 'deployed' ? 'success' : env.status === 'draft' ? 'neutral' : 'warning'
                      }`}
                    >
                      {env.status === 'deployed' ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Open <ArrowRight size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '48px 20px', background: '#121215', border: '1px solid #27272a', borderRadius: '12px', textAlign: 'center' }}>
          <Sparkles size={32} style={{ margin: '0 auto 12px', color: '#71717a' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#fafafa' }}>No Environments Yet</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#a1a1aa' }}>
            Start with a ready-made architecture blueprint or create an empty environment.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setActiveNav('templates')}>
              <FileCode size={14} /> Blueprints
            </button>
            <button className="btn btn-primary" onClick={onNewEnv}>
              <Plus size={14} /> New Environment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
