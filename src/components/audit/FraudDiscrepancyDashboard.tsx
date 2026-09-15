import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  Sliders, 
  Activity, 
  Lock,
  UserX,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Send,
  Receipt,
  QrCode,
  Smartphone,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { FraudAlert, ShiftRegister, SaleTransaction, Product, SpotCheckAudit, User, SMSLog } from '../../types';
import { FraudDetectionEngine, FraudMetrics } from '../../services/fraudEngine';
import { runAIForensicAudit, AuditAnalysisReport } from '../../services/geminiAuditor';
import { SMSService } from '../../services/smsService';

interface FraudDiscrepancyDashboardProps {
  shifts: ShiftRegister[];
  sales: SaleTransaction[];
  alerts: FraudAlert[];
  products: Product[];
  spotChecks: SpotCheckAudit[];
  currentUser: User;
  onResolveAlert: (alertId: string) => void;
}

export const FraudDiscrepancyDashboard: React.FC<FraudDiscrepancyDashboardProps> = ({
  shifts,
  sales,
  alerts,
  products,
  spotChecks,
  currentUser,
  onResolveAlert
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sms_logs' | 'rra_ebm' | 'calculator'>('overview');
  const [sliderDailyLeakage, setSliderDailyLeakage] = useState<number>(500);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<AuditAnalysisReport | null>(null);
  const [smsFilter, setSmsFilter] = useState<'ALL' | 'STAFF_RESTOCK_ALERT' | 'OWNER_DISCREPANCY_ALERT' | 'CUSTOMER_RECEIPT'>('ALL');

  // Compute metrics
  const metrics: FraudMetrics = FraudDetectionEngine.calculateMetrics(
    shifts,
    sales,
    alerts,
    spotChecks
  );

  // Compounding math based on slider
  const compounding = FraudDetectionEngine.computeCompoundingLoss(sliderDailyLeakage);

  // SMS logs from service
  const allSmsLogs = useMemo(() => SMSService.getLogs(), [alerts, sales, products]);
  const filteredSmsLogs = useMemo(() => {
    if (smsFilter === 'ALL') return allSmsLogs;
    return allSmsLogs.filter(log => log.type === smsFilter);
  }, [allSmsLogs, smsFilter]);

  // RRA EBM invoices extracted from sales
  const rraInvoices = useMemo(() => {
    return sales
      .filter(s => !!s.rraInvoice)
      .map(s => ({
        saleId: s.id,
        receiptNumber: s.receiptNumber,
        cashierName: s.cashierName,
        timestamp: s.timestamp,
        totalAmountRwf: s.totalRwf,
        rraInvoice: s.rraInvoice!
      }));
  }, [sales]);

  const totalVatCollectedRwf = useMemo(() => {
    return rraInvoices.reduce((acc, inv) => acc + inv.rraInvoice.vatAmountA_18, 0);
  }, [rraInvoices]);

  const handleTriggerAIAudit = async () => {
    setIsAuditing(true);
    try {
      const report = await runAIForensicAudit({
        shifts,
        sales,
        alerts,
        products,
        spotChecks
      });
      setAiReport(report);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Anti-Theft Forensic & Discrepancy Engine</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                Live Audit Active
              </span>
            </h1>
            <p className="text-xs text-neutral-400 max-w-2xl mt-0.5">
              Automated anomaly detection designed specifically for Rwandan shops to combat daily register cash leaks compounding into significant multi-month losses.
            </p>
          </div>
        </div>

        <button
          id="btn-run-ai-audit"
          onClick={handleTriggerAIAudit}
          disabled={isAuditing}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/40"
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Audit Telemetry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run AI Forensic Audit</span>
            </>
          )}
        </button>
      </div>

      {/* SubTab Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 p-2 rounded-2xl border border-neutral-800 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'overview' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Fraud Overview & Flags</span>
            {alerts.filter(a => a.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full font-mono text-[10px]">
                {alerts.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            id="tab-sub-sms-logs"
            onClick={() => setActiveSubTab('sms_logs')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'sms_logs' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automated SMS Dispatch ({allSmsLogs.length})</span>
          </button>

          <button
            id="tab-sub-rra-ebm"
            onClick={() => setActiveSubTab('rra_ebm')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'rra_ebm' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>RRA 18% EBM Invoices ({rraInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'calculator' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Cash Leakage Compounding Math</span>
          </button>
        </div>

        <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
          MTN/Airtel Gateway &bull; RRA VCDC SDC v2.4
        </span>
      </div>

      {/* OVERVIEW SUBTAB */}
      {activeSubTab === 'overview' && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Recorded Cash Shortage</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-red-400">
                -{metrics.totalShortageRwf.toLocaleString()} <span className="text-xs text-neutral-400 font-sans">RWF</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Across {shifts.length} shift reconciliation audits
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Flagged Anomaly Rate</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-amber-400">
                {metrics.shrinkageRiskScore}/100 <span className="text-xs text-neutral-400 font-sans">Risk Index</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                {alerts.filter(a => a.status === 'PENDING').length} active unresolved flags
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Voided Cart Losses</span>
                <DollarSign className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-xl font-extrabold font-mono text-white">
                {metrics.totalVoidLossRwf.toLocaleString()} <span className="text-xs text-neutral-400 font-sans">RWF</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Phantom void & cancellation volume
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>High Risk Cashiers</span>
                <UserX className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white mt-1 truncate">
                {metrics.highRiskCashierNames.length > 0 ? metrics.highRiskCashierNames.join(', ') : 'None Flagged'}
              </div>
              <div className="text-[11px] text-neutral-400">
                Repeated drawer variance & shortage
              </div>
            </div>
          </div>

          {/* AI Forensic Report Card (if generated) */}
          {aiReport && (
            <div className="p-5 bg-neutral-900 border border-emerald-500/40 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">AI Forensic Auditor Diagnostic Report</h3>
                </div>
                <span className={`text-[10px] font-bold uppercase font-mono px-2.5 py-1 rounded-full ${
                  aiReport.riskRating === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                  aiReport.riskRating === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {aiReport.riskRating} RISK
                </span>
              </div>

              <p className="text-xs text-neutral-200 leading-relaxed font-medium bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                {aiReport.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Theft Patterns */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-red-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Patterns Detected</span>
                  </h4>
                  <ul className="space-y-1 text-neutral-300 text-[11px] list-disc list-inside">
                    {aiReport.theftPatternsDetected.map((pat, idx) => (
                      <li key={idx}>{pat}</li>
                    ))}
                  </ul>
                </div>

                {/* Vulnerable SKUs */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Vulnerable SKUs</span>
                  </h4>
                  <ul className="space-y-1 text-neutral-300 text-[11px] list-disc list-inside">
                    {aiReport.vulnerableInventoryItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Owner Actions */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Recommended Owner Actions</span>
                  </h4>
                  <ul className="space-y-1 text-neutral-300 text-[11px] list-disc list-inside">
                    {aiReport.recommendedOwnerActions.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Security Alerts List */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Live Discrepancy & Fraud Alert Log</h3>
              </div>
              <span className="text-xs text-neutral-400">
                {alerts.filter(a => a.status === 'PENDING').length} pending review
              </span>
            </div>

            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex flex-wrap items-start justify-between gap-3 text-xs transition ${
                    alert.status === 'RESOLVED'
                      ? 'bg-neutral-950/40 border-neutral-800 opacity-60'
                      : alert.severity === 'CRITICAL'
                      ? 'bg-red-950/20 border-red-500/40'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                        alert.severity === 'HIGH' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-bold text-white text-xs">{alert.title}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-normal">
                      {alert.description}
                    </p>

                    <div className="text-[10px] text-emerald-400 font-medium">
                      Suggested Action: {alert.suggestedAction}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-xs text-amber-400">
                      {alert.amountAtRiskRwf.toLocaleString()} RWF at risk
                    </span>
                    {alert.status === 'PENDING' ? (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-500 italic">Resolved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AUTOMATED SMS LOGS SUBTAB */}
      {activeSubTab === 'sms_logs' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">Automated SMS Gateway Telemetry</h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every restock, price update, drawer discrepancy, and customer e-receipt triggers an instant telecom SMS.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setSmsFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  smsFilter === 'ALL' ? 'bg-neutral-100 text-neutral-950 font-bold' : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                }`}
              >
                All ({allSmsLogs.length})
              </button>
              <button
                onClick={() => setSmsFilter('STAFF_RESTOCK_ALERT')}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  smsFilter === 'STAFF_RESTOCK_ALERT' ? 'bg-neutral-100 text-neutral-950 font-bold' : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                }`}
              >
                Staff Restock
              </button>
              <button
                onClick={() => setSmsFilter('OWNER_DISCREPANCY_ALERT')}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  smsFilter === 'OWNER_DISCREPANCY_ALERT' ? 'bg-neutral-100 text-neutral-950 font-bold' : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                }`}
              >
                Owner Discrepancy Alerts
              </button>
              <button
                onClick={() => setSmsFilter('CUSTOMER_RECEIPT')}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  smsFilter === 'CUSTOMER_RECEIPT' ? 'bg-neutral-100 text-neutral-950 font-bold' : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                }`}
              >
                Customer E-Receipts
              </button>
            </div>
          </div>

          {filteredSmsLogs.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No SMS alerts found for this filter.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSmsLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        log.type === 'OWNER_DISCREPANCY_ALERT'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : log.type === 'STAFF_RESTOCK_ALERT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {log.type === 'OWNER_DISCREPANCY_ALERT' ? '⚠️ SHORTAGE ALERT' : log.type === 'STAFF_RESTOCK_ALERT' ? '📦 STAFF RESTOCK' : '🧾 CUSTOMER E-RECEIPT'}
                      </span>
                      <span className="font-mono text-neutral-300 font-bold">{log.recipientPhone}</span>
                      <span className="text-neutral-500">({log.recipientName})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>DELIVERED ({log.gatewayRef})</span>
                      </span>
                      <span className="text-neutral-500 text-[10px] font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-neutral-900 border border-neutral-850 rounded-lg text-neutral-200 font-mono text-[11px] leading-relaxed">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RRA 18% EBM INVOICING SUBTAB */}
      {activeSubTab === 'rra_ebm' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">Official RRA Electronic Billing Machine (EBM) Ledger</h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Compliant with Rwanda Revenue Authority (RRA) Law No 027/2022 on Electronic Invoicing Systems (EIS).
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-right text-xs">
              <span className="text-neutral-400 block text-[10px]">Total 18% VAT Remitted:</span>
              <span className="text-base font-extrabold font-mono text-emerald-400">
                {totalVatCollectedRwf.toLocaleString()} RWF
              </span>
            </div>
          </div>

          {rraInvoices.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No sales recorded yet. Ring up a sale in POS to generate your first certified RRA EBM invoice.
            </div>
          ) : (
            <div className="space-y-3">
              {rraInvoices.map((inv) => (
                <div
                  key={inv.saleId}
                  className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-900">
                    <div>
                      <span className="font-bold text-white text-sm">Receipt #{inv.receiptNumber}</span>
                      <span className="text-neutral-400 ml-2 font-mono text-[11px]">SDC: {inv.rraInvoice.sdcReceiptNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-white">{inv.totalAmountRwf.toLocaleString()} RWF</span>
                      <span className="text-[10px] text-emerald-400 block font-mono">
                        VAT (18%): +{inv.rraInvoice.vatAmountA_18.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-neutral-300">
                    <div className="p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">Taxable Base:</span>
                      <span className="font-bold text-white">{inv.rraInvoice.taxableAmountA_18.toLocaleString()} RWF</span>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">SDC Device ID:</span>
                      <span className="font-bold text-white">{inv.rraInvoice.sdcId}</span>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">Global Counter:</span>
                      <span className="font-bold text-white">{inv.rraInvoice.internalData.replace('RW01-000000', '#')}</span>
                    </div>
                    <div className="p-2 bg-neutral-900 rounded-lg">
                      <span className="text-neutral-500 block text-[10px]">Cashier:</span>
                      <span className="font-bold text-white">{inv.cashierName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-neutral-500 font-mono">
                      Digital Signature: <code className="text-neutral-400">{inv.rraInvoice.receiptSignature}</code>
                    </span>
                    <a
                      href={inv.rraInvoice.qrVerificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Verify on RRA Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 500 RWF COMPACTION CALCULATOR SUBTAB */}
      {activeSubTab === 'calculator' && (
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                The Daily Cash Leakage Compounding Visualizer
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              See how untracked losses destroy shop profitability
            </span>
          </div>

          {/* Slider Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300 font-semibold">Simulated Daily Discrepancy per Register:</span>
              <span className="font-mono font-bold text-base text-amber-400">
                {sliderDailyLeakage.toLocaleString()} RWF / day
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={sliderDailyLeakage}
              onChange={(e) => setSliderDailyLeakage(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>Minor coin loss</span>
              <span>Daily discrepancy</span>
              <span>1,000 RWF</span>
              <span>2,500 RWF</span>
              <span>Severe discrepancy</span>
            </div>
          </div>

          {/* Compounding Projections Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-[11px] text-neutral-400">1 Month (30 days)</div>
              <div className="text-base sm:text-lg font-bold font-mono text-neutral-200 mt-1">
                {compounding.monthly.toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">RWF</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-[11px] text-neutral-400">3 Months (Quarter)</div>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-1">
                {(compounding.daily * 90).toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">RWF</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="text-[11px] text-neutral-400">6 Months</div>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-300 mt-1">
                {compounding.sixMonths.toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">RWF</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-950 border border-red-500/30 rounded-xl bg-red-950/10">
              <div className="text-[11px] text-red-300">1 Full Year (365 days)</div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-red-400 mt-1">
                {compounding.yearly.toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">RWF</span>
              </div>
            </div>
          </div>

          {/* Real-World Equivalent Basket */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block">
              What That 1-Year Loss ({compounding.yearly.toLocaleString()} RWF) Equals in Rwandan Retail Value:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {compounding.equivalentBaskets.map((b, idx) => (
                <div key={idx} className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 text-left">
                  <span className="font-mono font-bold text-emerald-400 text-sm block">
                    {b.quantity.toLocaleString()}x
                  </span>
                  <span className="text-[11px] text-neutral-300">{b.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
