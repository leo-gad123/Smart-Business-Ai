/**
 * SmartStock Rwanda — Subscription Engine
 * CRUD, activation, plan changes, idempotent billing, and admin aggregation.
 * All amounts are computed server-side via subscriptionPlans.ts.
 */

import { config } from 'dotenv';
import { getItem, getItems, upsertItem } from './mongo';
import { COLLECTIONS } from './models';
import { calculatePlanForWorkerCount, calculateSubscriptionSchedule, billingPeriodKey, workerCountLabel } from './subscriptionPlans';
import { getActiveProviders, isProviderConfigured, PaymentProviderId } from './payments';
import { newUuid } from './uuid';
import { logSubscriptionEvent } from './billingLog';

config();

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'TRIAL'
  | 'PAYMENT_DUE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED';

export interface Subscription {
  id: string;
  businessId: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessName?: string;
  planType: 'SINGLE_WORKER' | 'MULTIPLE_WORKERS';
  workerCount: number;
  setupFee: number;
  monthlyFee: number;
  trialMonths: number;
  subscriptionStartDate: string;
  trialEndDate: string;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  status: SubscriptionStatus;
  paymentProvider: PaymentProviderId;
  paymentReference?: string;
  paymentMethod?: string; // setup fee payment channel
  mtnReferenceId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export async function getSubscriptionByOwner(ownerId: string): Promise<Subscription | null> {
  const all = await getItems(COLLECTIONS.SUBSCRIPTIONS);
  const found = all.find(
    (s: unknown) =>
      (s as Subscription).ownerId === ownerId ||
      (s as Subscription).ownerEmail === ownerId ||
      (s as Subscription).businessId === ownerId,
  );
  return (found as Subscription) || null;
}

export async function getSubscriptionByBusiness(businessId: string): Promise<Subscription | null> {
  const all = await getItems(COLLECTIONS.SUBSCRIPTIONS);
  const found = all.find((s: unknown) => (s as Subscription).businessId === businessId);
  return (found as Subscription) || null;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  return (await getItems(COLLECTIONS.SUBSCRIPTIONS)) as unknown as Subscription[];
}

// ---------------------------------------------------------------------------
// Create / activate a subscription after setup-fee payment
// ---------------------------------------------------------------------------
export async function createAndActivateSubscription(params: {
  businessId: string;
  ownerId: string;
  workerCount: number;
  setupFeePaidRwf?: number; // informational; amount is recomputed server-side
  paymentProvider: PaymentProviderId;
  paymentReference?: string;
  mtnReferenceId?: string;
  setupFeeTransactionId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessName?: string;
}): Promise<Subscription> {
  const plan = calculatePlanForWorkerCount(params.workerCount);

  // Security: the server ALWAYS recomputes the amount. Even if the client
  // sent setupFeePaidRwf, we override with the computed value and reject
  // mismatches in the API layer.
  const schedule = calculateSubscriptionSchedule(new Date());

  const now = new Date().toISOString();
  const subscription: Subscription = {
    id: newUuid('sub'),
    businessId: params.businessId,
    ownerId: params.ownerId,
    ownerName: params.ownerName,
    ownerEmail: params.ownerEmail,
    ownerPhone: params.ownerPhone,
    businessName: params.businessName,
    planType: plan.planType,
    workerCount: params.workerCount,
    setupFee: plan.setupFee,
    monthlyFee: plan.monthlyFee,
    trialMonths: plan.trialMonths,
    subscriptionStartDate: schedule.subscriptionStartDate,
    trialEndDate: schedule.trialEndDate,
    nextPaymentDate: schedule.nextPaymentDate,
    lastPaymentDate: now,
    status: 'TRIAL', // Free first month after setup fee paid
    paymentProvider: params.paymentProvider,
    paymentReference: params.paymentReference,
    mtnReferenceId: params.mtnReferenceId,
    createdAt: now,
    updatedAt: now,
  };

  await upsertItem(COLLECTIONS.SUBSCRIPTIONS, subscription as unknown as Record<string, unknown>);

  // Record the setup-fee payment in subscription payments history.
  await upsertItem(COLLECTIONS.SUBSCRIPTION_PAYMENTS, {
    id: newUuid('pay'),
    subscriptionId: subscription.id,
    businessId: params.businessId,
    ownerId: params.ownerId,
    businessName: params.businessName,
    ownerName: params.ownerName,
    billingPeriod: 'SETUP',
    amountRwf: plan.setupFee,
    type: 'SETUP_FEE',
    status: 'SUCCESSFUL',
    paymentProvider: params.paymentProvider,
    paymentReference: params.paymentReference || '',
    providerReferenceId: params.mtnReferenceId || '',
    providerTransactionId: params.setupFeeTransactionId || '',
    description: 'One-time registration/setup fee',
    createdAt: now,
  } as Record<string, unknown>);

  logSubscriptionEvent(subscription.id, 'CREATED', `Subscription created & activated. Plan: ${plan.planType}. Setup fee: ${plan.setupFee} RWF. Trial: 1 month FREE.`);

  return subscription;
}

// ---------------------------------------------------------------------------
// Worker-count change → possible plan upgrade
// ---------------------------------------------------------------------------
export async function changeWorkerCount(
  subscriptionId: string,
  newWorkerCount: number,
): Promise<{ subscription: Subscription; changed: boolean; oldMonthlyFee: number; newMonthlyFee: number }> {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) throw new Error('Subscription not found.');

