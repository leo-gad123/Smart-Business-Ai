export type CollectionName =
  | 'products'
  | 'users'
  | 'sales'
  | 'shifts'
  | 'currentshift'
  | 'adjustments'
  | 'alerts'
  | 'spotchecks'
  | 'offlinequeue'
  | 'onboarding'
  | 'currentuser'
  | 'globalcounter'
  | 'businessgoals'
  | 'invoices'
  | 'expenses'
  | 'contracts'
  | 'staffshifts'
  | 'debtors'
  | 'performancereports'
  | 'smslogs';

export const COLLECTIONS: Record<string, CollectionName> = {
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
};

export interface SyncState {
  [name: string]: unknown[];
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchState(): Promise<SyncState | null> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) return null;
    const json = (await res.json()) as { data: SyncState };
    return json.data || null;
  } catch {
    return null;
  }
}

export async function pushCollection(name: CollectionName, data: unknown[], shop?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/collections/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, shop }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushState(state: SyncState): Promise<boolean> {
  try {
    const res = await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: state }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearCollection(name: CollectionName): Promise<boolean> {
  try {
    const res = await fetch(`/api/collections/${name}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearAll(): Promise<boolean> {
  try {
    const res = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: {} }) });
    return res.ok;
  } catch {
    return false;
  }
}