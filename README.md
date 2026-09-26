# Azure Bicep Builder (ABB)

> A visual, drag-and-drop cloud architecture designer and deployment studio for Azure Bicep. Design topologies visually, generate production-ready Bicep code instantly, track your credits & balance, and deploy directly to Azure.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2.x](https://img.shields.io/badge/Desktop-Tauri_2.x-black.svg)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/Frontend-React_19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-blue.svg)](https://www.typescriptlang.org/)
[![Azure ARM](https://img.shields.io/badge/Cloud-Azure_ARM_REST_API-0078D4.svg)](https://learn.microsoft.com/en-us/rest/api/resources/)

---

## What is Azure Bicep Builder (ABB)?

Azure Bicep Builder bridges the gap between visual cloud architecture diagrams and Infrastructure-as-Code (IaC). Instead of handcrafting JSON or Bicep files from scratch:
1. **You drag and connect cloud resources** (Web Apps, Storage, Key Vaults, Databases, Virtual Networks) on an interactive visual canvas.
2. **The app generates valid Azure Bicep code** and ARM templates in real-time.
3. **You deploy with 1-click** to your live Azure subscription (including Azure for Students), track your remaining credits/spending, and delete resources with interactive confirmation when done.

```
+-------------------------+       +------------------------+       +------------------------+
|  Visual Canvas Designer |  ---> | Bidirectional Bicep/ARM|  ---> | Real Azure Deployment  |
|  (Drag, Drop & Connect) |       | Code Generation Engine |       |  (ARM REST API / CLI)  |
+-------------------------+       +------------------------+       +------------------------+
```

---

## Key Features

### 1. Interactive Visual Builder
- Drag-and-drop Azure resources onto an infinite grid canvas.
- Draw connection arrows between nodes to declare resource dependencies (`dependsOn`).
- Configure properties via the side inspector panel (SKUs, tiers, runtimes, subnets, and credentials).

### 2. Bidirectional Bicep Code Editor
- Built-in Monaco Editor with syntax highlighting.
- Changes in the visual diagram update Bicep code in real-time.
- Direct copy, download, and template export capabilities.

### 3. Dedicated Blueprints Library
- Instant 1-click deployment templates including Web Apps, Cloud VPS Linux hosts, Microservices clusters, and AI/Data engines.
- Inspect JSON schemas and dependency graphs before instantiating.

### 4. Credits & Live Resource Manager
- **Credits & Billing View**: Monitor remaining Azure for Students grant balance ($100), invoice estimations, and subscription details.
- **Cloud Resources View**: Real-time inventory of provisioned Azure resources across resource groups.
- **Safe Teardown with Copy-Confirmation**: Protected modal requiring confirmation by typing or pasting resource names, with automatic cascade deletion for dependent App Service plans.

### 5. Real Cloud Deployments & What-If Diff
- **Direct Azure ARM Deployment**: Auto-creates Resource Groups, submits sanitized templates, and tracks provisioning status per-resource in real-time.
- **Azure for Students Policy Advisor**: Automatically detects regional policy constraints with 1-click region switching.
- **What-If Analysis**: Preview planned creations, modifications, and deletions before applying changes to the cloud.

---

## Project Structure

```text
Azure-Bicep-Builder/
├── src/
│   ├── components/
│   │   ├── account/         # Cloud account & subscription profile
│   │   ├── auth/            # Microsoft OAuth modal & in-app login flows
│   │   ├── billing/         # Credits & billing overview
│   │   ├── blueprints/      # Starter blueprints library window
│   │   ├── builder/         # Visual canvas, custom nodes, property inspector
│   │   ├── common/          # AppleSpinner, DeleteConfirmModal, shared components
│   │   ├── dashboard/       # Workspace overview & environment manager
│   │   ├── deploy/          # Live ARM deployment runner & logs monitor
│   │   ├── editor/          # Monaco Bicep code editor & split view
│   │   ├── layout/          # Sidebar navigation & global header
│   │   ├── resources/       # Cloud resources inventory & live teardown
│   │   └── whatif/          # Azure pre-flight What-If diff visualizer
│   ├── services/
│   │   ├── azureAuth.ts     # Azure ARM REST API, Device OAuth & billing helpers
│   │   └── bicepGenerator.ts# AST generator translating canvas to clean Bicep
│   ├── stores/              # Zustand state management (UI, Azure, Environments)
│   ├── types/               # Single source of truth TypeScript definitions
│   ├── App.tsx              # Main routing and application layout
│   └── index.css            # Dark mode design system (Obsidian / High Contrast Zinc)
├── src-tauri/               # Tauri 2.x Rust desktop backend
│   ├── src/commands.rs      # Native system command bridges (az cli, bicep)
│   └── tauri.conf.json      # Desktop window configuration & permissions
├── vite.config.ts           # Vite bundler & proxy routing for Azure ARM endpoints
└── package.json             # Dependencies and build scripts
```

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | Tauri 2.x (Rust) | Lightweight, fast native desktop executable |
| **Frontend** | React 19 + TypeScript | UI state, component lifecycle, type safety |
| **Canvas** | React Flow | Drag-and-drop node graph & dynamic edge linking |
| **Code Editor** | Monaco Editor | In-browser VS Code editing experience |
| **State** | Zustand | Global state for subscriptions, environments & active nodes |
| **Cloud API** | Azure ARM REST API | Direct provisioning, billing calculation & resource queries |

---

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- Rust & Cargo (optional, only required if building native desktop app)

### 1. Clone & Install
```bash
git clone https://github.com/lunoxd/Azure-Bicep-Builder.git
cd Azure-Bicep-Builder
npm install
```

### 2. Run Development Server (Web Mode)
```bash
npm run dev
```

### 3. Build Production Bundle
```bash
npm run build
```

---

## License

Distributed under the MIT License.