  const oldPlan = calculatePlanForWorkerCount(subscription.workerCount);
  const newPlan = calculatePlanForWorkerCount(newWorkerCount);

  const changed = oldPlan.planType !== newPlan.planType;
  const now = new Date().toISOString();

  if (!changed) {
    subscription.workerCount = newWorkerCount;
    subscription.updatedAt = now;
    await upsertItem(COLLECTIONS.SUBSCRIPTIONS, subscription as unknown as Record<string, unknown>);
    return { subscription, changed: false, oldMonthlyFee: oldPlan.monthlyFee, newMonthlyFee: newPlan.monthlyFee };
  }

  // Upgrade: apply new plan going forward. Historical payments are untouched.
  subscription.workerCount = newWorkerCount;
  subscription.planType = newPlan.planType;
  // Keep original setup fee (setup fee is tied to the initial plan, not changed).
  subscription.monthlyFee = newPlan.monthlyFee;
  subscription.updatedAt = now;

  await upsertItem(COLLECTIONS.SUBSCRIPTIONS, subscription as unknown as Record<string, unknown>);

  logSubscriptionEvent(subscriptionId, 'PLAN_CHANGE', `Worker count changed ${oldPlan.planType} -> ${newPlan.planType}. Monthly fee ${oldPlan.monthlyFee} -> ${newPlan.monthlyFee} RWF. No historical refunds.`);

  return { subscription, changed: true, oldMonthlyFee: oldPlan.monthlyFee, newMonthlyFee: newPlan.monthlyFee };
}

export async function getSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
  const doc = await getItem(COLLECTIONS.SUBSCRIPTIONS, subscriptionId);
  return (doc as Subscription) || null;
}

// ---------------------------------------------------------------------------
// Cancel / suspend
// ---------------------------------------------------------------------------
export async function cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription | null> {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) return null;

  subscription.status = 'CANCELLED';
  subscription.updatedAt = new Date().toISOString();

  await upsertItem(COLLECTIONS.SUBSCRIPTIONS, subscription as unknown as Record<string, unknown>);
  logSubscriptionEvent(subscriptionId, 'CANCELLED', `Subscription cancelled.${reason ? ' Reason: ' + reason : ''}`);
  return subscription;
}

export async function updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<Subscription | null> {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) return null;

  subscription.status = status;
  subscription.updatedAt = new Date().toISOString();
  await upsertItem(COLLECTIONS.SUBSCRIPTIONS, subscription as unknown as Record<string, unknown>);
  logSubscriptionEvent(subscriptionId, 'STATUS', `Status changed to ${status}.`);
  return subscription;
}

// ---------------------------------------------------------------------------
// Payment history
// ---------------------------------------------------------------------------
export interface SubscriptionPaymentRecord {
  id: string;
  subscriptionId: string;
  businessId?: string;
  ownerId?: string;
  businessName?: string;
  ownerName?: string;
  billingPeriod: string; // 'SETUP' | '2026-10' | ...
  amountRwf: number;
  type: 'SETUP_FEE' | 'MONTHLY' | 'REFUND' | 'ADJUSTMENT';
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  paymentProvider: PaymentProviderId;
  paymentReference: string;
  providerReferenceId?: string;
  providerTransactionId?: string;
  description?: string;
  createdAt: string;
  paidAt?: string;
}

