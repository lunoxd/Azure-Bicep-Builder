import React from 'react';
import { useUIStore, useAzureStore, useEnvironmentStore } from '../../stores';
import type { NavSection } from '../../types';
import { LayoutDashboard, Network, FileCode, Rocket, Cloud, Wallet } from 'lucide-react';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'environments', label: 'Environments', icon: <Network size={18} /> },
  { id: 'templates', label: 'Blueprints', icon: <FileCode size={18} /> },
  { id: 'resources', label: 'Cloud Resources', icon: <Cloud size={18} /> },
  { id: 'credits', label: 'Credits & Billing', icon: <Wallet size={18} /> },
  { id: 'deployments', label: 'Deployments', icon: <Rocket size={18} /> },
];

export const Sidebar: React.FC = () => {
  const { activeNav, setActiveNav, sidebarCollapsed } = useUIStore();
  const { loginStatus } = useAzureStore();
  const { currentEnvironment } = useEnvironmentStore();

  return (
    <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <img
          src="/logo.png"
          alt="Azure Bicep Builder"
          style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }}
        />
        {!sidebarCollapsed && (
          <div className="sidebar-logo-text">
            <h1 style={{ fontSize: '13px', lineHeight: '1.2' }}>Azure Bicep Builder</h1>
            <span style={{ fontSize: '10px', color: '#a1a1aa' }}>ABB</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!sidebarCollapsed && <div className="sidebar-section-label">Workspace</div>}
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => setActiveNav(item.id)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </div>
        ))}

        {!sidebarCollapsed && currentEnvironment && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: '14px' }}>
              Active Topology
            </div>
            <div
              className={`sidebar-item ${activeNav === 'environments' ? 'active' : ''}`}
              onClick={() => setActiveNav('environments')}
              style={{
                border: '1px solid #27272a',
                background: '#121215',
              }}
            >
              <span className="sidebar-item-icon">
                <Cloud size={16} />
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentEnvironment.name}
              </span>
            </div>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-azure-status" title={loginStatus.loggedIn ? `Logged in: ${loginStatus.account?.name}` : 'Not connected to Azure'}>
          <span className={`status-dot ${loginStatus.loggedIn ? 'connected' : 'disconnected'}`} />
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#fafafa' }}>
                {loginStatus.loggedIn ? 'Azure Connected' : 'Azure Offline'}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-tertiary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {loginStatus.loggedIn
                  ? loginStatus.account?.name || 'Authorized'
                  : 'CLI Session'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
