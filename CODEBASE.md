# Azure Bicep Builder (ABB) — Codebase Architecture & Navigational Map

> **Purpose of this document**: This guide provides an exact map of the codebase architecture, file relations, data flows, and subsystem locations so developers and AI agents can immediately navigate and modify the project without exploratory searching.

---

## 🏗️ System Overview

Azure Bicep Builder is structured into three primary tiers:

```
├── src/            # Frontend React 19 + TypeScript + Zustand + Monaco + React Flow
├── src-tauri/      # Native Rust Desktop Core (Tauri v2 + CLI Execution + Native HTTP Engine)
└── website/        # Next.js 15 App Router Download Portal & Marketing Site
```

---

## 📂 Detailed Directory & File Map

### 1. Frontend Core (`/src`)

| Directory / File | Description & Responsibilities | Key Symbols / Exports |
|---|---|---|
| [`src/App.tsx`](file:///Users/luno/bicep/src/App.tsx) | Main shell router, tab state dispatcher, lazy-loader, startup session initializer. | `App` |
| [`src/main.tsx`](file:///Users/luno/bicep/src/main.tsx) | React DOM entry point. | - |
| [`src/index.css`](file:///Users/luno/bicep/src/index.css) | Global design system, dark mode tokens, Apple-style spinner animations (`@keyframes apple-spin-steps`, `@keyframes spin`), glassmorphism, responsive grid. | `.apple-spinner-wrapper`, `.spinner`, `.animate-spin` |
| [`src/types/index.ts`](file:///Users/luno/bicep/src/types/index.ts) | Core TypeScript interfaces and type definitions. | `Resource`, `Environment`, `AzureAccount`, `AzureSubscription`, `WhatIfResult`, `RegionCompatibility`, `DeploymentStep` |
| [`src/stores/index.ts`](file:///Users/luno/bicep/src/stores/index.ts) | Zustand global state management. | `useEnvironmentStore`, `useAzureStore`, `useDeploymentStore`, `useUIStore` |
| [`src/data/resources.ts`](file:///Users/luno/bicep/src/data/resources.ts) | Cloud resource catalog, category metadata, default SKU configurations, Azure region matrices, template presets. | `RESOURCE_TYPES`, `AZURE_REGIONS`, `TEMPLATES`, `CATEGORIES` |
| [`src/hooks/useTauri.ts`](file:///Users/luno/bicep/src/hooks/useTauri.ts) | Universal Tauri IPC bridge with automatic web fallback wrappers. | `isTauri`, `checkAzCli`, `installAzCliInApp`, `checkLoginStatus`, `azureLogin`, `deployBicep`, `runWhatIf`, `deleteDeploymentResourceGroup` |
| [`src/services/azureAuth.ts`](file:///Users/luno/bicep/src/services/azureAuth.ts) | Microsoft Entra ID Device Flow OAuth 2.0, universal `armRequest` HTTP execution engine, direct ARM REST API deployment, cascade deletion, billing/credits API. | `armRequest`, `requestDeviceCode`, `pollDeviceCodeToken`, `deployWithArmRestApi`, `deleteResourceByIdViaArm`, `deleteResourceGroupViaArm`, `fetchSubscriptionResources`, `fetchSubscriptionBillingInfo` |

---

### 2. UI Component Library (`/src/components`)

All components are categorized into domain-specific subdirectories and re-exported via [`src/components/index.ts`](file:///Users/luno/bicep/src/components/index.ts):

| Domain Folder | File | Role & Key Features |
|---|---|---|
| `components/builder/` | [`VisualBuilder.tsx`](file:///Users/luno/bicep/src/components/builder/VisualBuilder.tsx)<br>[`ResourceNode.tsx`](file:///Users/luno/bicep/src/components/builder/ResourceNode.tsx)<br>[`ResourcePalette.tsx`](file:///Users/luno/bicep/src/components/builder/ResourcePalette.tsx)<br>[`PropertiesPanel.tsx`](file:///Users/luno/bicep/src/components/builder/PropertiesPanel.tsx) | **Interactive Architecture Canvas**: Drag-and-drop React Flow canvas, node dependency connections (`dependsOn`), category palettes, and SKU property inspector. |
| `components/editor/` | [`CodeEditor.tsx`](file:///Users/luno/bicep/src/components/editor/CodeEditor.tsx)<br>[`SplitView.tsx`](file:///Users/luno/bicep/src/components/editor/SplitView.tsx) | **Monaco Bicep Editor**: Syntax highlighted code editor, source-map line highlighting, side-by-side canvas & code split view. |
| `components/deploy/` | [`DeployView.tsx`](file:///Users/luno/bicep/src/components/deploy/DeployView.tsx) | **Cloud Deployment Manager**: 1-click real ARM deployment, live step-by-step provisioning tracker, policy constraint auto-detection, and 1-click teardown. |
| `components/whatif/` | [`WhatIfView.tsx`](file:///Users/luno/bicep/src/components/whatif/WhatIfView.tsx) | **Predictive Delta Analyzer**: Evaluates ARM delta before committing (Create, Modify, Delete, Ignore) with visual diff comparison. |
| `components/account/` | [`CloudAccountView.tsx`](file:///Users/luno/bicep/src/components/account/CloudAccountView.tsx) | **Azure Account & Resources Manager**: Live resource inventory, RG teardown, spending summary, subscription switcher. |
| `components/resources/` | [`LiveResourcesView.tsx`](file:///Users/luno/bicep/src/components/resources/LiveResourcesView.tsx) | **Live Resource Inspector**: Searchable cloud catalog with safe deletion confirmation modals. |
| `components/billing/` | [`CreditsBillingView.tsx`](file:///Users/luno/bicep/src/components/billing/CreditsBillingView.tsx) | **Credits & Consumption Tracker**: Student $100 grant and corporate credit visualizers with breakdown by Azure service. |
| `components/blueprints/`| [`BlueprintsView.tsx`](file:///Users/luno/bicep/src/components/blueprints/BlueprintsView.tsx) | **Architecture Blueprints**: 1-click starter environments (VPS Host, Web App + Postgres, AKS AI Stack). |
| `components/auth/` | [`AzureConnectionModal.tsx`](file:///Users/luno/bicep/src/components/auth/AzureConnectionModal.tsx)<br>[`LoginScreen.tsx`](file:///Users/luno/bicep/src/components/auth/LoginScreen.tsx) | **Authentication**: Microsoft Device Code Flow UI and Azure CLI login trigger. |
| `components/environments/` | [`NewEnvironmentModal.tsx`](file:///Users/luno/bicep/src/components/environments/NewEnvironmentModal.tsx) | **Environment Manager**: Create and scope environments with target Azure region and Resource Group. |
| `components/layout/` | [`Header.tsx`](file:///Users/luno/bicep/src/components/layout/Header.tsx)<br>[`Sidebar.tsx`](file:///Users/luno/bicep/src/components/layout/Sidebar.tsx) | **App Frame**: Top navbar, active subscription indicator, navigation tab routing, quick action buttons. |
| `components/common/` | [`AppleSpinner.tsx`](file:///Users/luno/bicep/src/components/common/AppleSpinner.tsx)<br>[`DeleteConfirmModal.tsx`](file:///Users/luno/bicep/src/components/common/DeleteConfirmModal.tsx) | **Shared Utilities**: Apple macOS/iOS-style stepped spinner and safety deletion confirmation modal. |
| `components/modules/` | [`ModuleVersionManager.tsx`](file:///Users/luno/bicep/src/components/modules/ModuleVersionManager.tsx) | **Module Registry**: Version selector for public and private Bicep modules. |
| `components/replicate/` | [`RegionReplicationModal.tsx`](file:///Users/luno/bicep/src/components/replicate/RegionReplicationModal.tsx) | **Multi-Region Replicator**: Cross-region deployment cloning with automated SKU availability checking. |
| `components/dashboard/` | [`Dashboard.tsx`](file:///Users/luno/bicep/src/components/dashboard/Dashboard.tsx) | **Home Dashboard**: Quick statistics, recent deployments, active environment snapshot. |

---

### 3. Native Desktop Core (`/src-tauri`)

| File | Purpose & Responsibilities | Key Functions / Structs |
|---|---|---|
| [`src-tauri/src/main.rs`](file:///Users/luno/bicep/src-tauri/src/main.rs) | Tauri application binary entrypoint. | `main` |
| [`src-tauri/src/lib.rs`](file:///Users/luno/bicep/src-tauri/src/lib.rs) | Tauri runtime builder, plugin registration, and command invoke handler mapping. | `run`, `generate_handler!` |
| [`src-tauri/src/commands.rs`](file:///Users/luno/bicep/src-tauri/src/commands.rs) | Native IPC commands executed directly on the host system. | `http_arm_request`, `delete_resource_native`, `delete_resource_group`, `deploy`, `run_what_if`, `check_az_cli`, `azure_login`, `install_az_cli_in_app`, `check_region_compatibility` |
| [`src-tauri/src/models.rs`](file:///Users/luno/bicep/src-tauri/src/models.rs) | Rust Serde data models serialized/deserialized across Tauri IPC boundary. | `HttpResponse`, `AzureAccount`, `AzureSubscription`, `Resource`, `Environment`, `WhatIfResult`, `RegionCompatibility` |
| [`src-tauri/src/generator.rs`](file:///Users/luno/bicep/src-tauri/src/generator.rs) | Native Bicep code generator engine and AST source-map builder. | `generate_bicep` |
| [`src-tauri/tauri.conf.json`](file:///Users/luno/bicep/src-tauri/tauri.conf.json) | Tauri application configuration (window size 1440x900, icon paths, bundle identifiers). | - |

---

### 4. Next.js Website & Download Portal (`/website`)

| File | Purpose |
|---|---|
| [`website/app/layout.tsx`](file:///Users/luno/bicep/website/app/layout.tsx) | Next.js 15 RootLayout, SEO OpenGraph metadata, favicon, font loading. |
| [`website/app/page.tsx`](file:///Users/luno/bicep/website/app/page.tsx) | Interactive product landing page with tabbed download selector (macOS DMG/ZIP, Windows, Linux), visual workspace preview, and blueprint code switcher. |
| [`website/app/globals.css`](file:///Users/luno/bicep/website/app/globals.css) | Standalone modern dark mode CSS with glowing mesh gradients and card hover states. |
| [`website/public/downloads/`](file:///Users/luno/bicep/website/public/downloads) | Built release artifacts (`Azure-Bicep-Builder-macOS.dmg`, `Azure-Bicep-Builder-macOS.zip`). |
| [`website/next.config.mjs`](file:///Users/luno/bicep/website/next.config.mjs) | Next.js runtime configuration. |
| [`website/tsconfig.json`](file:///Users/luno/bicep/website/tsconfig.json) | TypeScript configuration for Next.js App Router. |

---

## ⚡ Key Data Flows & Architectural Patterns

### 1. Azure Authentication Flow
```
User clicks "Connect Azure" ->
  1. Option A (In-App Device Code): requestDeviceCode() -> polling pollDeviceCodeToken() -> saveAuthSession()
  2. Option B (Azure CLI): invoke('azure_login') -> az login (opens browser) -> checkLoginStatus()
-> fetchAzureSubscriptions() populates active account and subscription stores.
```

### 2. Universal ARM HTTP Pipeline
```
Frontend ARM Operation ->
  armRequest(url, { method, token, body })
    ├── If in Tauri: invoke('http_arm_request') [Bypasses webview CORS via native curl]
    └── If in Browser: fetch('/api/azure-arm/...') [Proxies through Vite dev server]
```

### 3. Deployment Flow
```
DeployView ->
  generateBicepCode() ->
  deployBicep() ->
    1. Try native Tauri execution (`az deployment group create`)
    2. Fallback to deployWithArmRestApi() (Direct ARM PUT with polling until 'Succeeded')
```

### 4. Resource Deletion with Cascade Resolution
```
LiveResourcesView / CloudAccountView ->
  DeleteConfirmModal (User types resource name to confirm) ->
  deleteResourceByIdViaArm(resourceId, type, { cascade: true })
    1. Try native `az resource delete --ids`
    2. Try ARM REST `DELETE`
    3. If 409 Conflict (e.g. App Service Plan with hosted Web Apps), cascade deletes dependent children first, then deletes target.
```

---

## 🛠️ Quick Commands Cheat Sheet

| Action | Command | Working Directory |
|---|---|---|
| Run Desktop App Dev Server | `npm run tauri dev` | `/` (root) |
| Build Desktop Frontend | `npm run build` | `/` (root) |
| Check Tauri Rust Backend | `cargo check` | `/src-tauri` |
| Build Tauri Release Binary | `npm run tauri build` | `/` (root) |
| Run Next.js Website Dev | `npm run dev` | `/website` |
| Build Next.js Website | `npm run build` | `/website` |
