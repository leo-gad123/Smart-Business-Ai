import { Subscription, SubscriptionPayment, SubscriptionPlan, SubscriptionQuote, SubscriptionPlanType } from '../types';

/**
 * Client-side pricing mirror for REFLECTION ONLY.
 * The server ALWAYS recomputes amounts before accepting payment —
 * this local copy is used purely to render the UI instantly.
 */
export const LOCAL_PLANS: Record<SubscriptionPlanType, SubscriptionPlan> = {
  SINGLE_WORKER: {
    planType: 'SINGLE_WORKER',
    setupFee: 15000,
    monthlyFee: 4000,
    trialMonths: 1,
    maxWorkers: 1,
    label: 'Single Worker',
    description: 'For businesses with exactly 1 worker.',
  },
  MULTIPLE_WORKERS: {
    planType: 'MULTIPLE_WORKERS',
    setupFee: 30000,
    monthlyFee: 8000,
    trialMonths: 1,
    maxWorkers: null,
    label: 'Multiple Workers',
    description: 'For businesses with 2+ workers.',
  },
};

export function planForWorkerCount(workerCount: number): SubscriptionPlan {
  return workerCount <= 1 ? LOCAL_PLANS.SINGLE_WORKER : LOCAL_PLANS.MULTIPLE_WORKERS;
}

export function computeSetupFee(workerCount: number): number {
  return planForWorkerCount(workerCount).setupFee;
}

export function computeMonthlyFee(workerCount: number): number {
  return planForWorkerCount(workerCount).monthlyFee;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString()} RWF`;
}

export function formatDate(iso: string | Date, locale = 'en-GB'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Server API calls
// ---------------------------------------------------------------------------

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string; message?: string }).error || (json as { message?: string }).message || `Request failed (${res.status})`);
  }
  return json as T;
}

export async function fetchPlans(): Promise<{ workerCountOptions: { label: string; value: number }[]; plans: Record<SubscriptionPlanType, SubscriptionPlan> }> {
  return req('/api/subscriptions/plans');
}

export async function fetchQuote(workerCount: number): Promise<SubscriptionQuote> {
  const json = await req<{ ok: boolean; setupFee: number; monthlyFee: number; trialMonths: number; trialEndDate: string; nextPaymentDate: string }>(
    `/api/subscriptions/quote?workerCount=${workerCount}`,
  );
  return {
    workerCount,
    setupFee: json.setupFee,
    monthlyFee: json.monthlyFee,
    trialMonths: json.trialMonths,
    trialEndDate: json.trialEndDate,
    nextPaymentDate: json.nextPaymentDate,
  };
}

export async function activateSubscription(params: {
  businessId: string;
  ownerId: string;
  workerCount: number;
  paymentProvider: 'MTN_MOMO' | 'AIRTEL_MONEY';
  paymentReference?: string;
  mtnReferenceId?: string;
  setupFeeTransactionId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessName?: string;
}): Promise<Subscription> {
  const json = await req<{ ok: boolean; subscription: Subscription; alreadyActive?: boolean }>('/api/subscriptions/activate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return json.subscription;
}

export async function fetchMySubscription(params: { ownerId?: string; businessId?: string; email?: string }): Promise<Subscription | null> {
  const qs = new URLSearchParams();
  if (params.ownerId) qs.set('ownerId', params.ownerId);
  if (params.businessId) qs.set('businessId', params.businessId);
  if (params.email) qs.set('email', params.email);
  const json = await req<{ ok: boolean; subscription: Subscription | null }>(`/api/subscriptions/mine?${qs.toString()}`);
  return json.subscription;
}

export async function fetchAllSubscriptions(): Promise<Subscription[]> {
  const json = await req<{ ok: boolean; subscriptions: Subscription[] }>('/api/subscriptions');
  return json.subscriptions;
}

export async function updateWorkerCount(subscriptionId: string, workerCount: number): Promise<{ subscription: Subscription; changed: boolean; oldMonthlyFee: number; newMonthlyFee: number }> {
  return req(`/api/subscriptions/${subscriptionId}/workers`, {
    method: 'POST',
    body: JSON.stringify({ workerCount }),
  });
}

export async function cancelSubscriptionApi(subscriptionId: string, reason?: string): Promise<Subscription> {
  const json = await req<{ ok: boolean; subscription: Subscription }>(`/api/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return json.subscription;
}

export async function fetchPaymentHistory(subscriptionId: string): Promise<SubscriptionPayment[]> {
  const json = await req<{ ok: boolean; payments: SubscriptionPayment[] }>(`/api/subscriptions/${subscriptionId}/payments`);
  return json.payments;
}

export interface SubscriptionOverviewStats {
  totalBusinesses: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  paymentDueSubscriptions: number;
  pendingSubscriptions: number;
  cancelledSubscriptions: number;
  suspendedSubscriptions: number;
  monthlyRecurringRevenue: number;
  setupFeeRevenue: number;
  last30DaysRevenue: number;
  singleWorkerPlanCount: number;
  multipleWorkerPlanCount: number;
}

export async function fetchSubscriptionOverview(): Promise<SubscriptionOverviewStats> {
  const json = await req<{ ok: boolean; stats: SubscriptionOverviewStats }>('/api/subscriptions/overview');
  return json.stats;
}

export async function runBillingCycleApi(): Promise<{ created: number; due: number; skipped: number }> {
  const json = await req<{ ok: boolean; result: { created: number; due: number; skipped: number } }>('/api/billing/run', { method: 'POST' });
  return json.result;
}

export async function confirmSubscriptionPayment(params: {
  subscriptionId: string;
  billingPeriod: string;
  amountRwf: number;
  paymentProvider: 'MTN_MOMO' | 'AIRTEL_MONEY';
  paymentReference: string;
  providerTransactionId?: string;
  paidAt?: string;
}): Promise<unknown> {
  return req('/api/subscriptions/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}