// ============================================================
// In-App Azure Authentication Service (Direct Microsoft OAuth 2.0)
// Uses Microsoft Entra ID Device Code Flow & ARM REST API
// Works everywhere: Tauri Desktop, Browser Dev, and Standalone
// ============================================================

import type { AzureAccount, AzureSubscription } from '../types';

const AZURE_CLI_CLIENT_ID = '04b07795-8ddb-461a-bbee-02f9e1bf7b46'; // Official Azure CLI public client
const TENANT = 'organizations'; // Multi-tenant organization login
const STORAGE_KEY_AUTH = 'bicep_azure_auth_session';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

export interface TokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  id_token?: string;
}

export interface StoredAuthSession {
  token: TokenResponse;
  account: AzureAccount;
  subscriptions: AzureSubscription[];
  expiresAt: number;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
}

/**
 * Universal Form POST with Tauri Native fallback and Dev Proxy fallback
 */
async function postForm(url: string, formParams: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(formParams).toString();

  // 1. If in Tauri desktop, use native HTTP command to completely bypass webview CORS
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const responseText = await invoke<string>('http_post_form', { url, formBody: body });
      return JSON.parse(responseText);
    } catch (err) {
      console.warn('Tauri native HTTP post fallback:', err);
    }
  }

  // 2. In browser dev server, use the local proxy to avoid CORS
  const proxyUrl = url.replace('https://login.microsoftonline.com', '/api/ms-login');

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return await res.json();
  } catch (proxyErr) {
    // 3. Direct fetch attempt as final fallback
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    return await res.json();
  }
}

/**
 * Universal JSON GET with Tauri Native fallback and Dev Proxy fallback
 */
async function getJson(url: string, bearerToken?: string): Promise<any> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const responseText = await invoke<string>('http_get_json', { url, bearerToken });
      return JSON.parse(responseText);
    } catch (err) {
      console.warn('Tauri native HTTP get fallback:', err);
    }
  }

  const proxyUrl = url.replace('https://management.azure.com', '/api/azure-arm');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  try {
    const res = await fetch(proxyUrl, { headers });
    return await res.json();
  } catch {
    const res = await fetch(url, { headers });
    return await res.json();
  }
}

/**
 * 1. Request Microsoft Device Authorization Code
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const url = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/devicecode`;
  const data = await postForm(url, {
    client_id: AZURE_CLI_CLIENT_ID,
    scope: 'https://management.azure.com/.default offline_access openid profile email',
  });

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  if (!data.device_code || !data.user_code) {
    throw new Error('Failed to retrieve device code from Microsoft.');
  }

  return data;
}

/**
 * 2. Poll Microsoft Token Endpoint until user completes browser authorization
 */
export async function pollDeviceCodeToken(
  deviceCode: string,
  interval: number = 5,
  expiresIn: number = 900,
  onStatusUpdate?: (status: string) => void
): Promise<TokenResponse> {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
  const startTime = Date.now();
  const pollInterval = Math.max(interval, 3) * 1000;

  while (Date.now() - startTime < expiresIn * 1000) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    try {
      const data = await postForm(tokenUrl, {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: AZURE_CLI_CLIENT_ID,
        device_code: deviceCode,
      });

      if (data.access_token) {
        onStatusUpdate?.('Authentication approved! Fetching Azure subscriptions...');
        return data;
      }

      if (data.error === 'authorization_pending') {
        onStatusUpdate?.('Waiting for Microsoft login approval in browser...');
        continue;
      }

      if (data.error === 'slow_down') {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      if (data.error === 'code_expired') {
        throw new Error('Verification code expired. Please request a new code.');
      }

      if (data.error === 'access_denied') {
        throw new Error('Authentication request was declined.');
      }

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }
    } catch (e: any) {
      if (e.message?.includes('Verification code expired') || e.message?.includes('declined')) {
        throw e;
      }
      // network retry
    }
  }

  throw new Error('Authentication timed out. Please try again.');
}

/**
 * 3. Fetch user Azure subscriptions directly via Azure Resource Manager REST API
 */
