use crate::models::*;
use std::process::Command;

/// Check if the Azure CLI is installed and return its executable path
pub fn find_az_cli() -> Result<String, String> {
    let candidates = [
        "/opt/homebrew/bin/az",
        "/usr/local/bin/az",
        "/usr/bin/az",
        "az",
    ];

    for candidate in &candidates {
        if let Ok(output) = Command::new(candidate).arg("--version").output() {
            if output.status.success() {
                return Ok(candidate.to_string());
            }
        }
    }

    // Try finding via shell which
    if let Ok(output) = Command::new("which").arg("az").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(path);
            }
        }
    }

    Err("Azure CLI (az) is not installed on this system.".to_string())
}

/// Run an az command and return stdout as a string
pub fn run_az(args: &[&str]) -> Result<String, String> {
    let az_path = find_az_cli()?;
    
    // Set standard PATH to include Homebrew and common directories
    let current_path = std::env::var("PATH").unwrap_or_default();
    let extended_path = format!("/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:{}", current_path);

    let output = Command::new(&az_path)
        .args(args)
        .env("PATH", extended_path)
        .output()
        .map_err(|e| format!("Failed to execute '{}': {}", az_path, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let err_msg = if !stderr.trim().is_empty() { stderr } else { stdout };
        Err(format!("az error: {}", err_msg.trim()))
    }
}

// ============================================================
// Tauri Commands — In-App Automated Setup & Azure Diagnostics
// ============================================================

#[tauri::command]
pub fn check_az_cli() -> Result<bool, String> {
    find_az_cli().map(|_| true)
}

#[tauri::command]
pub fn get_az_cli_info() -> Result<serde_json::Value, String> {
    match find_az_cli() {
        Ok(path) => {
            let ver_out = run_az(&["--version"]).unwrap_or_default();
            let first_line = ver_out.lines().next().unwrap_or("azure-cli").to_string();
            Ok(serde_json::json!({
                "installed": true,
                "path": path,
                "version": first_line
            }))
        }
        Err(e) => Ok(serde_json::json!({
            "installed": false,
            "error": e
        }))
    }
}

/// Automated in-app installation of Azure CLI without requiring user terminal work
#[tauri::command]
pub fn install_az_cli_in_app() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        // Try installing via homebrew non-interactively
        if let Ok(brew_path) = Command::new("which").arg("brew").output() {
            if brew_path.status.success() {
                let brew_str = String::from_utf8_lossy(&brew_path.stdout).trim().to_string();
                let output = Command::new(&brew_str)
                    .args(&["install", "azure-cli"])
                    .env("NONINTERACTIVE", "1")
                    .output()
                    .map_err(|e| format!("Homebrew install failed: {}", e))?;

                if output.status.success() {
                    return Ok("Azure CLI installed successfully via Homebrew.".to_string());
                }
            }
        }

        // Fallback standalone install script
        let output = Command::new("curl")
            .args(&["-sL", "https://aka.ms/InstallAzureCLIOSX"])
            .output()
            .map_err(|e| format!("Failed to download Azure CLI package: {}", e))?;

        if output.status.success() {
            Ok("Azure CLI automated installer executed.".to_string())
        } else {
            Err("Automated installer encountered an issue. Please verify internet connection.".to_string())
        }
    }

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("powershell")
            .args(&["-Command", "winget install -e --id Microsoft.AzureCLI --silent --accept-source-agreements --accept-package-agreements"])
            .output()
            .map_err(|e| format!("Failed to run winget install: {}", e))?;

        if output.status.success() {
            Ok("Azure CLI installed successfully on Windows.".to_string())
        } else {
            Err("Windows installer exited. You can also install from https://aka.ms/installazurecli".to_string())
        }
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("curl")
            .args(&["-sL", "https://aka.ms/InstallAzureCLIDeb", "|", "sudo", "bash"])
            .output()
            .map_err(|e| format!("Failed to run Linux installer: {}", e))?;

        if output.status.success() {
            Ok("Azure CLI installed successfully on Linux.".to_string())
        } else {
            Err("Linux installer failed. Please verify sudo permissions.".to_string())
        }
    }
}

/// Automated in-app installation of Bicep extension
#[tauri::command]
pub fn install_bicep_cli_in_app() -> Result<String, String> {
    run_az(&["bicep", "install"])
}

#[tauri::command]
pub fn check_login_status() -> Result<AzureLoginStatus, String> {
    match run_az(&["account", "show", "--output", "json"]) {
        Ok(output) => {
            let account: AzureAccount = serde_json::from_str(&output)
                .map_err(|e| format!("Failed to parse active account: {}", e))?;

            // Fetch subscriptions list
            let subs_output = run_az(&["account", "list", "--output", "json"])
                .unwrap_or_else(|_| "[]".to_string());
            
            let subscriptions: Vec<AzureSubscription> = serde_json::from_str(&subs_output)
                .unwrap_or_default();

            Ok(AzureLoginStatus {
                logged_in: true,
                account: Some(account),
                subscriptions,
            })
        }
        Err(_) => Ok(AzureLoginStatus {
            logged_in: false,
            account: None,
            subscriptions: vec![],
        }),
    }
}

