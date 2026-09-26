import type { ResourceTypeInfo, Template } from '../types';

// ============================================================
// Resource Type Definitions with Google Material Symbols / Lucide
// ============================================================

export const RESOURCE_TYPES: ResourceTypeInfo[] = [
  {
    type: 'Microsoft.Resources/resourceGroups',
    displayName: 'Resource Group',
    shortName: 'RG',
    icon: 'folder_open',
    color: '#fafafa',
    category: 'Foundation',
    defaultProperties: {},
    availableVersions: ['1.0.0'],
  },
  {
    type: 'Microsoft.Network/virtualNetworks',
    displayName: 'Virtual Network',
    shortName: 'VNet',
    icon: 'hub',
    color: '#38bdf8',
    category: 'Networking',
    defaultProperties: {
      addressSpace: '10.0.0.0/16',
      subnets: [
        { name: 'default', addressPrefix: '10.0.0.0/24' },
      ],
    },
    availableVersions: ['1.0.0', '1.1.0'],
  },
  {
    type: 'Microsoft.Storage/storageAccounts',
    displayName: 'Storage Account',
    shortName: 'Storage',
    icon: 'hard_drive',
    color: '#10b981',
    category: 'Storage',
    defaultProperties: {
      sku: 'Standard_LRS',
      kind: 'StorageV2',
      accessTier: 'Hot',
    },
    availableVersions: ['1.0.0'],
  },
  {
    type: 'Microsoft.Web/serverfarms',
    displayName: 'App Service Plan',
    shortName: 'ASP',
    icon: 'dns',
    color: '#f59e0b',
    category: 'Compute',
    defaultProperties: {
      skuName: 'F1',
      skuTier: 'Free',
      os: 'Linux',
    },
    availableVersions: ['1.0.0'],
  },
  {
    type: 'Microsoft.Web/sites',
    displayName: 'Web App',
    shortName: 'App',
    icon: 'language',
    color: '#06b6d4',
    category: 'Compute',
    defaultProperties: {
      runtime: 'NODE|18-lts',
      httpsOnly: 'true',
    },
    availableVersions: ['1.0.0', '1.1.0'],
  },
  {
    type: 'Microsoft.KeyVault/vaults',
    displayName: 'Key Vault',
    shortName: 'KV',
    icon: 'lock',
    color: '#f43f5e',
    category: 'Security',
    defaultProperties: {
      sku: 'standard',
    },
    availableVersions: ['1.0.0'],
  },
  {
    type: 'Microsoft.DBforPostgreSQL/flexibleServers',
    displayName: 'PostgreSQL Server',
    shortName: 'PgSQL',
    icon: 'database',
    color: '#3b82f6',
    category: 'Database',
    defaultProperties: {
      skuName: 'Standard_B1ms',
      skuTier: 'Burstable',
      version: '16',
      storageSizeGB: '32',
      administratorLogin: 'pgadmin',
    },
    availableVersions: ['1.0.0'],
  },
];

export function getResourceTypeInfo(type: string): ResourceTypeInfo | undefined {
  return RESOURCE_TYPES.find((rt) => rt.type === type);
}

// ============================================================
// Starter Architecture Templates
// ============================================================