export async function fetchAzureSubscriptions(accessToken: string): Promise<{
  account: AzureAccount;
  subscriptions: AzureSubscription[];
}> {
  let userName = 'Azure User';
  let tenantId = 'Default Tenant';
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    userName = payload.name || payload.unique_name || payload.upn || payload.email || 'Authenticated User';
    tenantId = payload.tid || 'Default Tenant';
  } catch {
    // fallback
  }

  const armUrl = 'https://management.azure.com/subscriptions?api-version=2020-01-01';
  let subscriptions: AzureSubscription[] = [];

  try {
    const data = await getJson(armUrl, accessToken);
    if (data?.value && Array.isArray(data.value)) {
      subscriptions = data.value.map((s: any) => ({
        id: s.subscriptionId,
        name: s.displayName || s.subscriptionId,
        state: s.state || 'Enabled',
        tenantId: s.tenantId || tenantId,
      }));
    }
  } catch (err) {
    console.warn('Direct ARM subscription fetch notice:', err);
  }

  if (subscriptions.length === 0) {
    subscriptions = [
      {
        id: 'primary-subscription',
        name: 'Primary Cloud Subscription',
        state: 'Enabled',
        tenantId,
      },
    ];
  }

  const account: AzureAccount = {
    name: userName,
    id: subscriptions[0].id,
    tenantId,
    state: 'Enabled',
    isDefault: true,
  };

  return { account, subscriptions };
}

/**
 * Helper to build valid Azure Resource Manager (ARM) JSON template from visual resources
 */
export function buildArmTemplate(resources: any[], region: string, tenantId: string = '') {
  const armResources = resources.map((r) => {
    // 1. Resolve dependsOn references safely (ignore raw UUIDs not found in resources)
    const validDependsOn = (r.dependsOn || [])
      .map((depId: string) => {
        const depRes = resources.find((x) => x.id === depId);
        return depRes ? `[resourceId('${depRes.type}', '${depRes.name}')]` : null;
      })
      .filter((d: string | null): d is string => d !== null);

    const baseRes: any = {
      type: r.type,
      apiVersion: getApiVersionForType(r.type),
      name: r.name,
      location: region,
    };

    if (validDependsOn.length > 0) {
      baseRes.dependsOn = validDependsOn;
    }

    // 2. Format resource-specific ARM properties
    switch (r.type) {
      case 'Microsoft.Storage/storageAccounts': {
        // Storage account names must be lowercase alphanumeric only (3-24 chars)
        const cleanName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
        baseRes.name = cleanName.length >= 3 ? cleanName : `${cleanName}stg01`;
        baseRes.sku = { name: r.properties?.sku || 'Standard_LRS' };
        baseRes.kind = r.properties?.kind || 'StorageV2';
        baseRes.properties = {
          accessTier: r.properties?.accessTier || 'Hot',
          supportsHttpsTrafficOnly: true,
          minimumTlsVersion: 'TLS1_2',
        };
        break;
      }

      case 'Microsoft.Web/serverfarms': {
        baseRes.sku = {
          name: r.properties?.skuName || 'B1',
          tier: r.properties?.skuTier || 'Basic',
        };
        baseRes.kind = 'linux';
        baseRes.properties = {
          reserved: true,
        };
        break;
      }

      case 'Microsoft.Web/sites': {
        const aspRes = resources.find((x) => x.type === 'Microsoft.Web/serverfarms');
        baseRes.properties = {
          serverFarmId: aspRes ? `[resourceId('Microsoft.Web/serverfarms', '${aspRes.name}')]` : undefined,
          httpsOnly: true,
          siteConfig: {
            linuxFxVersion: r.properties?.runtime || 'NODE|18-lts',
          },
        };
        break;
      }

      case 'Microsoft.Network/virtualNetworks': {
        baseRes.properties = {
          addressSpace: {
            addressPrefixes: [r.properties?.addressSpace || '10.0.0.0/16'],
          },
          subnets: (r.properties?.subnets || [{ name: 'default', addressPrefix: '10.0.0.0/24' }]).map((s: any) => ({
            name: s.name,
            properties: { addressPrefix: s.addressPrefix || '10.0.0.0/24' },
          })),
        };
        break;
      }

      case 'Microsoft.KeyVault/vaults': {
        baseRes.properties = {
          sku: { family: 'A', name: r.properties?.sku || 'standard' },
          tenantId: tenantId || 'organizations',
          accessPolicies: [],
          enableRbacAuthorization: true,
        };
        break;
      }

      case 'Microsoft.DBforPostgreSQL/flexibleServers': {
        baseRes.sku = {
          name: r.properties?.skuName || 'Standard_B1ms',
          tier: r.properties?.skuTier || 'Burstable',
        };
        baseRes.properties = {
          version: r.properties?.version || '16',
          administratorLogin: r.properties?.administratorLogin || 'pgadmin',
          administratorLoginPassword: 'P@ssw0rdAzureBicep2026!',
          storage: {
            storageSizeGB: parseInt(r.properties?.storageSizeGB || '32', 10),
          },
        };
        break;
      }

      default: {
        baseRes.properties = r.properties || {};
        break;
      }
    }

    return baseRes;
  });

  return {
    $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
    contentVersion: '1.0.0.0',
    resources: armResources,
  };
}

