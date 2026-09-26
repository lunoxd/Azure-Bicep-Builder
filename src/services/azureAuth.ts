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

export interface ArmFetchResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

/**
 * Universal ARM REST API request runner
 * In Tauri: Executes natively via curl/Rust (bypassing webview CORS entirely)
 * In Dev Browser: Proxies through Vite /api/azure-arm
 */
export async function armRequest(
  url: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    headers?: Record<string, string>;
    _retried?: boolean;
  } = {}
): Promise<ArmFetchResponse> {
  const method = (options.method || 'GET').toUpperCase();
  // Use the provided token or get a valid (auto-refreshed) one from the session
  let token = options.token;
  if (!token) {
    try {
      token = await getValidToken();
    } catch {
      token = getSavedAuthSession()?.token?.access_token;
    }
  }
  const rawBody = options.body
    ? typeof options.body === 'string'
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  // 1. In Tauri Desktop: Call native Tauri HTTP command
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const response = await invoke<{ status: number; ok: boolean; body: string; error?: string }>(
        'http_arm_request',
        {
          method,
          url,
          bearerToken: token || null,
          headers: options.headers || null,
          body: rawBody || null,
        }
      );

      // On 401 from Tauri, try to refresh token and retry once
      if (response.status === 401 && !options._retried) {
        try {
          const refreshed = await getValidToken();
          return armRequest(url, { ...options, token: refreshed, _retried: true });
        } catch {
          // fall through to return the 401
        }
      }
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.ok ? 'OK' : 'Error',
        json: async () => {
          if (!response.body || response.body.trim().length === 0) return {};
          return JSON.parse(response.body);
        },
        text: async () => response.body || '',
      };
    } catch (tauriErr) {
      console.warn('Tauri native ARM request notice:', tauriErr);
    }
  }

  // 2. Web browser: Use dev proxy
  const proxyUrl = url.replace('https://management.azure.com', '/api/azure-arm');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: rawBody,
  };

  try {
    const res = await fetch(proxyUrl, fetchOptions);
    // On 401 in browser, try token refresh and retry once
    if (res.status === 401 && !options._retried) {
      try {
        const refreshed = await getValidToken();
        return armRequest(url, { ...options, token: refreshed, _retried: true });
      } catch {
        // fall through
      }
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      json: () => res.json(),
      text: () => res.text(),
    };
  } catch {
    // 3. Final direct fetch attempt
    const res = await fetch(url, fetchOptions);
    if (res.status === 401 && !options._retried) {
      try {
        const refreshed = await getValidToken();
        return armRequest(url, { ...options, token: refreshed, _retried: true });
      } catch {
        // fall through
      }
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      json: () => res.json(),
      text: () => res.text(),
    };
  }
}

/**
 * Universal JSON GET with Tauri Native fallback and Dev Proxy fallback
 */
