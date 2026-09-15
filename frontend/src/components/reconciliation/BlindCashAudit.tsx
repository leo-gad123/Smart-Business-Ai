import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Coins, 
  Banknote, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  FileText, 
  History, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { ShiftRegister, User, CashDenominationCount, FraudAlert } from '../../types';
import { SpotCheckModal } from './SpotCheckModal';
import { Product, SpotCheckAudit } from '../../types';

interface BlindCashAuditProps {
  currentShift: ShiftRegister | null;
  currentUser: User;
  shiftsHistory: ShiftRegister[];
  products: Product[];
  onOpenShift: (cashier: User, openingCashFloat: number, openingMomoFloat: number) => void;
  onCloseShiftBlind: (params: {
    actualCashCountedRwf: number;
    actualMomoCountedRwf: number;
    cashDenominations: CashDenominationCount;
    discrepancyNote?: string;
    closedByAuditorName: string;
  }) => void;
  onRecordSpotCheck: (audit: SpotCheckAudit) => void;
}

export const BlindCashAudit: React.FC<BlindCashAuditProps> = ({
  currentShift,
  currentUser,
  shiftsHistory,
  products,
  onOpenShift,
  onCloseShiftBlind,
  onRecordSpotCheck
}) => {
  // Open Shift Form State
  const [openingCashFloat, setOpeningCashFloat] = useState('20000');
  const [openingMomoFloat, setOpeningMomoFloat] = useState('50000');

  // Blind Count Denominations State
  const [denominations, setDenominations] = useState<CashDenominationCount>({
    note20000: 0,
    note10000: 2,
    note5000: 6,
    note2000: 15,
    note1000: 24,
    note500: 10,
    coins: 500
  });

  const [actualMomoBalance, setActualMomoBalance] = useState('50000');
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [isSpotCheckOpen, setIsSpotCheckOpen] = useState(false);
  const [lastReconciliationResult, setLastReconciliationResult] = useState<ShiftRegister | null>(null);

  // Compute actual physical cash total
  const countedCashTotalRwf = useMemo(() => {
    return (
      (denominations.note20000 * 20000) +
      (denominations.note10000 * 10000) +
      (denominations.note5000 * 5000) +
      (denominations.note2000 * 2000) +
      (denominations.note1000 * 1000) +
      (denominations.note500 * 500) +
      (denominations.coins)
    );
  }, [denominations]);

  const countedMomoTotalRwf = parseFloat(actualMomoBalance) || 0;

  const handleDenominationChange = (key: keyof CashDenominationCount, value: string) => {
    const num = parseInt(value, 10) || 0;
    setDenominations(prev => ({
      ...prev,
      [key]: Math.max(0, num)
    }));
  };

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(openingCashFloat) || 0;
    const momo = parseFloat(openingMomoFloat) || 0;
    onOpenShift(currentUser, cash, momo);
  };

  const handleBlindReconcileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    if (countedCashTotalRwf === 0) {
      if (!confirm('You entered 0 RWF physical cash counted. Are you sure?')) return;
    }

    onCloseShiftBlind({
      actualCashCountedRwf: countedCashTotalRwf,
      actualMomoCountedRwf: countedMomoTotalRwf,
      cashDenominations: denominations,
      discrepancyNote: discrepancyNote.trim() || undefined,
      closedByAuditorName: currentUser.name
    });

    // Capture closed preview
    const cashVariance = countedCashTotalRwf - currentShift.expectedCashInDrawerRwf;
    setLastReconciliationResult({
      ...currentShift,
      actualCashCountedRwf: countedCashTotalRwf,
      actualMomoCountedRwf: countedMomoTotalRwf,
      cashVarianceRwf: cashVariance,
      momoVarianceRwf: countedMomoTotalRwf - currentShift.expectedMomoInAccountRwf,
      status: cashVariance < 0 ? 'CLOSED_SHORTAGE' : cashVariance > 0 ? 'CLOSED_SURPLUS' : 'CLOSED_BALANCED'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-6">
      {/* Top Explanation Banner */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Blind Cash Reconciliation System</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Anti-Theft Protocol
              </span>
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl mt-0.5">
              Cashiers must physically count and input Rwandan banknotes without seeing the computer's expected total. This prevents hiding daily cash shortages or falsifying change.
            </p>
          </div>
        </div>

        {currentUser.role === 'owner' && (
          <button
            id="btn-trigger-spot-check"
            onClick={() => setIsSpotCheckOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Surprise Spot-Check</span>
          </button>
        )}
      </div>

      {/* Main Reconciliation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Shift Terminal or Open Shift Prompt (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!currentShift ? (
            /* Open Shift Float Setup Card */
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span>Open Register Shift & Set Morning Float</span>
              </div>
              <p className="text-xs text-neutral-400">
                Set the physical cash drawer float and MTN Mobile Money starting balance before the cashier starts ringing up sales.
              </p>

              <form onSubmit={handleOpenShiftSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Cash Drawer Opening Float (RWF)
                    </label>
                    <div className="relative">
                      <Banknote className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-opening-cash"
                        type="number"
                        value={openingCashFloat}
                        onChange={(e) => setOpeningCashFloat(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      MTN MoMo Starting Account Balance (RWF)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-opening-momo"
                        type="number"
                        value={openingMomoFloat}
                        onChange={(e) => setOpeningMomoFloat(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-400">
                  Cashier on duty: <span className="text-white font-bold">{currentUser.name}</span> ({currentUser.role === 'owner' ? 'Owner' : 'Employee'})
                </div>

                <button
                  id="btn-confirm-open-shift"
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Lock In Float & Open Shift</span>
                </button>
              </form>
            </div>
          ) : (
            /* Active Shift: Blind Cash Count Form */
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider font-mono">
                    ACTIVE SHIFT RUNNING
                  </span>
                  <h3 className="text-base font-extrabold text-white">{currentShift.shiftCode}</h3>
                </div>
                <div className="text-right text-xs text-neutral-400 font-mono">
                  Started: {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Blind Count Notice */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>System Expected Total: <strong className="text-neutral-500 font-mono">HIDDEN (Blind Close)</strong></span>
                </div>
                <span className="text-[11px] text-amber-400 font-medium">Anti-Theft Active</span>
              </div>

              <form onSubmit={handleBlindReconcileSubmit} className="space-y-4">
                <label className="text-xs font-bold text-neutral-300 block uppercase tracking-wider text-[11px]">
                  Physical Rwandan Currency Count
                </label>

                {/* Rwandan Banknotes Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* 20,000 RWF */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-neutral-300">20,000 RWF note</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.note20000 || ''}
                      onChange={(e) => handleDenominationChange('note20000', e.target.value)}
                      placeholder="Count"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-center font-mono font-bold text-white text-xs outline-none"
                    />
                    <div className="text-[10px] text-right font-mono text-neutral-500">
                      ={(denominations.note20000 * 20000).toLocaleString()}
                    </div>
                  </div>

                  {/* 10,000 RWF */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-neutral-300">10,000 RWF note</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.note10000 || ''}
                      onChange={(e) => handleDenominationChange('note10000', e.target.value)}
                      placeholder="Count"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-center font-mono font-bold text-white text-xs outline-none"
                    />
                    <div className="text-[10px] text-right font-mono text-neutral-500">
                      ={(denominations.note10000 * 10000).toLocaleString()}
                    </div>
                  </div>

                  {/* 5,000 RWF */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-neutral-300">5,000 RWF note</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.note5000 || ''}
                      onChange={(e) => handleDenominationChange('note5000', e.target.value)}
                      placeholder="Count"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-center font-mono font-bold text-white text-xs outline-none"
                    />
                    <div className="text-[10px] text-right font-mono text-neutral-500">
                      ={(denominations.note5000 * 5000).toLocaleString()}
                    </div>
                  </div>

                  {/* 2,000 RWF */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-neutral-300">2,000 RWF note</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.note2000 || ''}
                      onChange={(e) => handleDenominationChange('note2000', e.target.value)}
                      placeholder="Count"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-center font-mono font-bold text-white text-xs outline-none"
                    />
                    <div className="text-[10px] text-right font-mono text-neutral-500">
                      ={(denominations.note2000 * 2000).toLocaleString()}
                    </div>
                  </div>

                  {/* 1,000 RWF */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-neutral-300">1,000 RWF note</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.note1000 || ''}
                      onChange={(e) => handleDenominationChange('note1000', e.target.value)}
                      placeholder="Count"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-center font-mono font-bold text-white text-xs outline-none"
                    />
                    <div className="text-[10px] text-right font-mono text-neutral-500">
                      ={(denominations.note1000 * 1000).toLocaleString()}
                    </div>
                  </div>

                  {/* 500 RWF Note & Coins */}
                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-neutral-300">500 RWF & Coins</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.note500 || ''}
                      onChange={(e) => handleDenominationChange('note500', e.target.value)}
                      placeholder="500s"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-center font-mono font-bold text-white text-xs outline-none"
                    />
                    <div className="text-[10px] text-right font-mono text-neutral-500">
                      ={(denominations.note500 * 500 + denominations.coins).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Mobile Money Ending Float Count */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Ending MTN MoMo Float Balance (RWF)
                  </label>
                  <input
                    type="number"
                    value={actualMomoBalance}
                    onChange={(e) => setActualMomoBalance(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-amber-400"
                    placeholder="e.g. 113000"
                    required
                  />
                </div>

                {/* Cashier Closing Note */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Cashier Handover Notes / Discrepancy Explanation
                  </label>
                  <input
                    type="text"
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    placeholder="e.g. Customer change shortage of 200 RWF or paid supplier delivery"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Total Counted Banner */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Total Physical Cash Handed Over:</span>
                  <span className="text-sm font-extrabold font-mono text-emerald-400">
                    {countedCashTotalRwf.toLocaleString()} RWF
                  </span>
                </div>

                <button
                  id="btn-submit-blind-close"
                  type="submit"
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Blind Count & Reveal Variance Report</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Reconciliation Audit Ledger & Shift History (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Latest Reconciliation Card if just closed */}
          {lastReconciliationResult && (
            <div className="p-4 bg-neutral-900 border border-neutral-750 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="font-bold text-xs text-white">Audit Variance Result</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  lastReconciliationResult.status === 'CLOSED_SHORTAGE'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {lastReconciliationResult.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>System Expected Cash:</span>
                  <span className="font-mono text-white">
                    {lastReconciliationResult.expectedCashInDrawerRwf.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Actual Physical Counted:</span>
                  <span className="font-mono text-white font-bold">
                    {lastReconciliationResult.actualCashCountedRwf?.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-800 text-sm font-bold">
                  <span>Cash Drawer Discrepancy:</span>
                  <span className={`font-mono ${
                    (lastReconciliationResult.cashVarianceRwf || 0) < 0 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {lastReconciliationResult.cashVarianceRwf && lastReconciliationResult.cashVarianceRwf > 0 ? '+' : ''}
                    {lastReconciliationResult.cashVarianceRwf?.toLocaleString()} RWF
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Historical Shifts Log */}
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Historical Shift Registers</span>
              </div>
              <span className="text-[11px] text-neutral-400">{shiftsHistory.length} recorded</span>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {shiftsHistory.map((shift) => {
                const isShortage = (shift.cashVarianceRwf || 0) < 0;

                return (
                  <div
                    key={shift.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white">{shift.shiftCode}</div>
                        <div className="text-[11px] text-neutral-400">Cashier: {shift.cashierName}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isShortage
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {shift.cashVarianceRwf ? `${shift.cashVarianceRwf > 0 ? '+' : ''}${shift.cashVarianceRwf.toLocaleString()} RWF` : 'Balanced'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-900 font-mono">
                      <span>Cash Sales: {shift.totalCashSalesRwf.toLocaleString()} RWF</span>
                      <span>MoMo: {shift.totalMomoSalesRwf.toLocaleString()} RWF</span>
                    </div>

                    {shift.discrepancyNote && (
                      <div className="text-[10px] text-amber-300/90 italic bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                        "{shift.discrepancyNote}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Spot Check Modal */}
      <SpotCheckModal
        isOpen={isSpotCheckOpen}
        onClose={() => setIsSpotCheckOpen(false)}
        products={products}
        currentUser={currentUser}
        onRecordSpotCheck={onRecordSpotCheck}
      />
    </div>
  );
};
