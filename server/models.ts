import { Schema, model, Model as MongooseModel } from 'mongoose';

export const COLLECTIONS = {
  PRODUCTS: 'products',
  USERS: 'users',
  SALES: 'sales',
  SHIFTS: 'shifts',
  CURRENT_SHIFT: 'currentshift',
  ADJUSTMENTS: 'adjustments',
  ALERTS: 'alerts',
  SPOT_CHECKS: 'spotchecks',
  OFFLINE_QUEUE: 'offlinequeue',
  ONBOARDING: 'onboarding',
  CURRENT_USER: 'currentuser',
  GLOBAL_COUNTER: 'globalcounter',
  BUSINESS_GOALS: 'businessgoals',
  INVOICES: 'invoices',
  EXPENSES: 'expenses',
  CONTRACTS: 'contracts',
  STAFF_SHIFTS: 'staffshifts',
  DEBTORS: 'debtors',
  PERFORMANCE_REPORTS: 'performancereports',
  SMS_LOGS: 'smslogs',
  SUBSCRIPTIONS: 'subscriptions',
  SUBSCRIPTION_PAYMENTS: 'subscriptionpayments',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const ALL_COLLECTION_NAMES: CollectionName[] = Object.values(COLLECTIONS);

const mixedSchema = new Schema({}, { strict: false, _id: true, versionKey: false });

const modelCache = new Map<string, MongooseModel<unknown>>();

export function getModel<T = Record<string, unknown>>(name: string): MongooseModel<T> {
  const cached = modelCache.get(name);
  if (cached) return cached as MongooseModel<T>;
  const created = model<T>(name, mixedSchema, name);
  modelCache.set(name, created as MongooseModel<unknown>);
  return created;
}