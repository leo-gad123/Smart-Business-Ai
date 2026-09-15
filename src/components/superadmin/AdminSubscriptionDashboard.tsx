import React, { useState, useCallback, useEffect } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hourglass,
  Ban,
  PauseCircle,
} from 'lucide-react';
import { Subscription, SubscriptionPlanType } from '../../types';
import {
  fetchAllSubscriptions,
  fetchSubscriptionOverview,
  formatDate,
  formatRwf,
} from '../../services/subscriptionApi';

interface AdminSubscriptionDashboardProps {
  onError?: (msg: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  TRIAL: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
  PAYMENT_DUE: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  PENDING: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
  EXPIRED: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  CANCELLED: 'bg-neutral-500/15 border-neutral-500/40 text-neutral-400',
  SUSPENDED: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
};

export const AdminSubscriptionDashboard: React.FC<AdminSubscriptionDashboardProps> = ({ onError }) => {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([fetchSubscriptionOverview(), fetchAllSubscriptions()]);
      setStats(s as unknown as Record<string, number>);
      setSubscriptions(list);
    } catch (err: any) {
      onError?.(err.message || 'Could not load subscription data.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = stats
    ? [
        { label: 'Total Businesses', value: stats.totalBusinesses ?? 0, icon: <Building2 className="w-4 h-4" />, color: 'text-white' },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400' },
        { label: 'Trial', value: stats.trialSubscriptions ?? 0, icon: <Sparkles className="w-4 h-4" />, color: 'text-sky-400' },
        { label: 'Expired', value: stats.expiredSubscriptions ?? 0, icon: <XCircle className="w-4 h-4" />, color: 'text-rose-400' },
        { label: 'Payment Due', value: stats.paymentDueSubscriptions ?? 0, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400' },
        { label: 'MRR (RWF/mo)', value: stats.monthlyRecurringRevenue ?? 0, icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400' },
        { label: 'Setup-fee Revenue', value: stats.setupFeeRevenue ?? 0, icon: <CreditCard className="w-4 h-4" />, color: 'text-amber-300' },
        { label: 'Single Worker Plan', value: stats.singleWorkerPlanCount ?? 0, icon: <Users className="w-4 h-4" />, color: 'text-blue-400' },
        { label: 'Multiple Worker Plan', value: stats.multipleWorkerPlanCount ?? 0, icon: <Users className="w-4 h-4" />, color: 'text-purple-400' },
        { label: 'Cancelled', value: stats.cancelledSubscriptions ?? 0, icon: <Ban className="w-4 h-4" />, color: 'text-neutral-400' },
        { label: 'Suspended', value: stats.suspendedSubscriptions ?? 0, icon: <PauseCircle className="w-4 h-4" />, color: 'text-rose-400' },
        { label: 'Pending', value: stats.pendingSubscriptions ?? 0, icon: <Hourglass className="w-4 h-4" />, color: 'text-slate-400' },
      ]
    : [];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Subscriptions &amp; Billing</h3>
            <p className="text-xs text-slate-400">Recurring revenue, plans, and payment health.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          aria-label="Refresh subscriptions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      )}

      {/* KPI Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {statCards.map((c) => (
            <div key={c.label} className="p-3 rounded-xl bg-[#0b1329] border border-slate-800">
              <div className="flex items-center justify-between">
                <span className={`text-xl font-extrabold font-mono ${c.color}`}>
                  {typeof c.value === 'number' && c.label.includes('RWF') ? formatRwf(c.value) : (c.value ?? 0).toLocaleString()}
                </span>
                <span className={c.color}>{c.icon}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Subscription Table */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">All Subscriptions</h4>
          <span className="text-[11px] text-slate-400">{subscriptions.length} businesses</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="px-4 py-2.5 font-semibold">Business</th>
                <th className="px-4 py-2.5 font-semibold">Owner</th>
                <th className="px-4 py-2.5 font-semibold">Workers</th>
                <th className="px-4 py-2.5 font-semibold">Plan</th>
                <th className="px-4 py-2.5 font-semibold">Setup Fee</th>
                <th className="px-4 py-2.5 font-semibold">Monthly</th>
                <th className="px-4 py-2.5 font-semibold">Trial End</th>
                <th className="px-4 py-2.5 font-semibold">Next Payment</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No subscriptions yet. New businesses will appear here once they complete registration and pay the setup fee.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition">
                    <td className="px-4 py-2.5 font-bold text-white">{s.businessName || s.businessId}</td>
                    <td className="px-4 py-2.5 text-slate-300">{s.ownerName || s.ownerId}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-300">{s.workerCount}</td>
                    <td className="px-4 py-2.5 text-slate-300">{s.planType === 'SINGLE_WORKER' ? 'Single Worker' : 'Multiple Workers'}</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-400">{formatRwf(s.setupFee)}</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-400">{formatRwf(s.monthlyFee)}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{formatDate(s.trialEndDate)}</td>
                    <td className="px-4 py-2.5 font-mono text-amber-300">{formatDate(s.nextPaymentDate)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[s.status] || STATUS_BADGE.PENDING}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Prices shown are the server-computed amounts. Payments are verified with the mobile-money provider before a subscription is marked paid.
      </p>
    </div>
  );
};