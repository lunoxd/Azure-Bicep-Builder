import React, { useState, useEffect } from 'react';
import { useAzureStore } from '../../stores';
import { checkLoginStatus, azureLogin, setSubscription, checkAzCli, installAzCliInApp } from '../../hooks/useTauri';
import {
  requestDeviceCode,
  pollDeviceCodeToken,
  fetchAzureSubscriptions,
  saveAuthSession,
  getSavedAuthSession,
  clearAuthSession,
  type DeviceCodeResponse,
} from '../../services/azureAuth';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Terminal,
  Globe,
  DownloadCloud,
  Sparkles,
  Copy,
  ExternalLink,
  LogOut,
  Zap,
} from 'lucide-react';

export const AzureConnectionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    loginStatus,
    setLoginStatus,
    selectedSubscription,
    setSelectedSubscription,
    loading,
    setLoading,
    error,
    setError,
  } = useAzureStore();

  const [authMethod, setAuthMethod] = useState<'inapp' | 'cli'>('inapp');
  const [deviceInfo, setDeviceInfo] = useState<DeviceCodeResponse | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [cliInstalled, setCliInstalledState] = useState<boolean | null>(null);
  const [isInstallingCli, setIsInstallingCli] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [installSuccessMsg, setInstallSuccessMsg] = useState<string | null>(null);

  // Restore saved session or check CLI on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      const saved = getSavedAuthSession();
      if (saved && !loginStatus.loggedIn) {
        setLoginStatus({
          loggedIn: true,
          account: saved.account,
          subscriptions: saved.subscriptions,
        });
        if (saved.subscriptions.length > 0 && !selectedSubscription) {
          setSelectedSubscription(saved.subscriptions[0]);
        }
      }
      checkCli();
    }
  }, [isOpen]);

  const checkCli = async () => {
    setIsVerifying(true);
    try {
      const installed = await checkAzCli();
      setCliInstalledState(installed);
      if (installed && !loginStatus.loggedIn) {
        const status = await checkLoginStatus();
        if (status.loggedIn) {
          setLoginStatus(status);
          if (status.subscriptions.length > 0 && !selectedSubscription) {
            setSelectedSubscription(status.subscriptions[0]);
          }
        }
      }
    } catch {
      setCliInstalledState(false);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  // In-App Microsoft Device Code Flow
  const handleStartInAppAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      setDeviceStatus('Requesting Microsoft authorization code...');
      
      const devCode = await requestDeviceCode();
      setDeviceInfo(devCode);
      setDeviceStatus('Please enter code in browser and approve access.');

      // Automatically open login URL in a new window/tab
      window.open(devCode.verification_uri, '_blank');

      // Poll in background
      const token = await pollDeviceCodeToken(
        devCode.device_code,
        devCode.interval || 5,
        devCode.expires_in || 900,
        (msg) => setDeviceStatus(msg)
      );

      // Fetch user subscriptions with access token
      const { account, subscriptions } = await fetchAzureSubscriptions(token.access_token);
      
      saveAuthSession(token, account, subscriptions);

      setLoginStatus({
        loggedIn: true,
        account,
        subscriptions,
      });

      if (subscriptions.length > 0) {
        setSelectedSubscription(subscriptions[0]);
      }

      setDeviceInfo(null);
      setDeviceStatus('Successfully authenticated with Microsoft Azure!');
    } catch (err: any) {
      setError(err?.message || err?.toString() || 'Microsoft login encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (deviceInfo?.user_code) {
      navigator.clipboard.writeText(deviceInfo.user_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    setLoginStatus({ loggedIn: false, subscriptions: [] });
    setSelectedSubscription(null);
    setDeviceInfo(null);
    setDeviceStatus('');
  };

  const handleAutoInstallCli = async () => {
    try {
      setIsInstallingCli(true);
      setError(null);
      setInstallSuccessMsg(null);
      const res = await installAzCliInApp();
      setInstallSuccessMsg(res || 'Azure CLI installed successfully!');
      await checkCli();
    } catch (err: any) {
      setError(err?.toString() || 'In-app installation encountered an issue.');
    } finally {
      setIsInstallingCli(false);
    }
  };

  const handleCliLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await azureLogin();
      setLoginStatus(status);
      if (status.subscriptions.length > 0) {
        setSelectedSubscription(status.subscriptions[0]);
      }
    } catch (err: any) {
      setError(err?.toString() || 'Azure CLI login failed. Please verify browser permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSub = async (subId: string) => {
    const sub = loginStatus.subscriptions.find((s) => s.id === subId);
    if (sub) {
      setSelectedSubscription(sub);
      try {
        await setSubscription(sub.id);
      } catch (err: any) {
        console.warn('Subscription selection warning:', err);
      }
    }
  };

  return (
    <div className="replication-modal">
      <div className="replication-content" style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={24} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0 }}>
                Azure Authentication
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                Direct In-App Microsoft Entra ID Login & Azure CLI Support
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        {!loginStatus.loggedIn && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '4px',
              background: '#18181b',
              borderRadius: '8px',
              border: '1px solid #27272a',
              marginBottom: '18px',
            }}
          >
            <button
              onClick={() => setAuthMethod('inapp')}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: authMethod === 'inapp' ? '#27272a' : 'transparent',
                color: authMethod === 'inapp' ? '#fafafa' : '#a1a1aa',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Zap size={14} color={authMethod === 'inapp' ? '#10b981' : '#71717a'} />
              ⚡ In-App Direct Login (Fastest)
            </button>
            <button
              onClick={() => setAuthMethod('cli')}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: authMethod === 'cli' ? '#27272a' : 'transparent',
                color: authMethod === 'cli' ? '#fafafa' : '#a1a1aa',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Terminal size={14} color={authMethod === 'cli' ? '#10b981' : '#71717a'} />
              Local Azure CLI (az)
            </button>
          </div>
        )}

        {/* Active Account Status */}
        {loginStatus.loggedIn ? (
          <div
            className="card"
            style={{
              padding: '20px',
              marginBottom: '18px',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              background: 'rgba(16, 185, 129, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={28} color="#10b981" />
                <div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: '#fafafa' }}>
                    {loginStatus.account?.name || 'Authenticated User'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Tenant: <code>{loginStatus.account?.tenantId || 'Default Organization'}</code>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSignOut}
                style={{ color: '#ef4444', borderColor: '#3f3f46' }}
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>

            {/* Subscriptions Dropdown */}
            {loginStatus.subscriptions.length > 0 && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label" style={{ fontWeight: 700 }}>
                  Active Azure Subscription ({loginStatus.subscriptions.length} detected)
                </label>
                <select
                  className="input"
                  style={{ height: '42px', fontSize: '13px' }}
                  value={selectedSubscription?.id || ''}
                  onChange={(e) => handleSelectSub(e.target.value)}
                >
                  {loginStatus.subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* In-App Direct Device Code View */}
            {authMethod === 'inapp' && (
              <div
                className="card"
                style={{ padding: '20px', marginBottom: '18px', background: '#18181b' }}
              >
                <div style={{ marginBottom: deviceInfo ? '16px' : '0' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>
                    Instant In-App Microsoft Login
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Connects securely via Microsoft Entra ID Device Flow. Works directly without requiring pre-installed CLIs.
                  </div>
                </div>

                {deviceInfo && (
                  <div
                    style={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '6px' }}>
                      YOUR MICROSOFT SIGN-IN CODE
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '28px',
                        fontWeight: 900,
                        letterSpacing: '4px',
                        color: '#10b981',
                        margin: '8px 0',
                      }}
                    >
                      {deviceInfo.user_code}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
                        {copiedCode ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                        {copiedCode ? 'Code Copied!' : 'Copy Code'}
                      </button>
                      <a
                        href={deviceInfo.verification_uri}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> Open Login Page
                      </a>
                    </div>

                    {deviceStatus && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#10b981',
                          marginTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span className="spinner" style={{ width: '10px', height: '10px' }} />
                        {deviceStatus}
                      </div>
                    )}
                  </div>
                )}

                {!deviceInfo && (
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '12px', padding: '14px 20px' }}
                    onClick={handleStartInAppAuth}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner" /> : <Zap size={18} />}
                    {loading ? 'Connecting to Microsoft...' : '⚡ Start In-App Microsoft Sign-In'}
                  </button>
                )}
              </div>
            )}

            {/* Azure CLI View */}
            {authMethod === 'cli' && (
              <div
                className="card"
                style={{ padding: '18px 20px', marginBottom: '18px', background: '#18181b' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Terminal size={20} color="#a1a1aa" />
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#fafafa' }}>
                        Azure CLI (<code>az</code>)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {cliInstalled === true
                          ? 'Azure CLI installed and ready'
                          : cliInstalled === false
                          ? 'Azure CLI not detected on system'
                          : 'Checking system environment...'}
                      </div>
                    </div>
                  </div>

                  <div>
                    {cliInstalled === true ? (
                      <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={checkCli} disabled={isVerifying}>
                        <RefreshCw size={11} /> Recheck
                      </button>
                    )}
                  </div>
                </div>

                {cliInstalled === false && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                        Auto-install Azure CLI inside the app:
                      </p>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAutoInstallCli}
                        disabled={isInstallingCli}
                      >
                        {isInstallingCli ? <span className="spinner" style={{ width: '12px', height: '12px' }} /> : <DownloadCloud size={13} />}
                        {isInstallingCli ? 'Installing...' : '⚡ 1-Click CLI Install'}
                      </button>
                    </div>
                  </div>
                )}

                {installSuccessMsg && (
                  <div className="badge badge-success" style={{ marginTop: '10px', width: '100%', padding: '6px 10px' }}>
                    <Sparkles size={12} /> {installSuccessMsg}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '16px', padding: '14px 20px' }}
                  onClick={handleCliLogin}
                  disabled={loading}
                >
                  {loading ? <span className="spinner" /> : <Globe size={18} />}
                  {loading ? 'Launching Browser Login...' : 'Sign in via Azure CLI'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Error Alert */}
        {error && (
          <div
            className="badge badge-error"
            style={{
              display: 'block',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: 'var(--text-xs)',
              whiteSpace: 'pre-wrap',
            }}
          >
            <AlertCircle size={15} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            🔒 100% Local-first: Direct authentication with Microsoft Entra ID.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
