import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  DollarSign, 
  Smartphone, 
  Receipt,
  X,
  FileText
} from 'lucide-react';
import { ShiftRegister, User } from '../../types';
import { db } from '../../services/db';

interface BlindReconciliationModalProps {
  shift: ShiftRegister;
  currentUser: User;
  onClose: () => void;
  onShiftClosed: (closedShift: ShiftRegister) => void;
}

export const BlindReconciliationModal: React.FC<BlindReconciliationModalProps> = ({
  shift,
  currentUser,
  onClose,
  onShiftClosed
}) => {
  const [cashInHand, setCashInHand] = useState<string>('');
  const [momoInPhone, setMomoInPhone] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state after blind submission
  const [auditResult, setAuditResult] = useState<{
    closedShift: ShiftRegister;
    expectedCash: number;
    countedCash: number;
    cashVariance: number;
    expectedMomo: number;
    countedMomo: number;
    momoVariance: number;
    expectedTotal: number;
    countedTotal: number;
    totalVariance: number;
    ownerSmsSent: boolean;
    ownerPhone: string;
    ownerName: string;
  } | null>(null);

  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualCash = parseFloat(cashInHand) || 0;
    const actualMomo = parseFloat(momoInPhone) || 0;

    setIsSubmitting(true);

    try {
      const result = db.closeShiftWithBlindCount({
        actualCashCountedRwf: actualCash,
        actualMomoCountedRwf: actualMomo,
        cashDenominations: {
          note5000: 0,
          note2000: 0,
          note1000: 0,
          note500: 0,
          coins: 0,
          coin100: 0,
          coin50: 0
        },
        discrepancyNote: note.trim() || undefined,
        closedByAuditorName: currentUser.name
      });

      const owner = db.getUsers().find(u => u.role === 'owner') || currentUser;
      const expectedCash = shift.expectedCashInDrawerRwf;
      const expectedMomo = shift.expectedMomoInAccountRwf;
      const expectedTotal = expectedCash + expectedMomo;
      const countedTotal = actualCash + actualMomo;
      const totalVariance = countedTotal - expectedTotal;

      setAuditResult({
        closedShift: result.shift,
        expectedCash,
        countedCash: actualCash,
        cashVariance: actualCash - expectedCash,
        expectedMomo,
        countedMomo: actualMomo,
        momoVariance: actualMomo - expectedMomo,
        expectedTotal,
        countedTotal,
        totalVariance,
        ownerSmsSent: true,
        ownerPhone: owner.phone || '+250 788 123 456',
        ownerName: owner.name
      });
    } catch (err) {
      console.error('Error closing shift:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeAndExit = () => {
    if (auditResult) {
      onShiftClosed(auditResult.closedShift);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-red-950/80 to-neutral-900 border-b border-red-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Gusoza Shift / Blind Reconciliation
              </h3>
              <p className="text-xs text-neutral-400">
                Shift: <span className="font-mono text-neutral-200 font-semibold">{shift.shiftCode}</span> • Cashier: <span className="text-neutral-200">{currentUser.name}</span>
              </p>
            </div>
          </div>
          {!auditResult && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step 1: Blind Inputs Form */}
        {!auditResult ? (
          <form onSubmit={handleSubmitAudit} className="p-5 space-y-4">
            {/* Anti-Theft Explanation Banner */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed">
                <span className="font-semibold text-white">Kubarura Kase mu Ibanga (Blind Count):</span>{' '}
                Andika amafaranga nyakuri ufashe mu ntoki (mu kase) n'ari kuri telefone ya MoMo. Sisitemu ntiyerekana ayo yiteze mbere yo kubarura kugira ngo hirindwe inyerezwa ry'amafaranga.
              </div>
            </div>

            {/* Input 1: Cash in Hand */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Amafaranga ari mu Kase / Cash in Hand (RWF)</span>
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-blind-cash"
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 104000"
                  value={cashInHand}
                  onChange={(e) => setCashInHand(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-base text-white font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500 font-mono">
                  RWF
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Bara inoti n'ibiceri byose biri muri tiriwawari (drawer) yawe y'uyu munsi.
              </p>
            </div>

            {/* Input 2: MoMo in Work Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Amafaranga ari kuri MoMo / Telephone ya Kazi (RWF)</span>
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-blind-momo"
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 113000"
                  value={momoInPhone}
                  onChange={(e) => setMomoInPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-base text-white font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500 font-mono">
                  RWF
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Reba ubutumwa bwa MoMo MTN / Airtel Money bwa nyuma kuri telefone ya kazi.
              </p>
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ibisobanuro niba hari ikibazo (Optional Note)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Amafaranga yasigaye ku muguzi..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-neutral-600 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-xl transition"
              >
                Guhagarika (Cancel)
              </button>
              <button
                id="btn-submit-blind-audit"
                type="submit"
                disabled={isSubmitting || !cashInHand || !momoInPhone}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/40"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? 'Iri kubara...' : 'Genzura & Soza Akazi (Submit Blind Audit)'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: System Audit Calculation & Result Card */
          <div className="p-5 space-y-4">
            {/* Discrepancy or Exact Match Alert Card */}
            {auditResult.totalVariance === 0 ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-emerald-300">
                    Inyerezwa: 0 RWF (Kase Irashyitse Neza - Exact Match)
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Amafaranga wabaruye mu kase no kuri MoMo ahuye neza 100% n'ayo sisitemu yacuruje muri shift yawe. Nta gihombo cyangwa inyerezwa ribonetse!
                  </p>
                </div>
              </div>
            ) : auditResult.totalVariance < 0 ? (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                      Shortage Alert
                    </span>
                    <h4 className="font-bold text-sm text-red-300">
                      Habuzemo: -{Math.abs(auditResult.totalVariance).toLocaleString()} RWF
                    </h4>
                  </div>
                  <p className="text-xs text-red-200/90 leading-relaxed">
                    Hakozwe raporo y'inyerezwa ry'amafaranga. Sisitemu ibonye ikinyuranyo cya -{Math.abs(auditResult.totalVariance).toLocaleString()} RWF hagati y'ayo wacuruje n'ayo wazanye mu kase.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-emerald-300">
                    Harenzeho: +{auditResult.totalVariance.toLocaleString()} RWF (Surplus Detected)
                  </h4>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Amafaranga watanze mu kase arenzeho ayo sisitemu yiteze. Ibi byashyizwe mu nyandiko z'ubugenzuzi.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Breakdown Comparison Grid */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-850">
                <span className="text-neutral-400 font-medium">Umuyoboro w'Amafaranga</span>
                <span className="text-neutral-400 font-medium text-right">Ayo Sisitemu Yiteze / Ayabaruwe</span>
              </div>

              {/* Cash Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-neutral-300">Kase (Cash in Drawer):</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-neutral-400">{auditResult.expectedCash.toLocaleString()}</span>
                  <span className="text-neutral-500 mx-1">→</span>
                  <span className="font-bold text-white">{auditResult.countedCash.toLocaleString()} RWF</span>
                  {auditResult.cashVariance !== 0 && (
                    <span className={`ml-2 text-[11px] font-semibold ${auditResult.cashVariance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ({auditResult.cashVariance > 0 ? '+' : ''}{auditResult.cashVariance.toLocaleString()} RWF)
                    </span>
                  )}
                </div>
              </div>

              {/* MoMo Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-neutral-300">MoMo (Telefone ya Kazi):</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-neutral-400">{auditResult.expectedMomo.toLocaleString()}</span>
                  <span className="text-neutral-500 mx-1">→</span>
                  <span className="font-bold text-white">{auditResult.countedMomo.toLocaleString()} RWF</span>
                  {auditResult.momoVariance !== 0 && (
                    <span className={`ml-2 text-[11px] font-semibold ${auditResult.momoVariance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ({auditResult.momoVariance > 0 ? '+' : ''}{auditResult.momoVariance.toLocaleString()} RWF)
                    </span>
                  )}
                </div>
              </div>

              {/* Total Row */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-850 font-semibold">
                <span className="text-white">Igiteranyo Cyose (Total):</span>
                <div className="text-right font-mono">
                  <span className="text-neutral-400">{auditResult.expectedTotal.toLocaleString()}</span>
                  <span className="text-neutral-500 mx-1">vs</span>
                  <span className={`font-bold ${auditResult.totalVariance === 0 ? 'text-emerald-400' : auditResult.totalVariance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {auditResult.countedTotal.toLocaleString()} RWF
                  </span>
                </div>
              </div>
            </div>

            {/* Store Owner SMS Notification Badge */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Send className="w-3.5 h-3.5" />
                  <span>SMS Yihuse Yoherejwe kuri Nyir'ubucuruzi</span>
                </div>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  DELIVERED
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                Recipient: <span className="text-neutral-200">{auditResult.ownerName}</span> ({auditResult.ownerPhone})
              </p>
              <div className="p-2 bg-neutral-900 rounded-lg text-[11px] text-neutral-300 font-mono border border-neutral-800">
                [SmartStock Shift Report] {auditResult.totalVariance === 0 ? '✅ Inyerezwa: 0 RWF' : `⚠️ Habuzemo: -${Math.abs(auditResult.totalVariance).toLocaleString()} RWF`} • Cashier {currentUser.name} • Total: {auditResult.countedTotal.toLocaleString()} RWF.
              </div>
            </div>

            {/* Final Action */}
            <button
              id="btn-finalize-shift-close"
              type="button"
              onClick={handleFinalizeAndExit}
              className="w-full py-3.5 bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xl"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Funga Shift & Sohoka (Finalize & End Shift)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
