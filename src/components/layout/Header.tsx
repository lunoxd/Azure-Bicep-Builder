import React from 'react';
import { useAzureStore, useEnvironmentStore, useUIStore } from '../../stores';
import { setSubscription } from '../../hooks/useTauri';
import { AzureConnectionModal } from '../auth/AzureConnectionModal';
import type { ViewMode } from '../../types';
import { Globe, Code2, Columns, Search, Rocket, MapPin, KeyRound, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { loginStatus, selectedSubscription, setSelectedSubscription } = useAzureStore();
  const { currentEnvironment, viewMode, setViewMode } = useEnvironmentStore();
  const { activeNav, setRegionReplicationOpen, azureConnectionModalOpen, setAzureConnectionModalOpen } = useUIStore();

  const handleSubscriptionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    const sub = loginStatus.subscriptions.find((s) => s.id === subId);
    if (sub) {
      setSelectedSubscription(sub);
      try {
        await setSubscription(sub.id);
      } catch (err) {
        console.error('Failed to set subscription:', err);
      }
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-title">
          {activeNav === 'environments' && currentEnvironment ? (
            <div className="header-env-info">
              <span style={{ fontWeight: 800, color: '#fafafa', fontSize: 'var(--text-base)' }}>
                {currentEnvironment.name}
              </span>
              <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>
                {currentEnvironment.resourceGroup}
              </span>
              <span className="env-region">
                <MapPin size={14} color="#10b981" />
                {currentEnvironment.region}
              </span>
            </div>
          ) : (
            <span style={{ textTransform: 'capitalize', color: '#fafafa', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
              {activeNav}
            </span>
          )}
        </div>

        {activeNav === 'environments' && currentEnvironment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="view-toggle">
              {(
                [
                  { mode: 'visual', label: 'Visual Canvas', icon: <Globe size={14} /> },
                  { mode: 'code', label: 'Bicep Code', icon: <Code2 size={14} /> },
                  { mode: 'split', label: 'Split View', icon: <Columns size={14} /> },
                  { mode: 'whatif', label: 'What-If Diff', icon: <Search size={14} /> },
                  { mode: 'deploy', label: 'Deploy', icon: <Rocket size={14} /> },
                ] as { mode: ViewMode; label: string; icon: React.ReactNode }[]
              ).map((item) => (
                <button
                  key={item.mode}
                  className={`tab ${viewMode === item.mode ? 'active' : ''}`}
                  onClick={() => setViewMode(item.mode)}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRegionReplicationOpen(true)}
              title="Replicate this environment configuration to another region"
            >
              <Globe size={14} /> Replicate Region
            </button>
          </div>
        )}

        {/* Azure Connection Status & Subscription Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {loginStatus.loggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loginStatus.subscriptions.length > 0 ? (
                <select
                  className="input"
                  style={{ width: 'auto', minWidth: '180px', padding: '6px 28px 6px 10px', fontSize: '12px' }}
                  value={selectedSubscription?.id || ''}
                  onChange={handleSubscriptionChange}
                >
                  {loginStatus.subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAzureConnectionModalOpen(true)}
                title="Manage Azure Connection"
              >
                <ShieldCheck size={14} color="#10b981" />
                <span>{loginStatus.account?.name ? `${loginStatus.account.name.split(' ')[0]} (Connected)` : 'Connected'}</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAzureConnectionModalOpen(true)}
            >
              <KeyRound size={14} />
              Connect Azure
            </button>
          )}
        </div>
      </header>

      <AzureConnectionModal
        isOpen={azureConnectionModalOpen}
        onClose={() => setAzureConnectionModalOpen(false)}
      />
    </>
  );
};
