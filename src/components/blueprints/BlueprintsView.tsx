import React, { useState } from 'react';
import { useEnvironmentStore, useUIStore } from '../../stores';
import { TEMPLATES } from '../../data/resources';
import type { Template, Environment } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import {
  FileCode,
  Search,
  Layers,
  ArrowRight,
  Server,
  Database,
  HardDrive,
  Globe,
  Lock,
  X,
} from 'lucide-react';

export const BlueprintsView: React.FC = () => {
  const { environments, setEnvironments, setCurrentEnvironment, setViewMode } = useEnvironmentStore();
  const { setActiveNav } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const categories = ['All', 'Compute & VPS', 'Web & API', 'Containers', 'Data & AI', 'Networking', 'Full Stack'];

  const filteredTemplates = TEMPLATES.filter((tmpl) => {
    const matchCat = selectedCategory === 'All' || tmpl.category === selectedCategory;
    const matchSearch =
      tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.resources.some((r) => r.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleLaunchBlueprint = (tmpl: Template) => {
    const cleanName = tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newEnv: Environment = {
      id: uuidv4(),
      name: `${cleanName}-env`,
      description: tmpl.description,
      subscription: 'Active Subscription',
      subscriptionId: '',
      resourceGroup: `rg-${cleanName}`,
      region: 'eastus',
      resources: tmpl.resources.map((res) => ({
        ...res,
        id: uuidv4(),
      })),
      moduleVersions: { ...tmpl.moduleVersions },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
    };

    // Wire up app -> serverfarm dependency if applicable
    const asp = newEnv.resources.find((r) => r.type === 'Microsoft.Web/serverfarms');
    const webApp = newEnv.resources.find((r) => r.type === 'Microsoft.Web/sites');
    if (asp && webApp && !webApp.dependsOn.includes(asp.id)) {
      webApp.dependsOn.push(asp.id);
    }

    setEnvironments([...environments, newEnv]);
    setCurrentEnvironment(newEnv);
    setViewMode('visual');
    setActiveNav('environments');
  };

  const getResourceIcon = (type: string) => {
    if (type.includes('storageAccounts')) return <HardDrive size={13} />;
    if (type.includes('sites') || type.includes('serverfarms')) return <Server size={13} />;
    if (type.includes('PostgreSQL') || type.includes('sql')) return <Database size={13} />;
    if (type.includes('vaults')) return <Lock size={13} />;
    if (type.includes('virtualNetworks')) return <Globe size={13} />;
    return <Layers size={13} />;
  };

  return (
    <div className="blueprints-view" style={{ padding: '24px 32px', height: '100%', overflowY: 'auto', background: '#09090b' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode size={24} />
            Architecture Blueprints
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            Preconfigured, production-ready Azure cloud topologies with automated dependency wiring.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 12px', width: '280px' }}>
            <Search size={15} style={{ marginRight: '8px', color: '#71717a' }} />
            <input
              type="text"
              placeholder="Search blueprints & components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fafafa', outline: 'none', fontSize: '13px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px', borderBottom: '1px solid #27272a' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: selectedCategory === cat ? '1px solid #3b82f6' : '1px solid #27272a',
              background: selectedCategory === cat ? '#2563eb' : '#18181b',
              color: selectedCategory === cat ? '#ffffff' : '#a1a1aa',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 120ms ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blueprints Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            style={{
              background: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 150ms ease',
            }}
          >
            <div>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#18181b',
                    color: '#a1a1aa',
                    border: '1px solid #27272a',
                  }}
                >
                  {tmpl.category}
                </span>

                <span style={{ fontSize: '11px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} /> {tmpl.resources.length} Components
                </span>
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fafafa', margin: '0 0 8px 0' }}>
                {tmpl.name}
              </h3>
              <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, margin: '0 0 16px 0', minHeight: '36px' }}>
                {tmpl.description}
              </p>

              {/* Included Components Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                {tmpl.resources.map((res, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#d4d4d8',
                    }}
                  >
                    {getResourceIcon(res.type)}
                    {res.displayName}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e1e24', paddingTop: '14px', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewTemplate(tmpl)}
                style={{ fontSize: '12px' }}
              >
                Inspect Schema
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleLaunchBlueprint(tmpl)}
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Use Blueprint <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Blueprint Inspect Modal */}
      {previewTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewTemplate(null);
          }}
        >
          <div
            style={{
              background: '#121215',
              border: '1px solid #27272a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '600px',
              padding: '24px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>
                  {previewTemplate.category} Blueprint
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#fafafa' }}>
                  {previewTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '20px', lineHeight: 1.5 }}>
              {previewTemplate.description}
            </p>

            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa', marginBottom: '10px' }}>
              Configured Topology Resources ({previewTemplate.resources.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {previewTemplate.resources.map((res, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getResourceIcon(res.type)}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa' }}>{res.displayName}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'var(--font-mono)' }}>{res.type}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                    {res.name}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setPreviewTemplate(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const tmpl = previewTemplate;
                  setPreviewTemplate(null);
                  handleLaunchBlueprint(tmpl);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Instantiate Environment <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
