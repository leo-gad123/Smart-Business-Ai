import { connectMongo, replaceItems, getItems } from './mongo';
import { COLLECTIONS } from './models';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  DEFAULT_RETAIL_PRODUCTS,
  INITIAL_SHIFTS,
  INITIAL_ALERTS,
  INITIAL_SALES,
  INITIAL_SMS_LOGS,
  INITIAL_ONBOARDING,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CONTRACTS,
  INITIAL_STAFF_SHIFTS,
  INITIAL_DEBTORS,
} from '../src/data/initialData';

export interface CollectionSeed {
  name: string;
  items: unknown[];
}

export function buildSeedData(includeDefaultProducts: boolean): CollectionSeed[] {
  return [
    { name: COLLECTIONS.USERS, items: INITIAL_USERS },
    { name: COLLECTIONS.PRODUCTS, items: includeDefaultProducts ? DEFAULT_RETAIL_PRODUCTS : INITIAL_PRODUCTS },
    { name: COLLECTIONS.SHIFTS, items: INITIAL_SHIFTS },
    { name: COLLECTIONS.ALERTS, items: INITIAL_ALERTS },
    { name: COLLECTIONS.SALES, items: INITIAL_SALES },
    { name: COLLECTIONS.SMS_LOGS, items: INITIAL_SMS_LOGS },
    { name: COLLECTIONS.ONBOARDING, items: INITIAL_ONBOARDING },
    { name: COLLECTIONS.INVOICES, items: INITIAL_INVOICES },
    { name: COLLECTIONS.EXPENSES, items: INITIAL_EXPENSES },
    { name: COLLECTIONS.CONTRACTS, items: INITIAL_CONTRACTS },
    { name: COLLECTIONS.STAFF_SHIFTS, items: INITIAL_STAFF_SHIFTS },
    { name: COLLECTIONS.DEBTORS, items: INITIAL_DEBTORS },
    { name: COLLECTIONS.CURRENT_USER, items: [INITIAL_USERS[0]] },
    { name: COLLECTIONS.CURRENT_SHIFT, items: [] },
    { name: COLLECTIONS.OFFLINE_QUEUE, items: [] },
    { name: COLLECTIONS.ADJUSTMENTS, items: [] },
    { name: COLLECTIONS.SPOT_CHECKS, items: [] },
    { name: COLLECTIONS.PERFORMANCE_REPORTS, items: [] },
    { name: COLLECTIONS.SUBSCRIPTIONS, items: [] },
    { name: COLLECTIONS.SUBSCRIPTION_PAYMENTS, items: [] },
    { name: COLLECTIONS.BUSINESS_GOALS, items: [{
      dailySalesTargetRwf: 200000,
      maxDailyExpenseLimitRwf: 30000,
      monthlyProfitGoalRwf: 1500000,
      autoSmsSummaryEnabled: true,
      smsRecipientPhone: '+250 788 314 520'
    }] },
    { name: COLLECTIONS.GLOBAL_COUNTER, items: [{ value: 500 }] },
  ];
}

export async function seedDatabase(opts: { force?: boolean; includeDefaultProducts?: boolean } = {}): Promise<{ collection: string; count: number }[]> {
  const { force = false, includeDefaultProducts = true } = opts;
  await connectMongo();
  const seeds = buildSeedData(includeDefaultProducts);
  const results: { collection: string; count: number }[] = [];

  for (const seed of seeds) {
    // Only seed collections that are empty unless force is set, so user
    // changes in Atlas are preserved across server restarts.
    const existing = await getItems(seed.name);
    const shouldSeed = force || existing.length === 0;
    if (shouldSeed) {
      await replaceItems(seed.name, seed.items);
      results.push({ collection: seed.name, count: seed.items.length });
    } else {
      results.push({ collection: seed.name, count: existing.length });
    }
  }

  console.log('[SmartStock Mongo] Seed completed successfully.');
  return results;
}