export async function getPaymentHistory(subscriptionId: string): Promise<SubscriptionPaymentRecord[]> {
  const all = await getItems(COLLECTIONS.SUBSCRIPTION_PAYMENTS);
  return (all as unknown as SubscriptionPaymentRecord[])
    .filter((p) => p.subscriptionId === subscriptionId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

/**
 * Confirm a successful (verified) subscription payment — idempotent.
 * Adds/updates the payment record and rolls the subscription forward.
 */
export async function confirmSubscriptionPayment(params: {
  subscriptionId: string;
  billingPeriod: string;
  amountRwf: number;
  paymentProvider: PaymentProviderId;
  paymentReference: string;
  providerTransactionId?: string;
  paidAt?: string;
}): Promise<{ subscription: Subscription; payment: SubscriptionPaymentRecord }> {
  const subscription = await getSubscriptionById(params.subscriptionId);
  if (!subscription) throw new Error('Subscription not found.');

  const now = params.paidAt || new Date().toISOString();

  // Idempotency: reuse existing record for (subscriptionId, billingPeriod)
  const existing = await getItems(COLLECTIONS.SUBSCRIPTION_PAYMENTS) as unknown as SubscriptionPaymentRecord[];
  let record = existing.find((p) => p.subscriptionId === params.subscriptionId && p.billingPeriod === params.billingPeriod);

  if (!record) {
    record = {
      id: newUuid('pay'),
      subscriptionId: params.subscriptionId,
      businessId: subscription.businessId,
      ownerId: subscription.ownerId,
      businessName: subscription.businessName,
      ownerName: subscription.ownerName,
      billingPeriod: params.billingPeriod,
      amountRwf: params.amountRwf,
      type: params.billingPeriod === 'SETUP' ? 'SETUP_FEE' : 'MONTHLY',
      status: 'SUCCESSFUL',
      paymentProvider: params.paymentProvider,
      paymentReference: params.paymentReference,
      providerTransactionId: params.providerTransactionId || '',
      description: params.billingPeriod === 'SETUP' ? 'One-time registration/setup fee' : `Monthly subscription (${workerCountLabel(subscription.workerCount)})`,
      createdAt: now,
      paidAt: now,
    };
  } else {
    record.status = 'SUCCESSFUL';
    record.amountRwf = params.amountRwf;
    record.paymentProvider = params.paymentProvider;
    record.paymentReference = params.paymentReference;
    record.providerTransactionId = params.providerTransactionId || record.providerTransactionId;
    record.paidAt = now;
  }

  await upsertItem(COLLECTIONS.SUBSCRIPTION_PAYMENTS, record as unknown as Record<string, unknown>);

  // If this (subscriptionId, billingPeriod) was already confirmed, do not roll
  // the subscription forward a second time (idempotency).
  if (existing.find((p) => p.subscriptionId === params.subscriptionId && p.billingPeriod === params.billingPeriod)?.id) {
    return { subscription, payment: record };
  }

  // Roll subscription forward
  if (params.billingPeriod === 'SETUP') {
    subscription.status = 'TRIAL';
  } else {
    subscription.status = 'ACTIVE';
  }
  subscription.lastPaymentDate = now;
  if (params.billingPeriod !== 'SETUP') {
    const rolled = new Date(subscription.nextPaymentDate);
    rolled.setMonth(rolled.getMonth() + 1);
    subscription.nextPaymentDate = rolled.toISOString();
  }
  subscription.updatedAt = now;
  await upsertItem(COLLECTIONS.SUBSCRIPTIONS, subscription as unknown as Record<string, unknown>);

  logSubscriptionEvent(
    subscription.id,
    params.billingPeriod === 'SETUP' ? 'SETUP_PAID' : 'PAYMENT_CONFIRMED',
    `Payment of ${params.amountRwf} RWF (${params.billingPeriod}) confirmed via ${params.paymentProvider}.`,
  );

  return { subscription, payment: record };
}

// ---------------------------------------------------------------------------
// Daily billing engine — idempotent by (subscriptionId, billingPeriod)
// ---------------------------------------------------------------------------
export async function runBillingCycle(now: Date = new Date()): Promise<{ created: number; due: number; skipped: number }> {
  const subscriptions = await getSubscriptions();
  let created = 0;
  let due = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    if (sub.status !== 'ACTIVE' && sub.status !== 'TRIAL') {
      skipped += 1;
      continue;
    }

    if (sub.status === 'TRIAL') {
      // Check if trial is over → move to ACTIVE (still no charge until nextPaymentDate)
      const trialEnd = new Date(sub.trialEndDate);
      if (now >= trialEnd) {
        sub.status = 'ACTIVE';
        sub.updatedAt = now.toISOString();
        await upsertItem(COLLECTIONS.SUBSCRIPTIONS, sub as unknown as Record<string, unknown>);
        logSubscriptionEvent(sub.id, 'TRIAL_END', 'Free trial ended. Subscription moved to ACTIVE.');
      }
    }

    const trialEnd = new Date(sub.trialEndDate);
    const nextPay = new Date(sub.nextPaymentDate);

    if (now < trialEnd) {
      // Still in free trial — no charge
      skipped += 1;
      continue;
    }

    if (now < nextPay) {
      // Not yet due
      skipped += 1;
      continue;
    }

    // Determine billing period for THIS cycle
    const period = billingPeriodKey(nextPay);

    // Idempotency: skip if this (subscriptionId, billingPeriod) already has a success record
    const history = await getItems(COLLECTIONS.SUBSCRIPTION_PAYMENTS) as unknown as SubscriptionPaymentRecord[];
    const alreadyBilled = history.find(
      (p) => p.subscriptionId === sub.id && p.billingPeriod === period && p.status === 'SUCCESSFUL',
    );
    if (alreadyBilled) {
      // Roll nextPaymentDate forward to prevent infinite re-triggers
      const rolled = new Date(sub.nextPaymentDate);
      rolled.setMonth(rolled.getMonth() + 1);
      sub.nextPaymentDate = rolled.toISOString();
      sub.updatedAt = now.toISOString();
      await upsertItem(COLLECTIONS.SUBSCRIPTIONS, sub as unknown as Record<string, unknown>);
      skipped += 1;
      continue;
    }

    created += 1;
    logSubscriptionEvent(sub.id, 'BILLING', `Billing cycle ${period}: charge created for ${sub.monthlyFee} RWF (${workerCountLabel(sub.workerCount)}).`);
    sub.status = 'PAYMENT_DUE';
    sub.updatedAt = now.toISOString();
    await upsertItem(COLLECTIONS.SUBSCRIPTIONS, sub as unknown as Record<string, unknown>);

    // Attempt payment through an active provider
    const providerId = sub.paymentProvider && isProviderConfigured(sub.paymentProvider)
      ? sub.paymentProvider
      : getActiveProviders()[0];

    // We create a PENDING record first; the provider flow updates it later.
    await upsertItem(COLLECTIONS.SUBSCRIPTION_PAYMENTS, {
      id: newUuid('pay'),
      subscriptionId: sub.id,
      businessId: sub.businessId,
      ownerId: sub.ownerId,
      billingPeriod: period,
      amountRwf: sub.monthlyFee,
      type: 'MONTHLY',
      status: 'PENDING',
      paymentProvider: providerId || sub.paymentProvider,
      paymentReference: `SRW-${period}-${sub.id.slice(-6)}`,
      description: `Monthly subscription (${workerCountLabel(sub.workerCount)})`,
      createdAt: now.toISOString(),
    } as Record<string, unknown>);
  }

  return { created, due: 0, skipped };
}

// ---------------------------------------------------------------------------
// Admin aggregation
// ---------------------------------------------------------------------------
export async function getSubscriptionOverview(): Promise<Record<string, unknown>> {
  const subs = await getSubscriptions();
  const payments = await getItems(COLLECTIONS.SUBSCRIPTION_PAYMENTS) as unknown as SubscriptionPaymentRecord[];

  const statusCount = (s: SubscriptionStatus) => subs.filter((x) => x.status === s).length;
  const planCount = (p: string) => subs.filter((x) => x.planType === p).length;

  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  const monthlyRecurringRevenue = subs
    .filter((s) => ['ACTIVE', 'TRIAL', 'PAYMENT_DUE'].includes(s.status))
    .reduce((sum, s) => sum + s.monthlyFee, 0);

  const setupFeeRevenue = payments
    .filter((p) => p.type === 'SETUP_FEE' && p.status === 'SUCCESSFUL')
    .reduce((sum, p) => sum + p.amountRwf, 0);

  const last30Days = Date.now() - oneMonthMs;
  const last30Revenue = payments
    .filter((p) => p.status === 'SUCCESSFUL' && new Date(p.paidAt || p.createdAt).getTime() >= last30Days)
    .reduce((sum, p) => sum + p.amountRwf, 0);

  return {
    totalBusinesses: subs.length,
    activeSubscriptions: statusCount('ACTIVE'),
    trialSubscriptions: statusCount('TRIAL'),
    expiredSubscriptions: statusCount('EXPIRED'),
    paymentDueSubscriptions: statusCount('PAYMENT_DUE'),
    pendingSubscriptions: statusCount('PENDING'),
    cancelledSubscriptions: statusCount('CANCELLED'),
    suspendedSubscriptions: statusCount('SUSPENDED'),
    monthlyRecurringRevenue,
    setupFeeRevenue,
    last30DaysRevenue: last30Revenue,
    singleWorkerPlanCount: planCount('SINGLE_WORKER'),
    multipleWorkerPlanCount: planCount('MULTIPLE_WORKERS'),
  };
}