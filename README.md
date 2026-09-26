# Azure Bicep Builder 🏗️⚡

> A visual, drag-and-drop cloud architecture designer and deployment studio for **Azure Bicep**. Design topologies visually, generate production-ready Bicep code instantly, track your credits & balance, and deploy directly to Azure.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri 2.x](https://img.shields.io/badge/Desktop-Tauri_2.x-black.svg)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/Frontend-React_18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5-blue.svg)](https://www.typescriptlang.org/)
[![Azure ARM](https://img.shields.io/badge/Cloud-Azure_ARM_REST_API-0078D4.svg)](https://learn.microsoft.com/en-us/rest/api/resources/)

---

## 📖 What is Azure Bicep Builder?

**Azure Bicep Builder** bridges the gap between visual cloud architecture diagrams and Infrastructure-as-Code (IaC). Instead of handcrafting JSON or Bicep files from scratch:
1. **You drag and connect cloud resources** (Web Apps, Storage, Key Vaults, Databases, Virtual Networks) on an interactive visual canvas.
2. **The app generates valid Azure Bicep code** and ARM templates in real-time.
3. **You deploy with 1-click** to your live Azure subscription (including Azure for Students), track your remaining credits/spending, and delete resources with 1-click when done.

```
┌─────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  Visual Canvas Designer │  ───> │ Bidirectional Bicep/ARM│  ───> │ Real Azure Deployment  │
│  (Drag, Drop & Connect) │       │ Code Generation Engine │       │  (ARM REST API / CLI)  │
└─────────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## ✨ Key Features

### 1. 🎨 Interactive Visual Builder
- Drag-and-drop Azure resources onto an infinite grid canvas.
- Draw connection arrows between nodes to declare resource dependencies (`dependsOn`).
- Configure properties via the side inspector panel (SKUs, tiers, runtimes, subnets, and credentials).

### 2. ⚡ Bidirectional Bicep Code Editor
- Built-in **Monaco Editor** (the engine behind VS Code) with syntax highlighting.
- Changes in the visual diagram update Bicep code in real-time.
- Direct copy, download, and template export capabilities.

### 3. 🔐 Instant In-App Azure Login
- **Microsoft Entra ID Device Code Flow**: Log in directly inside the app without needing local CLI tools installed.
- **Local Azure CLI support**: Automatically detects and uses `az login` if already installed on your machine.

### 4. 💳 Credits & Live Resource Manager
- **Credit Balance Tracker**: Monitor your remaining Azure for Students grant ($100) or Pay-As-You-Go credit pool.
- **Live Cloud Inventory**: View all real provisioned resources and Resource Groups currently running in your account.
- **1-Click Teardown**: Destroy individual resources or entire Resource Groups to prevent unexpected cloud charges.

### 5. 🚀 Real Cloud Deployments & What-If Diff
- **Direct Azure ARM Deployment**: Auto-creates Resource Groups, submits sanitized templates, and tracks provisioning status per-resource in real-time.
- **Azure for Students Policy Advisor**: Automatically detects regional policy constraints (e.g. `eastasia`, `southeastasia`, `centralindia`) with 1-click region switching.
- **What-If Analysis**: Preview planned creations, modifications, and deletions before applying changes to the cloud.

---

## 🗂️ Project Structure

```text
Azure-Bicep-Builder/
├── src/
│   ├── components/
│   │   ├── account/         # Azure balance, credits tracker & live inventory
│   │   ├── auth/            # Microsoft OAuth modal & in-app login flows
│   │   ├── builder/         # Visual canvas, custom nodes, property inspector
│   │   ├── dashboard/       # Blueprint gallery & environment manager
│   │   ├── deploy/          # Live ARM deployment runner & logs monitor
│   │   ├── editor/          # Monaco Bicep code editor & split view
│   │   ├── layout/          # Sidebar navigation & global header
│   │   ├── modules/         # Bicep module governance & version tracker
│   │   └── whatif/          # Azure pre-flight What-If diff visualizer
│   ├── services/
│   │   ├── azureAuth.ts     # Azure ARM REST API, Device OAuth & billing helpers
│   │   └── bicepGenerator.ts# AST generator translating canvas to clean Bicep
│   ├── stores/              # Zustand state management (UI, Azure, Environments)
│   ├── types/               # Single source of truth TypeScript definitions
│   ├── App.tsx              # Main routing and application layout
│   └── index.css            # Dark mode design system (Obsidian / Electric Azure Blue)
├── src-tauri/               # Tauri 2.x Rust desktop backend
│   ├── src/commands.rs      # Native system command bridges (az cli, bicep)
│   └── tauri.conf.json      # Desktop window configuration & permissions
├── vite.config.ts           # Vite bundler & proxy routing for Azure ARM endpoints
└── package.json             # Dependencies and build scripts
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | [Tauri 2.x](https://tauri.app/) (Rust) | Lightweight, fast native desktop executable (<15MB) |
| **Frontend** | React 18 + TypeScript | UI state, component lifecycle, type safety |
| **Canvas** | [React Flow](https://reactflow.dev/) | Drag-and-drop node graph & dynamic edge linking |
| **Code Editor** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | In-browser VS Code editing experience |
| **State** | [Zustand](https://github.com/pmndrs/zustand) | Global state for subscriptions, environments & active nodes |
| **Cloud API** | Azure ARM REST API (v2021-04-01) | Direct provisioning, billing calculation & resource queries |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Rust & Cargo](https://www.rust-lang.org/) (optional, only required if building native desktop app)

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
Open your browser at `http://localhost:1420` to start building!

### 3. Run Native Desktop App (Tauri Mode)
```bash
npm run tauri dev
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 💡 How To Use (Step-by-Step)

1. **Connect Azure**: Click **Connect Azure** in the header and log in using either the fast in-app Microsoft code or your local Azure CLI.
2. **Choose a Template or Start Blank**: Pick a starter blueprint (e.g. *Web App + PostgreSQL DB*) or create a custom environment.
3. **Customize in Visual Canvas**: Drag resources, connect dependencies, and configure pricing tiers in the right panel.
4. **Inspect Code**: Switch to **Bicep Code** or **Split View** to review the auto-generated Bicep syntax.
5. **Deploy to Azure**: Go to **Deploy**, choose your preferred region (e.g. *East Asia*), and hit **Deploy to Azure**.
6. **Track & Clean Up**: Check the **Credits & Resources** tab to verify provisioned infrastructure, monitor spent credits, or run a **1-Click Teardown** when you're done testing.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.
