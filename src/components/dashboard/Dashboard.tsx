import React from 'react';
import { useEnvironmentStore, useUIStore } from '../../stores';
import { TEMPLATES } from '../../data/resources';
import type { Environment, Template } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Globe, Layers, MapPin, Box, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC<{ onNewEnv: () => void }> = ({ onNewEnv }) => {
  const { environments, setCurrentEnvironment } = useEnvironmentStore();
  const { setActiveNav } = useUIStore();

  const handleSelectEnv = (env: Environment) => {
    setCurrentEnvironment(env);
    setActiveNav('environments');
    useEnvironmentStore.getState().setViewMode('visual');
  };

  const handleCreateFromTemplate = (template: Template) => {
    const newEnv: Environment = {
      id: uuidv4(),
      name: `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-env`,
      description: template.description,
      subscription: 'Active Subscription',
      subscriptionId: '',
      resourceGroup: `rg-${template.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      region: 'eastus',
      resources: template.resources.map((res) => ({
        ...res,
        id: uuidv4(),
      })),
      moduleVersions: { ...template.moduleVersions },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };

    const asp = newEnv.resources.find((r) => r.type === 'Microsoft.Web/serverfarms');
    const webApp = newEnv.resources.find((r) => r.type === 'Microsoft.Web/sites');
    if (asp && webApp && !webApp.dependsOn.includes(asp.id)) {
      webApp.dependsOn.push(asp.id);
    }

    useEnvironmentStore.getState().setEnvironments([...environments, newEnv]);
    setCurrentEnvironment(newEnv);
    setActiveNav('environments');
    useEnvironmentStore.getState().setViewMode('visual');
  };

  return (
    <div className="dashboard" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Environments Section */}
      <section style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fafafa', margin: 0 }}>
              Environments
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Visual Bicep topologies ready to design, inspect, and deploy to Azure.
            </p>
          </div>
          <button className="btn btn-primary" onClick={onNewEnv} style={{ padding: '10px 18px', fontWeight: 700 }}>
            <Plus size={16} /> New Environment
          </button>
        </div>

        {environments.length > 0 ? (
          <div className="dashboard-grid">
            {environments.map((env) => (
              <div key={env.id} className="card template-card" onClick={() => handleSelectEnv(env)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Globe size={18} color="#3b82f6" />
                  </div>
                  <span
                    className={`badge badge-${
                      env.status === 'deployed' ? 'success' : env.status === 'draft' ? 'neutral' : 'warning'
                    }`}
                  >
                    {env.status === 'deployed' ? 'Active' : 'Draft'}
                  </span>
                </div>
                <h3 style={{ marginTop: '12px', fontSize: '16px', fontWeight: 700 }}>{env.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {env.description || 'Custom Bicep cloud architecture'}
                </p>
                <div className="template-card-footer">
                  <span className="badge badge-neutral">
                    <MapPin size={11} /> {env.region}
                  </span>
                  <span className="badge badge-neutral">
                    <Box size={11} /> {env.resources.length} resources
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#3b82f6',
                    fontWeight: 700,
                  }}
                >
                  <span>Open Workspace</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '36px 20px' }}>
            <Globe size={36} color="#71717a" />
            <h3 style={{ marginTop: '12px' }}>No Environments Yet</h3>
            <p style={{ maxWidth: '400px', margin: '0 auto' }}>
              Create your first environment from scratch or choose a starter blueprint below.
            </p>
          </div>
        )}
      </section>

      {/* Starter Blueprints */}
      <section>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fafafa', margin: 0 }}>
            Starter Blueprints
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Preconfigured production Bicep templates.
          </p>
        </div>

        <div className="dashboard-grid">
          {TEMPLATES.map((tmpl) => (
            <div key={tmpl.id} className="template-card" onClick={() => handleCreateFromTemplate(tmpl)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#3b82f6' }}>
                  {tmpl.icon}
                </span>
                <span className="badge badge-info">{tmpl.category}</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{tmpl.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tmpl.description}</p>
              <div className="template-card-footer">
                <span className="badge badge-neutral">
                  <Layers size={11} /> {tmpl.resources.length} Resources
                </span>
              </div>
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#fafafa',
                  fontWeight: 600,
                }}
              >
                <span>Launch Template</span>
                <ArrowRight size={14} color="#3b82f6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
