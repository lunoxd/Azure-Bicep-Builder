import React, { useState } from 'react';
import { useEnvironmentStore, useDeploymentStore, useAzureStore, useUIStore } from '../../stores';
import { generateBicepCode, deployBicep, deleteDeploymentResourceGroup } from '../../hooks/useTauri';
import type { DeploymentStep, DeploymentStatus } from '../../types';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  ShieldAlert,
  Trash2,
  MapPin,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const DeployView: React.FC = () => {
  const { currentEnvironment, updateEnvironmentField } = useEnvironmentStore();
  const { loginStatus, selectedSubscription } = useAzureStore();
  const { setAzureConnectionModalOpen } = useUIStore();
  const { isDeploying, setIsDeploying, addToHistory } = useDeploymentStore();

  const [steps, setSteps] = useState<DeploymentStep[]>([]);
  const [overallStatus, setOverallStatus] = useState<DeploymentStatus>(
    currentEnvironment?.status === 'deployed' ? 'succeeded' : 'pending'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  if (!currentEnvironment) {
    return (
      <div className="empty-state">
        <Layers size={36} color="#71717a" />
        <h3>No Environment Selected</h3>
        <p>Please select or create an environment to deploy.</p>
      </div>
    );
  }

  const handleStartDeployment = async () => {
    if (!loginStatus.loggedIn) {
      setErrorMessage('Please authenticate with Azure before launching deployments.');
      setAzureConnectionModalOpen(true);
      return;
    }

    try {
      setIsDeploying(true);
      setOverallStatus('running');
      setErrorMessage(null);
      setDeleteSuccessMsg(null);

      const initialSteps: DeploymentStep[] = [
        {
          resourceName: currentEnvironment.resourceGroup,
          resourceType: 'Microsoft.Resources/resourceGroups',
          status: 'running',
          timestamp: new Date().toLocaleTimeString(),
          message: 'Validating & provisioning Azure Resource Group...',
        },
        ...currentEnvironment.resources.map((res) => ({
          resourceName: res.name,
          resourceType: res.type,
          status: 'pending' as DeploymentStatus,
          timestamp: '',
          message: 'Queued for deployment...',
        })),
      ];
      setSteps(initialSteps);

      const gen = await generateBicepCode(
        currentEnvironment.resources,
        currentEnvironment.resourceGroup,
        currentEnvironment.region
      );

      await deployBicep(
        gen.code,
        currentEnvironment.resourceGroup,
        currentEnvironment.region,
        selectedSubscription?.id || '',
        currentEnvironment.resources
      );

      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: 'succeeded',
          timestamp: new Date().toLocaleTimeString(),
          message: 'Active & provisioned in Azure.',
        }))
      );
      setOverallStatus('succeeded');
      updateEnvironmentField('status', 'deployed');
      updateEnvironmentField('lastDeployedAt', new Date().toISOString());

      addToHistory({
        id: `deploy-${Date.now()}`,
        environmentId: currentEnvironment.id,
        status: 'succeeded',
        region: currentEnvironment.region,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        steps: initialSteps,
        bicepCode: gen.code,
      });
    } catch (err: any) {
      setOverallStatus('failed');
      setErrorMessage(err?.message || err?.toString() || 'Deployment failed.');
      setSteps((prev) =>
        prev.map((step) =>
          step.status === 'running'
            ? { ...step, status: 'failed', message: 'Failed to deploy' }
            : step
        )
      );
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDeleteDeployment = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      setShowDeleteConfirm(false);

      await deleteDeploymentResourceGroup(
        currentEnvironment.resourceGroup,
        selectedSubscription?.id || ''
      );

      updateEnvironmentField('status', 'draft');
      updateEnvironmentField('lastDeployedAt', undefined);
      setOverallStatus('pending');
      setSteps([]);
      setDeleteSuccessMsg(`Azure Resource Group '${currentEnvironment.resourceGroup}' and all resources have been deleted.`);
    } catch (err: any) {
      setErrorMessage(err?.message || err?.toString() || 'Failed to delete Azure deployment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStepIndicator = (status: DeploymentStatus) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle2 size={16} color="#10b981" />;
      case 'running':
        return <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#10b981' }} />;
      case 'failed':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <Clock size={14} color="#71717a" />;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Environment Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '14px 16px', background: '#18181b', border: '1px solid #27272a' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Environment</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#fafafa', marginTop: '4px' }}>{currentEnvironment.name}</div>
        </div>
        <div className="card" style={{ padding: '14px 16px', background: '#18181b', border: '1px solid #27272a' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Resource Group</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa', marginTop: '4px', fontFamily: 'monospace' }}>
            {currentEnvironment.resourceGroup}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 16px', background: '#18181b', border: '1px solid #27272a' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Region</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} /> {currentEnvironment.region}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 16px', background: '#18181b', border: '1px solid #27272a' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Target Subscription</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedSubscription?.name || 'Default Subscription'}
          </div>
        </div>
      </div>

      {/* Auth Guard Banner */}
      {!loginStatus.loggedIn && (
        <div
          className="card"
          style={{
            padding: '24px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: '12px',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <ShieldAlert size={22} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fafafa', margin: '0 0 6px 0' }}>
            Connect Azure to Deploy
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Sign into your Microsoft Azure account to deploy this environment into your cloud subscription.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setAzureConnectionModalOpen(true)}
            style={{ padding: '12px 28px' }}
          >
            <KeyRound size={16} /> Connect Azure
          </button>
        </div>
      )}

      {/* Action Control Panel */}
      {loginStatus.loggedIn && (
        <div
          className="card"
          style={{
            padding: '24px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: (currentEnvironment.status === 'deployed' || overallStatus === 'succeeded') ? '#10b981' : overallStatus === 'running' ? '#38bdf8' : '#71717a',
                  }}
                />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#fafafa' }}>
                  {overallStatus === 'running' ? 'Deploying to Azure...' : (currentEnvironment.status === 'deployed' || overallStatus === 'succeeded') ? 'Environment Active in Azure' : 'Ready to Deploy'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                {currentEnvironment.resources.length} resources configured ({currentEnvironment.resources.map((r) => r.name).join(', ')})
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Deploy Button */}
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartDeployment}
                disabled={isDeploying || isDeleting}
                style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
              >
                {isDeploying ? (
                  <span className="spinner" style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Rocket size={16} />
                )}
                {isDeploying
                  ? 'Deploying to Azure...'
                  : currentEnvironment.status === 'deployed'
                  ? 'Redeploy Changes'
                  : 'Deploy to Azure'}
              </button>

              {/* Delete / Teardown Button */}
              {currentEnvironment.status === 'deployed' && (
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeploying || isDeleting}
                  style={{
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    padding: '12px 18px',
                  }}
                  title="Delete Resource Group and destroy all deployed Azure resources"
                >
                  {isDeleting ? (
                    <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#ef4444' }} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete Deployment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="replication-modal">
          <div className="replication-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#fafafa' }}>
                Delete Azure Deployment?
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This will permanently delete the Azure Resource Group{' '}
              <strong style={{ color: '#fafafa', fontFamily: 'monospace' }}>{currentEnvironment.resourceGroup}</strong> and all {currentEnvironment.resources.length} associated resources in subscription{' '}
              <strong style={{ color: '#fafafa' }}>{selectedSubscription?.name}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: '#ef4444', color: '#ffffff', border: 'none', fontWeight: 700 }}
                onClick={handleDeleteDeployment}
              >
                Yes, Delete from Azure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / Error Alerts */}
      {deleteSuccessMsg && (
        <div className="badge badge-success" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          <CheckCircle2 size={16} /> {deleteSuccessMsg}
        </div>
      )}

      {errorMessage && (
        <div className="badge badge-error" style={{ display: 'block', width: '100%', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          <XCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
          {errorMessage}
        </div>
      )}

      {/* Step-by-Step Progress Timeline */}
      {steps.length > 0 && (
        <div className="card" style={{ padding: '20px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fafafa', marginBottom: '14px' }}>
            Deployment Execution Progress
          </div>
          <div className="deploy-timeline">
            {steps.map((step, idx) => (
              <div key={idx} className="deploy-step">
                <div
                  className="deploy-step-indicator"
                  style={{
                    backgroundColor:
                      step.status === 'succeeded'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : step.status === 'running'
                        ? 'rgba(59, 130, 246, 0.12)'
                        : '#18181b',
                  }}
                >
                  {getStepIndicator(step.status)}
                </div>
                <div className="deploy-step-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{step.resourceName}</h4>
                    {step.timestamp && (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                        {step.timestamp}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {step.message || step.resourceType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
