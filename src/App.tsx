import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { VisualBuilder } from './components/builder/VisualBuilder';
import { CodeEditor } from './components/editor/CodeEditor';
import { SplitView } from './components/editor/SplitView';
import { WhatIfView } from './components/whatif/WhatIfView';
import { DeployView } from './components/deploy/DeployView';
import { ModuleVersionManager } from './components/modules/ModuleVersionManager';
import { RegionReplicationModal } from './components/replicate/RegionReplicationModal';
import { NewEnvironmentModal } from './components/environments/NewEnvironmentModal';

import { CloudAccountView } from './components/account/CloudAccountView';

import { useAzureStore, useEnvironmentStore, useUIStore } from './stores';
import { checkLoginStatus, checkAzCli } from './hooks/useTauri';
import { TEMPLATES } from './data/resources';
import type { Environment } from './types';
import { v4 as uuidv4 } from 'uuid';

export const App: React.FC = () => {
  const { setLoginStatus, setSelectedSubscription, setCliInstalled } = useAzureStore();
  const { currentEnvironment, setCurrentEnvironment, setEnvironments, environments, viewMode } = useEnvironmentStore();
  const { activeNav } = useUIStore();

  const [newEnvModalOpen, setNewEnvModalOpen] = useState<boolean>(false);

  // Initial check of Azure in-app session & CLI login state on startup
  useEffect(() => {
    checkAzCli().then((installed) => setCliInstalled(installed));
    
    // Check saved in-app OAuth session first
    import('./services/azureAuth').then(({ getSavedAuthSession }) => {
      const saved = getSavedAuthSession();
      if (saved) {
        setLoginStatus({
          loggedIn: true,
          account: saved.account,
          subscriptions: saved.subscriptions,
        });
        if (saved.subscriptions.length > 0) {
          setSelectedSubscription(saved.subscriptions[0]);
        }
        return;
      }

      // If no saved in-app session, check native Azure CLI
      checkLoginStatus().then((status) => {
        if (status.loggedIn) {
          setLoginStatus(status);
          if (status.subscriptions.length > 0) {
            setSelectedSubscription(status.subscriptions[0]);
          }
        }
      });
    });

    // Seed default environment if none exists for quick exploration
    if (environments.length === 0) {
      const defaultTmpl = TEMPLATES[0];
      const seededEnv: Environment = {
        id: uuidv4(),
        name: 'web-app-db-env',
        description: defaultTmpl.description,
        subscription: 'Development Sub',
        subscriptionId: '',
        resourceGroup: 'rg-webapp-prod-eastus',
        region: 'eastus',
        resources: defaultTmpl.resources.map((r) => ({
          ...r,
          id: uuidv4(),
        })),
        moduleVersions: { ...defaultTmpl.moduleVersions },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      };

      // Wire up app -> serverfarm dependency
      const asp = seededEnv.resources.find((r) => r.type === 'Microsoft.Web/serverfarms');
      const webApp = seededEnv.resources.find((r) => r.type === 'Microsoft.Web/sites');
      if (asp && webApp) {
        webApp.dependsOn.push(asp.id);
      }

      setEnvironments([seededEnv]);
      setCurrentEnvironment(seededEnv);
    }
  }, []);

  const renderContent = () => {
    if (activeNav === 'dashboard' || activeNav === 'templates') {
      return <Dashboard onNewEnv={() => setNewEnvModalOpen(true)} />;
    }

    if (activeNav === 'account') {
      return <CloudAccountView />;
    }

    if (activeNav === 'modules') {
      return <ModuleVersionManager />;
    }

    if (activeNav === 'deployments') {
      return <DeployView />;
    }

    if (activeNav === 'environments') {
      if (!currentEnvironment) {
        return (
          <div className="empty-state">
            <span className="empty-state-icon">🏗️</span>
            <h3>No Environment Active</h3>
            <p>Choose an environment from the dashboard or create one to start designing.</p>
            <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => setNewEnvModalOpen(true)}>
              ➕ Create Environment
            </button>
          </div>
        );
      }

      switch (viewMode) {
        case 'visual':
          return <VisualBuilder />;
        case 'code':
          return <CodeEditor />;
        case 'split':
          return <SplitView />;
        case 'whatif':
          return <WhatIfView />;
        case 'deploy':
          return <DeployView />;
        default:
          return <VisualBuilder />;
      }
    }

    return <Dashboard onNewEnv={() => setNewEnvModalOpen(true)} />;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">{renderContent()}</main>
      </div>

      <RegionReplicationModal />
      <NewEnvironmentModal
        isOpen={newEnvModalOpen}
        onClose={() => setNewEnvModalOpen(false)}
      />
    </div>
  );
};

export default App;
