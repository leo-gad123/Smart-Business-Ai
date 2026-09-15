import { User, OnboardingRegistration } from '../types';
import { db } from './db';
import { activateSubscription, confirmSubscriptionPayment } from './subscriptionApi';

export interface PaymentInitiateParams {
  amountRwf: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  txRef: string;
  user?: User;
  shopName?: string;
  redirectUrl?: string;
}

export interface MtnMomoGatewayStatus {
  env: string;
  configured: boolean;
  currency: string;
  targetEnvironment?: string;
  apiUserIdMasked?: string;
  subscriptionKeyMasked?: string;
}

let cachedGatewayStatus: MtnMomoGatewayStatus = {
  env: 'sandbox',
  configured: false,
  currency: 'RWF',
};

/**
 * Client-side config snapshot (does not contain secrets).
 */
export function getMtnMomoConfig(): { mode: string; currency: string } {
  return {
    mode: cachedGatewayStatus.env,
    currency: cachedGatewayStatus.currency,
  };
}

export async function refreshMtnMomoConfig(): Promise<MtnMomoGatewayStatus> {
  try {
    const res = await fetch('/api/payments/config');
    if (!res.ok) return cachedGatewayStatus;
    cachedGatewayStatus = (await res.json()) as MtnMomoGatewayStatus;
  } catch {
    // offline / server not running — keep cached status
  }
  return cachedGatewayStatus;
}

/**
 * Generates a unique transaction reference formatted for Rwandan merchants.
 */
export function generateTxRef(prefix = 'SMARTSTOCK-RW'): string {
  const timestamp = Date.now();
  const randomSalt = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${timestamp}-${randomSalt}`;
}

/**
 * Initiate a RequestToPay via MTN MoMo (server-side). Server calls the
 * MTN Collection API which pushes a USSD PIN prompt to the payer's phone.
 */
export async function initiatePayment(params: PaymentInitiateParams): Promise<{ referenceId: string }> {
  const res = await fetch('/api/payments/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amountRwf: params.amountRwf,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      txRef: params.txRef,
      userId: params.user?.id,
      shopName: params.shopName,
    }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || 'Failed to initiate MTN MoMo payment.');
  }
  const json = (await res.json()) as { referenceId: string };
  return { referenceId: json.referenceId };
}

export type MtnPaymentStatusResult = {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | string;
  financialTransactionId?: string;
  externalId?: string;
  amount?: string;
  currency?: string;
};

/**
 * Poll the RequestToPay status from our server (which queries MTN MoMo API).
 */
export async function fetchPaymentStatus(referenceId: string): Promise<MtnPaymentStatusResult> {
  const res = await fetch(`/api/payments/status?referenceId=${encodeURIComponent(referenceId)}`);
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || 'Failed to verify payment status.');
  }
  const json = (await res.json()) as { status: MtnPaymentStatusResult };
  return json.status;
}

/**
 * Process a successful MTN payment: activate subscriber account,
 * create/roll the subscription server-side, and clear demo mode restrictions.
 */
export function processSuccessfulPayment(params: {
  referenceId: string;
  financialTransactionId?: string;
  user?: User;
  shopName?: string;
  amountRwf: number;
  workerCount?: number;
  paymentType?: 'SETUP_FEE' | 'MONTHLY';
  subscriptionId?: string;
  billingPeriod?: string;
}): { success: boolean; user: User; onboarding?: OnboardingRegistration } {
  const {
    referenceId,
    financialTransactionId,
    user,
    shopName,
    amountRwf,
    workerCount = 1,
    paymentType = 'SETUP_FEE',
    subscriptionId,
    billingPeriod,
  } = params;

  const result = db.activateSubscriberAccount({
    userId: user?.id,
    txRef: referenceId,
    transactionId: financialTransactionId || referenceId,
    amountRwf,
    paymentMethod: 'MTN_MOMO',
    customerName: user?.name,
    customerPhone: user?.phone,
    customerEmail: user?.email,
    shopName: shopName || user?.shopName,
  });

  // Server-authoritative subscription handling (fire-and-forget; local db
  // already updated so the app works even if the server is unreachable).
  try {
    if (paymentType === 'SETUP_FEE') {
      activateSubscription({
        businessId: shopName || user?.shopName || 'smartstock-business',
        ownerId: user?.id || 'local-owner',
        workerCount,
        paymentProvider: 'MTN_MOMO',
        paymentReference: referenceId,
        mtnReferenceId: referenceId,
        setupFeeTransactionId: financialTransactionId,
        ownerName: user?.name,
        ownerEmail: user?.email,
        ownerPhone: user?.phone,
        businessName: shopName || user?.shopName,
      }).catch((err) => {
        console.warn('[SmartStock] Server subscription activation unavailable:', err.message);
      });
    } else if (subscriptionId && billingPeriod) {
      confirmSubscriptionPayment({
        subscriptionId,
        billingPeriod,
        amountRwf,
        paymentProvider: 'MTN_MOMO',
        paymentReference: referenceId,
        providerTransactionId: financialTransactionId,
      }).catch((err) => {
        console.warn('[SmartStock] Server payment confirm unavailable:', err.message);
      });
    }
  } catch (err) {
    console.warn('[SmartStock] Subscription server sync failed:', (err as Error).message);
  }

  return {
    success: true,
    user: result.user,
    onboarding: result.onboarding,
  };
}
