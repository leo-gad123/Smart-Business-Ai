import { Product, SaleTransaction, ShiftRegister, User, FraudAlert } from '../types';
import { db } from './db';

const AI_BASE = '/api/ai';

export interface AIConfigInfo {
  configured: boolean;
  model?: string;
}

export async function getAIConfig(): Promise<AIConfigInfo> {
  try {
    const res = await fetch(`${AI_BASE}/config`);
    const data = await res.json();
    return { configured: data.configured === true, model: data.model };
  } catch {
    return { configured: false };
  }
}

export async function askAI(prompt: string, systemContext?: string, jsonMode = false): Promise<string> {
  const res = await fetch(`${AI_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemContext, jsonMode }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'AI request failed.');
  }
  return data.reply as string;
}

const fmt = (n: number) => n.toLocaleString('en-US');
const dayKey = (d: Date) => d.toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Shop-scoped AI context: full business history + daily/weekly/monthly trends
// ---------------------------------------------------------------------------
export interface ShopAIContextParams {
  currentUser: User;
  products: Product[];
  sales: SaleTransaction[];
  shifts: ShiftRegister[];
  allUsers: User[];
}

export function buildShopAIContext(params: ShopAIContextParams): string {
  const { currentUser, products, sales, shifts, allUsers } = params;
  const liveSales = sales.filter((s) => !s.isVoided);
  const analytics = db.getCustomerAndSalesAnalytics();
  const contracts = db.getContracts();
  const invoices = db.getInvoices();
  const expenses = db.getExpenses();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Daily aggregation (last 45 days) — revenue, transactions, profit
  const dailyMap: Record<string, { revenue: number; transactions: number; profit: number }> = {};
  liveSales.forEach((s) => {
    const d = dayKey(new Date(s.timestamp));
    if (!dailyMap[d]) dailyMap[d] = { revenue: 0, transactions: 0, profit: 0 };
    dailyMap[d].revenue += s.totalRwf;
    dailyMap[d].transactions += 1;
    dailyMap[d].profit += s.grossProfitRwf || s.totalRwf - (s.totalCostRwf || s.totalRwf * 0.72);
  });
  const dailySeries = Object.entries(dailyMap)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-45)
    .map(([date, v]) => `${date}: ${fmt(Math.round(v.revenue))} RWF, ${v.transactions} tx, profit ${fmt(Math.round(v.profit))} RWF`);

  // Weekly aggregation (last 8 weeks)
  const weeklyMap: Record<string, { revenue: number; transactions: number }> = {};
  liveSales.forEach((s) => {
    const d = new Date(s.timestamp);
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay());
    const wk = dayKey(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate()));
    if (!weeklyMap[wk]) weeklyMap[wk] = { revenue: 0, transactions: 0 };
    weeklyMap[wk].revenue += s.totalRwf;
    weeklyMap[wk].transactions += 1;
  });
  const weeklySeries = Object.entries(weeklyMap).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-8).map(([wk, v]) => `week-of ${wk}: ${fmt(Math.round(v.revenue))} RWF, ${v.transactions} tx`);

  // Monthly aggregation (last 6 months)
  const monthMap: Record<string, { revenue: number; transactions: number }> = {};
  liveSales.forEach((s) => {
    const d = new Date(s.timestamp);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[mk]) monthMap[mk] = { revenue: 0, transactions: 0 };
    monthMap[mk].revenue += s.totalRwf;
    monthMap[mk].transactions += 1;
  });
  const monthlySeries = Object.entries(monthMap).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-6).map(([mk, v]) => `${mk}: ${fmt(Math.round(v.revenue))} RWF, ${v.transactions} tx`);

  // Week-over-week growth
  const days7Ago = new Date(todayStart.getTime() - 7 * 86400000);
  const days14Ago = new Date(todayStart.getTime() - 14 * 86400000);
  const weekRevenue = liveSales.filter((s) => new Date(s.timestamp) >= days7Ago).reduce((a, b) => a + b.totalRwf, 0);
  const prevWeekRevenue = liveSales.filter((s) => { const t = new Date(s.timestamp); return t >= days14Ago && t < days7Ago; }).reduce((a, b) => a + b.totalRwf, 0);
  const wowPct = prevWeekRevenue > 0 ? Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100) : 0;

  const totalSalesRev = liveSales.reduce((a, b) => a + b.totalRwf, 0);
  const lowStockItems = products.filter((p) => p.currentStock <= p.reorderLevel);

  const shiftDiscrepancies = shifts
    .map((s) => {
      const cashVar = s.cashVarianceRwf ?? 0;
      const momoVar = s.momoVarianceRwf ?? 0;
      return { cashier: s.cashierName, shiftCode: s.shiftCode, cashDiscrepancy: cashVar, momoDiscrepancy: momoVar, totalDiscrepancy: cashVar + momoVar };
    })
    .filter((d) => d.totalDiscrepancy !== 0)
    .slice(0, 15);

  const bestDay = Object.entries(dailyMap).sort((a, b) => b[1].revenue - a[1].revenue)[0];

  const lines: string[] = [];
  lines.push(`STORE PROFILE:`);
  lines.push(`- Shop: ${currentUser.shopName || 'SmartStock Rwanda'}`);
  lines.push(`- Owner: ${currentUser.name}`);
  lines.push(`- Total SKUs in stock: ${products.length}`);
  lines.push(`- Active employees in system: ${allUsers.filter((u) => u.role === 'employee').length}`);

  lines.push(`ALL-TIME PERFORMANCE:`);
  lines.push(`- Total revenue: ${fmt(Math.round(totalSalesRev))} RWF across ${liveSales.length} transactions`);
  lines.push(`- Gross profit: ${fmt(Math.round(analytics.salesSummary.grossProfitRwf))} RWF (${analytics.salesSummary.profitMarginPercent}% margin)`);
  lines.push(`- Average ticket: ${fmt(analytics.salesSummary.averageTicketRwf)} RWF`);
  lines.push(`- VAT collected: ${fmt(Math.round(analytics.salesSummary.vatCollectedRwf))} RWF`);
  lines.push(`- Week-over-week revenue change: ${wowPct >= 0 ? '+' : ''}${wowPct}%`);
  lines.push(`- Best revenue day: ${bestDay ? `${bestDay[0]} (${fmt(Math.round(bestDay[1].revenue))} RWF)` : 'n/a'}`);

  lines.push(`DAILY TRANSACTION HISTORY (last 45 active days, newest first grouping not applied):`);
  lines.push(dailySeries.length ? dailySeries.join('\n') : '- No sales recorded yet.');

  lines.push(`WEEKLY TRENDS (last 8 calendar weeks):`);
  lines.push(weeklySeries.length ? weeklySeries.join('\n') : '- No sales recorded yet.');

  lines.push(`MONTHLY TRENDS (last 6 months):`);
  lines.push(monthlySeries.length ? monthlySeries.join('\n') : '- No sales recorded yet.');

  lines.push(`CUSTOMER GROWTH & ANALYTICS:`);
  lines.push(`- Customers: ${analytics.totalCustomers} (${analytics.newCustomers} new, ${analytics.returningCustomers} returning, ${analytics.repeatCustomerRatePercent}% repeat, ${analytics.churnRatePercent}% churn, ${analytics.customerGrowthPercent}% growth)`);
  lines.push(`- Top-moving products: ${JSON.stringify(analytics.topMovingItems.map((p) => ({ name: p.productName, units: p.unitsSold, revenue: Math.round(p.revenueRwf) })))}`);
  lines.push(`- Debtors: ${analytics.debtSummary.activeDebtorsCount} active, ${fmt(Math.round(analytics.debtSummary.outstandingBalanceRwf))} RWF outstanding, ${fmt(Math.round(analytics.debtSummary.totalRecoveredRwf))} RWF recovered`);

  lines.push(`INVENTORY & OPERATIONS:`);
  lines.push(`- Low stock items: ${JSON.stringify(lowStockItems.map((p) => ({ name: p.name, currentStock: p.currentStock, reorderLevel: p.reorderLevel, unit: p.unit })).slice(0, 25))}`);
  lines.push(`- Active contracts & payroll: ${JSON.stringify(contracts.filter((c) => c.status === 'ACTIVE').map((c) => ({ name: c.employeeName, role: c.role, salaryRwf: c.monthlySalaryRwf })))}`);
  lines.push(`- Monthly payroll obligation: ${fmt(contracts.filter((c) => c.status === 'ACTIVE').reduce((a, c) => a + c.monthlySalaryRwf, 0))} RWF`);
  lines.push(`- Cashier shift discrepancies: ${JSON.stringify(shiftDiscrepancies)}`);
  lines.push(`- Purchase invoices: ${invoices.length} totaling ${fmt(Math.round(invoices.reduce((a, b) => a + b.totalAmountRwf, 0)))} RWF`);
  lines.push(`- Operational expenses: ${expenses.length} totaling ${fmt(Math.round(expenses.reduce((a, b) => a + b.amountRwf, 0)))} RWF`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Platform-wide AI context for the Super Admin
// ---------------------------------------------------------------------------
export interface PlatformAIContextParams {
  currentUser: User;
  allUsers: User[];
  sales: SaleTransaction[];
  alerts: FraudAlert[];
}

export function buildPlatformAIContext(params: PlatformAIContextParams): string {
  const { currentUser, allUsers, sales, alerts } = params;
  const liveSales = sales.filter((s) => !s.isVoided);

  const owners = allUsers.filter((u) => u.role === 'owner');
  const employees = allUsers.filter((u) => u.role === 'employee');
  const activeOwners = owners.filter((u) => u.active !== false);

  const perShop: Record<string, { revenue: number; transactions: number }> = {};
  liveSales.forEach((s) => {
    const key = s.customerName && allUsers.some((u) => u.shopName && s.customerPhone?.includes(u.shopName)) ? 'vendor' : (allUsers.find((u) => u.id === s.cashierId)?.shopName || 'unknown-shop');
    if (!perShop[key]) perShop[key] = { revenue: 0, transactions: 0 };
    perShop[key].revenue += s.totalRwf;
    perShop[key].transactions += 1;
  });

  const pendingAlerts = alerts.filter((a) => a.status === 'PENDING');
  const criticalAlerts = pendingAlerts.filter((a) => a.severity === 'HIGH' || a.severity === 'CRITICAL');

  const totalRevenue = liveSales.reduce((a, b) => a + b.totalRwf, 0);

  const lines: string[] = [];
  lines.push(`PLATFORM PROFILE (SmartStock Rwanda):`);
  lines.push(`- Super Admin: ${currentUser.name}`);
  lines.push(`- Registered business owners: ${owners.length} (${activeOwners.length} active)`);
  lines.push(`- Total cashiers/employees on platform: ${employees.length}`);
  lines.push(`- Total users: ${allUsers.length}`);

  lines.push(`PLATFORM PERFORMANCE:`);
  lines.push(`- All-shop revenue: ${fmt(Math.round(totalRevenue))} RWF across ${liveSales.length} transactions`);
  lines.push(`- Revenue by shop/cashier segment: ${JSON.stringify(Object.entries(perShop).map(([shop, v]) => ({ shop, revenue: Math.round(v.revenue), transactions: v.transactions })))}`);

  lines.push(`FRAUD & COMPLIANCE:`);
  lines.push(`- Alerts: ${alerts.length} total, ${pendingAlerts.length} pending, ${criticalAlerts.length} HIGH/CRITICAL`);
  lines.push(`- Pending alerts detail: ${JSON.stringify(pendingAlerts.slice(0, 15).map((a) => ({ title: a.title, severity: a.severity, category: a.category, cashier: a.relatedCashierName, amountAtRiskRwf: Math.round(a.amountAtRiskRwf), status: a.status })))}`);

  return lines.join('\n');
}