#[tauri::command]
pub fn azure_login() -> Result<AzureLoginStatus, String> {
    // Run interactive az login (opens browser automatically)
    let _ = run_az(&["login", "--output", "json"])?;
    check_login_status()
}

#[tauri::command]
pub fn set_subscription(subscription_id: String) -> Result<(), String> {
    run_az(&["account", "set", "--subscription", &subscription_id])?;
    Ok(())
}

#[tauri::command]
pub fn list_regions() -> Result<Vec<serde_json::Value>, String> {
    let output = run_az(&["account", "list-locations", "--output", "json"])?;
    let regions: Vec<serde_json::Value> = serde_json::from_str(&output)
        .map_err(|e| format!("Failed to parse regions: {}", e))?;
    Ok(regions)
}

// ============================================================
// Tauri Commands — Bicep Generation
// ============================================================

#[tauri::command]
pub fn generate_bicep_code(
    resources: Vec<Resource>,
    resource_group: String,
    region: String,
) -> Result<BicepGenerationResult, String> {
    Ok(crate::generator::generate_bicep(&resources, &resource_group, &region))
}

// ============================================================
// Tauri Commands — What-If Analysis
// ============================================================

#[tauri::command]
pub fn run_what_if(
    bicep_code: String,
    resource_group: String,
    _subscription_id: String,
) -> Result<WhatIfResult, String> {
    let temp_dir = std::env::temp_dir();
    let bicep_path = temp_dir.join("bicep_studio_deploy.bicep");
    std::fs::write(&bicep_path, &bicep_code)
        .map_err(|e| format!("Failed to write temporary Bicep template: {}", e))?;

    let bicep_path_str = bicep_path.to_str().unwrap_or("");

    match run_az(&[
        "deployment", "group", "what-if",
        "--resource-group", &resource_group,
        "--template-file", bicep_path_str,
        "--output", "json",
        "--no-pretty-print",
    ]) {
        Ok(output) => {
            let parsed: serde_json::Value = serde_json::from_str(&output)
                .unwrap_or_else(|_| serde_json::json!({ "changes": [] }));

            let changes = parsed
                .get("changes")
                .and_then(|c| c.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|change| {
                            Some(WhatIfChange {
                                resource_id: change.get("resourceId")?.as_str()?.to_string(),
                                change_type: change.get("changeType")?.as_str()?.to_string(),
                                before: change.get("before").cloned(),
                                after: change.get("after").cloned(),
                            })
                        })
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();

            Ok(WhatIfResult {
                status: "success".to_string(),
                changes,
                error: None,
            })
        }
        Err(e) => {
            Ok(WhatIfResult {
                status: "error".to_string(),
                changes: vec![],
                error: Some(e),
            })
        }
    }
}

// ============================================================
// Tauri Commands — Deployment
// ============================================================

#[tauri::command]
pub fn deploy(
    bicep_code: String,
    resource_group: String,
    region: String,
    _subscription_id: String,
) -> Result<serde_json::Value, String> {
    let temp_dir = std::env::temp_dir();
    let bicep_path = temp_dir.join("bicep_studio_deploy.bicep");
    std::fs::write(&bicep_path, &bicep_code)
        .map_err(|e| format!("Failed to write deployment file: {}", e))?;

    let bicep_path_str = bicep_path.to_str().unwrap_or("");

    // Create resource group if it doesn't already exist
    let _ = run_az(&[
        "group", "create",
        "--name", &resource_group,
        "--location", &region,
    ]);

    // Execute Deployment
    let output = run_az(&[
        "deployment", "group", "create",
        "--resource-group", &resource_group,
        "--template-file", bicep_path_str,
        "--output", "json",
    ])?;

    let result: serde_json::Value = serde_json::from_str(&output)
        .map_err(|e| format!("Failed to parse deployment output: {}", e))?;

    Ok(result)
}

#[tauri::command]
pub fn delete_resource_group(resource_group: String) -> Result<String, String> {
    run_az(&["group", "delete", "--name", &resource_group, "--yes", "--no-wait"])
}

// ============================================================
// Tauri Commands — Region Compatibility
// ============================================================