async function getJson(url: string, bearerToken?: string): Promise<any> {
  const res = await armRequest(url, { method: 'GET', token: bearerToken });
  if (res.ok) {
    return await res.json();
  }
  const errText = await res.text();
  let parsedErr: any = null;
  try {
    parsedErr = JSON.parse(errText);
  } catch {
    // ignore
  }
  const msg = parsedErr?.error?.message || parsedErr?.message || errText;
  throw new Error(`ARM request failed (${res.status}): ${msg}`);
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
 * 3b. Fetch available Azure locations/regions for a subscription
 */
export async function fetchSubscriptionLocations(
  subscriptionId: string,
  accessToken?: string
): Promise<{ name: string; displayName: string }[]> {
  const token = accessToken || getSavedAuthSession()?.token?.access_token;
  if (!token) return [];

  const locUrl = `https://management.azure.com/subscriptions/${subscriptionId}/locations?api-version=2020-01-01`;
  try {
    const data = await getJson(locUrl, token);
    if (data?.value && Array.isArray(data.value)) {
      return data.value.map((loc: any) => ({
        name: loc.name,
        displayName: loc.displayName || loc.name,
      }));
    }
  } catch (err) {
    console.warn('Subscription locations fetch notice:', err);
  }
  return [];
}


/**
 * 3c. Fetch all live Azure resources in a subscription
 */
export async function fetchSubscriptionResources(
  subscriptionId: string,
  accessToken?: string
): Promise<any[]> {
  const token = accessToken || getSavedAuthSession()?.token?.access_token;
  if (!token) return [];

  const resourcesUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`;
  try {
    const data = await getJson(resourcesUrl, token);
    if (data?.value && Array.isArray(data.value)) {
      return data.value.map((res: any) => {
        // Extract resource group from Azure resource ID (/subscriptions/.../resourceGroups/<rg>/...)
        const match = res.id.match(/resourceGroups\/([^\/]+)/i);
        const resourceGroup = match ? match[1] : 'default-rg';
        return {
          id: res.id,
          name: res.name,
          type: res.type,
          location: res.location,
          resourceGroup,
          sku: res.sku,
          tags: res.tags,
          provisioningState: res.provisioningState || 'Succeeded',
        };
      });
    }
  } catch (err) {
    console.warn('Subscription resources fetch notice:', err);
  }
  return [];
}

/**
 * 3d. Fetch all Resource Groups in a subscription
 */
export async function fetchResourceGroups(
  subscriptionId: string,
  accessToken?: string
): Promise<any[]> {
  const token = accessToken || getSavedAuthSession()?.token?.access_token;
  if (!token) return [];

  const rgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2021-04-01`;
  try {
    const data = await getJson(rgUrl, token);
    if (data?.value && Array.isArray(data.value)) {
      return data.value.map((rg: any) => ({
        id: rg.id,
        name: rg.name,
        location: rg.location,
        properties: rg.properties,
      }));
    }
  } catch (err) {
    console.warn('Subscription resource groups fetch notice:', err);
  }
  return [];
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

export function extractResourceTypeFromId(resourceId: string): string {
  const match = resourceId.match(/\/providers\/([^\/]+\/[^\/]+)/i);
  return match ? match[1] : '';
}

export function getApiVersionForType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('microsoft.network/virtualnetworks') || t.includes('virtualnetworks')) return '2023-09-01';
  if (t.includes('microsoft.network/networksecuritygroups') || t.includes('networksecuritygroups')) return '2023-09-01';
  if (t.includes('microsoft.network/publicipaddresses') || t.includes('publicipaddresses')) return '2023-09-01';
  if (t.includes('microsoft.network/networkinterfaces') || t.includes('networkinterfaces')) return '2023-09-01';
  if (t.includes('microsoft.storage/storageaccounts') || t.includes('storageaccounts')) return '2023-01-01';
  if (t.includes('serverfarms') || t.includes('microsoft.web/serverfarms')) return '2022-09-01';
  if (t.includes('sites') || t.includes('microsoft.web/sites')) return '2022-09-01';
  if (t.includes('microsoft.keyvault/vaults') || t.includes('keyvault') || t.includes('vaults')) return '2023-07-01';
  if (t.includes('microsoft.dbforpostgresql/flexibleservers') || t.includes('flexibleservers') || t.includes('postgresql')) return '2023-03-01-preview';
  if (t.includes('microsoft.sql/servers') || t.includes('sql')) return '2021-11-01';
  if (t.includes('microsoft.compute/virtualmachines') || t.includes('virtualmachines')) return '2023-09-01';
  if (t.includes('microsoft.compute/disks') || t.includes('disks')) return '2023-04-02';
  if (t.includes('microsoft.containerservice/managedclusters') || t.includes('managedclusters')) return '2023-10-01';
  if (t.includes('microsoft.containerregistry/registries') || t.includes('containerregistry')) return '2023-07-01';
  if (t.includes('microsoft.operationalinsights/workspaces')) return '2022-10-01';
  if (t.includes('microsoft.insights/components') || t.includes('insights')) return '2020-02-02';
  return '2021-04-01';
}

/**
 * 4. Real Azure Resource Manager Template Deployment via REST API
 */
