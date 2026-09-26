import React, { useState, useEffect } from 'react';
import { useAzureStore } from '../../stores';
import { azureLogin, checkAzCli } from '../../hooks/useTauri';
import {
  requestDeviceCode,
  pollDeviceCodeToken,
  fetchAzureSubscriptions,
  saveAuthSession,
  type DeviceCodeResponse,
} from '../../services/azureAuth';
import {
  Layers,
  ShieldCheck,
  AlertCircle,
  Zap,
  Terminal,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { AppleSpinner } from '../common/AppleSpinner';

export const LoginScreen: React.FC = () => {
  const {
    setLoginStatus,
    setSelectedSubscription,
    loading,
    setLoading,
    error,
    setError,
    setCliInstalled,
  } = useAzureStore();

  const [deviceInfo, setDeviceInfo] = useState<DeviceCodeResponse | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isCliLoggingIn, setIsCliLoggingIn] = useState(false);

  useEffect(() => {
    setError(null);
    checkAzCli().then((installed) => setCliInstalled(installed));
  }, []);

  const handleStartInAppAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      setDeviceStatus('Requesting Microsoft authorization code...');

      const devCode = await requestDeviceCode();
      setDeviceInfo(devCode);
      setDeviceStatus('Enter code in browser and authorize Microsoft access.');

      window.open(devCode.verification_uri, '_blank');

      const token = await pollDeviceCodeToken(
        devCode.device_code,
        devCode.interval || 5,
        devCode.expires_in || 900,
        (msg) => setDeviceStatus(msg)
      );

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
    } catch (err: any) {
      setError(err?.message || err?.toString() || 'Microsoft login encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleCliLogin = async () => {
    try {
      setIsCliLoggingIn(true);
      setError(null);
      const status = await azureLogin();
      setLoginStatus(status);
      if (status.subscriptions.length > 0) {
        setSelectedSubscription(status.subscriptions[0]);
      }
    } catch (err: any) {
      setError(err?.toString() || 'Failed to authenticate with Azure CLI');
    } finally {
      setIsCliLoggingIn(false);
    }
  };

  const handleCopyCode = () => {
    if (deviceInfo?.user_code) {
      navigator.clipboard.writeText(deviceInfo.user_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const isAnyLoading = loading || isCliLoggingIn;

  return (
    <div className="auth-gate-container">
      <div className="auth-gate-card">
        {/* Brand Icon & Heading */}
        <div className="auth-gate-header">
          <div className="auth-gate-logo">
            <Layers size={28} strokeWidth={2.2} color="#38bdf8" />
          </div>
          <h1 className="auth-gate-title">Azure Bicep Builder</h1>
          <p className="auth-gate-subtitle">
            Sign in with Microsoft Azure to visually design topologies, inspect live cloud spending,
            and deploy infrastructure with zero drift.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} className="auth-error-icon" />
            <span className="auth-error-text">{error}</span>
          </div>
        )}

        {/* Device Code Flow Active Screen */}
        {deviceInfo ? (
          <div className="auth-device-box">
            <div className="auth-device-step">
              <span className="auth-step-number">1</span>
              <span>Copy your one-time Microsoft authorization code:</span>
            </div>

            <div className="auth-code-wrapper">
              <span className="auth-user-code">{deviceInfo.user_code}</span>
              <button
                type="button"
                className="btn-auth-copy"
                onClick={handleCopyCode}
                title="Copy code"
              >
                {copiedCode ? (
                  <>
                    <Check size={14} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="auth-device-step" style={{ marginTop: '14px' }}>
              <span className="auth-step-number">2</span>
              <span>Complete authentication in your browser:</span>
            </div>

            <a
              href={deviceInfo.verification_uri}
              target="_blank"
              rel="noreferrer"
              className="btn-auth-browser"
            >
              <span>Open Microsoft Login Page</span>
              <ExternalLink size={14} />
            </a>

            <div className="auth-polling-status">
              <AppleSpinner size={14} color="#38bdf8" />
              <span>{deviceStatus || 'Waiting for browser approval...'}</span>
            </div>
          </div>
        ) : (
          /* Main Action Buttons */
          <div className="auth-actions-group">
            {/* 1. Primary: 1-Click Microsoft In-App OAuth */}
            <button
              type="button"
              className="btn-auth-primary"
              onClick={handleStartInAppAuth}
              disabled={isAnyLoading}
            >
              {loading ? (
                <>
                  <AppleSpinner size={18} color="#ffffff" />
                  <span>Connecting to Microsoft...</span>
                </>
              ) : (
                <>
                  <Zap size={18} color="#38bdf8" />
                  <span>Sign in with Microsoft Azure</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or</span>
            </div>

            {/* 2. Secondary: Native Azure CLI */}
            <button
              type="button"
              className="btn-auth-secondary"
              onClick={handleCliLogin}
              disabled={isAnyLoading}
            >
              {isCliLoggingIn ? (
                <>
                  <AppleSpinner size={16} />
                  <span>Launching Azure CLI...</span>
                </>
              ) : (
                <>
                  <Terminal size={16} />
                  <span>Sign in via Azure CLI (`az login`)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security & Local-First Footer Badge */}
        <div className="auth-security-footer">
          <ShieldCheck size={14} color="#10b981" />
          <span>Local-first architecture. Official Microsoft OAuth session without storing credentials.</span>
        </div>
      </div>
    </div>
  );
};
