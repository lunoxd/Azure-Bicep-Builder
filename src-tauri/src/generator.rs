use crate::models::{BicepGenerationResult, LineRange, Resource};
use std::collections::HashMap;

/// Generates production-grade Bicep code from a topology of Azure resources.
/// Returns formatted Bicep code and a source map mapping resource IDs to line ranges.
pub fn generate_bicep(resources: &[Resource], resource_group: &str, region: &str) -> BicepGenerationResult {
    let mut lines: Vec<String> = Vec::new();
    let mut source_map: HashMap<String, LineRange> = HashMap::new();

    // File Header
    lines.push("// ============================================================================".to_string());
    lines.push("// Azure Bicep Infrastructure Deployment Template".to_string());
    lines.push(format!("// Target Region: {}", region));
    lines.push(format!("// Target Resource Group: {}", resource_group));
    lines.push("// ============================================================================".to_string());
    lines.push(String::new());

    // Target Scope
    lines.push("targetScope = 'resourceGroup'".to_string());
    lines.push(String::new());

    // Parameters
    lines.push("@description('The Azure region where all architecture resources will be provisioned.')".to_string());
    lines.push(format!("param location string = '{}'", region));
    lines.push(String::new());

    lines.push("@description('Deployment environment tag for organizational governance.')".to_string());
    lines.push("param environmentName string = 'production'".to_string());
    lines.push(String::new());

    lines.push("@description('Standard resource tags applied across infrastructure.')".to_string());
    lines.push("param tags object = {".to_string());
    lines.push("  Environment: environmentName".to_string());
    lines.push("  ManagedBy: 'BicepVisualStudio'".to_string());
    lines.push("}".to_string());
    lines.push(String::new());

    // Generate each resource
    for resource in resources {
        if resource.resource_type == "Microsoft.Resources/resourceGroups" {
            continue;
        }

        let start_line = lines.len() + 1;

        // Resource marker comment for source mapping
        lines.push(format!("// @resource:{}", resource.id));

        let bicep_name = sanitize_bicep_name(&resource.name);

        match resource.resource_type.as_str() {
            "Microsoft.Network/virtualNetworks" => {
                generate_vnet(&mut lines, resource, &bicep_name);
            }
            "Microsoft.Storage/storageAccounts" => {
                generate_storage(&mut lines, resource, &bicep_name);
            }
            "Microsoft.Web/serverfarms" => {
                generate_app_service_plan(&mut lines, resource, &bicep_name);
            }
            "Microsoft.Web/sites" => {
                generate_web_app(&mut lines, resource, &bicep_name, resources);
            }
            "Microsoft.KeyVault/vaults" => {
                generate_key_vault(&mut lines, resource, &bicep_name);
            }
            "Microsoft.DBforPostgreSQL/flexibleServers" => {
                generate_postgresql(&mut lines, resource, &bicep_name);
            }
            _ => {
                lines.push(format!("// Unsupported resource provider: {}", resource.resource_type));
            }
        }

        let end_line = lines.len();
        source_map.insert(
            resource.id.clone(),
            LineRange {
                start: start_line,
                end: end_line,
            },
        );

        lines.push(String::new());
    }

    // Outputs Section
    lines.push("// ============================================================================".to_string());
    lines.push("// Deployment Outputs".to_string());
    lines.push("// ============================================================================".to_string());

    for resource in resources {
        let bicep_name = sanitize_bicep_name(&resource.name);
        match resource.resource_type.as_str() {
            "Microsoft.Web/sites" => {
                lines.push(format!("output {}Endpoint string = 'https://${{{}.properties.defaultHostName}}'", bicep_name, bicep_name));
            }
            "Microsoft.Storage/storageAccounts" => {
                lines.push(format!("output {}PrimaryEndpoint string = {}.properties.primaryEndpoints.blob", bicep_name, bicep_name));
            }
            "Microsoft.KeyVault/vaults" => {
                lines.push(format!("output {}VaultUri string = {}.properties.vaultUri", bicep_name, bicep_name));
            }
            "Microsoft.DBforPostgreSQL/flexibleServers" => {
                lines.push(format!("output {}Fqdn string = {}.properties.fullyQualifiedDomainName", bicep_name, bicep_name));
            }
            _ => {}
        }
    }

    BicepGenerationResult {
        code: lines.join("\n"),
        source_map,
    }
}

fn sanitize_bicep_name(name: &str) -> String {
    let sanitized: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '_' { c } else { '_' })
        .collect();
    if sanitized.chars().next().map_or(false, |c| c.is_numeric()) {
        format!("res_{}", sanitized)
    } else {
        sanitized
    }
}

fn get_prop_str(resource: &Resource, key: &str, default: &str) -> String {
    resource
        .properties
        .get(key)
        .and_then(|v| v.as_str())
        .unwrap_or(default)
        .to_string()
}

fn get_prop_array(resource: &Resource, key: &str) -> Vec<serde_json::Value> {
    resource
        .properties
        .get(key)
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default()
}

