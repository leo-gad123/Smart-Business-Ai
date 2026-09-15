/**
 * SmartStock Rwanda — Payment Provider Abstraction Layer
 *
 * Supports MTN_MOMO today and prepares the architecture for AIRTEL_MONEY.
 * Each provider implements the same interface so the subscription billing
 * engine can charge through any active provider.
 *
 * Credentials are never hard-coded — they come from .env only.
 */

import { requestToPay, getRequestToPayStatus, normalizeMtnMsisdn } from '../mtnMomo';

export type PaymentProviderId = 'MTN_MOMO' | 'AIRTEL_MONEY';

export interface PaymentRequestParams {
  amountRwf: number;
  payerPhone: string;
  externalId: string; // unique external reference (txRef)
  payerMessage?: string;
  payeeNote?: string;
  // Airtel Money may require additional context later, e.g. merchantCode
  meta?: Record<string, unknown>;
}

export interface PaymentRequestResult {
  provider: PaymentProviderId;
  referenceId: string;  // provider-specific idempotency key (e.g. X-Reference-Id)
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  providerTransactionId?: string;
}

export interface PaymentStatusResult {
  provider: PaymentProviderId;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | string;
  financialTransactionId?: string;
  externalId?: string;
  amount?: string;
  currency?: string;
  reason?: { code?: string; message?: string };
}

export interface PaymentProvider {
  id: PaymentProviderId;
  isConfigured: () => boolean;
  collectPayment: (params: PaymentRequestParams) => Promise<PaymentRequestResult>;
  checkStatus: (referenceId: string) => Promise<PaymentStatusResult>;
  normalizePhone: (raw: string) => string;
}

// ---------------------------------------------------------------------------
// MTN MoMo provider — implemented against the official MTN Collection API
// (delegates to server/mtnMomo.ts which reads MTN_MOMO_* env vars)
// ---------------------------------------------------------------------------
const MTN_MOMO_PROVIDER: PaymentProvider = {
  id: 'MTN_MOMO',
  isConfigured: () => Boolean(
    process.env.MTN_MOMO_SUBSCRIPTION_KEY &&
    process.env.MTN_MOMO_API_USER &&
    process.env.MTN_MOMO_API_KEY,
  ),
  collectPayment: async (params) => {
    const result = await requestToPay({
      amountRwf: params.amountRwf,
      payerPhone: params.payerPhone,
      externalId: params.externalId,
      payerMessage: params.payerMessage,
      payeeNote: params.payeeNote,
    });
    return { provider: 'MTN_MOMO', referenceId: result.referenceId, status: result.status };
  },
  checkStatus: async (referenceId) => {
    const status = await getRequestToPayStatus(referenceId);
    return { provider: 'MTN_MOMO', ...status };
  },
  normalizePhone: (raw) => normalizeMtnMsisdn(raw),
};

// ---------------------------------------------------------------------------
// Airtel Money provider — scaffolded, requires Airtel developer API credentials
// (AIR* env vars). The API endpoints are intentionally NOT hard-coded until
// verified against the official Airtel developer documentation.
// ---------------------------------------------------------------------------
const AIRTEL_MONEY_PROVIDER: PaymentProvider = {
  id: 'AIRTEL_MONEY',
  isConfigured: () => Boolean(
    process.env.AIRTEL_CLIENT_ID &&
    process.env.AIRTEL_CLIENT_SECRET &&
    process.env.AIRTEL_BASE_URL &&
    process.env.AIRTEL_SUBSCRIPTION_KEY,
  ),
  collectPayment: async (params) => {
    throw new Error(
      'Airtel Money is not yet enabled. Add AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET, AIRTEL_BASE_URL and AIRTEL_SUBSCRIPTION_KEY to .env to activate it.',
    );
  },
  checkStatus: async () => {
    throw new Error('Airtel Money status check is not yet implemented.');
  },
  normalizePhone: (raw) => `250${(raw || '').replace(/\D/g, '').slice(-9)}`,
};

const PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  MTN_MOMO: MTN_MOMO_PROVIDER,
  AIRTEL_MONEY: AIRTEL_MONEY_PROVIDER,
};

export function getProvider(id: PaymentProviderId): PaymentProvider {
  return PROVIDERS[id];
}

export function getActiveProviders(): PaymentProviderId[] {
  return (Object.keys(PROVIDERS) as PaymentProviderId[]).filter((id) => PROVIDERS[id].isConfigured());
}

export function isProviderConfigured(id: PaymentProviderId): boolean {
  return PROVIDERS[id].isConfigured();
}

export function getProviderConfigStatus(): Record<PaymentProviderId, { configured: boolean }> {
  return {
    MTN_MOMO: { configured: MTN_MOMO_PROVIDER.isConfigured() },
    AIRTEL_MONEY: { configured: AIRTEL_MONEY_PROVIDER.isConfigured() },
  };
}