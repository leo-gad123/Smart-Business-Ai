import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectMongo, getItems, replaceItems, clearCollection, listCollections, getItem, upsertItem, deleteItem, ensureSubscriptionIndexes } from './mongo';
import { seedDatabase } from './seed';
import { COLLECTIONS, ALL_COLLECTION_NAMES } from './models';
import {
  isMtnMomoConfigured,
  mtnConfigMasked,
  requestToPay,
  getRequestToPayStatus,
  MTN_MOMO_ENV,
  MTN_MOMO_CURRENCY,
  MTN_MOMO_TARGET_ENV,
} from './mtnMomo';
import { sendOTP, verifyOTP } from './email';
import {
  createSuperAdminSession,
  verifySuperAdminSession,
  destroySuperAdminSession,
  extractBearerToken,
} from './auth';
import {
  createAndActivateSubscription,
  getSubscriptionByOwner,
  getSubscriptionByBusiness,
  getSubscriptionById,
  getSubscriptions,
  changeWorkerCount,
  cancelSubscription,
  getPaymentHistory,
  confirmSubscriptionPayment,
  runBillingCycle,
  getSubscriptionOverview,
} from './subscriptions';
import { PLANS, calculatePlanForWorkerCount, calculateSubscriptionSchedule, WORKER_COUNT_OPTIONS } from './subscriptionPlans';
import { getActiveProviders, getProviderConfigStatus, PaymentProviderId } from './payments';
import { startBillingScheduler } from './billingJob';

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const validName = (name: string): boolean => {
  return ALL_COLLECTION_NAMES.includes(name as (typeof COLLECTIONS)[keyof typeof COLLECTIONS]);
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', db: mongooseState(), collections: ALL_COLLECTION_NAMES });
});