export async function deployWithArmRestApi(
  subscriptionId: string,
  resourceGroup: string,
  region: string,
  resources: any[],
  onProgress?: (msg: string) => void
): Promise<any> {
  if (!resources || resources.length === 0) {
    throw new Error('No resources to deploy. Please add at least one resource to your environment.');
  }

  // Always get a valid (auto-refreshed) token before deployment
  const token = await getValidToken();
  const deploymentName = `bicep-studio-${Date.now()}`;

  onProgress?.(`Provisioning resource group '${resourceGroup}'...`);

  // 1. Ensure Azure Resource Group exists first
  const rgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2021-04-01`;
  try {
    const rgRes = await armRequest(rgUrl, {
      method: 'PUT',
      token,
      body: { location: region },
    });
    if (!rgRes.ok && rgRes.status !== 200 && rgRes.status !== 201) {
      const rgErr = await rgRes.text();
      console.warn('Resource group pre-provision notice:', rgErr);
    }
  } catch (rgError) {
    console.warn('Failed to pre-provision resource group:', rgError);
  }

  // 2. Build sanitized ARM JSON template from resources
  const tenantId = getSavedAuthSession()?.account?.tenantId;
  const armTemplate = buildArmTemplate(resources, region, tenantId);

  onProgress?.(`Submitting ARM deployment template (${resources.length} resources)...`);

  // 3. Trigger ARM Deployment PUT
  const deployUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Resources/deployments/${deploymentName}?api-version=2021-04-01`;

  const res = await armRequest(deployUrl, {
    method: 'PUT',
    token,
    body: {
      properties: {
        mode: 'Incremental',
        template: armTemplate,
      },
    },
  });

  if (!res.ok && res.status !== 200 && res.status !== 201) {
    const errText = await res.text();
    let errObj: any = null;
    try {
      errObj = JSON.parse(errText);
    } catch {
      // not json
    }
    const msg = errObj?.error?.message || errObj?.message || errText;
    throw new Error(`Azure ARM Deployment failed (${res.status}): ${msg}`);
  }

  // 4. Poll Azure ARM Deployment until completion
  const startTime = Date.now();
  const maxTimeoutMs = 8 * 60 * 1000; // 8 min max
  const pollIntervalMs = 4000;
  let pollCount = 0;

  while (Date.now() - startTime < maxTimeoutMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    pollCount++;

    try {
      const statusRes = await armRequest(deployUrl, { method: 'GET', token });

      if (!statusRes.ok) {
        const errBody = await statusRes.text();
        // 401 → token expired mid-poll, throw immediately
        if (statusRes.status === 401) {
          throw new Error('Azure session expired during deployment. Please sign in again.');
        }
        // Other transient errors: warn and retry
        console.warn(`ARM poll attempt ${pollCount} returned ${statusRes.status}:`, errBody);
        onProgress?.(`Azure provisioning... (checking status, attempt ${pollCount})`);
        continue;
      }

      const statusData = await statusRes.json();
      const provState = statusData?.properties?.provisioningState;

      onProgress?.(`Azure deployment status: ${provState || 'Provisioning'} (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);

      if (provState === 'Succeeded') {
        return statusData;
      }

      if (provState === 'Failed' || provState === 'Canceled') {
        // Fetch detailed operation failure details
        const opsUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Resources/deployments/${deploymentName}/operations?api-version=2021-04-01`;
        try {
          const opsRes = await armRequest(opsUrl, { method: 'GET', token });
          if (opsRes.ok) {
            const opsData = await opsRes.json();
            const failedOp = (opsData.value || []).find(
              (op: any) => op.properties?.provisioningState === 'Failed'
            );
            if (failedOp) {
              const statusMsg = failedOp.properties?.statusMessage;
              const errDetail = statusMsg?.error?.message || statusMsg?.message || JSON.stringify(statusMsg);
              throw new Error(`Resource '${failedOp.properties?.targetResource?.resourceName || 'Unknown'}' failed in Azure: ${errDetail}`);
            }
          }
        } catch (e: any) {
          if (e.message?.includes('failed in Azure:')) throw e;
        }

        const mainErr = statusData?.properties?.error?.message || JSON.stringify(statusData?.properties?.error || 'Deployment failed');
        throw new Error(`Azure deployment '${deploymentName}' failed: ${mainErr}`);
      }
    } catch (pollErr: any) {
      if (
        pollErr.message?.includes('failed in Azure:') ||
        pollErr.message?.includes('failed:') ||
        pollErr.message?.includes('session expired')
      ) {
        throw pollErr;
      }
      // transient network error — retry
      console.warn(`ARM poll attempt ${pollCount} error (retrying):`, pollErr.message);
    }
  }

  throw new Error('Azure deployment timed out after 8 minutes. Check the Azure Portal for status.');
}

