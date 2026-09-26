use serde::{Deserialize, Serialize};

// ============================================================
// Azure Account & Subscription
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureAccount {
    pub name: String,
    pub id: String,
    #[serde(rename = "tenantId")]
    pub tenant_id: String,
    pub state: String,
    #[serde(rename = "isDefault")]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureSubscription {
    pub id: String,
    pub name: String,
    pub state: String,
    #[serde(rename = "tenantId")]
    pub tenant_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AzureLoginStatus {
    pub logged_in: bool,
    pub account: Option<AzureAccount>,
    pub subscriptions: Vec<AzureSubscription>,
}

// ============================================================
// Resource Model
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    #[serde(rename = "type")]
    pub resource_type: String,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub properties: serde_json::Value,
    #[serde(rename = "dependsOn")]
    pub depends_on: Vec<String>,
    pub position: Position,
    #[serde(rename = "moduleVersion")]
    pub module_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub id: String,
    pub name: String,
    pub description: String,
    pub subscription: String,
    #[serde(rename = "subscriptionId")]
    pub subscription_id: String,
    #[serde(rename = "resourceGroup")]
    pub resource_group: String,
    pub region: String,
    pub resources: Vec<Resource>,
    #[serde(rename = "moduleVersions")]
    pub module_versions: std::collections::HashMap<String, String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(rename = "lastDeployedAt")]
    pub last_deployed_at: Option<String>,
    pub status: String,
}

// ============================================================
// What-If Types
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatIfPropertyChange {
    pub path: String,
    #[serde(rename = "propertyChangeType")]
    pub property_change_type: String,
    pub before: Option<serde_json::Value>,
    pub after: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatIfChange {
    #[serde(rename = "resourceId")]
    pub resource_id: String,
    #[serde(rename = "changeType")]
    pub change_type: String,
    #[serde(rename = "before", default)]
    pub before: Option<serde_json::Value>,
    #[serde(rename = "after", default)]
    pub after: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatIfResult {
    pub status: String,
    pub changes: Vec<WhatIfChange>,
    pub error: Option<String>,
}

// ============================================================
// Deployment
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentEvent {
    pub status: String,
    pub message: String,
    pub timestamp: String,
    #[serde(rename = "resourceName")]
    pub resource_name: Option<String>,
    #[serde(rename = "resourceType")]
    pub resource_type: Option<String>,
}

// ============================================================
// Region Compatibility
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionWarning {
    #[serde(rename = "resourceId")]
    pub resource_id: String,
    #[serde(rename = "resourceName")]
    pub resource_name: String,
    #[serde(rename = "resourceType")]
    pub resource_type: String,
    pub severity: String,
    pub message: String,
    #[serde(rename = "autoFix")]
    pub auto_fix: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionCompatibility {
    pub region: String,
    #[serde(rename = "regionDisplayName")]
    pub region_display_name: String,
    pub compatible: bool,
    pub warnings: Vec<RegionWarning>,
}

// ============================================================
// Bicep Generation Result
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BicepGenerationResult {
    pub code: String,
    #[serde(rename = "sourceMap")]
    pub source_map: std::collections::HashMap<String, LineRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineRange {
    pub start: usize,
    pub end: usize,
}

// ============================================================
// Native HTTP Response
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub ok: bool,
    pub body: String,
    pub error: Option<String>,
}

