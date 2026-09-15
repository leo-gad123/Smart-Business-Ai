import React, { useState } from 'react';
import { 
  Mail, 
  Smartphone, 
  X, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard, 
  ArrowRight,
  Send,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { db } from '../../../services/db';
import { WeeklyPerformanceReport } from '../../../types';

interface WeeklyPerformanceReportModalProps {
  onClose: () => void;
  onOpenAIWithPrompt: (prompt: string) => void;
}

export const WeeklyPerformanceReportModal: React.FC<WeeklyPerformanceReportModalProps> = ({
  onClose,
  onOpenAIWithPrompt
}) => {
  const [report] = useState<WeeklyPerformanceReport>(() => db.generateWeeklyPerformanceReport());
  const [viewMode, setViewMode] = useState<'email' | 'sms'>('email');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTriggerDispatch = () => {
    setToastMessage(`✅ Dispatch successful! Automated ${viewMode.toUpperCase()} notification has been triggered to Jean-Claude Mugabo.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const prefilledAIPrompt = `Ndasaba isesengura ryimbitse kuri Raporo y'Icyumweru: Ubwiyongere bw'abakiriya ni ${report.customerTrends.growthPercent >= 0 ? '+' : ''}${report.customerTrends.growthPercent}% (Abashya: ${report.customerTrends.newCustomers}, Abagarutse: ${report.customerTrends.returningCustomers}), Inyungu yose ni ${report.salesVolume.grossProfitRwf.toLocaleString()} RWF (${report.salesVolume.grossMarginPercent}%), n'amadeni asigaye ni ${report.creditAndDebt.outstandingBalanceRwf.toLocaleString()} RWF mu bakiriya ${report.creditAndDebt.activeDebtorsCount}. Ni izihe nama zafasha kuzamura inyungu no kugarura amadeni vuba?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Weekly Automated Performance Report
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Automated Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Raporo y'icyumweru yoherezwa mu buryo bwikora kuri Email na SMS bya Nyir'ubucuruzi (Executive Summary).
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

        {/* View Switcher & Actions Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('email')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                viewMode === 'email'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Report Format</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('sms')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                viewMode === 'sms'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>SMS Summary Format</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerDispatch}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Trigger Now</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* EMAIL VIEW */}
          {viewMode === 'email' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              {/* Email Client Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono">
                  <span>From: <strong className="text-blue-400">reports@smartstock.rw</strong> (SmartStock Rwanda Automated Analytics)</span>
                  <span>{new Date(report.generatedAt).toLocaleString()}</span>
                </div>
                <div className="text-slate-300">
                  <span>To: <strong className="text-white">Jean-Claude Mugabo</strong> (Store Owner) &lt;mugabo@smartstock.rw&gt;</span>
                </div>
                <div className="text-sm font-bold text-white pt-1">
                  Subject: 📈 SmartStock Weekly Report: +{report.customerTrends.growthPercent}% Customer Growth &amp; {report.salesVolume.totalRevenueRwf.toLocaleString()} RWF Sales Volume
                </div>
              </div>

              {/* Email Content Container */}
              <div className="p-6 space-y-6 text-slate-200">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white">
                    Muraho Jean-Claude Mugabo,
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Dore incamake y'ubucuruzi n'imikorere y'iduka ryawe mu cyumweru gishize ({report.dateRange.start} kugeza {report.dateRange.end}). Sisitemu yakusanyije amakuru y'ubugenzuzi, abakiriya bashya n'abagarutse, ibirarane by'amadeni, n'ibicuruzwa byagurishijwe kurusha ibindi.
                  </p>
                </div>

                {/* 4-KPI Metric Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Total Sales Volume</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold text-white">
                      {report.salesVolume.totalRevenueRwf.toLocaleString()} RWF
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {report.salesVolume.totalTransactions} transactions completed
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Gross Profit &amp; Margin</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      {report.salesVolume.grossProfitRwf.toLocaleString()} RWF
                    </div>
                    <div className="text-[11px] text-emerald-300/80 mt-1 font-semibold">
                      {report.salesVolume.grossMarginPercent}% profit margin
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Customer Growth</span>
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold text-blue-400">
                      +{report.customerTrends.growthPercent}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {report.customerTrends.returningCustomers} returning, {report.customerTrends.newCustomers} new
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Debtors Outstanding</span>
                      <CreditCard className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-lg font-bold text-purple-400">
                      {report.creditAndDebt.outstandingBalanceRwf.toLocaleString()} RWF
                    </div>
                    <div className="text-[11px] text-purple-300/80 mt-1">
                      {report.creditAndDebt.activeDebtorsCount} active debtors registered
                    </div>
                  </div>
                </div>

                {/* Section: Top-Moving Items */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>Top-Moving Items This Week (Ibicuruzwa Byaguzwe Cyane)</span>
                  </h4>

                  <div className="divide-y divide-slate-800/80">
                    {report.topMovingItems.map((item, index) => (
                      <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-white">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>{item.quantitySold} units sold</span>
                          <span className="font-bold text-emerald-400">{item.totalRevenueRwf.toLocaleString()} RWF</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Credit & Debt Summary */}
                <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-purple-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-400" />
                    <span>Debtors &amp; Credit Ledger Status (Kwikopesha Summary)</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Amafaranga yose y'amadeni yatanzwe kugeza ubu ni <strong>{report.creditAndDebt.totalDebtIssuedRwf.toLocaleString()} RWF</strong>, 
                    hishyuwe <strong>{report.creditAndDebt.totalDebtRecoveredRwf.toLocaleString()} RWF</strong> ({report.creditAndDebt.recoveryRatePercent}% recovery rate).
                    Hazasigara <strong>{report.creditAndDebt.outstandingBalanceRwf.toLocaleString()} RWF</strong> mu bakiriya {report.creditAndDebt.activeDebtorsCount} bafite ibirarane.
                  </p>
                </div>

                {/* 1-CLICK CTA BUTTON: Launch AI Assistant */}
                <div className="p-5 bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/40 rounded-xl text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-sm">
                    <Sparkles className="w-5 h-5 text-blue-400 animate-spin" />
                    <span>Want Deeper Strategic Insights on this Report?</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                    Kanda kuri iyi buto hasi kugira ngo uhite ufungura Smart AI Assistant igusesengurire iyi raporo, ikwereke uko wazamura inyungu n'ingamba zo kwishyuza amadeni vuba.
                  </p>
                  <button
                    id="btn-report-ask-ai"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAIWithPrompt(prefilledAIPrompt);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Ask AI Assistant About This Report (1-Click Analysis)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SMS VIEW */}
          {viewMode === 'sms' && (
            <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
              <div className="text-center border-b border-slate-800 pb-2">
                <span className="text-[11px] font-mono text-slate-400">SMARTSTOCK RWANDA SMS GATEWAY</span>
                <p className="text-xs font-bold text-white mt-0.5">To: +250 788 123 456 (Jean-Claude Mugabo)</p>
              </div>

              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-2.5 text-slate-200 font-mono">
                <p className="font-bold text-emerald-400">SMARTSTOCK KIGALI - RAPORO Y'ICYUMWERU:</p>
                <p>• Sales: {report.salesVolume.totalRevenueRwf.toLocaleString()} RWF</p>
                <p>• Profit: {report.salesVolume.grossProfitRwf.toLocaleString()} RWF ({report.salesVolume.grossMarginPercent}%)</p>
                <p>• Abakiriya: +{report.customerTrends.growthPercent}% ({report.customerTrends.returningCustomers} bagarutse, {report.customerTrends.newCustomers} bashya)</p>
                <p>• Amadeni asigaye: {report.creditAndDebt.outstandingBalanceRwf.toLocaleString()} RWF (abakiriya {report.creditAndDebt.activeDebtorsCount})</p>
                <p>• Top product: {report.topMovingItems[0]?.productName || 'Inyange Milk'} ({report.topMovingItems[0]?.quantitySold || 32} pcs)</p>
                <p className="text-[11px] text-blue-300 pt-1">
                  Kanda hano ufungure AI Business Assistant igusesengurire raporo: https://smartstock.rw/ai
                </p>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAIWithPrompt(prefilledAIPrompt);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch AI Assistant from SMS Link</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
