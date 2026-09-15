import crypto from 'crypto';
import { config } from 'dotenv';

config();

// MTN MoMo (Collection - Mobile Money API) for Rwanda RWF
export const MTN_MOMO_ENV: 'sandbox' | 'live' = process.env.MTN_MOMO_ENV === 'live' ? 'live' : 'sandbox';

export const MTN_MOMO_BASE_URL =
  process.env.MTN_MOMO_BASE_URL ||
  (MTN_MOMO_ENV === 'live'
    ? 'https://proxy.momoapi.mtn.com'
    : 'https://sandbox.momodeveloper.mtn.com');

export const MTN_MOMO_CURRENCY = process.env.MTN_MOMO_CURRENCY || 'RWF';
export const MTN_MOMO_TARGET_ENV = process.env.MTN_MOMO_TARGET_ENV || (MTN_MOMO_ENV === 'live' ? 'mtnrwanda' : 'sandbox');

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export function isMtnMomoConfigured(): boolean {
  return Boolean(
    process.env.MTN_MOMO_SUBSCRIPTION_KEY &&
    process.env.MTN_MOMO_API_USER &&
    process.env.MTN_MOMO_API_KEY
  );
}

export function mtnConfigMasked(): Record<string, string> {
  const mask = (v?: string, n = 6) =>
    v ? `${v.slice(0, n)}...${v.slice(-4)}` : '';
  return {
    env: MTN_MOMO_ENV,
    currency: MTN_MOMO_CURRENCY,
    targetEnvironment: MTN_MOMO_TARGET_ENV,
    apiUserId: process.env.MTN_MOMO_API_USER || '',
    apiUserIdMasked: mask(process.env.MTN_MOMO_API_USER),
    subscriptionKeyMasked: mask(process.env.MTN_MOMO_SUBSCRIPTION_KEY),
  };
}

/**
 * Generate a UUID v4 used as X-Reference-Id (idempotency key) for each
 * RequestToPay operation and for polling its status.
 */
export function newReferenceId(): string {
  return crypto.randomUUID();
}

/**
 * Normalize a Rwandan phone number into international MSISDN format
 * required by the MTN MoMo API (e.g. 2507ххххххх).
 */
export function normalizeMtnMsisdn(raw: string): string {
  let p = (raw || '').replace(/[^\d]/g, '');
  if (p.startsWith('250')) p = p.slice(3);
  if (p.startsWith('0')) p = p.slice(1);
  return `250${p.slice(0, 9)}`;
}

async function momoRequest<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const url = `${MTN_MOMO_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Target-Environment': MTN_MOMO_TARGET_ENV,
      'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY || '',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const detail = (json as { message?: string; error?: string }).message
      || (json as { error?: string }).error
      || `MTN MoMo request failed with status ${res.status}`;
    throw new Error(detail);
  }
  return json as unknown as T;
}

/**
 * OAuth2 access token (client_credentials) for the Collection product.
 * Token is cached and refreshed before expiry.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }
  if (!isMtnMomoConfigured()) {
    throw new Error('MTN MoMo is not configured. Set MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER and MTN_MOMO_API_KEY in .env');
  }
  const basic = Buffer.from(
    `${process.env.MTN_MOMO_API_USER || ''}:${process.env.MTN_MOMO_API_KEY || ''}`
  ).toString('base64');
  const res = await fetch(`${MTN_MOMO_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${basic}`,
      'X-Reference-Id': process.env.MTN_MOMO_API_USER || '',
      'X-Target-Environment': MTN_MOMO_TARGET_ENV,
      'Ocp-Apim-Subscription-Key': process.env.MTN_MOMO_SUBSCRIPTION_KEY || '',
    },
    body: JSON.stringify({ grant_type: 'client_credentials' }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MTN MoMo token request failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: string | number };
  const token = json.access_token;
  if (!token) {
    throw new Error('MTN MoMo token request returned no access_token.');
  }
  const expiresIn = Number(json.expires_in) || 3600;
  cachedToken = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

export interface MtnRequestToPayParams {
  amountRwf: number;
  payerPhone: string;
  externalId: string;
  payerMessage?: string;
  payeeNote?: string;
}

export interface MtnRequestToPayResult {
  referenceId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  financialTransactionId?: string;
  amount: string;
  currency: string;
}

/**
 * Issue a RequestToPay push payment request to a customer's MTN Mobile Money
 * number. The customer receives a USSD PIN prompt to approve the charge.
 */
export async function requestToPay(params: MtnRequestToPayParams): Promise<MtnRequestToPayResult> {
  const token = await getAccessToken();
  const referenceId = newReferenceId();
  await momoRequest(
    '/collection/v1_0/requesttopay',
    {
      method: 'POST',
      headers: { 'X-Reference-Id': referenceId },
      body: JSON.stringify({
        amount: String(Math.round(params.amountRwf)),
        currency: MTN_MOMO_CURRENCY,
        externalId: params.externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: normalizeMtnMsisdn(params.payerPhone),
        },
        payerMessage: params.payerMessage || 'SmartStock Rwanda subscription payment',
        payeeNote: params.payeeNote || 'SmartStock Rwanda - Merchant Account Activation',
      }),
    },
    token
  );
  return {
    referenceId,
    status: 'PENDING',
    amount: String(Math.round(params.amountRwf)),
    currency: MTN_MOMO_CURRENCY,
  };
}

export interface MtnPaymentStatus {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | string;
  financialTransactionId?: string;
  externalId?: string;
  amount?: string;
  currency?: string;
  reason?: { code?: string; message?: string };
  payer?: { partyIdType?: string; partyId?: string };
}

/**
 * Poll the status of a RequestToPay transaction. Allowed statuses:
 * PENDING -> user has not approved yet; SUCCESSFUL -> payment completed;
 * FAILED -> declined or expired; TIMEOUT.
 */
export async function getRequestToPayStatus(referenceId: string): Promise<MtnPaymentStatus> {
  const token = await getAccessToken();
  return momoRequest<MtnPaymentStatus>(
    `/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`,
    { method: 'GET' },
    token
  );
}