export const TEMPLATES: Template[] = [
  {
    id: 'web-app-db',
    name: 'Web App + Database',
    description: 'A modern web application topology with App Service, PostgreSQL database, and Key Vault for zero-trust secrets.',
    icon: 'cloud_sync',
    category: 'Web',
    moduleVersions: { network: '1.1.0', storage: '1.0.0' },
    resources: [
      {
        type: 'Microsoft.Web/serverfarms',
        name: 'asp-webapp',
        displayName: 'App Service Plan',
        properties: { skuName: 'B1', skuTier: 'Basic', os: 'Linux' },
        dependsOn: [],
        position: { x: 100, y: 100 },
      },
      {
        type: 'Microsoft.Web/sites',
        name: 'app-webapp',
        displayName: 'Web Application',
        properties: { runtime: 'NODE|18-lts', httpsOnly: 'true' },
        dependsOn: [],
        position: { x: 420, y: 100 },
      },
      {
        type: 'Microsoft.DBforPostgreSQL/flexibleServers',
        name: 'psql-webapp',
        displayName: 'PostgreSQL Server',
        properties: {
          skuName: 'Standard_B1ms',
          skuTier: 'Burstable',
          version: '16',
          storageSizeGB: '32',
          administratorLogin: 'pgadmin',
        },
        dependsOn: [],
        position: { x: 420, y: 340 },
      },
      {
        type: 'Microsoft.KeyVault/vaults',
        name: 'kv-webapp',
        displayName: 'Key Vault',
        properties: { sku: 'standard' },
        dependsOn: [],
        position: { x: 100, y: 340 },
      },
    ],
  },
  {
    id: 'static-site',
    name: 'Static Website Storage',
    description: 'An immutable Storage Account configured for global static website hosting and asset delivery.',
    icon: 'web',
    category: 'Web',
    moduleVersions: { storage: '1.0.0' },
    resources: [
      {
        type: 'Microsoft.Storage/storageAccounts',
        name: 'ststaticsite',
        displayName: 'Static Site Storage',
        properties: {
          sku: 'Standard_LRS',
          kind: 'StorageV2',
          accessTier: 'Hot',
        },
        dependsOn: [],
        position: { x: 250, y: 200 },
      },
    ],
  },
  {
    id: 'secure-network',
    name: 'Secure Enterprise VNet',
    description: 'Multi-tier Virtual Network with subnets, secure storage, and Key Vault access policies.',
    icon: 'shield',
    category: 'Networking',
    moduleVersions: { network: '1.1.0', storage: '1.0.0' },
    resources: [
      {
        type: 'Microsoft.Network/virtualNetworks',
        name: 'vnet-secure',
        displayName: 'Virtual Network',
        properties: {
          addressSpace: '10.0.0.0/16',
          subnets: [
            { name: 'frontend', addressPrefix: '10.0.1.0/24' },
            { name: 'backend', addressPrefix: '10.0.2.0/24' },
            { name: 'data', addressPrefix: '10.0.3.0/24' },
          ],
        },
        dependsOn: [],
        position: { x: 250, y: 80 },
      },
      {
        type: 'Microsoft.Storage/storageAccounts',
        name: 'stsecure',
        displayName: 'Storage Account',
        properties: {
          sku: 'Standard_GRS',
          kind: 'StorageV2',
          accessTier: 'Hot',
        },
        dependsOn: [],
        position: { x: 100, y: 320 },
      },
      {
        type: 'Microsoft.KeyVault/vaults',
        name: 'kv-secure',
        displayName: 'Key Vault',
        properties: { sku: 'standard' },
        dependsOn: [],
        position: { x: 420, y: 320 },
      },
    ],
  },
  {
    id: 'full-stack',
    name: 'Full Stack Cloud Platform',
    description: 'Complete architecture: Isolated VNet, Linux App Service, PostgreSQL DB, Key Vault, and Storage Account.',
    icon: 'layers',
    category: 'Full Stack',
    moduleVersions: { network: '1.1.0', storage: '1.0.0' },
    resources: [
      {
        type: 'Microsoft.Network/virtualNetworks',
        name: 'vnet-fullstack',
        displayName: 'Virtual Network',
        properties: {
          addressSpace: '10.0.0.0/16',
          subnets: [
            { name: 'web', addressPrefix: '10.0.1.0/24' },
            { name: 'data', addressPrefix: '10.0.2.0/24' },
          ],
        },
        dependsOn: [],
        position: { x: 250, y: 40 },
      },
      {
        type: 'Microsoft.Web/serverfarms',
        name: 'asp-fullstack',
        displayName: 'App Service Plan',
        properties: { skuName: 'B1', skuTier: 'Basic', os: 'Linux' },
        dependsOn: [],
        position: { x: 50, y: 220 },
      },
      {
        type: 'Microsoft.Web/sites',
        name: 'app-fullstack',
        displayName: 'Web Application',
        properties: { runtime: 'NODE|18-lts', httpsOnly: 'true' },
        dependsOn: [],
        position: { x: 300, y: 220 },
      },
      {
        type: 'Microsoft.DBforPostgreSQL/flexibleServers',
        name: 'psql-fullstack',
        displayName: 'PostgreSQL Server',
        properties: {
          skuName: 'Standard_B1ms',
          skuTier: 'Burstable',
          version: '16',
          storageSizeGB: '32',
          administratorLogin: 'pgadmin',
        },
        dependsOn: [],
        position: { x: 520, y: 220 },
      },
      {
        type: 'Microsoft.KeyVault/vaults',
        name: 'kv-fullstack',
        displayName: 'Key Vault',
        properties: { sku: 'standard' },
        dependsOn: [],
        position: { x: 150, y: 400 },
      },
      {
        type: 'Microsoft.Storage/storageAccounts',
        name: 'stfullstack',
        displayName: 'Storage Account',
        properties: {
          sku: 'Standard_LRS',
          kind: 'StorageV2',
          accessTier: 'Hot',
        },
        dependsOn: [],
        position: { x: 420, y: 400 },
      },
    ],
  },
];

// ============================================================
// Azure Regions List
// ============================================================

export const AZURE_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northcentralus', label: 'North Central US' },
  { value: 'southcentralus', label: 'South Central US' },
  { value: 'canadacentral', label: 'Canada Central' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
  { value: 'francecentral', label: 'France Central' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'swedencentral', label: 'Sweden Central' },
  { value: 'norwayeast', label: 'Norway East' },
  { value: 'switzerlandnorth', label: 'Switzerland North' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'koreacentral', label: 'Korea Central' },
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'centralindia', label: 'Central India' },
  { value: 'southindia', label: 'South India' },
  { value: 'brazilsouth', label: 'Brazil South' },
  { value: 'southafricanorth', label: 'South Africa North' },
  { value: 'uaenorth', label: 'UAE North' },
];
