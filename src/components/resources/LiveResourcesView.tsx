import React, { useState, useEffect } from 'react';
import { useAzureStore, useUIStore } from '../../stores';
import {
  fetchSubscriptionResources,
  fetchResourceGroups,
  deleteResourceByIdViaArm,
  deleteResourceGroupViaArm,
} from '../../services/azureAuth';
import type { LiveAzureResource } from '../../types';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { AppleSpinner } from '../common/AppleSpinner';
import {
  Cloud,
  Layers,
  RefreshCw,
  ExternalLink,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Server,
  Database,
  HardDrive,
  Globe,
  Lock,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

export const LiveResourcesView: React.FC = () => {
  const { loginStatus, selectedSubscription, setSelectedSubscription } = useAzureStore();
  const { setActiveNav } = useUIStore();
  const [resources, setResources] = useState<LiveAzureResource[]>([]);
  const [resourceGroups, setResourceGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'resources' | 'rgs'>('resources');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [modalTarget, setModalTarget] = useState<{
    type: 'resource' | 'rg';
    id: string;
    name: string;
    resourceType?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [hasInitialLoaded, setHasInitialLoaded] = useState<boolean>(false);

  const loadResourcesData = async () => {
    if (!selectedSubscription?.id) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const [resList, rgList] = await Promise.all([
        fetchSubscriptionResources(selectedSubscription.id),
        fetchResourceGroups(selectedSubscription.id),
      ]);
      setResources(resList);
      setResourceGroups(rgList);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Failed to refresh cloud resources: ${err.message || err}`,
      });
    } finally {
      setLoading(false);
      setHasInitialLoaded(true);
    }
  };

  useEffect(() => {
    if (selectedSubscription?.id) {
      loadResourcesData();
    }
  }, [selectedSubscription?.id]);

  const openDeleteModalForResource = (res: LiveAzureResource) => {
    setModalTarget({
      type: 'resource',
      id: res.id,
      name: res.name,
      resourceType: res.type,
    });
    setConfirmModalOpen(true);
  };

  const openDeleteModalForRg = (rgName: string) => {
    setModalTarget({
      type: 'rg',
      id: rgName,
      name: rgName,
      resourceType: 'Resource Group',
    });
    setConfirmModalOpen(true);
  };

  const handleExecuteDelete = async (cascade: boolean) => {
    if (!modalTarget) return;
    setIsDeleting(true);
    setActionMessage(null);

    try {
      if (modalTarget.type === 'resource') {
        const result = await deleteResourceByIdViaArm(
          modalTarget.id,
          modalTarget.resourceType,
          undefined,
          { cascade }
        );
        const cascadeMsg = result.cascadeDeleted?.length
          ? ` (and cascaded hosted web apps: ${result.cascadeDeleted.join(', ')})`
          : '';
        setActionMessage({
          type: 'success',
          text: `Resource '${modalTarget.name}' deletion initiated successfully${cascadeMsg}.`,
        });
        setResources((prev) => prev.filter((r) => r.id !== modalTarget.id));
        if (result.cascadeDeleted?.length) {
          setResources((prev) =>
            prev.filter((r) => !result.cascadeDeleted.includes(r.name))
          );
        }
      } else {
        if (!selectedSubscription?.id) return;
        await deleteResourceGroupViaArm(selectedSubscription.id, modalTarget.name);
        setActionMessage({
          type: 'success',
          text: `Resource Group '${modalTarget.name}' and all child resources deleted successfully.`,
        });
        setResourceGroups((prev) => prev.filter((r) => r.name !== modalTarget.name));
        setResources((prev) => prev.filter((r) => r.resourceGroup !== modalTarget.name));
      }
      setConfirmModalOpen(false);
      setModalTarget(null);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Delete failed: ${err.message || err}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.resourceGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (typeFilter === 'all') return matchSearch;
    return matchSearch && res.type.toLowerCase().includes(typeFilter.toLowerCase());
  });

  const getResourceIcon = (type: string) => {
    if (type.includes('storageAccounts')) return <HardDrive size={16} />;
    if (type.includes('sites') || type.includes('serverfarms')) return <Server size={16} />;
    if (type.includes('PostgreSQL') || type.includes('sql')) return <Database size={16} />;
    if (type.includes('vaults')) return <Lock size={16} />;
    if (type.includes('virtualNetworks')) return <Globe size={16} />;
    return <Cloud size={16} />;
  };

  if (!loginStatus.loggedIn) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '48px 32px' }}>
          <ShieldCheck size={48} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fafafa', marginBottom: '8px' }}>Azure Account Not Connected</h2>
          <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Sign in with your Azure or Azure for Students account using the Azure button in the top navigation bar to view and manage live provisioned cloud resources.
          </p>
          <a
            href="https://portal.azure.com"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <ExternalLink size={16} /> Open Azure Portal
          </a>
        </div>
      </div>
    );
  }

  // AppleSpinner loading screen on click / initial data fetch
  if (loading && !hasInitialLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '450px',
          gap: '16px',
          background: '#09090b',
        }}
      >
        <AppleSpinner size={36} />
        <div style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: 500, letterSpacing: '0.02em' }}>
          Fetching data...
        </div>
      </div>
    );
  }

  const isServerFarm = modalTarget?.resourceType?.toLowerCase().includes('serverfarms');

  return (
    <div className="live-resources-view" style={{ padding: '24px 32px', height: '100%', overflowY: 'auto', background: '#09090b' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cloud size={24} />
            Live Cloud Resources Manager
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            Inspect, manage, and clean up active provisioned resources and resource groups in Azure.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedSubscription?.id || ''}
            onChange={(e) => {
              const sub = loginStatus.subscriptions.find((s) => s.id === e.target.value);
              if (sub) setSelectedSubscription(sub);
            }}
            className="input-select"
            style={{ minWidth: '220px', background: '#18181b', border: '1px solid #27272a', color: '#fafafa', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}
          >
            {loginStatus.subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.state})
              </option>
            ))}
          </select>

          <button
            className="btn btn-primary"
            onClick={loadResourcesData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <AppleSpinner size={15} /> : <RefreshCw size={15} />}
            {loading ? 'Refreshing...' : 'Refresh Resources'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setActiveNav('credits')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Wallet size={15} /> View Credits & Billing <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            background: actionMessage.type === 'success' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${actionMessage.type === 'success' ? '#2563eb' : '#ef4444'}`,
            color: actionMessage.type === 'success' ? '#93c5fd' : '#fca5a5',
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {actionMessage.text}
        </div>
      )}

      {/* Summary Stats Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Resources
            </span>
            <Cloud size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#fafafa' }}>
            {resources.length}
          </div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
            Active provisioned cloud items
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resource Groups
            </span>
            <Layers size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#fafafa' }}>
            {resourceGroups.length}
          </div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
            Container namespaces
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Regions
            </span>
            <Globe size={18} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#fafafa' }}>
            {Array.from(new Set(resources.map((r) => r.location))).length}
          </div>
          <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
            Azure datacenter regions
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #27272a', marginBottom: '20px', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('resources')}
          style={{
            background: activeTab === 'resources' ? '#2563eb' : 'transparent',
            color: activeTab === 'resources' ? '#ffffff' : '#a1a1aa',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Cloud size={15} /> Provisioned Resources ({resources.length})
        </button>

        <button
          onClick={() => setActiveTab('rgs')}
          style={{
            background: activeTab === 'rgs' ? '#2563eb' : 'transparent',
            color: activeTab === 'rgs' ? '#ffffff' : '#a1a1aa',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Layers size={15} /> Resource Groups ({resourceGroups.length})
        </button>
      </div>

      {/* TAB 1: LIVE RESOURCES INVENTORY */}
      {activeTab === 'resources' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '6px 12px', width: '320px' }}>
              <Search size={15} style={{ marginRight: '8px', color: '#71717a' }} />
              <input
                type="text"
                placeholder="Search resources, types, RG, region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fafafa', outline: 'none', fontSize: '13px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Filter:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-select"
                style={{ background: '#18181b', border: '1px solid #27272a', color: '#fafafa', borderRadius: '6px', padding: '6px 10px', fontSize: '12px' }}
              >
                <option value="all">All Resource Types</option>
                <option value="storageAccounts">Storage Accounts</option>
                <option value="sites">App Services / Web Apps</option>
                <option value="serverfarms">App Service Plans</option>
                <option value="virtualNetworks">Virtual Networks</option>
                <option value="vaults">Key Vaults</option>
                <option value="flexibleServers">PostgreSQL Servers</option>
              </select>
            </div>
          </div>

          {/* Resources Table */}
          {filteredResources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
              <Cloud size={36} style={{ margin: '0 auto 12px', color: '#3f3f46' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
                {loading ? 'Fetching Azure Resources...' : 'No Resources Found'}
              </h3>
              <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '400px', margin: '0 auto' }}>
                {loading
                  ? 'Connecting to Azure ARM REST API...'
                  : 'No provisioned cloud resources found matching criteria.'}
              </p>
            </div>
          ) : (
            <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#18181b', borderBottom: '1px solid #27272a', color: '#a1a1aa' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Resource Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Resource Group</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Region</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((res) => (
                    <tr
                      key={res.id}
                      style={{ borderBottom: '1px solid #1e1e24', transition: 'background 100ms' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#18181c')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fafafa' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getResourceIcon(res.type)}
                          <span>{res.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#a1a1aa', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {res.type.replace('Microsoft.', '')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#fafafa' }}>{res.resourceGroup}</td>
                      <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{res.location}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#e4e4e7',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                          }}
                        >
                          <CheckCircle2 size={11} /> {res.provisioningState || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <a
                            href={`https://portal.azure.com/#@/resource${res.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            title="Open in Azure Portal"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                          >
                            <ExternalLink size={12} /> Portal
                          </a>
                          <button
                            className="btn btn-ghost"
                            onClick={() => openDeleteModalForResource(res)}
                            title="Delete Resource from Azure"
                            style={{ padding: '4px 8px', color: '#ef4444' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESOURCE GROUPS MANAGER */}
      {activeTab === 'rgs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {resourceGroups.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px', background: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
              <Layers size={36} style={{ margin: '0 auto 12px', color: '#3f3f46' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>No Resource Groups</h3>
              <p style={{ fontSize: '13px', color: '#a1a1aa' }}>No Resource Groups found in this subscription.</p>
            </div>
          ) : (
            resourceGroups.map((rg) => {
              const count = resources.filter((r) => r.resourceGroup.toLowerCase() === rg.name.toLowerCase()).length;
              return (
                <div
                  key={rg.id}
                  style={{
                    background: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#fafafa' }}>{rg.name}</span>
                      <span style={{ fontSize: '11px', color: '#a1a1aa', background: '#18181b', padding: '2px 8px', borderRadius: '4px' }}>
                        {rg.location}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '16px' }}>
                      Contains <strong style={{ color: '#fafafa' }}>{count}</strong> live resource{count === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e1e24', paddingTop: '12px' }}>
                    <a
                      href={`https://portal.azure.com/#@/resource/subscriptions/${selectedSubscription?.id}/resourceGroups/${rg.name}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: '#fafafa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ExternalLink size={12} /> View in Portal
                    </a>

                    <button
                      className="btn btn-ghost"
                      onClick={() => openDeleteModalForRg(rg.name)}
                      style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}
                    >
                      <Trash2 size={13} />
                      1-Click Teardown
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalTarget && (
        <DeleteConfirmModal
          isOpen={confirmModalOpen}
          title={modalTarget.type === 'rg' ? 'Delete Resource Group' : 'Delete Azure Resource'}
          itemName={modalTarget.name}
          itemType={modalTarget.resourceType}
          description={
            modalTarget.type === 'rg'
              ? `Deleting Resource Group '${modalTarget.name}' will permanently destroy ALL resources hosted inside it.`
              : `Permanently delete '${modalTarget.name}' from your Azure subscription.`
          }
          cascadeOption={isServerFarm}
          cascadeLabel="Cascade delete: Automatically remove any Web Apps hosted on this App Service Plan first"
          isDeleting={isDeleting}
          onConfirm={handleExecuteDelete}
          onClose={() => {
            if (!isDeleting) {
              setConfirmModalOpen(false);
              setModalTarget(null);
            }
          }}
        />
      )}
    </div>
  );
};
