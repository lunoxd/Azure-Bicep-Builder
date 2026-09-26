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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

const AppleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.05 1.72-.92 2.74 1 .08 2.03-.49 2.62-1.24z"/>
  </svg>
);

const WindowsIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.45l6.5-.9v6.95H3V5.45zm0 7.85h6.5v6.95L3 19.35v-6.05zm7.8-8.98L21 2.7v8.8h-10.2V4.32zm10.2 8.98v8.8l-10.2-1.62v-7.18H21z"/>
  </svg>
);

const LinuxIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.002 2c-2.38 0-4.31 1.93-4.31 4.31 0 1.24.52 2.36 1.36 3.14-.07.41-.12.83-.12 1.26 0 1.83.69 3.51 1.83 4.8-1.57.85-2.76 2.39-3.09 4.24-.13.73.43 1.38 1.17 1.38h10.32c.74 0 1.3-.65 1.17-1.38-.33-1.85-1.52-3.39-3.09-4.24 1.14-1.29 1.83-2.97 1.83-4.8 0-.43-.05-.85-.12-1.26.84-.78 1.36-1.9 1.36-3.14 0-2.38-1.93-4.31-4.31-4.31zm-1.5 4.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
  </svg>
);

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
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0.3}
            glow={1.2}
            bloom={1.2}
            hoverStrength={2}
            transparent={true}
          />
        </div>

        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <Badge variant="secondary">v0.1.0 Release</Badge>
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

            {/* Download Group using shadcn Tabs */}
            <div className="download-group-container" id="downloads">
              <Tabs defaultValue="macos" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList style={{ margin: '0 auto 20px', display: 'flex', justifyContent: 'center' }}>
                  <TabsTrigger value="macos">
                    <AppleIcon size={15} /> macOS
                  </TabsTrigger>
                  <TabsTrigger value="windows">
                    <WindowsIcon size={15} /> Windows
                  </TabsTrigger>
                  <TabsTrigger value="linux">
                    <LinuxIcon size={15} /> Linux / Source
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="macos">
                  <div className="download-cards-grid">
                    <a
                      href="/downloads/Azure-Bicep-Builder-macOS.dmg"
                      download
                      className="btn-download-primary"
                    >
                      <AppleIcon size={18} /> Download macOS .DMG (4.1 MB)
                    </a>
                    <a
                      href="/downloads/Azure-Bicep-Builder-macOS.zip"
                      download
                      className="btn-download-secondary"
                    >
                      <FolderDown size={18} /> Download macOS .ZIP (3.9 MB)
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="windows">
                  <div className="download-cards-grid">
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-primary"
                    >
                      <WindowsIcon size={18} /> Windows 64-bit Installer (.exe)
                    </a>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-secondary"
                    >
                      <ExternalLink size={16} /> GitHub Windows Releases
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="linux">
                  <div className="download-cards-grid">
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder/releases"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-primary"
                    >
                      <LinuxIcon size={18} /> Linux .AppImage / .deb
                    </a>
                    <a
                      href="https://github.com/lunoxd/Azure-Bicep-Builder"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-download-secondary"
                    >
                      <GithubIcon size={16} /> Build from Source (Cargo + Vite)
                    </a>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="hero-meta">
                <Badge variant="secondary">✨ Local-first</Badge>
                <Badge variant="secondary">🔒 No telemetry</Badge>
                <Badge variant="secondary">⚡ ARM REST & CLI</Badge>
                <Badge variant="secondary">📄 MIT Licensed</Badge>
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
              <div className="preview-dot" style={{ background: '#4e5058' }} />
              <div className="preview-dot" style={{ background: '#4e5058' }} />
              <div className="preview-dot" style={{ background: '#4e5058' }} />
            </div>
            <div className="preview-title">Azure Bicep Builder — Visual Workspace & Live Synchronizer</div>
            <div style={{ width: '40px' }} />
          </div>

          <div className="preview-body">
            {/* Visual Canvas Card */}
            <div className="preview-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                Visual Architecture Canvas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#2b2d31', border: '1px solid #383a40', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#313338', border: '1px solid #383a40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2f3f5' }}>
                      <Server size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>vm-linux-app-01</div>
                      <div style={{ fontSize: '11px', color: '#b5bac1' }}>Standard_B2s • Ubuntu 22.04</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Compute</Badge>
                </div>

                <div style={{ textAlign: 'center', color: '#949ba4', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>↓ dependsOn subnet & nic</span>
                </div>

                <div style={{ background: '#2b2d31', border: '1px solid #383a40', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#313338', border: '1px solid #383a40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2f3f5' }}>
                      <Globe size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>vnet-primary-eastus</div>
                      <div style={{ fontSize: '11px', color: '#b5bac1' }}>10.0.0.0/16 • 1 Subnet</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Network</Badge>
                </div>

                <div style={{ background: '#2b2d31', border: '1px solid #383a40', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#313338', border: '1px solid #383a40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2f3f5' }}>
                      <Database size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>pg-flexible-db</div>
                      <div style={{ fontSize: '11px', color: '#b5bac1' }}>Standard_B1ms • PostgreSQL 16</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Database</Badge>
                </div>
              </div>
            </div>

            {/* Generated Code Card */}
            <div className="preview-card">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
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

      {/* Features Grid using shadcn Cards */}
      <section className="features-section" id="features">
        <h2 className="section-title">Engineered for Azure Cloud Teams</h2>
        <p className="section-subtitle">
          Everything required to prototype, visualize, validate, and deploy production Azure infrastructure.
        </p>

        <div className="features-grid">
          <Card className="feature-card">
            <CardHeader style={{ padding: 0 }}>
              <div className="feature-icon-box">
                <Layers size={22} />
              </div>
              <CardTitle>Visual Drag & Drop Canvas</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '8px 0 0 0' }}>
              <CardDescription>
                Link resources with visual wires. Declare dependency trees naturally and configure SKU tiers, network prefixes, and identities in a property panel.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardHeader style={{ padding: 0 }}>
              <div className="feature-icon-box">
                <FileCode size={22} />
              </div>
              <CardTitle>Bidirectional Bicep Editor</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '8px 0 0 0' }}>
              <CardDescription>
                Monaco-powered syntax editing with intelligent auto-completion. Canvas graph and Bicep source code stay in lockstep synchronization.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardHeader style={{ padding: 0 }}>
              <div className="feature-icon-box">
                <Rocket size={22} />
              </div>
              <CardTitle>Direct Real ARM Deployments</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '8px 0 0 0' }}>
              <CardDescription>
                Deploy straight to your Microsoft Azure subscription via Microsoft Entra ID Device Flow or local Azure CLI without managing custom API keys.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardHeader style={{ padding: 0 }}>
              <div className="feature-icon-box">
                <ShieldCheck size={22} />
              </div>
              <CardTitle>Azure What-If Delta Analysis</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '8px 0 0 0' }}>
              <CardDescription>
                Evaluate the precise resource create, modify, and delete operations prior to deployment to prevent unexpected disruption or configuration drift.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardHeader style={{ padding: 0 }}>
              <div className="feature-icon-box">
                <Sparkles size={22} />
              </div>
              <CardTitle>Live Credits & Spending Tracker</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '8px 0 0 0' }}>
              <CardDescription>
                Monitor your student grant or corporate subscription balance in real-time with automatic consumption API breakdown by service.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="feature-card">
            <CardHeader style={{ padding: 0 }}>
              <div className="feature-icon-box">
                <Globe size={22} />
              </div>
              <CardTitle>Zero-Orphan Clean Teardown</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '8px 0 0 0' }}>
              <CardDescription>
                Resource Group boundary encapsulation guarantees that removing an environment cleans up all attached NICs, storage disks, and IPs cleanly.
              </CardDescription>
            </CardContent>
          </Card>
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
            <Button
              key={idx}
              variant={activeBlueprint === idx ? 'blurple' : 'secondary'}
              size="sm"
              onClick={() => setActiveBlueprint(idx)}
            >
              {bp.title}
            </Button>
          ))}
        </div>

        <div className="preview-frame" style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="preview-header">
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f2f3f5' }}>
              {blueprints[activeBlueprint].title}
            </span>
            <Badge variant="secondary">{blueprints[activeBlueprint].tag}</Badge>
          </div>
          <div style={{ padding: '20px', background: '#2b2d31' }}>
            <p style={{ color: '#b5bac1', fontSize: '14px', marginBottom: '16px' }}>
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
