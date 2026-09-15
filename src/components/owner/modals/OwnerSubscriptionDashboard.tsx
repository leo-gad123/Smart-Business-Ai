import React, { useState, useCallback, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  CreditCard,
  History,
  Sparkles,
  Ban,
} from 'lucide-react';
import { User as UserType, Subscription, SubscriptionPayment } from '../../../types';
import {
  fetchMySubscription,
  fetchPaymentHistory,
  updateWorkerCount,
  cancelSubscriptionApi,
  formatRwf,
  formatDate,
  planForWorkerCount,
  LOCAL_PLANS,
  type SubscriptionPlan,
} from '../../../services/subscriptionApi';
import { MtnMomoPaymentModal } from '../../payment/MtnMomoPaymentModal';

interface OwnerSubscriptionDashboardProps {
  currentUser: UserType;
  onUserUpdated?: (user: UserType) => void;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
  TRIAL: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
  PAYMENT_DUE: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
  PENDING: 'bg-slate-500/15 border-slate-500/40 text-slate-300',
  EXPIRED: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
  CANCELLED: 'bg-neutral-500/15 border-neutral-500/40 text-neutral-400',
  SUSPENDED: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
};

export const OwnerSubscriptionDashboard: React.FC<OwnerSubscriptionDashboardProps> = ({
  currentUser,
  onUserUpdated,
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayments, setShowPayments] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPayNow, setShowPayNow] = useState(false);
  const [workerCountInput, setWorkerCountInput] = useState(1);
  const [pendingChangeMsg, setPendingChangeMsg] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sub = await fetchMySubscription({ ownerId: currentUser.id, email: currentUser.email });
      setSubscription(sub);
      if (sub) {
        const history = await fetchPaymentHistory(sub.id).catch(() => []);
        setPayments(history);
        setWorkerCountInput(sub.workerCount);
      }
    } catch (err: any) {
      setError(err.message || 'Could not load subscription.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, currentUser.email]);

  useEffect(() => {
    load();
  }, [load]);

  // Plan fallback: if no server subscription yet, infer plan from local user state.
  const currentPlan = subscription
    ? planForWorkerCount(subscription.workerCount)
    : planForWorkerCount(1);

  const handleUpdateWorkerCount = async () => {
    if (!subscription) return;
    if (workerCountInput < 1) return;

    const oldPlan = planForWorkerCount(subscription.workerCount);
    const newPlan = planForWorkerCount(workerCountInput);
    const changed = oldPlan.planType !== newPlan.planType;

    if (changed && !pendingChangeMsg) {
      setPendingChangeMsg(`Your business now has more than 1 worker.

Your subscription will change from:
${formatRwf(oldPlan.monthlyFee)}/month

to:
${formatRwf(newPlan.monthlyFee)}/month.`);
      return;
    }

    setUpdating(true);
    setActionMsg('');
    try {
      await updateWorkerCount(subscription.id, workerCountInput);
      setActionMsg('Plan updated. No historical payments were changed.');
      setPendingChangeMsg('');
      setShowChangePlan(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to update worker count.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    setUpdating(true);
    try {
      const updated = await cancelSubscriptionApi(subscription.id, 'Cancelled by owner.');
      setSubscription(updated);
      setActionMsg('Subscription cancelled.');
      setShowCancelConfirm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription.');
    } finally {
      setUpdating(false);
    }
  };

  const payAmount = subscription ? subscription.monthlyFee : currentPlan.monthlyFee;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Subscription & Billing</h3>
            <p className="text-xs text-slate-400">Manage your plan, workers, and payments.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_STYLES[subscription?.status || 'PENDING'] || STATUS_STYLES.PENDING}`}>
            {subscription?.status || 'PENDING'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {actionMsg && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-700/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Current Plan</span>
          </div>
          <span className="font-bold text-white text-sm">
            {subscription ? (subscription.planType === 'SINGLE_WORKER' ? 'Single Worker' : 'Multiple Workers') : currentPlan.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
            <span className="block text-slate-400 mb-0.5">Workers</span>
            <span className="font-mono font-bold text-white text-sm">{subscription?.workerCount ?? '—'} worker(s)</span>
          </div>
          <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
            <span className="block text-slate-400 mb-0.5">Setup Fee (paid)</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{formatRwf(subscription?.setupFee ?? currentPlan.setupFee)}</span>
          </div>
          <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
            <span className="block text-slate-400 mb-0.5">Monthly Subscription</span>
            <span className="font-mono font-bold text-white text-sm">{formatRwf(subscription?.monthlyFee ?? currentPlan.monthlyFee)}/mo</span>
          </div>
          <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
            <span className="block text-slate-400 mb-0.5">Trial</span>
            <span className="font-bold text-emerald-400 text-sm">FREE ({subscription?.trialMonths ?? 1} month)</span>
          </div>
          <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
            <span className="block text-slate-400 mb-0.5">Trial Ends</span>
            <span className="font-mono text-white text-sm">{formatDate(subscription?.trialEndDate || '')}</span>
          </div>
          <div className="p-2.5 bg-slate-800/60 border border-slate-700 rounded-xl">
            <span className="block text-slate-400 mb-0.5">Next Payment</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{formatDate(subscription?.nextPaymentDate || '')}</span>
          </div>
        </div>

        {subscription?.status === 'TRIAL' && (
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-[11px] text-sky-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              You are in your <strong>FREE trial month</strong>. Your first monthly payment of{' '}
              <strong>{formatRwf(subscription.monthlyFee)}</strong> is due on {formatDate(subscription.nextPaymentDate)}.
            </span>
          </div>
        )}

        {subscription?.status === 'PAYMENT_DUE' && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Your monthly payment of <strong>{formatRwf(subscription.monthlyFee)}</strong> is due. Renew now to keep your subscription active.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            id="btn-subscription-pay-now"
            onClick={() => setShowPayNow(true)}
            disabled={updating}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <CreditCard className="w-3.5 h-3.5" /> Pay Now
          </button>
          <button
            type="button"
            id="btn-subscription-change-plan"
            onClick={() => setShowChangePlan(true)}
            disabled={updating}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 border border-slate-700"
          >
            <Users className="w-3.5 h-3.5" /> Change Plan
          </button>
          <button
            type="button"
            id="btn-subscription-history"
            onClick={() => setShowPayments(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <History className="w-3.5 h-3.5" /> View Payment History
          </button>
          <button
            type="button"
            id="btn-subscription-cancel"
            onClick={() => setShowCancelConfirm(true)}
            disabled={updating || subscription?.status === 'CANCELLED'}
            className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-800/50 disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" /> Cancel Subscription
          </button>
        </div>
      </div>

      {/* Payment History Modal */}
      {showPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white">Payment History</h4>
              </div>
              <button type="button" onClick={() => setShowPayments(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {payments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-xs font-bold text-white">{p.type === 'SETUP_FEE' ? 'Setup Fee' : `Monthly · ${p.billingPeriod}`}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{p.paymentReference}</span>
                      </div>
                      <div className="text-right">
                        <span className={`block text-xs font-bold ${p.status === 'SUCCESSFUL' ? 'text-emerald-400' : p.status === 'FAILED' ? 'text-rose-400' : 'text-amber-300'}`}>
                          {formatRwf(p.amountRwf)}
                        </span>
                        <span className="block text-[10px] text-slate-400">{formatDate(p.paidAt || p.createdAt)} · {p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white">Change Worker Count</h4>
              </div>
              <button type="button" onClick={() => setShowChangePlan(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {pendingChangeMsg ? (
                <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 whitespace-pre-line leading-relaxed">
                  {pendingChangeMsg}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(LOCAL_PLANS).map((plan) => (
                      <button
                        key={plan.planType}
                        type="button"
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          planForWorkerCount(workerCountInput).planType === plan.planType
                            ? 'bg-emerald-500/10 border-emerald-500'
                            : 'bg-[#111c38]/60 border-slate-700/60'
                        }`}
                        onClick={() => setWorkerCountInput(plan.planType === 'SINGLE_WORKER' ? 1 : 3)}
                      >
                        <span className="block font-bold text-white text-xs">{plan.label}</span>
                        <span className="block text-[11px] text-slate-400">{formatRwf(plan.monthlyFee)}/month</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Exact worker count</label>
                    <input
                      type="number"
                      min={1}
                      value={workerCountInput}
                      onChange={(e) => setWorkerCountInput(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Increasing from 1 to more than 1 worker upgrades you to the Multiple Workers plan (confirm required).
                    </p>
                  </div>
                  {error && <p className="text-xs text-rose-400">{error}</p>}
                </>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowChangePlan(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  id="btn-confirm-plan-change"
                  onClick={handleUpdateWorkerCount}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" /> {pendingChangeMsg ? 'Confirm Plan Change' : 'Apply Worker Count'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Ban className="w-5 h-5" />
                <h4 className="font-bold text-white">Cancel Subscription?</h4>
              </div>
              <button type="button" onClick={() => setShowCancelConfirm(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-300">
                Are you sure you want to cancel? You will lose access to Cloud POS, EBM invoices, and unlimited offline POS when the current period ends.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  type="button"
                  id="btn-confirm-cancel-subscription"
                  onClick={handleCancel}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-60"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Now Modal → monthly MTN MoMo payment */}
      {subscription && (
        <MtnMomoPaymentModal
          isOpen={showPayNow}
          onClose={() => setShowPayNow(false)}
          amountRwf={payAmount}
          customerName={currentUser.name}
          customerEmail={currentUser.email}
          customerPhone={currentUser.phone}
          shopName={currentUser.shopName}
          user={currentUser}
          workerCount={subscription.workerCount}
          paymentType="MONTHLY"
          subscriptionId={subscription.id}
          billingPeriod={new Date().toISOString().slice(0, 7)}
          onPaymentSuccess={(result) => {
            setShowPayNow(false);
            setActionMsg('Payment confirmed. Your subscription is active.');
            onUserUpdated?.(result.user);
            load();
          }}
          onNavigateToOwner={() => setShowPayNow(false)}
        />
      )}
    </div>
  );
};