/**
 * 4b. Delete Resource Group / Teardown deployment directly via ARM REST API
 */
export async function deleteResourceGroupViaArm(
  subscriptionId: string,
  resourceGroup: string
): Promise<any> {
  // If running inside Tauri, try native az group delete first
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const out = await invoke<string>('delete_resource_group', { resourceGroup });
      return { status: 'Deleted', resourceGroup, output: out };
    } catch (cliErr) {
      console.warn('Native az group delete fallback to ARM REST API:', cliErr);
    }
  }

  const token = await getValidToken();
  const deleteUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2021-04-01`;

  const res = await armRequest(deleteUrl, {
    method: 'DELETE',
    token,
  });

  if (!res.ok && res.status !== 202 && res.status !== 204 && res.status !== 200) {
    const errText = await res.text();
    let errObj: any = null;
    try {
      errObj = JSON.parse(errText);
    } catch {
      // ignore
    }
    const msg = errObj?.error?.message || errObj?.message || errText;
    throw new Error(`Failed to delete Azure Resource Group: ${msg}`);
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
  const token = await getValidToken();
  const deploymentName = `whatif-${Date.now()}`;

  // Ensure Azure Resource Group exists before running What-If
  const rgUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}?api-version=2021-04-01`;
  try {
    await armRequest(rgUrl, {
      method: 'PUT',
      token,
      body: { location: region },
    });
  } catch (e) {
    console.warn('What-If resource group notice:', e);
  }

  const tenantId = getSavedAuthSession()?.account?.tenantId;
  const armTemplate = buildArmTemplate(resources, region, tenantId);
  const whatIfUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/Microsoft.Resources/deployments/${deploymentName}/whatIf?api-version=2021-04-01`;

  const res = await armRequest(whatIfUrl, {
    method: 'POST',
    token,
    body: {
      properties: {
        mode: 'Incremental',
        template: armTemplate,
      },
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    let errObj: any = null;
    try {
      errObj = JSON.parse(errText);
    } catch {
      // ignore
    }
    const msg = errObj?.error?.message || errObj?.message || errText;
    throw new Error(`Azure What-If execution failed: ${msg}`);
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
 * Retrieve saved auth session (never returns expired sessions without refresh_token)
 */
export function getSavedAuthSession(): StoredAuthSession | null {
  try {
    const item = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!item) return null;
    const session: StoredAuthSession = JSON.parse(item);
    // Hard-expire sessions that have no refresh_token and are truly expired
    if (session.expiresAt && Date.now() > session.expiresAt && !session.token.refresh_token) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      return null;
    }
    // Remove sessions that are too old even with a refresh token (7 days)
    if (session.expiresAt && Date.now() > session.expiresAt + 7 * 24 * 3600 * 1000) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Refresh an expired access token using the stored refresh_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
  const data = await postForm(tokenUrl, {
    grant_type: 'refresh_token',
    client_id: AZURE_CLI_CLIENT_ID,
    refresh_token: refreshToken,
    scope: 'https://management.azure.com/.default offline_access openid profile email',
  });

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  if (!data.access_token) {
    throw new Error('Token refresh failed: no access_token returned.');
  }
  return data;
}

/**
 * Get a valid (non-expired) access token, refreshing proactively if within 5 minutes of expiry.
 * Updates localStorage with the refreshed token automatically.
 */
export async function getValidToken(): Promise<string> {
  const session = getSavedAuthSession();
  if (!session) {
    throw new Error('Not authenticated with Azure. Please sign in first.');
  }

  const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry
  const needsRefresh = session.expiresAt && (Date.now() >= session.expiresAt - REFRESH_THRESHOLD_MS);

  if (needsRefresh && session.token.refresh_token) {
    try {
      console.info('Azure access token near/past expiry — refreshing automatically...');
      const newToken = await refreshAccessToken(session.token.refresh_token);
      // Persist refreshed token
      saveAuthSession(newToken, session.account, session.subscriptions);
      return newToken.access_token;
    } catch (refreshErr) {
      console.warn('Silent token refresh failed:', refreshErr);
      // If refresh fails and token is hard-expired, force re-auth
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        throw new Error('Azure session expired and refresh failed. Please sign in again.');
      }
      // Token still within expiry window — use existing token
    }
  }

  return session.token.access_token;
}

/**
 * Clear stored auth session (Sign out)
 */
export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

/**
 * 6. Fetch Billing, Spending & Credits Breakdown
 */
export interface AzureBillingSummary {
  subscriptionName: string;
  subscriptionId: string;
  currency: string;
  totalSpent: number;
  remainingCredits: number;
  initialCredits: number;
  spendingByService: { serviceName: string; cost: number; currency: string }[];
  isStudentAccount: boolean;
  status: string;
}

export async function fetchSubscriptionBillingInfo(
  subscriptionId: string,
  subName?: string,
  accessToken?: string
): Promise<AzureBillingSummary> {
  const token = accessToken || getSavedAuthSession()?.token?.access_token;
  const isStudent = (subName || '').toLowerCase().includes('student') || (subName || '').toLowerCase().includes('azure for student');
  const initialCredits = isStudent ? 100.0 : 200.0;

  let totalSpent = 0.0;
  let currency = 'USD';
  const spendingByService: { serviceName: string; cost: number; currency: string }[] = [];

  if (token && subscriptionId) {
    try {
      // Query Azure Consumption Usage Details REST API
      const usageUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Consumption/usageDetails?api-version=2021-10-01&$top=50`;
      const data = await getJson(usageUrl, token);
      if (data?.value && Array.isArray(data.value)) {
        const serviceMap: Record<string, { cost: number; currency: string }> = {};
        for (const item of data.value) {
          const props = item.properties || {};
          const cost = parseFloat(props.costInBillingCurrency || props.pretaxCost || '0');
          const service = props.consumedService || props.meterDetails?.meterCategory || 'Cloud Compute';
          const curr = props.billingCurrency || 'USD';
          currency = curr;
          totalSpent += cost;

          if (!serviceMap[service]) {
            serviceMap[service] = { cost: 0, currency: curr };
          }
          serviceMap[service].cost += cost;
        }

        for (const [serviceName, val] of Object.entries(serviceMap)) {
          spendingByService.push({
            serviceName,
            cost: Math.round(val.cost * 100) / 100,
            currency: val.currency,
          });
        }
      }
    } catch (err) {
      console.warn('Billing API query notice (may require Enterprise/Billing permissions):', err);
    }
  }

  // Calculate remaining credits
  const remainingCredits = Math.max(0, initialCredits - totalSpent);

  return {
    subscriptionName: subName || 'Azure Subscription',
    subscriptionId,
    currency,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remainingCredits: Math.round(remainingCredits * 100) / 100,
    initialCredits,
    spendingByService,
    isStudentAccount: isStudent,
    status: 'Active',
  };
}

