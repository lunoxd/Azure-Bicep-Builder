import React, { useState, useEffect } from 'react';
import { useEnvironmentStore, useDeploymentStore, useAzureStore, useUIStore } from '../../stores';
import { generateBicepCode, deployBicep, deleteDeploymentResourceGroup } from '../../hooks/useTauri';
import { fetchSubscriptionLocations } from '../../services/azureAuth';
import type { DeploymentStep, DeploymentStatus } from '../../types';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  ShieldAlert,
  Trash2,
  Layers,
  AlertTriangle,
  Sparkles,
  Globe,
  ExternalLink,
} from 'lucide-react';

const DEFAULT_REGIONS = [
  { id: 'eastasia', name: 'East Asia', studentRecommended: true },
  { id: 'southeastasia', name: 'Southeast Asia', studentRecommended: true },
  { id: 'centralindia', name: 'Central India', studentRecommended: true },
  { id: 'southindia', name: 'South India', studentRecommended: true },
  { id: 'japaneast', name: 'Japan East', studentRecommended: true },
  { id: 'koreacentral', name: 'Korea Central', studentRecommended: true },
  { id: 'eastus', name: 'East US', studentRecommended: true },
  { id: 'eastus2', name: 'East US 2', studentRecommended: true },
  { id: 'westus2', name: 'West US 2', studentRecommended: true },
  { id: 'centralus', name: 'Central US', studentRecommended: true },
  { id: 'southcentralus', name: 'South Central US', studentRecommended: true },
  { id: 'westeurope', name: 'West Europe', studentRecommended: true },
  { id: 'northeurope', name: 'North Europe', studentRecommended: true },
  { id: 'uksouth', name: 'UK South', studentRecommended: true },
  { id: 'australiaeast', name: 'Australia East', studentRecommended: true },
  { id: 'canadacentral', name: 'Canada Central', studentRecommended: false },
  { id: 'francecentral', name: 'France Central', studentRecommended: false },
  { id: 'germanywestcentral', name: 'Germany West Central', studentRecommended: false },
  { id: 'switzerlandnorth', name: 'Switzerland North', studentRecommended: false },
  { id: 'swedencentral', name: 'Sweden Central', studentRecommended: false },
  { id: 'uaenorth', name: 'UAE North', studentRecommended: false },
  { id: 'brazilsouth', name: 'Brazil South', studentRecommended: false },
  { id: 'southafricanorth', name: 'South Africa North', studentRecommended: false },
];

