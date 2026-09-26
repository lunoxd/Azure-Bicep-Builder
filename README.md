# Azure Bicep Builder 🏗️⚡

> A modern, local-first visual desktop studio & architecture layer over **Azure Bicep**.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Tauri 2.x](https://img.shields.io/badge/Tauri-2.x-black.svg)](https://tauri.app/)
[![React 18](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

---

## 🌟 Highlights & Features

- 🎨 **Visual Architecture Canvas**: Drag-and-drop Azure resources (Virtual Networks, Subnets, Storage Accounts, App Service Plans, Web Apps, Key Vaults, PostgreSQL Flexible Servers, and more) with automatic dependency link wiring.
- ⚡ **Real-Time Bidirectional Bicep Code Generator**: Monaco code editor syncing with AST source maps. Edits in visual canvas update Bicep template instantaneously.
- 🔐 **Instant In-App Azure Authentication**: Direct Microsoft Entra ID Device Code OAuth flow and Azure Resource Manager (ARM) REST API integration — no manual CLI setup required.
- 🚀 **1-Click Live Deployments & Teardown**: Direct provisioning to your real Azure subscription with per-resource real-time step streaming, plus 1-click **Delete Deployment** to safely destroy infrastructure when done.
- 🔍 **Azure ARM What-If Analysis**: Live pre-flight diff calculation against Azure Resource Manager to preview creation, modifications, and deletions before applying changes.
- 🌍 **Multi-Region Replication Engine**: Clone entire architectures across Azure regions with automatic SKU availability and compliance verification.
- 📦 **Bicep Module Governance**: Track, pin, and update module versions across all environments with upgrade path indicators.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Flow, Monaco Editor, Lucide Icons, Google Material Symbols.
- **Backend**: Tauri 2.x (Rust), Tokio, Tauri Shell plugin.
- **Styling**: Monochromatic dark theme (Black `#09090b` / Emerald Green `#10b981`).
- **Cloud Layer**: Microsoft Entra ID OAuth 2.0 & Azure Resource Manager REST API v2021-04-01.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (latest stable)
- *(Optional)* [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) & [Bicep CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install)

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lunoxd/Azure-Bicep-Builder.git
   cd Azure-Bicep-Builder
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in Web Browser Mode:**
   ```bash
   npm run dev
   ```

4. **Run in Native Desktop App Mode (Tauri):**
   ```bash
   npm run tauri dev
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