/**
 * 7. Delete individual Azure Resource via ARM REST API with Conflict / Cascade Resolution
 */
export async function deleteResourceByIdViaArm(
  resourceId: string,
  resourceType?: string,
  accessToken?: string,
  options?: { cascade?: boolean }
): Promise<any> {
  // If running inside desktop Tauri, try native az CLI first if available
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const out = await invoke<string>('delete_resource_native', { resourceId });
      return { status: 'Deleted', resourceId, output: out };
    } catch (cliErr) {
      console.warn('Native az resource delete fallback to ARM REST API:', cliErr);
    }
  }

  let token = accessToken;
  if (!token) {
    token = await getValidToken();
  }

  const detectedType = resourceType || extractResourceTypeFromId(resourceId);
  const apiVersion = getApiVersionForType(detectedType);

  const performDelete = async (targetId: string, targetType: string, version?: string) => {
    const v = version || getApiVersionForType(targetType);
    const deleteUrl = `https://management.azure.com${targetId}?api-version=${v}`;
    return await armRequest(deleteUrl, {
      method: 'DELETE',
      token,
    });
  };

  let res = await performDelete(resourceId, detectedType, apiVersion);

  // If Azure reports NoRegisteredProviderFound or unsupported api-version error, parse supported versions list and retry
  if (!res.ok && res.status !== 202 && res.status !== 204 && res.status !== 200) {
    const errText = await res.text();
    let errObj: any = null;
    try {
      errObj = JSON.parse(errText);
    } catch {
      // not json
    }

    const errMsg = errObj?.error?.message || errObj?.Message || errObj?.message || '';
    const errCode = errObj?.error?.code || errObj?.Code || errObj?.code || '';

    // 1. Check for API version mismatch
    const versionMatch = errMsg.match(/supported api-versions are '([^']+)'/i);
    if (versionMatch && versionMatch[1]) {
      const supportedList = versionMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
      const candidate = supportedList.find((v: string) => !v.includes('preview') && !v.includes('alpha')) || supportedList[0];
      if (candidate && candidate !== apiVersion) {
        console.info(`Retrying Azure delete with supported api-version '${candidate}' for ${detectedType || resourceId}`);
        res = await performDelete(resourceId, detectedType, candidate);
        if (res.ok || res.status === 202 || res.status === 204 || res.status === 200) {
          return { status: 'Deleted', resourceId, apiVersion: candidate };
        }
      }
    }

    // 2. Check for App Service Plan / Web App Conflict (Conflict error 409)
    if (errCode === 'Conflict' || errMsg.includes('cannot be deleted because it has web app(s)')) {
      const subRgMatch = resourceId.match(/^(\/subscriptions\/[^\/]+\/resourceGroups\/[^\/]+)/i);
      const baseRgPath = subRgMatch ? subRgMatch[1] : '';

      // Extract conflicting web app names from parameters or error message
      let assignedApps: string[] = [];
      const errorEntityParams = errObj?.Details?.[0]?.ErrorEntity?.Parameters || errObj?.error?.details?.[0]?.parameters;
      if (Array.isArray(errorEntityParams) && errorEntityParams.length > 1) {
        assignedApps = errorEntityParams.slice(1).map((s: any) => String(s).trim());
      } else {
        const appMatch = errMsg.match(/has web app\(s\)\s+([^\s]+)\s+assigned/i);
        if (appMatch && appMatch[1]) {
          assignedApps = appMatch[1].split(',').map((s: string) => s.trim());
        }
      }

      if (assignedApps.length > 0 && (options?.cascade !== false)) {
        console.info(`Cascade deleting assigned web apps first: ${assignedApps.join(', ')}`);
        for (const appName of assignedApps) {
          const siteId = `${baseRgPath}/providers/Microsoft.Web/sites/${appName}`;
          try {
            await performDelete(siteId, 'Microsoft.Web/sites');
          } catch (siteErr) {
            console.warn(`Failed to cascade delete web app '${appName}':`, siteErr);
          }
        }
        // Wait 1.5s for Azure to release the plan binding
        await new Promise((r) => setTimeout(r, 1500));
        res = await performDelete(resourceId, detectedType, apiVersion);
        if (res.ok || res.status === 202 || res.status === 204 || res.status === 200) {
          return { status: 'Deleted', resourceId, cascadeDeleted: assignedApps };
        }
      } else if (assignedApps.length > 0) {
        throw new Error(`Cannot delete App Service Plan '${resourceId.split('/').pop()}': Web App '${assignedApps.join(', ')}' is currently hosted on it. Please delete the Web App first.`);
      }
    }

    if (!res.ok && res.status !== 202 && res.status !== 204 && res.status !== 200) {
      const displayMsg = errMsg || errText;
      throw new Error(`Failed to delete resource: ${displayMsg}`);
    }
  }

  return { status: 'Deleted', resourceId, apiVersion };
}