export const DeployView: React.FC = () => {
  const { currentEnvironment, updateEnvironmentField } = useEnvironmentStore();
  const { loginStatus, selectedSubscription } = useAzureStore();
  const { setAzureConnectionModalOpen } = useUIStore();
  const { isDeploying, setIsDeploying, addToHistory } = useDeploymentStore();

  const [regions, setRegions] = useState(DEFAULT_REGIONS);
  const [steps, setSteps] = useState<DeploymentStep[]>([]);
  const [overallStatus, setOverallStatus] = useState<DeploymentStatus>(
    currentEnvironment?.status === 'deployed' ? 'succeeded' : 'pending'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolicyError, setIsPolicyError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  // Fetch subscription's real Azure regions dynamically if logged in
  useEffect(() => {
    if (loginStatus.loggedIn && selectedSubscription?.id) {
      fetchSubscriptionLocations(selectedSubscription.id).then((liveLocs) => {
        if (liveLocs && liveLocs.length > 0) {
          const merged = liveLocs.map((loc: { name: string; displayName: string }) => ({
            id: loc.name,
            name: loc.displayName || loc.name,
            studentRecommended: ['eastasia', 'southeastasia', 'centralindia', 'eastus', 'eastus2', 'westus2', 'westeurope', 'centralus'].includes(loc.name.toLowerCase()),
          }));
          setRegions(merged);
        }
      });
    }
  }, [loginStatus.loggedIn, selectedSubscription?.id]);

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
      setIsPolicyError(false);
      setDeleteSuccessMsg(null);

      const initialSteps: DeploymentStep[] = [
        {
          resourceName: currentEnvironment.resourceGroup,
          resourceType: 'Microsoft.Resources/resourceGroups',
          status: 'running',
          timestamp: new Date().toLocaleTimeString(),
          message: `Validating & provisioning Azure Resource Group in '${currentEnvironment.region}'...`,
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
      const errStr = err?.message || err?.toString() || 'Deployment failed.';
      setErrorMessage(errStr);
      
      // Detect Azure Student/Free Tier Regional Policy restriction
      if (errStr.includes('RequestDisallowedByAzure') || errStr.includes('best available regions')) {
        setIsPolicyError(true);
      }

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

  const handleQuickRegionSwitch = (newRegion: string) => {
    updateEnvironmentField('region', newRegion);
    setErrorMessage(null);
    setIsPolicyError(false);
    setOverallStatus('pending');
    setSteps([]);
  };

  const handleDeleteDeployment = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);
      setIsPolicyError(false);
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
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Environment Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
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

        {/* Interactive Region Selector with East Asia & Global Azure Regions */}
        <div className="card" style={{ padding: '14px 16px', background: '#18181b', border: '1px solid #27272a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Deployment Region</div>
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>Selectable</span>
          </div>
          <div style={{ position: 'relative', marginTop: '4px' }}>
            <select
              className="input"
              style={{
                height: '34px',
                padding: '4px 26px 4px 8px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#10b981',
                background: '#09090b',
                borderColor: '#3f3f46',
                cursor: 'pointer',
              }}
              value={currentEnvironment.region}
              onChange={(e) => handleQuickRegionSwitch(e.target.value)}
              disabled={isDeploying || isDeleting}
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id}) {r.studentRecommended ? '⭐ (Student)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', background: '#18181b', border: '1px solid #27272a' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Target Subscription</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fafafa', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedSubscription?.name || 'Default Subscription'}
          </div>
        </div>
      </div>

      {/* Azure Student / Free Tier Policy Advisory Banner with East Asia */}
      {isPolicyError && (
        <div
          className="card"
          style={{
            padding: '20px',
            border: '1px solid #2563eb',
            background: 'rgba(37, 99, 235, 0.08)',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sparkles size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fafafa', margin: 0 }}>
              Azure for Students Regional Policy Detected
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#fafafa', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Your Azure subscription allows deployment to designated regions. Choose your target region below and retry:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'eastasia', label: '⭐ East Asia (eastasia)' },
              { id: 'southeastasia', label: '⭐ Southeast Asia (southeastasia)' },
              { id: 'centralindia', label: '⭐ Central India (centralindia)' },
              { id: 'japaneast', label: '⭐ Japan East (japaneast)' },
              { id: 'eastus', label: '⭐ East US (eastus)' },
              { id: 'eastus2', label: '⭐ East US 2 (eastus2)' },
              { id: 'westeurope', label: '⭐ West Europe (westeurope)' },
            ].map((reg) => (
              <button
                key={reg.id}
                className="btn btn-secondary btn-sm"
                style={{
                  background: currentEnvironment.region === reg.id ? '#2563eb' : '#18181b',
                  color: currentEnvironment.region === reg.id ? '#ffffff' : '#fafafa',
                  borderColor: currentEnvironment.region === reg.id ? '#2563eb' : '#3f3f46',
                  fontWeight: 700,
                  padding: '6px 12px',
                }}
                onClick={() => handleQuickRegionSwitch(reg.id)}
              >
                ⚡ {reg.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
                  {overallStatus === 'running'
                    ? 'Deploying to Azure...'
                    : (currentEnvironment.status === 'deployed' || overallStatus === 'succeeded')
                    ? 'Environment Active in Azure'
                    : 'Ready to Deploy'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Targeting Region: <strong style={{ color: '#3b82f6' }}>{currentEnvironment.region}</strong> • {currentEnvironment.resources.length} resources
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

              {/* Open in Azure Portal Button */}
              {currentEnvironment.status === 'deployed' && (
                <a
                  href={`https://portal.azure.com/#@${loginStatus.account?.tenantId || 'common'}/resource/subscriptions/${selectedSubscription?.id || loginStatus.account?.id}/resourceGroups/${currentEnvironment.resourceGroup}/overview`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-lg"
                  style={{ textDecoration: 'none', padding: '12px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={15} /> Azure Portal
                </a>
              )}

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
              <strong style={{ color: '#fafafa' }}>{selectedSubscription?.name}</strong> ({currentEnvironment.region}).
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

      {/* Success Message */}
      {deleteSuccessMsg && (
        <div className="badge badge-success" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          <CheckCircle2 size={16} /> {deleteSuccessMsg}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && !isPolicyError && (
        <div className="badge badge-error" style={{ display: 'block', width: '100%', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          <XCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
          {errorMessage}
        </div>
      )}

      {/* Step-by-Step Progress Timeline */}
      {steps.length > 0 && (
        <div className="card" style={{ padding: '20px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fafafa', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} color="#10b981" />
            Deployment Execution Progress ({currentEnvironment.region})
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
