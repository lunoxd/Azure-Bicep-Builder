// ============================================================
// Core Types — The Internal Resource Model
// These types are the single source of truth. Both the visual
// builder and the Bicep code editor are projections of this model.
// ============================================================

export type ResourceType =
  | 'Microsoft.Resources/resourceGroups'
  | 'Microsoft.Network/virtualNetworks'
  | 'Microsoft.Storage/storageAccounts'
  | 'Microsoft.Web/serverfarms'
  | 'Microsoft.Web/sites'
  | 'Microsoft.KeyVault/vaults'
  | 'Microsoft.DBforPostgreSQL/flexibleServers';

export interface Position {
  x: number;
  y: number;
}

export interface Subnet {
  name: string;
  addressPrefix: string;
}

export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  displayName: string;
  properties: Record<string, any>;
  dependsOn: string[];      // IDs of other resources this depends on
  position: Position;
  moduleVersion?: string;    // e.g. "1.0.0"
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  subscription: string;
  subscriptionId: string;
  resourceGroup: string;
  region: string;
  resources: Resource[];
  moduleVersions: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastDeployedAt?: string;
  status: EnvironmentStatus;
}

export type EnvironmentStatus =
  | 'draft'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'modified';

// ============================================================
// Azure Types
// ============================================================

export interface AzureAccount {
  name: string;
  id: string;
  tenantId: string;
  state: string;
  isDefault: boolean;
}

export interface AzureSubscription {
  id: string;
  name: string;
  state: string;
  tenantId: string;
}

export interface AzureLoginStatus {
  loggedIn: boolean;
  account?: AzureAccount;
  subscriptions: AzureSubscription[];
}

// ============================================================
// What-If Types
// ============================================================

export type WhatIfChangeType =
  | 'Create'
  | 'Delete'
  | 'Deploy'
  | 'Modify'
  | 'NoChange'
  | 'Ignore'
  | 'Unsupported';

export interface WhatIfPropertyChange {
  path: string;
  propertyChangeType: 'Create' | 'Delete' | 'Modify' | 'NoEffect';
  before?: any;
  after?: any;
}

export interface WhatIfChange {
  resourceId: string;
  resourceType: string;
  resourceName: string;
  changeType: WhatIfChangeType;
  propertyChanges: WhatIfPropertyChange[];
}

export interface WhatIfResult {
  status: 'success' | 'error';
  changes: WhatIfChange[];
  error?: string;
}

// ============================================================
// Deployment Types
// ============================================================

export type DeploymentStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface DeploymentStep {
  resourceName: string;
  resourceType: string;
  status: DeploymentStatus;
  timestamp: string;
  message?: string;
}

export interface Deployment {
  id: string;
  environmentId: string;
  status: DeploymentStatus;
  region: string;
  startedAt: string;
  completedAt?: string;
  steps: DeploymentStep[];
  bicepCode: string;
}

// ============================================================
// Region Replication Types
// ============================================================

export interface RegionCompatibility {
  region: string;
  regionDisplayName: string;
  compatible: boolean;
  warnings: RegionWarning[];
}

export interface RegionWarning {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  autoFix?: string;
}

// ============================================================
// Template Types
// ============================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  resources: Omit<Resource, 'id'>[];
  moduleVersions: Record<string, string>;
}

// ============================================================
// Module Version Types
// ============================================================

export interface ModuleVersion {
  resourceType: ResourceType;
  version: string;
  changelog: string;
  isLatest: boolean;
}

// ============================================================
// Resource Metadata (for the palette and forms)
// ============================================================

export interface ResourceTypeInfo {
  type: ResourceType;
  displayName: string;
  shortName: string;
  icon: string;
  color: string;
  category: string;
  defaultProperties: Record<string, any>;
  availableVersions: string[];
}

// View modes
export type ViewMode = 'visual' | 'code' | 'split' | 'whatif' | 'deploy';

// Navigation
export type NavSection =
  | 'dashboard'
  | 'environments'
  | 'templates'
  | 'modules'
  | 'deployments'
  | 'settings';