app.get('/api/collections', async (_req: Request, res: Response) => {
  try {
    const names = await listCollections();
    res.json({ collections: names });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/collections/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  if (!validName(name)) {
    return res.status(400).json({ error: `Unknown collection: ${name}` });
  }
  try {
    const items = await getItems(name);
    res.json({ data: items, collection: name });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.put('/api/collections/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  if (!validName(name)) {
    return res.status(400).json({ error: `Unknown collection: ${name}` });
  }
  const { data } = req.body || {};
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Expected body: { "data": [...] }' });
  }
  try {
    await replaceItems(name, data);
    res.json({ ok: true, collection: name, count: data.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/collections/:name', async (req: Request, res: Response) => {
  const name = req.params.name;
  if (!validName(name)) {
    return res.status(400).json({ error: `Unknown collection: ${name}` });
  }
  try {
    await clearCollection(name);
    res.json({ ok: true, collection: name });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Document-level CRUD: /api/collections/:name/:id
// ---------------------------------------------------------------------------
app.get('/api/collections/:name/:id', async (req: Request, res: Response) => {
  const name = req.params.name;
  const id = req.params.id;
  if (!validName(name)) {
    return res.status(400).json({ error: `Unknown collection: ${name}` });
  }
  try {
    const item = await getItem(name, id);
    if (!item) {
      return res.status(404).json({ error: `Document ${id} not found in ${name}` });
    }
    res.json({ data: item, collection: name });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/collections/:name/:id', async (req: Request, res: Response) => {
  const name = req.params.name;
  const id = req.params.id;
  if (!validName(name)) {
    return res.status(400).json({ error: `Unknown collection: ${name}` });
  }
  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Expected body: { "data": { ... } }' });
  }
  try {
    const payload = { ...data, id };
    await upsertItem(name, payload);
    res.json({ ok: true, collection: name, id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.delete('/api/collections/:name/:id', async (req: Request, res: Response) => {
  const name = req.params.name;
  const id = req.params.id;
  if (!validName(name)) {
    return res.status(400).json({ error: `Unknown collection: ${name}` });
  }
  try {
    const deleted = await deleteItem(name, id);
    res.json({ ok: true, deleted, collection: name, id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Full state export for one-shot hydration of a fresh device
app.get('/api/state', async (_req: Request, res: Response) => {
  try {
    const state: Record<string, unknown[]> = {};
    for (const name of ALL_COLLECTION_NAMES) {
      state[name] = await getItems(name);
    }
    res.json({ data: state });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Full state import (replaces every collection)
app.put('/api/state', async (req: Request, res: Response) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Expected body: { "data": { collection: [...] } }' });
  }
  try {
    const results: Record<string, number> = {};
    for (const name of ALL_COLLECTION_NAMES) {
      const items = Array.isArray(data[name]) ? data[name] : [];
      await replaceItems(name, items);
      results[name] = items.length;
    }
    res.json({ ok: true, counts: results });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    const { force = false, includeDefaultProducts = true } = req.body || {};
    const results = await seedDatabase({ force, includeDefaultProducts });
    res.json({ ok: true, seeded: results });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// MTN MoMo Payment Gateway (Rwanda Mobile Money RWF)
// ---------------------------------------------------------------------------
app.get('/api/payments/config', (_req: Request, res: Response) => {
  const configured = isMtnMomoConfigured();
  res.json({
    env: MTN_MOMO_ENV,
    configured,
    currency: MTN_MOMO_CURRENCY,
    targetEnvironment: MTN_MOMO_TARGET_ENV,
    ...mtnConfigMasked(),
  });
});

app.post('/api/payments/initiate', async (req: Request, res: Response) => {
  try {
    if (!isMtnMomoConfigured()) {
      return res.status(500).json({ error: 'MTN MoMo is not configured. Set MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER and MTN_MOMO_API_KEY in .env' });
    }
    const {
      amountRwf,
      customerName,
      customerEmail,
      customerPhone,
      txRef,
      redirectUrl,
      userId,
      shopName,
    } = req.body || {};

    if (!txRef) {
      return res.status(400).json({ error: 'txRef is required' });
    }
    if (!customerPhone) {
      return res.status(400).json({ error: 'customerPhone is required' });
    }

    const result = await requestToPay({
      amountRwf: Number(amountRwf) || 30000,
      payerPhone: customerPhone,
      externalId: txRef,
      payerMessage: `SmartStock Rwanda - ${amountRwf || 30000} RWF subscription`,
      payeeNote: `Activation:${userId || 'owner'}${shopName ? ':' + shopName : ''}`,
    });
    res.json({ ok: true, referenceId: result.referenceId, status: result.status });
  } catch (err) {
    console.error('[SmartStock Payments] Initiate failed:', err);
    res.status(502).json({ error: (err as Error).message });
  }
});

app.get('/api/payments/status', async (req: Request, res: Response) => {
  try {
    const referenceId = String(req.query.referenceId || req.query.chargeId || '');
    if (!referenceId) {
      return res.status(400).json({ error: 'referenceId is required' });
    }
    const status = await getRequestToPayStatus(referenceId);
    res.json({ ok: true, status });
  } catch (err) {
    console.error('[SmartStock Payments] Status check failed:', err);
    res.status(502).json({ error: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Subscription Plans & Pricing (server-authoritative)
// ---------------------------------------------------------------------------
// Guest-accessible pricing lookup — returns worker-count options + plan pricing.
app.get('/api/subscriptions/plans', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    workerCountOptions: WORKER_COUNT_OPTIONS,
    plans: PLANS,
  });
});

// Quote: compute plan for a given worker count. Returns authoritative amounts
// AND schedule so the UI never trusts the client for prices.
app.get('/api/subscriptions/quote', (req: Request, res: Response) => {
  const workerCount = Number(req.query.workerCount || req.body?.workerCount || 1);
  const plan = calculatePlanForWorkerCount(workerCount);
  const schedule = calculateSubscriptionSchedule(new Date());
  res.json({
    ok: true,
    workerCount,
    plan,
    schedule,
    setupFee: plan.setupFee,
    monthlyFee: plan.monthlyFee,
    trialMonths: plan.trialMonths,
    trialEndDate: schedule.trialEndDate,
    nextPaymentDate: schedule.nextPaymentDate,
  });
});

// ---------------------------------------------------------------------------
// Subscription API (owner + admin)
// ---------------------------------------------------------------------------

// Current user's subscription (by ownerId, businessId, or user email)
app.get('/api/subscriptions/mine', async (req: Request, res: Response) => {
  try {
    const ownerId = String(req.query.ownerId || req.query.userId || '');
    const businessId = String(req.query.businessId || '');
    const email = String(req.query.email || '');
    let subscription = null;
    if (ownerId) subscription = await getSubscriptionByOwner(ownerId);
    else if (businessId) subscription = await getSubscriptionByBusiness(businessId);
    else if (email) {
      const byEmail = (await getSubscriptions()).find((s) => (s.ownerEmail || '').toLowerCase() === email.toLowerCase());
      subscription = byEmail || null;
    }
    res.json({ ok: true, subscription });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// List all subscriptions (admin)
app.get('/api/subscriptions', async (_req: Request, res: Response) => {
  try {
    const subscriptions = await getSubscriptions();
    res.json({ ok: true, subscriptions });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Create/activate a subscription after a verified setup-fee payment.
// SECURITY: amount is recomputed server-side from workerCount.
app.post('/api/subscriptions/activate', async (req: Request, res: Response) => {
  try {
    const {
      businessId,
      ownerId,
      workerCount,
      paymentProvider,
      paymentReference,
      mtnReferenceId,
      setupFeeTransactionId,
      ownerName,
      ownerEmail,
      ownerPhone,
      businessName,
      clientPaidAmount,
    } = req.body || {};

    if (!businessId || !ownerId) {
      return res.status(400).json({ ok: false, error: 'businessId and ownerId are required.' });
    }
    const wc = Number(workerCount);
    if (!Number.isFinite(wc) || wc < 1) {
      return res.status(400).json({ ok: false, error: 'workerCount must be a positive integer.' });
    }

    // Server re-computes the correct setup fee — never trust client price.
    const plan = calculatePlanForWorkerCount(wc);
    if (clientPaidAmount != null && Number(clientPaidAmount) !== plan.setupFee) {
      return res.status(422).json({
        ok: false,
        error: `Amount mismatch. Expected ${plan.setupFee} RWF, received ${clientPaidAmount} RWF.`,
        expectedSetupFee: plan.setupFee,
      });
    }

    // Prevent duplicate subscriptions: if this business already has a live one, return it.
    const existing = await getSubscriptionByBusiness(businessId);
    if (existing && ['ACTIVE', 'TRIAL', 'PAYMENT_DUE'].includes(existing.status)) {
      return res.json({ ok: true, subscription: existing, alreadyActive: true });
    }

    const subscription = await createAndActivateSubscription({
      businessId,
      ownerId,
      workerCount: wc,
      paymentProvider: (paymentProvider as PaymentProviderId) || 'MTN_MOMO',
      paymentReference,
      mtnReferenceId,
      setupFeeTransactionId,
      ownerName,
      ownerEmail,
      ownerPhone,
      businessName,
    });

    res.json({ ok: true, subscription, alreadyActive: false });
  } catch (err) {
    console.error('[SmartStock Subscriptions] Activate failed:', err);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Change worker count → possibly auto-upgrade plan (confirmation handled in UI,
// enforcement here). Requires business-level info.
app.post('/api/subscriptions/:id/workers', async (req: Request, res: Response) => {
  try {
    const subscriptionId = String(req.params.id);
    const newWorkerCount = Number(req.body?.workerCount);
    if (!Number.isFinite(newWorkerCount) || newWorkerCount < 1) {
      return res.status(400).json({ ok: false, error: 'workerCount must be a positive integer.' });
    }
    const result = await changeWorkerCount(subscriptionId, newWorkerCount);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[SmartStock Subscriptions] Change plan failed:', err);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Cancel subscription
app.post('/api/subscriptions/:id/cancel', async (req: Request, res: Response) => {
  try {
    const subscriptionId = String(req.params.id);
    const subscription = await cancelSubscription(subscriptionId, req.body?.reason);
    if (!subscription) return res.status(404).json({ ok: false, error: 'Subscription not found.' });
    res.json({ ok: true, subscription });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Payment history for a subscription
app.get('/api/subscriptions/:id/payments', async (req: Request, res: Response) => {
  try {
    const subscriptionId = String(req.params.id);
    const payments = await getPaymentHistory(subscriptionId);
    res.json({ ok: true, payments });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Confirm a verified subscription payment (setup fee or monthly) — idempotent.
// Call ONLY after the provider status has been verified server-side.
app.post('/api/subscriptions/payments/confirm', async (req: Request, res: Response) => {
  try {
    const { subscriptionId, billingPeriod, amountRwf, paymentProvider, paymentReference, providerTransactionId, paidAt } = req.body || {};
    if (!subscriptionId || !billingPeriod) {
      return res.status(400).json({ ok: false, error: 'subscriptionId and billingPeriod are required.' });
    }
    if (!Number.isFinite(Number(amountRwf)) || Number(amountRwf) <= 0) {
      return res.status(400).json({ ok: false, error: 'A positive amountRwf is required.' });
    }
    const result = await confirmSubscriptionPayment({
      subscriptionId,
      billingPeriod,
      amountRwf: Number(amountRwf),
      paymentProvider: (paymentProvider as PaymentProviderId) || 'MTN_MOMO',
      paymentReference: paymentReference || `SRW-CONFIRM-${Date.now()}`,
      providerTransactionId,
      paidAt,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[SmartStock Subscriptions] Confirm payment failed:', err);
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Admin aggregation — subscription dashboard stats
app.get('/api/subscriptions/overview', async (_req: Request, res: Response) => {
  try {
    const stats = await getSubscriptionOverview();
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Manual billing cycle trigger (admin)
app.post('/api/billing/run', async (_req: Request, res: Response) => {
  try {
    const result = await runBillingCycle();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// Payment provider status (for dashboards/debugging)
app.get('/api/payments/providers', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    activeProviders: getActiveProviders(),
    config: getProviderConfigStatus(),
  });
});

// ---------------------------------------------------------------------------
// Email OTP Authentication
// ---------------------------------------------------------------------------
async function findUserByEmail(email?: string) {
  if (!email) return undefined;
  const users = await getItems(COLLECTIONS.USERS);
  return users.find(
    (u: any) => String(u.email || '').toLowerCase() === email.toLowerCase(),
  );
}

// Login roles selectable from the frontend (Owner / Cashier / Employee).
// "Cashier" maps to the stored 'employee' role in the database.
const LOGIN_ROLES = ['owner', 'employee', 'cashier'] as const;
type LoginRole = (typeof LOGIN_ROLES)[number];
const toDbRole = (role: LoginRole): string => (role === 'cashier' ? 'employee' : role);

app.post('/api/otp/send', async (req: Request, res: Response) => {
  try {
    const { email, role, userName } = req.body || {};
    if (!email || !role) {
      return res.status(400).json({ ok: false, message: 'email and role are required' });
    }
    if (!LOGIN_ROLES.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role. Choose Owner, Cashier, or Employee.' });
    }
    const expectedRole = toDbRole(role as LoginRole);
    // Backend enforces that the SELECTED role matches the account's actual assigned role.
    const registered = await findUserByEmail(email);
    if (registered && registered.role) {
      if (registered.role === 'superadmin') {
        return res.status(403).json({ ok: false, message: 'Super Admin access uses a different secure flow. Sign in at /superadmin.' });
      }
      if (registered.role !== expectedRole) {
        return res.status(403).json({ ok: false, message: `The selected role (${role}) does not match this account's assigned role on the server.` });
      }
    }
    const result = await sendOTP({ email, role: expectedRole, userName });
    res.json(result);
  } catch (err) {
    console.error('[SmartStock OTP] Send failed:', err);
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

app.post('/api/otp/verify', async (req: Request, res: Response) => {
  try {
    const { email, role, code } = req.body || {};
    if (!email || !role || !code) {
      return res.status(400).json({ ok: false, message: 'email, role, and code are required' });
    }
    if (!LOGIN_ROLES.includes(role)) {
      return res.status(400).json({ ok: false, message: 'Invalid role.' });
    }
    const expectedRole = toDbRole(role as LoginRole);
    const result = verifyOTP({ email, role: expectedRole, code });
    if (!result.ok) {
      return res.json(result);
    }
    // Determine the authoritative role server-side — never trust the client's role for routing.
    const registered = await findUserByEmail(email);
    if (registered && registered.role) {
      return res.json({ ok: true, message: result.message, role: registered.role, user: sanitizeUser(registered) });
    }
    res.json({ ok: true, message: result.message, role: expectedRole });
  } catch (err) {
    console.error('[SmartStock OTP] Verify failed:', err);
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Super Admin Helper Functions
// ---------------------------------------------------------------------------
async function findSuperAdminByEmail(email?: string) {
  if (!email) return undefined;
  const users = await getItems(COLLECTIONS.USERS);
  return users.find(
    (u: any) => u.role === 'superadmin' && String(u.email || '').toLowerCase() === email.toLowerCase(),
  );
}

function sanitizeUser(user: any) {
  if (!user) return undefined;
  const { systemPassword: _p, pin: _pin, cvDataUrl: _cv, cvFileName: _cvf, contractFileName: _cn, contractDataUrl: _cd, ...safe } = user;
  return safe;
}

// Middleware: require a valid superadmin session via Authorization: Bearer <token>
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const session = verifySuperAdminSession(extractBearerToken(req.headers.authorization));
  if (!session) {
    return res.status(401).json({ ok: false, message: 'Unauthorized. A valid Super Admin session is required.' });
  }
  (req as any).superAdminSession = session;
  next();
}

// ---------------------------------------------------------------------------
// Super Admin Authentication API (dedicated flow)
// ---------------------------------------------------------------------------
app.post('/api/auth/superadmin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password are required.' });
    }
    const admin = await findSuperAdminByEmail(email);
    if (!admin || admin.systemPassword !== password) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    }
    const result = await sendOTP({ email: admin.email, role: 'superadmin', userName: admin.name });
    if (!result.ok) {
      return res.status(429).json(result);
    }
    res.json({ ok: true, message: result.message, previewUrl: result.previewUrl, retryAfterSeconds: result.retryAfterSeconds });
  } catch (err) {
    console.error('[SmartStock Auth] Superadmin login failed:', err);
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

app.post('/api/auth/superadmin/otp/send', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email is required.' });
    }
    const admin = await findSuperAdminByEmail(email);
    if (!admin) {
      return res.status(404).json({ ok: false, message: 'No registered platform admin account matches that email.' });
    }
    const result = await sendOTP({ email: admin.email, role: 'superadmin', userName: admin.name });
    if (!result.ok) {
      return res.status(429).json(result);
    }
    res.json({ ok: true, message: result.message, previewUrl: result.previewUrl, retryAfterSeconds: result.retryAfterSeconds });
  } catch (err) {
    console.error('[SmartStock Auth] Superadmin OTP send failed:', err);
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

app.post('/api/auth/superadmin/otp/verify', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ ok: false, message: 'Email and 6-digit code are required.' });
    }
    const otpResult = verifyOTP({ email, role: 'superadmin', code });
    if (!otpResult.ok) {
      return res.status(400).json(otpResult);
    }
    const admin = await findSuperAdminByEmail(email);
    if (!admin) {
      return res.status(404).json({ ok: false, message: 'Admin account not found.' });
    }
    const { token, session } = createSuperAdminSession(admin.email);
    console.log(`[SmartStock Auth] Superadmin OTP verified, session created for ${admin.email}, expires ${new Date(session.expiresAt).toISOString()}`);
    res.json({ ok: true, message: 'OTP verified. Session created.', token, user: sanitizeUser(admin) });
  } catch (err) {
    console.error('[SmartStock Auth] Superadmin OTP verify failed:', err);
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

app.get('/api/auth/superadmin/session', (req: Request, res: Response) => {
  const session = verifySuperAdminSession(extractBearerToken(req.headers.authorization));
  if (!session) {
    return res.status(401).json({ ok: false, message: 'Session expired or invalid.' });
  }
  res.json({ ok: true, session });
});

app.post('/api/auth/superadmin/logout', (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (token) destroySuperAdminSession(token);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Protected Super Admin Data API (requires valid session)
// ---------------------------------------------------------------------------
app.get('/api/superadmin/overview', requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const [users, sales, alerts] = await Promise.all([
      getItems(COLLECTIONS.USERS),
      getItems(COLLECTIONS.SALES),
      getItems(COLLECTIONS.ALERTS),
    ]);
    res.json({
      ok: true,
      data: {
        users: users.map(sanitizeUser),
        sales,
        alerts,
      },
    });
  } catch (err) {
    console.error('[SmartStock Admin] Overview failed:', err);
    res.status(500).json({ ok: false, message: (err as Error).message });
  }
});

// ---------------------------------------------------------------------------
// Helpers & Startup
// ---------------------------------------------------------------------------
function mongooseState(): string {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

const PORT = Number(process.env.PORT) || 4000;

// Start the API immediately so OTP/auth endpoints are always available,
// then connect & seed Mongo in the background (sendOTP does not depend on the DB).
app.listen(PORT, () => {
  console.log(`[SmartStock API] Listening on http://localhost:${PORT}`);
});

connectMongo()
  .then(() => ensureSubscriptionIndexes())
  .then(() => seedDatabase({ force: false }))
  .then(() => {
    console.log('[SmartStock API] MongoDB connected & seeded.');
    startBillingScheduler();
  })
  .catch((err) => console.error('[SmartStock API] MongoDB unavailable (API continues on OTP auth):', err));