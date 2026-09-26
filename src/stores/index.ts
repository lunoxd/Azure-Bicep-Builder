import { create } from 'zustand';
import type {
  AzureLoginStatus,
  AzureSubscription,
  Environment,
  Resource,
  ViewMode,
  NavSection,
  WhatIfResult,
  Deployment,
  RegionCompatibility,
} from '../types';

// ============================================================
// Azure Store — Authentication & Subscription State
// ============================================================

interface AzureState {
  loginStatus: AzureLoginStatus;
  selectedSubscription: AzureSubscription | null;
  cliInstalled: boolean | null;
  loading: boolean;
  error: string | null;

  setLoginStatus: (status: AzureLoginStatus) => void;
  setSelectedSubscription: (sub: AzureSubscription | null) => void;
  setCliInstalled: (installed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAzureStore = create<AzureState>((set) => ({
  loginStatus: { loggedIn: false, subscriptions: [] },
  selectedSubscription: null,
  cliInstalled: null,
  loading: false,
  error: null,

  setLoginStatus: (status) => set({ loginStatus: status }),
  setSelectedSubscription: (sub) => set({ selectedSubscription: sub }),
  setCliInstalled: (installed) => set({ cliInstalled: installed }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// Environment Store — The Core Model
// ============================================================

interface EnvironmentState {
  environments: Environment[];
  currentEnvironment: Environment | null;
  selectedResourceId: string | null;
  viewMode: ViewMode;

  setEnvironments: (envs: Environment[]) => void;
  setCurrentEnvironment: (env: Environment | null) => void;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  removeResource: (id: string) => void;
  setSelectedResourceId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  addDependency: (fromId: string, toId: string) => void;
  removeDependency: (fromId: string, toId: string) => void;
  updateEnvironmentField: (field: string, value: any) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  currentEnvironment: null,
  selectedResourceId: null,
  viewMode: 'visual',

  setEnvironments: (envs) => set({ environments: envs }),

  setCurrentEnvironment: (env) => set({ currentEnvironment: env }),

  addResource: (resource) => {
    const current = get().currentEnvironment;
    if (!current) return;
    set({
      currentEnvironment: {
        ...current,
        resources: [...current.resources, resource],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  updateResource: (id, updates) => {
    const current = get().currentEnvironment;
    if (!current) return;
    set({
      currentEnvironment: {
        ...current,
        resources: current.resources.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  removeResource: (id) => {
    const current = get().currentEnvironment;
    if (!current) return;
    set({
      currentEnvironment: {
        ...current,
        resources: current.resources.filter((r) => r.id !== id),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  setSelectedResourceId: (id) => set({ selectedResourceId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  addDependency: (fromId, toId) => {
    const current = get().currentEnvironment;
    if (!current) return;
    set({
      currentEnvironment: {
        ...current,
        resources: current.resources.map((r) =>
          r.id === fromId && !r.dependsOn.includes(toId)
            ? { ...r, dependsOn: [...r.dependsOn, toId] }
            : r
        ),
      },
    });
  },

  removeDependency: (fromId, toId) => {
    const current = get().currentEnvironment;
    if (!current) return;
    set({
      currentEnvironment: {
        ...current,
        resources: current.resources.map((r) =>
          r.id === fromId
            ? { ...r, dependsOn: r.dependsOn.filter((d) => d !== toId) }
            : r
        ),
      },
    });
  },

  updateEnvironmentField: (field, value) => {
    const current = get().currentEnvironment;
    if (!current) return;
    set({
      currentEnvironment: {
        ...current,
        [field]: value,
        updatedAt: new Date().toISOString(),
      },
    });
  },
}));

// ============================================================
// Deployment Store
// ============================================================

interface DeploymentState {
  whatIfResult: WhatIfResult | null;
  currentDeployment: Deployment | null;
  deploymentHistory: Deployment[];
  isDeploying: boolean;
  isRunningWhatIf: boolean;

  setWhatIfResult: (result: WhatIfResult | null) => void;
  setCurrentDeployment: (dep: Deployment | null) => void;
  addToHistory: (dep: Deployment) => void;
  setIsDeploying: (v: boolean) => void;
  setIsRunningWhatIf: (v: boolean) => void;
}

export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  whatIfResult: null,
  currentDeployment: null,
  deploymentHistory: [],
  isDeploying: false,
  isRunningWhatIf: false,

  setWhatIfResult: (result) => set({ whatIfResult: result }),
  setCurrentDeployment: (dep) => set({ currentDeployment: dep }),
  addToHistory: (dep) =>
    set({ deploymentHistory: [dep, ...get().deploymentHistory] }),
  setIsDeploying: (v) => set({ isDeploying: v }),
  setIsRunningWhatIf: (v) => set({ isRunningWhatIf: v }),
}));

// ============================================================
// UI Store
// ============================================================

interface UIState {
  activeNav: NavSection;
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;
  darkMode: boolean;
  regionReplicationOpen: boolean;
  azureConnectionModalOpen: boolean;
  targetRegion: string | null;
  regionCompatibility: RegionCompatibility | null;

  setActiveNav: (nav: NavSection) => void;
  toggleSidebar: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setRegionReplicationOpen: (open: boolean) => void;
  setAzureConnectionModalOpen: (open: boolean) => void;
  setTargetRegion: (region: string | null) => void;
  setRegionCompatibility: (compat: RegionCompatibility | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeNav: 'dashboard',
  sidebarCollapsed: false,
  propertiesPanelOpen: true,
  darkMode: true,
  regionReplicationOpen: false,
  azureConnectionModalOpen: false,
  targetRegion: null,
  regionCompatibility: null,

  setActiveNav: (nav) => set({ activeNav: nav }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  toggleDarkMode: () => set({ darkMode: !get().darkMode }),
  setRegionReplicationOpen: (open) => set({ regionReplicationOpen: open }),
  setAzureConnectionModalOpen: (open) => set({ azureConnectionModalOpen: open }),
  setTargetRegion: (region) => set({ targetRegion: region }),
  setRegionCompatibility: (compat) => set({ regionCompatibility: compat }),
}));