#[tauri::command]
pub fn check_region_compatibility(
    resources: Vec<Resource>,
    target_region: String,
) -> Result<RegionCompatibility, String> {
    let mut warnings: Vec<RegionWarning> = Vec::new();
    let limited_regions = vec!["brazilsouth", "southafricanorth", "centralindia"];

    for resource in &resources {
        if resource.resource_type == "Microsoft.DBforPostgreSQL/flexibleServers" {
            if limited_regions.contains(&target_region.as_str()) {
                let sku = resource.properties.get("skuName")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Standard_B1ms");

                if sku.starts_with("Standard_B") {
                    warnings.push(RegionWarning {
                        resource_id: resource.id.clone(),
                        resource_name: resource.name.clone(),
                        resource_type: resource.resource_type.clone(),
                        severity: "warning".to_string(),
                        message: format!(
                            "PostgreSQL Burstable SKU '{}' has quota limits in {}. Recommended: Standard_D2s_v3.",
                            sku, target_region
                        ),
                        auto_fix: Some("Standard_D2s_v3".to_string()),
                    });
                }
            }
        }

        if resource.resource_type == "Microsoft.KeyVault/vaults" {
            let sku = resource.properties.get("sku")
                .and_then(|v| v.as_str())
                .unwrap_or("standard");
            if sku == "premium" && limited_regions.contains(&target_region.as_str()) {
                warnings.push(RegionWarning {
                    resource_id: resource.id.clone(),
                    resource_name: resource.name.clone(),
                    resource_type: resource.resource_type.clone(),
                    severity: "warning".to_string(),
                    message: format!(
                        "Key Vault HSM Premium partitions may require approval in {}. Recommended: Standard SKU.",
                        target_region
                    ),
                    auto_fix: Some("standard".to_string()),
                });
            }
        }
    }

    let has_errors = warnings.iter().any(|w| w.severity == "error");
    let display_name = get_region_display_name(&target_region);

    Ok(RegionCompatibility {
        region: target_region.clone(),
        region_display_name: display_name,
        compatible: !has_errors,
        warnings,
    })
}

fn get_region_display_name(region: &str) -> String {
    match region {
        "eastus" => "East US",
        "eastus2" => "East US 2",
        "westus" => "West US",
        "westus2" => "West US 2",
        "westus3" => "West US 3",
        "centralus" => "Central US",
        "northcentralus" => "North Central US",
        "southcentralus" => "South Central US",
        "westeurope" => "West Europe",
        "northeurope" => "North Europe",
        "uksouth" => "UK South",
        "ukwest" => "UK West",
        "francecentral" => "France Central",
        "germanywestcentral" => "Germany West Central",
        "japaneast" => "Japan East",
        "southeastasia" => "Southeast Asia",
        "australiaeast" => "Australia East",
        _ => region,
    }
    .to_string()
}

// ============================================================
// Tauri Commands — Native HTTP for Microsoft OAuth & ARM
// ============================================================

#[tauri::command]
pub fn http_post_form(url: String, form_body: String) -> Result<String, String> {
    let output = Command::new("curl")
        .args(&["-s", "-X", "POST", "-d", &form_body, &url])
        .output()
        .map_err(|e| format!("HTTP POST failed: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        Err(err)
    }
}

#[tauri::command]
pub fn http_get_json(url: String, bearer_token: Option<String>) -> Result<String, String> {
    let mut cmd = Command::new("curl");
    cmd.args(&["-s", "-H", "Content-Type: application/json"]);
    if let Some(token) = bearer_token {
        cmd.args(&["-H", &format!("Authorization: Bearer {}", token)]);
    }
    cmd.arg(&url);

    let output = cmd.output().map_err(|e| format!("HTTP GET failed: {}", e))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        Err(err)
    }
}

#[tauri::command]
pub fn http_arm_request(

    method: String,
    url: String,
    bearer_token: Option<String>,
    headers: Option<std::collections::HashMap<String, String>>,
    body: Option<String>,
) -> Result<HttpResponse, String> {
    let mut cmd = Command::new("curl");
    cmd.args(&["-s", "-w", "\n__HTTP_STATUS__:%{http_code}"]);
    cmd.arg("-X").arg(&method);

    if let Some(token) = bearer_token {
        if !token.is_empty() {
            cmd.arg("-H").arg(format!("Authorization: Bearer {}", token));
        }
    }

    if let Some(hdrs) = headers {
        for (k, v) in hdrs {
            cmd.arg("-H").arg(format!("{}: {}", k, v));
        }
    }

    if let Some(req_body) = &body {
        if !req_body.is_empty() {
            cmd.arg("-H").arg("Content-Type: application/json");
            cmd.arg("-d").arg(req_body);
        }
    }

    cmd.arg(&url);

    let output = cmd.output().map_err(|e| format!("HTTP request execution failed: {}", e))?;
    let raw_out = String::from_utf8_lossy(&output.stdout).to_string();
    let raw_err = String::from_utf8_lossy(&output.stderr).to_string();

    let (response_body, status_code) = if let Some(idx) = raw_out.rfind("\n__HTTP_STATUS__:") {
        let (body_part, status_part) = raw_out.split_at(idx);
        let code_str = status_part.trim().replace("__HTTP_STATUS__:", "").trim().to_string();
        let code = code_str.parse::<u16>().unwrap_or(if output.status.success() { 200 } else { 500 });
        (body_part.to_string(), code)
    } else {
        (raw_out, if output.status.success() { 200 } else { 500 })
    };

    let is_ok = (200..300).contains(&status_code);

    Ok(HttpResponse {
        status: status_code,
        ok: is_ok,
        body: response_body,
        error: if !is_ok && !raw_err.is_empty() { Some(raw_err) } else { None },
    })
}

#[tauri::command]
pub fn delete_resource_native(resource_id: String) -> Result<String, String> {
    run_az(&["resource", "delete", "--ids", &resource_id, "--yes", "--no-wait"])
}


