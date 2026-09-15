/**
 * SmartStock Rwanda — Server-side Subscription Plan & Pricing Logic
 * All pricing MUST be computed here. The frontend is never trusted.
 */

export type PlanType = 'SINGLE_WORKER' | 'MULTIPLE_WORKERS';

export interface PlanPricing {
  planType: PlanType;
  setupFee: number;       // RWF one-time
  monthlyFee: number;     // RWF/month after trial
  trialMonths: number;    // always 1
  maxWorkers: number | null; // null = unlimited
  label: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Pricing constants — edit these to change pricing globally
// ---------------------------------------------------------------------------
const PLAN_SINGLE_WORKER: PlanPricing = {
  planType: 'SINGLE_WORKER',
  setupFee: 15_000,
  monthlyFee: 4_000,
  trialMonths: 1,
  maxWorkers: 1,
  label: 'Single Worker',
  description: 'For businesses with exactly 1 worker.',
};

const PLAN_MULTIPLE_WORKERS: PlanPricing = {
  planType: 'MULTIPLE_WORKERS',
  setupFee: 30_000,
  monthlyFee: 8_000,
  trialMonths: 1,
  maxWorkers: null,
  label: 'Multiple Workers',
  description: 'For businesses with 2+ workers.',
};

export const PLANS: Record<PlanType, PlanPricing> = {
  SINGLE_WORKER: PLAN_SINGLE_WORKER,
  MULTIPLE_WORKERS: PLAN_MULTIPLE_WORKERS,
};

// ---------------------------------------------------------------------------
// Worker-count selection options exposed to the UI
// ---------------------------------------------------------------------------
export interface WorkerCountOption {
  label: string;
  value: number; // exact worker count used for pricing; 0 = placeholder
  minWorkers: number;
  maxWorkers: number | null;
}

export const WORKER_COUNT_OPTIONS: WorkerCountOption[] = [
  { label: '1 Worker',     value: 1,  minWorkers: 1, maxWorkers: 1 },
  { label: '2 – 5 Workers', value: 3, minWorkers: 2, maxWorkers: 5 },
  { label: '6 – 10 Workers', value: 8, minWorkers: 6, maxWorkers: 10 },
  { label: '11+ Workers',  value: 15, minWorkers: 11, maxWorkers: null },
];

// ---------------------------------------------------------------------------
// Core pricing function — authoritative, server-side only
// ---------------------------------------------------------------------------
export function calculatePlanForWorkerCount(workerCount: number): PlanPricing {
  if (workerCount <= 1) {
    return { ...PLAN_SINGLE_WORKER };
  }
  return { ...PLAN_MULTIPLE_WORKERS };
}

/**
 * Calculate subscription schedule dates.
 * Returns dates in ISO-8601 full format.
 */
export function calculateSubscriptionSchedule(setupPaidAt: Date = new Date()): {
  subscriptionStartDate: string;
  trialEndDate: string;
  nextPaymentDate: string;
} {
  const startDate = new Date(setupPaidAt);
  const trialEnd = new Date(startDate);
  trialEnd.setMonth(trialEnd.getMonth() + 1);

  // Next payment is due at end of trial (first paid month)
  const nextPayment = new Date(trialEnd);

  return {
    subscriptionStartDate: startDate.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    nextPaymentDate: nextPayment.toISOString(),
  };
}

/**
 * Generate a unique billing period key for idempotent charges.
 * Format: YYYY-MM (e.g. "2026-10")
 */
export function billingPeriodKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Given a subscription, determine if it needs a billing charge today.
 */
export function needsBillingCharge(subscription: {
  status: string;
  trialEndDate: string;
  nextPaymentDate: string;
}, now: Date = new Date()): boolean {
  if (subscription.status !== 'ACTIVE') return false;
  const trialEnd = new Date(subscription.trialEndDate);
  if (now < trialEnd) return false; // still in trial
  const nextPay = new Date(subscription.nextPaymentDate);
  return now >= nextPay;
}

/**
 * Map a worker count to the worker-count option label for display.
 */
export function workerCountLabel(workerCount: number): string {
  if (workerCount <= 1) return '1 Worker';
  if (workerCount <= 5) return `${workerCount} Workers (2–5 Plan)`;
  if (workerCount <= 10) return `${workerCount} Workers (6–10 Plan)`;
  return `${workerCount} Workers (11+ Plan)`;
}

/**
 * Check if upgrading worker count triggers a plan change.
 */
export function wouldTriggerPlanChange(currentWorkerCount: number, newWorkerCount: number): boolean {
  const currentPlan = calculatePlanForWorkerCount(currentWorkerCount);
  const newPlan = calculatePlanForWorkerCount(newWorkerCount);
  return currentPlan.planType !== newPlan.planType;
}
