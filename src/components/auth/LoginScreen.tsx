import React from 'react';
import { useAzureStore } from '../../stores';
import { azureLogin } from '../../hooks/useTauri';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC<{ onSkip?: () => void }> = ({ onSkip }) => {
  const { setLoginStatus, setSelectedSubscription, loading, setLoading, error, setError } = useAzureStore();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await azureLogin();
      setLoginStatus(status);
      if (status.subscriptions.length > 0) {
        setSelectedSubscription(status.subscriptions[0]);
      }
    } catch (err: any) {
      setError(err?.toString() || 'Failed to authenticate with Azure CLI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#18181b', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldCheck size={28} color="#10b981" />
      </div>
      <h2>Connect to Microsoft Azure</h2>
      <p>
        Bicep Visual Studio operates local-first. We authenticate directly through your official Azure CLI
        session without ever storing passwords or client secrets.
      </p>

      {error && (
        <div className="badge badge-error" style={{ padding: '8px 14px', fontSize: 'var(--text-xs)', maxWidth: '440px' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <button className="btn btn-primary btn-lg" onClick={handleLogin} disabled={loading}>
          {loading ? <span className="spinner" /> : <LogIn size={16} />}
          {loading ? 'Authenticating in browser...' : 'Sign in with Azure CLI'}
        </button>
        {onSkip && (
          <button className="btn btn-secondary btn-lg" onClick={onSkip}>
            Offline Mode
          </button>
        )}
      </div>

      <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-tertiary)', maxWidth: '380px', lineHeight: 1.5 }}>
        Requires Azure CLI (<code>az</code>) installed on your system.
      </div>
    </div>
  );
};