// ============================================================
// Virtual Network Generator
// ============================================================

fn generate_vnet(lines: &mut Vec<String>, resource: &Resource, bicep_name: &str) {
    let address_space = get_prop_str(resource, "addressSpace", "10.0.0.0/16");
    let subnets = get_prop_array(resource, "subnets");

    lines.push(format!("resource {} 'Microsoft.Network/virtualNetworks@2023-11-01' = {{", bicep_name));
    lines.push(format!("  name: '{}'", resource.name));
    lines.push("  location: location".to_string());
    lines.push("  tags: tags".to_string());
    lines.push("  properties: {".to_string());
    lines.push("    addressSpace: {".to_string());
    lines.push(format!("      addressPrefixes: [ '{}' ]", address_space));
    lines.push("    }".to_string());

    if !subnets.is_empty() {
        lines.push("    subnets: [".to_string());
        for subnet in &subnets {
            let subnet_name = subnet
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("default");
            let subnet_prefix = subnet
                .get("addressPrefix")
                .and_then(|v| v.as_str())
                .unwrap_or("10.0.0.0/24");
            lines.push("      {".to_string());
            lines.push(format!("        name: '{}'", subnet_name));
            lines.push("        properties: {".to_string());
            lines.push(format!("          addressPrefix: '{}'", subnet_prefix));
            lines.push("          privateEndpointNetworkPolicies: 'Disabled'".to_string());
            lines.push("          privateLinkServiceNetworkPolicies: 'Enabled'".to_string());
            lines.push("        }".to_string());
            lines.push("      }".to_string());
        }
        lines.push("    ]".to_string());
    }

    lines.push("  }".to_string());
    lines.push("}".to_string());
}

// ============================================================
// Storage Account Generator
// ============================================================

fn generate_storage(lines: &mut Vec<String>, resource: &Resource, bicep_name: &str) {
    let sku = get_prop_str(resource, "sku", "Standard_LRS");
    let kind = get_prop_str(resource, "kind", "StorageV2");
    let access_tier = get_prop_str(resource, "accessTier", "Hot");

    lines.push(format!("resource {} 'Microsoft.Storage/storageAccounts@2023-05-01' = {{", bicep_name));
    lines.push(format!("  name: '{}'", resource.name));
    lines.push("  location: location".to_string());
    lines.push("  tags: tags".to_string());
    lines.push(format!("  kind: '{}'", kind));
    lines.push("  sku: {".to_string());
    lines.push(format!("    name: '{}'", sku));
    lines.push("  }".to_string());
    lines.push("  properties: {".to_string());
    lines.push(format!("    accessTier: '{}'", access_tier));
    lines.push("    supportsHttpsTrafficOnly: true".to_string());
    lines.push("    minimumTlsVersion: 'TLS1_2'".to_string());
    lines.push("    allowBlobPublicAccess: false".to_string());
    lines.push("    encryption: {".to_string());
    lines.push("      services: {".to_string());
    lines.push("        blob: {".to_string());
    lines.push("          enabled: true".to_string());
    lines.push("        }".to_string());
    lines.push("      }".to_string());
    lines.push("      keySource: 'Microsoft.Storage'".to_string());
    lines.push("    }".to_string());
    lines.push("  }".to_string());
    lines.push("}".to_string());
}

// ============================================================
// App Service Plan Generator
// ============================================================

fn generate_app_service_plan(lines: &mut Vec<String>, resource: &Resource, bicep_name: &str) {
    let sku_name = get_prop_str(resource, "skuName", "B1");
    let sku_tier = get_prop_str(resource, "skuTier", "Basic");
    let os = get_prop_str(resource, "os", "Linux");

    lines.push(format!("resource {} 'Microsoft.Web/serverfarms@2023-12-01' = {{", bicep_name));
    lines.push(format!("  name: '{}'", resource.name));
    lines.push("  location: location".to_string());
    lines.push("  tags: tags".to_string());
    lines.push("  sku: {".to_string());
    lines.push(format!("    name: '{}'", sku_name));
    lines.push(format!("    tier: '{}'", sku_tier));
    lines.push("  }".to_string());
    lines.push(format!("  kind: '{}'", if os == "Linux" { "linux" } else { "app" }));
    lines.push("  properties: {".to_string());
    lines.push(format!("    reserved: {}", if os == "Linux" { "true" } else { "false" }));
    lines.push("  }".to_string());
    lines.push("}".to_string());
}

// ============================================================
// Web App Generator
// ============================================================

