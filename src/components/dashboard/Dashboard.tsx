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
      {/* Top Header: Big User Name (No Box) & Quick Actions */}
      <div className="dashboard-header-open">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: loginStatus.loggedIn ? '#22c55e' : '#eab308',
                boxShadow: loginStatus.loggedIn
                  ? '0 0 8px rgba(34, 197, 94, 0.6)'
                  : '0 0 8px rgba(234, 179, 8, 0.6)',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
              {loginStatus.loggedIn
                ? `Azure • ${selectedSubscription?.name || 'Active Subscription'}`
                : 'Local Offline Studio'}
            </span>
          </div>
          <h1 className="dashboard-header-title">
            {getGreeting()}, {displayName}
          </h1>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveNav('templates')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', borderRadius: '10px' }}
          >
            <FileCode size={15} /> Blueprints
          </button>
          <button
            className="btn btn-primary"
            onClick={onNewEnv}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, height: '40px', padding: '0 18px', borderRadius: '10px' }}
          >
            <Plus size={16} /> New Environment
          </button>
        </div>
      </div>

      {/* Hero Grid: Big Money Container on Left, Big 2x2 Square 4-Division Metrics Box on Right */}
      <div className="dashboard-hero-grid">
        {/* Big Money & Cloud Spending Container */}
        <div className="dashboard-money-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.1))',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <Wallet size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Azure Credits & Spending
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                    {selectedSubscription ? selectedSubscription.name : 'Sandbox Environment'}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                }}
              >
                ● Active
              </span>
            </div>

            <div style={{ marginBottom: '16px', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1',
                }}
              >
                {balanceDisplay}
              </div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '6px' }}>
                Available credit balance for compute & networking
              </div>
            </div>
          </div>

          <div style={{ zIndex: 1, paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#71717a' }}>
              Real-time Cost Monitoring
            </div>
            <button
              onClick={() => setActiveNav('credits')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e2030',
                border: '1px solid #3b4261',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#282b40';
                e.currentTarget.style.borderColor = '#60a5fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1e2030';
                e.currentTarget.style.borderColor = '#3b4261';
              }}
            >
              Manage Credits <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Big Square 4-Division Metrics Box */}
        <div className="dashboard-quad-box">
          {/* Division 1: Top-Left - Environments */}
          <div className="dashboard-quad-cell">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Environments
              </span>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <Globe size={14} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa', lineHeight: 1.1 }}>{environments.length}</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Active topologies</div>
            </div>
          </div>

          {/* Division 2: Top-Right - Deployed */}
          <div className="dashboard-quad-cell">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deployed
              </span>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa', lineHeight: 1.1 }}>{deployedCount}</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Active deployments</div>
            </div>
          </div>

          {/* Division 3: Bottom-Left - Draft Stacks */}
          <div className="dashboard-quad-cell">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Draft Stacks
              </span>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(234, 179, 8, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
                <Layers size={14} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa', lineHeight: 1.1 }}>{draftCount}</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>In-design configurations</div>
            </div>
          </div>

          {/* Division 4: Bottom-Right - Configured Nodes */}
          <div className="dashboard-quad-cell">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Configured Nodes
              </span>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <Box size={14} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#fafafa', lineHeight: 1.1 }}>{totalResources}</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Total topology resources</div>
            </div>
          </div>
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
