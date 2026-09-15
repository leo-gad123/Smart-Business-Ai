import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  X, 
  Calendar, 
  DollarSign, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Scale,
  Users,
  Smartphone,
  Banknote,
  Receipt
} from 'lucide-react';
import { Product, SaleTransaction, ShiftRegister, User } from '../../../types';

interface Card3RevenueAnalyticsModalProps {
  products: Product[];
  sales: SaleTransaction[];
  shifts: ShiftRegister[];
  allUsers: User[];
  onClose: () => void;
}

type DateRangeOption = 'today' | 'yesterday' | '7days' | 'month' | 'custom' | 'all';

export const Card3RevenueAnalyticsModal: React.FC<Card3RevenueAnalyticsModalProps> = ({
  products,
  sales,
  shifts,
  allUsers,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'profit_breakdown' | 'cashier_audit'>('profit_breakdown');

  // Date Range filter
  const [rangeOption, setRangeOption] = useState<DateRangeOption>('today');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [itemSearch, setItemSearch] = useState('');

  // Filter Sales based on Date Range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return sales.filter(sale => {
      if (sale.isVoided) return false;
      const saleDate = sale.timestamp.split('T')[0];

      if (rangeOption === 'today') {
        return saleDate === todayStr;
      }
      if (rangeOption === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return saleDate === y.toISOString().split('T')[0];
      }
      if (rangeOption === '7days') {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return new Date(sale.timestamp) >= cutoff;
      }
      if (rangeOption === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return new Date(sale.timestamp) >= monthStart;
      }
      if (rangeOption === 'custom') {
        return saleDate >= customStartDate && saleDate <= customEndDate;
      }
      return true; // 'all'
    });
  }, [sales, rangeOption, customStartDate, customEndDate]);

  // Aggregate Metrics
  const { totalRevenueRwf, totalCostRwf, grossProfitRwf, overallMarginPct } = useMemo(() => {
    let rev = 0;
    let cost = 0;

    filteredSales.forEach(sale => {
      rev += sale.totalAmountRwf;
      sale.items.forEach(item => {
        // Calculate item cost
        const prod = products.find(p => p.id === item.productId);
        const unitCost = prod ? prod.costPriceRwf : (item.unitPriceRwf * 0.75); // estimated fallback
        cost += (unitCost * item.quantity);
      });
    });

    const profit = rev - cost;
    const margin = rev > 0 ? ((profit / rev) * 100) : 0;

    return {
      totalRevenueRwf: rev,
      totalCostRwf: cost,
      grossProfitRwf: profit,
      overallMarginPct: Math.round(margin * 10) / 10
    };
  }, [filteredSales, products]);

  // Per-Item Profit Breakdown
  const perItemAnalytics = useMemo(() => {
    const map = new Map<string, {
      productId: string;
      name: string;
      category: string;
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
      marginPct: number;
    }>();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = map.get(item.productId) || {
          productId: item.productId,
          name: item.productName,
          category: 'Grocery & Commodities',
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          marginPct: 0
        };

        const prod = products.find(p => p.id === item.productId);
        const unitCost = prod ? prod.costPriceRwf : (item.unitPriceRwf * 0.75);
        const itemRev = item.totalPriceRwf;
        const itemCost = unitCost * item.quantity;

        existing.unitsSold += item.quantity;
        existing.revenue += itemRev;
        existing.cost += itemCost;
        if (prod) existing.category = prod.category;

        map.set(item.productId, existing);
      });
    });

    // Compute margins and convert to array
    const list = Array.from(map.values()).map(item => {
      const profit = item.revenue - item.cost;
      const marginPct = item.revenue > 0 ? Math.round((profit / item.revenue) * 1000) / 10 : 0;
      return {
        ...item,
        profit,
        marginPct
      };
    });

    // Sort by profit descending
    list.sort((a, b) => b.profit - a.profit);

    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase();
      return list.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    return list;
  }, [filteredSales, products, itemSearch]);

  // Cashier Audit Comparison
  const cashierAudits = useMemo(() => {
    // Group shifts by cashier
    return shifts.map(s => {
      const expectedCash = s.totalCashSalesRwf + s.openingFloatCashRwf;
      const actualCash = s.closingActualCashCountedRwf ?? expectedCash;
      const cashDiff = actualCash - expectedCash;

      const expectedMomo = s.totalMomoSalesRwf + s.openingFloatMomoRwf;
      const actualMomo = s.closingActualMomoCountedRwf ?? expectedMomo;
      const momoDiff = actualMomo - expectedMomo;

      const totalDiscrepancy = cashDiff + momoDiff;

      return {
        shiftId: s.id,
        shiftCode: s.shiftCode,
        cashierName: s.cashierName,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        status: s.status,
        expectedCash,
        actualCash,
        cashDiff,
        expectedMomo,
        actualMomo,
        momoDiff,
        totalDiscrepancy,
        discrepancyNote: s.discrepancyNote
      };
    });
  }, [shifts]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Business Management & Revenue Analytics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Card 3
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kumenya inyungu (ya uyu munsi n'amatariki uhisemo), kureba audit y'umukozi (Cash/MoMo balance check).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-800 flex gap-2 bg-slate-900/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profit_breakdown')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'profit_breakdown'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Inyungu ku Bicuruzwa (Profit per Item & Margins)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cashier_audit')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'cashier_audit'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Audit y'Umukozi (Cash & MoMo Reconciliation)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: PROFIT PER ITEM OVER CUSTOM DATE RANGES */}
          {activeTab === 'profit_breakdown' && (
            <div className="space-y-6">
              {/* Date Filter Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Igihe (Period):
                  </span>

                  {(['today', 'yesterday', '7days', 'month', 'all', 'custom'] as DateRangeOption[]).map(opt => {
                    const labels: Record<DateRangeOption, string> = {
                      today: 'Uyu Munsi (Today)',
                      yesterday: 'Ejo Hashize',
                      '7days': 'Iminsi 7 (Last 7d)',
                      month: 'Ukwezi Kuno (This Month)',
                      all: 'Byose (All Time)',
                      custom: 'Guhitamo Amatariki (Custom)'
                    };

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRangeOption(opt)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          rangeOption === opt
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {labels[opt]}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Pickers */}
                {rangeOption === 'custom' && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800 shadow-md">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Revenue (Amafaranga Yagurishijwe)</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">
                    {totalRevenueRwf.toLocaleString()} <span className="text-xs font-sans text-slate-400">RWF</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{filteredSales.length} Transactions</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800 shadow-md">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Cost / COGS (Ayaranguwe)</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-300 mt-1 font-mono">
                    {totalCostRwf.toLocaleString()} <span className="text-xs font-sans text-slate-400">RWF</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Wholesale purchase value</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 shadow-md">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Net Gross Profit (Inyungu Isukuye)</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                    {grossProfitRwf.toLocaleString()} <span className="text-xs font-sans text-emerald-300">RWF</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-0.5 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Inyungu ya nyir'iduka</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800 shadow-md">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Profit Margin %</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">
                    {overallMarginPct}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Weighted average margin</div>
                </div>
              </div>

              {/* Detailed Item Profit Breakdown Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">
                    Inyungu kuri Buri Gicuruzwa (Itemized Profit Breakdown):
                  </h3>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Shakisha igicuruzwa..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-3">Igicuruzwa (Product)</th>
                        <th className="p-3">Icyiciro</th>
                        <th className="p-3 text-right">Ibyagurishijwe (Sold)</th>
                        <th className="p-3 text-right">Amafaranga Yinjiye (Revenue)</th>
                        <th className="p-3 text-right">Ayaranguwe (Cost)</th>
                        <th className="p-3 text-right">Inyungu (Net Profit)</th>
                        <th className="p-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
                      {perItemAnalytics.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500">
                            Nta bicuruzwa byagurishijwe muri iki gihe wahisemo.
                          </td>
                        </tr>
                      ) : (
                        perItemAnalytics.map(item => (
                          <tr key={item.productId} className="hover:bg-slate-900/50 transition">
                            <td className="p-3 font-bold text-white max-w-[200px] truncate">{item.name}</td>
                            <td className="p-3 text-slate-400">{item.category}</td>
                            <td className="p-3 text-right font-mono font-bold text-white">{item.unitsSold}</td>
                            <td className="p-3 text-right font-mono text-slate-200">{item.revenue.toLocaleString()} RWF</td>
                            <td className="p-3 text-right font-mono text-slate-400">{item.cost.toLocaleString()} RWF</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">
                              +{item.profit.toLocaleString()} RWF
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-200">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                item.marginPct >= 20 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {item.marginPct}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASHIER AUDIT (CASH VS MOMO RECONCILIATION) */}
          {activeTab === 'cashier_audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Gucunga Ikigega cya Cashier (Blind Shift Reconciliation Log)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gereranya amafaranga yagurishijwe muri sisitemu na cash/MoMo zagaragaye mu kigega.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                  Anti-Theft Reconciled
                </span>
              </div>

              {/* Audits History Cards */}
              <div className="space-y-3">
                {cashierAudits.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                    Nta mashifuti arangijwe arandikwa muri sisitemu.
                  </div>
                ) : (
                  cashierAudits.map(audit => {
                    const hasDiscrepancy = audit.totalDiscrepancy !== 0;
                    const isShortage = audit.totalDiscrepancy < 0;

                    return (
                      <div
                        key={audit.shiftId}
                        className={`p-4 rounded-xl border transition ${
                          isShortage
                            ? 'bg-rose-950/15 border-rose-500/40'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                              {audit.cashierName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white flex items-center gap-2">
                                <span>{audit.cashierName}</span>
                                <span className="font-mono text-xs text-slate-400 font-normal">({audit.shiftCode})</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Opened: {new Date(audit.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Status: {audit.status}
                              </div>
                            </div>
                          </div>

                          {/* Discrepancy Badge */}
                          <div>
                            {hasDiscrepancy ? (
                              <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 ${
                                isShortage 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{isShortage ? `Shortage: ${audit.totalDiscrepancy.toLocaleString()} RWF` : `Surplus: +${audit.totalDiscrepancy.toLocaleString()} RWF`}</span>
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Balanced (0 RWF Discrepancy)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Breakdown Grid: Cash vs MoMo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs font-mono">
                          {/* Physical Cash Drawer */}
                          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-slate-400 font-sans font-semibold">
                              <span className="flex items-center gap-1">
                                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                                Cash Drawer (Ayo mu Isanduku):
                              </span>
                              <span className={audit.cashDiff < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                Diff: {audit.cashDiff.toLocaleString()} RWF
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Expected: {audit.expectedCash.toLocaleString()} RWF</span>
                              <span className="font-bold text-white">Counted: {audit.actualCash.toLocaleString()} RWF</span>
                            </div>
                          </div>

                          {/* MTN Mobile Money Balance */}
                          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between text-slate-400 font-sans font-semibold">
                              <span className="flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                                MTN MoMo Float & Merchant:
                              </span>
                              <span className={audit.momoDiff < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                Diff: {audit.momoDiff.toLocaleString()} RWF
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Expected: {audit.expectedMomo.toLocaleString()} RWF</span>
                              <span className="font-bold text-white">Verified: {audit.actualMomo.toLocaleString()} RWF</span>
                            </div>
                          </div>
                        </div>

                        {audit.discrepancyNote && (
                          <div className="mt-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                            <strong className="text-slate-300">Note:</strong> {audit.discrepancyNote}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