fn generate_web_app(lines: &mut Vec<String>, resource: &Resource, bicep_name: &str, all_resources: &[Resource]) {
    let runtime = get_prop_str(resource, "runtime", "NODE|18-lts");

    let plan_ref = resource
        .depends_on
        .iter()
        .find_map(|dep_id| {
            all_resources
                .iter()
                .find(|r| r.id == *dep_id && r.resource_type == "Microsoft.Web/serverfarms")
                .map(|r| sanitize_bicep_name(&r.name))
        });

    lines.push(format!("resource {} 'Microsoft.Web/sites@2023-12-01' = {{", bicep_name));
    lines.push(format!("  name: '{}'", resource.name));
    lines.push("  location: location".to_string());
    lines.push("  tags: tags".to_string());
    lines.push("  properties: {".to_string());

    if let Some(plan_name) = plan_ref {
        lines.push(format!("    serverFarmId: {}.id", plan_name));
    }

    lines.push("    httpsOnly: true".to_string());
    lines.push("    siteConfig: {".to_string());
    lines.push(format!("      linuxFxVersion: '{}'", runtime));
    lines.push("      ftpsState: 'Disabled'".to_string());
    lines.push("      minTlsVersion: '1.2'".to_string());
    lines.push("      http20Enabled: true".to_string());
    lines.push("    }".to_string());
    lines.push("  }".to_string());
    lines.push("}".to_string());
}

// ============================================================
// Key Vault Generator
// ============================================================

fn generate_key_vault(lines: &mut Vec<String>, resource: &Resource, bicep_name: &str) {
    let sku = get_prop_str(resource, "sku", "standard");

    lines.push(format!("resource {} 'Microsoft.KeyVault/vaults@2023-07-01' = {{", bicep_name));
    lines.push(format!("  name: '{}'", resource.name));
    lines.push("  location: location".to_string());
    lines.push("  tags: tags".to_string());
    lines.push("  properties: {".to_string());
    lines.push("    tenantId: subscription().tenantId".to_string());
    lines.push("    sku: {".to_string());
    lines.push("      family: 'A'".to_string());
    lines.push(format!("      name: '{}'", sku));
    lines.push("    }".to_string());
    lines.push("    enableRbacAuthorization: true".to_string());
    lines.push("    enableSoftDelete: true".to_string());
    lines.push("    softDeleteRetentionInDays: 90".to_string());
    lines.push("    networkAcls: {".to_string());
    lines.push("      defaultAction: 'Allow'".to_string());
    lines.push("      bypass: 'AzureServices'".to_string());
    lines.push("    }".to_string());
    lines.push("  }".to_string());
    lines.push("}".to_string());
}

// ============================================================
// PostgreSQL Flexible Server Generator
// ============================================================

fn generate_postgresql(lines: &mut Vec<String>, resource: &Resource, bicep_name: &str) {
    let sku_name = get_prop_str(resource, "skuName", "Standard_B1ms");
    let sku_tier = get_prop_str(resource, "skuTier", "Burstable");
    let version = get_prop_str(resource, "version", "16");
    let storage_size = get_prop_str(resource, "storageSizeGB", "32");
    let admin_login = get_prop_str(resource, "administratorLogin", "pgadmin");

    lines.push(format!("resource {} 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {{", bicep_name));
    lines.push(format!("  name: '{}'", resource.name));
    lines.push("  location: location".to_string());
    lines.push("  tags: tags".to_string());
    lines.push("  sku: {".to_string());
    lines.push(format!("    name: '{}'", sku_name));
    lines.push(format!("    tier: '{}'", sku_tier));
    lines.push("  }".to_string());
    lines.push("  properties: {".to_string());
    lines.push(format!("    version: '{}'", version));
    lines.push(format!("    administratorLogin: '{}'", admin_login));
    lines.push("    administratorLoginPassword: 'REPLACE_WITH_SECURE_KEYVAULT_SECRET'".to_string());
    lines.push("    storage: {".to_string());
    lines.push(format!("      storageSizeGB: {}", storage_size));
    lines.push("      autoGrow: 'Enabled'".to_string());
    lines.push("    }".to_string());
    lines.push("    backup: {".to_string());
    lines.push("      backupRetentionDays: 7".to_string());
    lines.push("      geoRedundantBackup: 'Disabled'".to_string());
    lines.push("    }".to_string());
    lines.push("  }".to_string());
    lines.push("}".to_string());
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Position;

    #[test]
    fn test_generate_empty() {
        let result = generate_bicep(&[], "my-rg", "eastus");
        assert!(result.code.contains("targetScope = 'resourceGroup'"));
        assert!(result.source_map.is_empty());
    }

    #[test]
    fn test_generate_storage_account() {
        let resources = vec![Resource {
            id: "test-1".to_string(),
            resource_type: "Microsoft.Storage/storageAccounts".to_string(),
            name: "mystorageaccount".to_string(),
            display_name: "My Storage".to_string(),
            properties: serde_json::json!({
                "sku": "Standard_LRS",
                "kind": "StorageV2",
                "accessTier": "Hot"
            }),
            depends_on: vec![],
            position: Position { x: 0.0, y: 0.0 },
            module_version: None,
        }];

        let result = generate_bicep(&resources, "my-rg", "eastus");
        assert!(result.code.contains("Microsoft.Storage/storageAccounts"));
        assert!(result.code.contains("mystorageaccount"));
        assert!(result.source_map.contains_key("test-1"));
    }
}
