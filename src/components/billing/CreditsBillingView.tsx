import React, { useState, useEffect } from 'react';
import { useAzureStore, useUIStore } from '../../stores';
import {
  fetchSubscriptionBillingInfo,
  type AzureBillingSummary,
} from '../../services/azureAuth';
import {
  Wallet,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  Cloud,
  DollarSign,
  PieChart,
} from 'lucide-react';

import { AppleSpinner } from '../common/AppleSpinner';

export const CreditsBillingView: React.FC = () => {
  const { loginStatus, selectedSubscription, setSelectedSubscription } = useAzureStore();
  const { setActiveNav } = useUIStore();
  const [billing, setBilling] = useState<AzureBillingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasInitialLoaded, setHasInitialLoaded] = useState<boolean>(false);

  const loadBillingData = async () => {
    if (!selectedSubscription?.id) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const summary = await fetchSubscriptionBillingInfo(
        selectedSubscription.id,
        selectedSubscription.name
      );
      setBilling(summary);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Failed to refresh live billing: ${err.message || err}`,
      });
    } finally {
      setLoading(false);
      setHasInitialLoaded(true);
    }
  };

  useEffect(() => {
    if (selectedSubscription?.id) {
      loadBillingData();
    }
  }, [selectedSubscription?.id]);

  if (!loginStatus.loggedIn) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: '#18181b', borderRadius: '16px', border: '1px solid #27272a', padding: '48px 32px' }}>
          <ShieldCheck size={48} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fafafa', marginBottom: '8px' }}>Azure Account Not Connected</h2>
          <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            Sign in with your Azure or Azure for Students account using the Azure button in the top navigation bar to view your live credits balance, spending rate, and cost analysis.
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

  const remaining = billing?.remainingCredits ?? 100.0;
  const initial = billing?.initialCredits ?? 100.0;
  const spent = billing?.totalSpent ?? 0.0;
  const currency = billing?.currency || 'USD';
  const percentLeft = Math.min(100, Math.max(0, (remaining / initial) * 100));

  return (
    <div className="credits-billing-view" style={{ padding: '24px 32px', height: '100%', overflowY: 'auto', background: '#09090b' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fafafa', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={24} />
            Credits & Cost Management
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            Track your remaining Azure grants, credit balance, and spending breakdown across cloud services.
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
            onClick={loadBillingData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <AppleSpinner size={15} /> : <RefreshCw size={15} />}
            {loading ? 'Refreshing...' : 'Refresh Credits'}
          </button>

          <a
            href="https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            <ExternalLink size={15} /> Azure Cost Portal
          </a>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            color: '#fca5a5',
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Main Stats Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Balance & Credits */}
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Credits Balance
            </span>
            <CreditCard size={20} />
          </div>

          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fafafa', marginBottom: '6px' }}>
            ${remaining.toFixed(2)}
            <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 400, marginLeft: '8px' }}>
              / ${initial.toFixed(2)} {currency}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <Sparkles size={14} />
            {billing?.isStudentAccount ? 'Azure for Students ($100 Free Grant)' : 'Active Cloud Subscription Grant'}
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${percentLeft}%`,
                height: '100%',
                background: percentLeft > 25 ? '#2563eb' : '#ef4444',
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717a', marginTop: '6px' }}>
            <span>{percentLeft.toFixed(0)}% credits remaining</span>
            <span>${spent.toFixed(2)} consumed</span>
          </div>
        </div>

        {/* Card 2: Total Spending */}
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Spending
            </span>
            <DollarSign size={20} />
          </div>

          <div style={{ fontSize: '32px', fontWeight: 800, color: '#fafafa', marginBottom: '6px' }}>
            ${spent.toFixed(2)}
            <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 400, marginLeft: '8px' }}>
              {currency}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <TrendingUp size={14} />
            <span>Current consumption billing cycle</span>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1e1e24', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a1a1aa' }}>
            <span>Daily burn rate:</span>
            <strong style={{ color: '#fafafa' }}>~${(spent / 30).toFixed(2)} / day</strong>
          </div>
        </div>

        {/* Card 3: Resources Quick Link */}
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Resource Manager
              </span>
              <Cloud size={20} />
            </div>

            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '8px 0 16px' }}>
              Manage, delete, and inspect all live Azure resources running in your subscription in the dedicated Resource Manager page.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setActiveNav('resources')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
          >
            <Layers size={15} /> Open Resource Manager <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Student Sponsorship & Consumption Transparency Notice */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <ShieldCheck size={18} style={{ color: '#a1a1aa', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5 }}>
          <strong style={{ color: '#fafafa' }}>Student Grant & Consumption Tracking:</strong> Microsoft does not expose raw sponsorship wallet API balances to client-tier tokens. We calculate your balance by retrieving live, itemized usage charges directly from the Azure ARM Consumption REST API against your subscription's $100.00 student allocation.
        </div>
      </div>

      {/* Services Breakdown & Cost Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Spending by Service */}
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fafafa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} />
            Spending Breakdown by Azure Service
          </h2>

          {billing?.spendingByService && billing.spendingByService.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {billing.spendingByService.map((srv) => {
                const srvPercent = spent > 0 ? (srv.cost / spent) * 100 : 0;
                return (
                  <div key={srv.serviceName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#fafafa', fontWeight: 500 }}>{srv.serviceName}</span>
                      <span style={{ color: '#fafafa', fontWeight: 600 }}>
                        ${srv.cost.toFixed(2)} {srv.currency} ({srvPercent.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#1e1e24', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${srvPercent}%`, height: '100%', background: '#3b82f6' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#71717a' }}>
              <Sparkles size={28} style={{ margin: '0 auto 10px', color: '#3f3f46' }} />
              <p style={{ fontSize: '13px', color: '#a1a1aa' }}>
                $0.00 spent so far in this billing period.
              </p>
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                Deploying App Services, Databases, or Storage Accounts will show real-time cost telemetry here.
              </p>
            </div>
          )}
        </div>

        {/* Cost Optimization & Student Tips */}
        <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fafafa', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            Credit Preservation Tips
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px 16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
                App Service Plans (B1 vs F1)
              </h4>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
                Basic (B1) App Service plans cost approximately $13/month. When finished testing, delete unused plans in the Resource Manager or tear down the Resource Group.
              </p>
            </div>

            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px 16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
                Flexible PostgreSQL Servers
              </h4>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
                Burstable tier (B1ms) keeps costs minimal (~$15/month). Stop or delete test databases after verification.
              </p>
            </div>

            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px 16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
                1-Click Resource Group Teardown
              </h4>
              <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
                Use the Resource Groups tab in the Resource Manager to instantly wipe all associated cloud resources with zero leftover billing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
