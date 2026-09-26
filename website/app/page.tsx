'use client';

import React, { useState } from 'react';
import {
  Download,
  Layers,
  Code2,
  Rocket,
  ShieldCheck,
  Zap,
  HardDrive,
  Globe,
  Database,
  Server,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Terminal,
  Cpu,
  RefreshCw,
  FolderDown,
  FileCode,
} from 'lucide-react';
import Prism from './components/Prism';

const GithubIcon = ({ size = 16 }: { size?: number }) => (

  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);


export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [activeBlueprint, setActiveBlueprint] = useState<number>(0);

  const blueprints = [
    {
      title: 'Linux VPS Host & Security',
      category: 'Compute & Networking',
      tag: 'VM + VNet + NSG + Public IP',
      desc: 'Deploy an Ubuntu Linux VM with isolated subnets, network security group rules, public IP allocation, and automated SSH key binding.',
      code: `targetScope = 'resourceGroup'

param location string = 'eastus'
param adminUsername string = 'azureuser'

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: 'vnet-vps-prod'
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }
    subnets: [
      { name: 'snet-compute', properties: { addressPrefix: '10.0.1.0/24' } }
    ]
  }
}

resource vm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: 'vm-app-node01'
  location: location
  properties: {
    hardwareProfile: { vmSize: 'Standard_B2s' }
    storageProfile: {
      imageReference: { publisher: 'Canonical', offer: '0001-com-ubuntu-server-jammy', sku: '22_04-lts', version: 'latest' }
    }
  }
}`,
    },
    {
      title: 'Full-Stack Web App + PostgreSQL',
      category: 'Web & Databases',
      tag: 'App Service + Flexible Server',
      desc: 'Linux App Service running Node.js / Python connected to Azure Database for PostgreSQL Flexible Server with private storage and secure connection strings.',
      code: `targetScope = 'resourceGroup'

param location string = 'westeurope'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'asp-web-prod'
  location: location
  sku: { name: 'B1', tier: 'Basic' }
  kind: 'linux'
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'site-frontend-prod'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: { linuxFxVersion: 'NODE|18-lts' }
  }
}

resource db 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: 'pg-core-db'
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: { version: '16', storage: { storageSizeGB: 32 } }
}`,
    },
    {
      title: 'AI Inference & Microservices Stack',
      category: 'Containers & Analytics',
      tag: 'AKS + Container Registry + Key Vault',
      desc: 'Azure Kubernetes Service (AKS) managed cluster with Azure Container Registry (ACR) private image repository and Key Vault secret management.',
      code: `targetScope = 'resourceGroup'

param location string = 'eastus2'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acrmodelsregistry'
  location: location
  sku: { name: 'Standard' }
  properties: { adminUserEnabled: true }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-prod-secrets'
  location: location
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
  }
}`,
    },
  ];

  return (
    <div className="landing-container">
      {/* Floating Pill Navigation */}
      <header className="landing-nav-wrapper">
        <nav className="landing-nav">
          <a href="#" className="nav-brand">
            <div className="nav-logo-icon">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <span className="nav-brand-title">Azure Bicep Builder</span>
          </a>

          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#blueprints" className="nav-link">Blueprints</a>
            <a
              href="https://github.com/lunoxd/Azure-Bicep-Builder"
              target="_blank"
              rel="noreferrer"
              className="nav-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <GithubIcon size={15} /> GitHub
            </a>

            <a href="#downloads" className="btn-nav-download">
              Download App
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section with 3D WebGL Prism */}
      <div className="hero-wrapper">
        <div className="hero-prism-bg">
          <Prism
            animationType="hover"
            glow={1.2}
            bloom={1.1}
            scale={3.5}
            hoverStrength={1.8}
            noise={0.25}
            timeScale={0.5}
            transparent={true}
          />
        </div>

        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-tag">v0.1.0 Release</span>
              <span>Open Source Local-First Architecture Studio</span>
            </div>

            <h1 className="hero-title">
              Visual Cloud Architecture<br />
              <span className="hero-title-gradient">Meets Real Azure Bicep</span>
            </h1>

            <p className="hero-subtitle">
              Design topologies visually, generate production-grade Azure Bicep code with zero drift,
              inspect live cloud spending & credits, and deploy directly to Microsoft Azure with 1-click.
            </p>

            {/* Download Group */}
            <div className="download-group-container" id="downloads">
              <div className="download-tabs">
                <button
                  className={`download-tab ${activeTab === 'macos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('macos')}
                >
                  <Cpu size={16} /> macOS (Apple Silicon & Intel)
                </button>
                <button
                  className={`download-tab ${activeTab === 'windows' ? 'active' : ''}`}
                  onClick={() => setActiveTab('windows')}
                >
                  <Terminal size={16} /> Windows (x64 / ARM64)
                </button>
                <button
                  className={`download-tab ${activeTab === 'linux' ? 'active' : ''}`}
                  onClick={() => setActiveTab('linux')}
                >
                  <Server size={16} /> Linux / Source
                </button>
              </div>

              <div className="download-cards-grid">
                {activeTab === 'macos' && (
                  <>
                    <a
                      href="/downloads/Azure-Bicep-Builder-macOS.dmg"
                      download
                      className="btn-download-primary"
                    >
                      <Download size={18} /> Download macOS .DMG (4.1 MB)
                    </a>
                    <a
                      href="/downloads/Azure-Bicep-Builder-macOS.zip"
                      download
                      className="btn-download-secondary"
                    >
                      <FolderDown size={18} /> Download macOS .ZIP (3.9 MB)
                    </a>
                  </>
                )}

                {activeTab === 'windows' && (
                  <>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-primary"
                    >
                      <Download size={18} /> Windows 64-bit Installer (.exe)
                    </a>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-secondary"
                    >
                      <ExternalLink size={16} /> GitHub Windows Releases
                    </a>
                  </>
                )}

                {activeTab === 'linux' && (
                  <>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-primary"
                    >
                      <Download size={18} /> Linux .AppImage / .deb
                    </a>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-secondary"
                    >
                      <GithubIcon size={16} /> Build from Source (Cargo + Vite)
                    </a>
                  </>
                )}
              </div>

              <div className="hero-meta">
                <span>✨ 100% Local-first</span>
                <span>•</span>
                <span>🔒 No telemetry or tracker</span>
                <span>•</span>
                <span>⚡ Instant ARM REST & az CLI support</span>
                <span>•</span>
                <span>📄 MIT Licensed</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* App Interactive Preview */}
      <section className="preview-section">

        <div className="preview-frame">
          <div className="preview-header">
            <div className="preview-dots">
              <div className="preview-dot" style={{ background: '#ef4444' }} />
              <div className="preview-dot" style={{ background: '#f59e0b' }} />
              <div className="preview-dot" style={{ background: '#10b981' }} />
            </div>
            <div className="preview-title">Azure Bicep Builder — Visual Workspace & Live Synchronizer</div>
            <div style={{ width: '40px' }} />
          </div>

          <div className="preview-body">
            {/* Visual Canvas Card */}
            <div className="preview-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Visual Architecture Canvas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd' }}>
                      <Server size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>vm-linux-app-01</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Standard_B2s • Ubuntu 22.04</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#18181b', border: '1px solid #27272a', padding: '2px 8px', borderRadius: '4px', color: '#60a5fa' }}>Compute</span>
                </div>

                <div style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>↓ dependsOn subnet & nic</span>
                </div>

                <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6ee7b7' }}>
                      <Globe size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>vnet-primary-eastus</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa' }}>10.0.0.0/16 • 1 Subnet</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#18181b', border: '1px solid #27272a', padding: '2px 8px', borderRadius: '4px', color: '#34d399' }}>Network</span>
                </div>

                <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#4c1d95', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd' }}>
                      <Database size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>pg-flexible-db</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Standard_B1ms • PostgreSQL 16</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', background: '#18181b', border: '1px solid #27272a', padding: '2px 8px', borderRadius: '4px', color: '#a78bfa' }}>Database</span>
                </div>
              </div>
            </div>

            {/* Generated Code Card */}
            <div className="preview-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Auto-Generated Azure Bicep Template
              </div>
              <div className="preview-code">{`targetScope = 'resourceGroup'

param location string = 'eastus'
param environmentName string = 'production'

resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = {
  name: 'vnet-primary-eastus'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
  }
}

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: 'pg-flexible-db'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
}`}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section" id="features">
        <h2 className="section-title">Engineered for Azure Cloud Teams</h2>
        <p className="section-subtitle">
          Everything required to prototype, visualize, validate, and deploy production Azure infrastructure.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <Layers size={22} />
            </div>
            <h3>Visual Drag & Drop Canvas</h3>
            <p>
              Link resources with visual wires. Declare dependency trees naturally and configure SKU tiers, network prefixes, and identities in a property panel.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <FileCode size={22} />
            </div>
            <h3>Bidirectional Bicep Editor</h3>
            <p>
              Monaco-powered syntax editing with intelligent auto-completion. Canvas graph and Bicep source code stay in lockstep synchronization.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Rocket size={22} />
            </div>
            <h3>Direct Real ARM Deployments</h3>
            <p>
              Deploy straight to your Microsoft Azure subscription via Microsoft Entra ID Device Flow or local Azure CLI without managing custom API keys.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <ShieldCheck size={22} />
            </div>
            <h3>Azure What-If Delta Analysis</h3>
            <p>
              Evaluate the precise resource create, modify, and delete operations prior to deployment to prevent unexpected disruption or configuration drift.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Sparkles size={22} />
            </div>
            <h3>Live Credits & Spending Tracker</h3>
            <p>
              Monitor your student grant or corporate subscription balance in real-time with automatic consumption API breakdown by service.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Globe size={22} />
            </div>
            <h3>Zero-Orphan Clean Teardown</h3>
            <p>
              Resource Group boundary encapsulation guarantees that removing an environment cleans up all attached NICs, storage disks, and IPs cleanly.
            </p>
          </div>
        </div>
      </section>

      {/* Blueprints Showcase */}
      <section className="blueprints-section" id="blueprints">
        <h2 className="section-title">Production Cloud Blueprints</h2>
        <p className="section-subtitle">
          Instant starter templates designed following Microsoft Well-Architected Framework guidelines.
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          {blueprints.map((bp, idx) => (
            <button
              key={idx}
              className={`download-tab ${activeBlueprint === idx ? 'active' : ''}`}
              onClick={() => setActiveBlueprint(idx)}
            >
              {bp.title}
            </button>
          ))}
        </div>

        <div className="preview-frame" style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="preview-header">
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa' }}>
              {blueprints[activeBlueprint].title}
            </span>
            <span className="blueprint-tag">{blueprints[activeBlueprint].tag}</span>
          </div>
          <div style={{ padding: '20px', background: '#121215' }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '16px' }}>
              {blueprints[activeBlueprint].desc}
            </p>
            <div className="preview-code">{blueprints[activeBlueprint].code}</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>
          Azure Bicep Builder (ABB) • Open Source Visual Cloud Studio
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="https://github.com/lunoxd/Azure-Bicep-Builder" target="_blank" rel="noreferrer">
            GitHub Repository
          </a>
          <span>•</span>
          <a href="#downloads">Downloads</a>
          <span>•</span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  );
}