function getApiVersionForType(type: string): string {
  switch (type) {
    case 'Microsoft.Network/virtualNetworks':
      return '2023-09-01';
    case 'Microsoft.Storage/storageAccounts':
      return '2023-01-01';
    case 'Microsoft.Web/serverfarms':
    case 'Microsoft.Web/sites':
      return '2022-09-01';
    case 'Microsoft.KeyVault/vaults':
      return '2023-07-01';
    case 'Microsoft.DBforPostgreSQL/flexibleServers':
      return '2023-03-01-preview';
    default:
      return '2021-04-01';
  }
}

/**
 * 4. Real Azure Resource Manager Template Deployment via REST API
 */
export async function deployWithArmRestApi(
  subscriptionId: string,
  resourceGroup: string,
  region: string,
  resources: any[]
): Promise<any> {
  const session = getSavedAuthSession();
  if (!session?.token?.access_token) {
    throw new Error('Not authenticated with Azure. Please sign in first.');
  }

  const token = session.token.access_token;
  const deploymentName = `bicep-studio-${Date.now()}`;

  // 1. Ensure Azure Resource Group exists first
  const rgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2021-04-01`;
  const rgProxyUrl = rgUrl.replace('https://management.azure.com', '/api/azure-arm');
  try {
    const rgRes = await fetch(rgProxyUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: region,
      }),
    });
    if (!rgRes.ok) {
      const rgErr = await rgRes.text();
      console.warn('Resource group pre-provision notice:', rgErr);
    }
  } catch (rgError) {
    console.warn('Failed to pre-provision resource group:', rgError);
  }

  // 2. Build sanitized ARM JSON template from resources
  const armTemplate = buildArmTemplate(resources, region, session.account?.tenantId);

  // 3. Trigger ARM Deployment PUT
  const deployUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Resources/deployments/${deploymentName}?api-version=2021-04-01`;
  const proxyUrl = deployUrl.replace('https://management.azure.com', '/api/azure-arm');

  const res = await fetch(proxyUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        mode: 'Incremental',
        template: armTemplate,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Azure ARM Deployment failed: ${errText}`);
  }

  return await res.json();
}

/**
 * 4b. Delete Resource Group / Teardown deployment directly via ARM REST API
 */
export async function deleteResourceGroupViaArm(
  subscriptionId: string,
  resourceGroup: string
): Promise<any> {
  const session = getSavedAuthSession();
  if (!session?.token?.access_token) {
    throw new Error('Not authenticated with Azure. Please sign in first.');
  }

  const token = session.token.access_token;
  const deleteUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2021-04-01`;
  const proxyUrl = deleteUrl.replace('https://management.azure.com', '/api/azure-arm');

  const res = await fetch(proxyUrl, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok && res.status !== 202 && res.status !== 204 && res.status !== 200) {
    const errText = await res.text();
    throw new Error(`Failed to delete Azure Resource Group: ${errText}`);
  }

  return { status: 'Deleted', resourceGroup };
}

/**
 * 5. Real Azure What-If Analysis via REST API
 */
export async function whatIfWithArmRestApi(
  subscriptionId: string,
  resourceGroup: string,
  region: string,
  resources: any[]
): Promise<any> {
  const session = getSavedAuthSession();
  if (!session?.token?.access_token) {
    throw new Error('Not authenticated with Azure. Please sign in first.');
  }

  const token = session.token.access_token;
  const deploymentName = `whatif-${Date.now()}`;

  // Ensure Azure Resource Group exists before running What-If
  const rgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2021-04-01`;
  const rgProxyUrl = rgUrl.replace('https://management.azure.com', '/api/azure-arm');
  try {
    await fetch(rgProxyUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: region,
      }),
    });
  } catch (e) {
    console.warn('What-If resource group notice:', e);
  }

  const armTemplate = buildArmTemplate(resources, region, session.account?.tenantId);

  const whatIfUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Resources/deployments/${deploymentName}/whatIf?api-version=2021-04-01`;
  const proxyUrl = whatIfUrl.replace('https://management.azure.com', '/api/azure-arm');

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        mode: 'Incremental',
        template: armTemplate,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Azure What-If execution failed: ${errText}`);
  }

  return await res.json();
}

/**
 * Save auth session to persistent storage
 */
export function saveAuthSession(token: TokenResponse, account: AzureAccount, subscriptions: AzureSubscription[]) {
  const session: StoredAuthSession = {
    token,
    account,
    subscriptions,
    expiresAt: Date.now() + (token.expires_in || 3600) * 1000,
  };
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
}

/**
 * Retrieve saved auth session
 */
export function getSavedAuthSession(): StoredAuthSession | null {
  try {
    const item = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!item) return null;
    const session: StoredAuthSession = JSON.parse(item);
    // Keep session if not expired (or within generous window)
    if (session.expiresAt && Date.now() > session.expiresAt + 86400000) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clear stored auth session (Sign out)
 */
export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}
