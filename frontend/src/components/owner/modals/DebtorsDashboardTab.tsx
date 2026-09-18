import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Phone, 
  Receipt, 
  X, 
  Trash2, 
  CreditCard,
  History,
  Check,
  Clock,
  ArrowRight,
  Save,
  Pencil
} from 'lucide-react';
import { db } from '../../../services/db';
import { DebtorRecord, User } from '../../../types';

interface DebtorsDashboardTabProps {
  currentUser: User;
  onRefreshData?: () => void;
}

export const DebtorsDashboardTab: React.FC<DebtorsDashboardTabProps> = ({
  currentUser,
  onRefreshData
}) => {
  const [debtors, setDebtors] = useState<DebtorRecord[]>(() => db.getDebtors());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'SETTLED'>('ALL');

  // Settlement Modal State
  const [settlingDebtor, setSettlingDebtor] = useState<DebtorRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<'CASH' | 'MOMO_MTN' | 'AIRTEL_MONEY' | 'BANK_TRANSFER'>('CASH');
  const [settleNotes, setSettleNotes] = useState('');
  const [settleSuccess, setSettleSuccess] = useState<string | null>(null);

  // Manual New Debtor Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualTotalAmount, setManualTotalAmount] = useState('');
  const [manualDueDate, setManualDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [manualNotes, setManualNotes] = useState('');

  // View Settlement History Modal
  const [viewHistoryDebtor, setViewHistoryDebtor] = useState<DebtorRecord | null>(null);

  // Edit Debtor Modal State
  const [editingDebtor, setEditingDebtor] = useState<DebtorRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  const reloadData = () => {
    const updated = db.getDebtors();
    setDebtors(updated);
    if (onRefreshData) onRefreshData();
  };

  // Metrics
  const totalDebtIssued = useMemo(() => debtors.reduce((acc, d) => acc + d.totalAmountRwf, 0), [debtors]);
  const totalDebtRecovered = useMemo(() => debtors.reduce((acc, d) => acc + d.paidAmountRwf, 0), [debtors]);
  const totalOutstanding = useMemo(() => debtors.reduce((acc, d) => acc + d.remainingBalanceRwf, 0), [debtors]);
  const activeDebtorsCount = useMemo(() => debtors.filter(d => d.status !== 'SETTLED').length, [debtors]);

  // Filtered List
  const filteredDebtors = useMemo(() => {
    return debtors.filter(d => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.customerName.toLowerCase().includes(q) ||
        d.customerPhone.toLowerCase().includes(q) ||
        (d.receiptNumber && d.receiptNumber.toLowerCase().includes(q))
      );
    });
  }, [debtors, statusFilter, searchQuery]);

  // Handle Settlement Submission
  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingDebtor) return;

    const amount = parseInt(settleAmount.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      alert('Shyiramo amafaranga yishyuwe afite agaciro.');
      return;
    }

    if (amount > settlingDebtor.remainingBalanceRwf) {
      alert(`Amafaranga yishyuwe (${amount.toLocaleString()} RWF) ntashobora kurenga asigaye (${settlingDebtor.remainingBalanceRwf.toLocaleString()} RWF).`);
      return;
    }

    const updated = db.settleDebtor(
      settlingDebtor.id,
      amount,
      settlePaymentMethod,
      currentUser.name,
      settleNotes.trim() || undefined
    );

    setSettleSuccess(`Kwishyuza ${amount.toLocaleString()} RWF byemejwe neza! Asigaye: ${updated.remainingBalanceRwf.toLocaleString()} RWF.`);
    setTimeout(() => {
      setSettleSuccess(null);
      setSettlingDebtor(null);
      setSettleAmount('');
      setSettleNotes('');
    }, 2000);

    reloadData();
  };

  // Handle Manual Debtor Creation
  const handleCreateManualDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(manualTotalAmount.replace(/\D/g, ''), 10);
    if (!manualCustomerName.trim() || !manualCustomerPhone.trim() || isNaN(amount) || amount <= 0) {
      alert("Uzuza amakuru yose y'umukiriya n'amafaranga asabwa.");
      return;
    }

    db.createDebtor({
      saleId: `manual-${Date.now()}`,
      receiptNumber: `CR-${Date.now().toString().slice(-6)}`,
      customerName: manualCustomerName.trim(),
      customerPhone: manualCustomerPhone.trim(),
      totalAmountRwf: amount,
      dueDate: manualDueDate,
      notes: manualNotes.trim() || 'Manual debt entry by Owner'
    });

    setIsManualModalOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualTotalAmount('');
    setManualNotes('');
    reloadData();
  };

  // Delete Debtor
  const handleDeleteDebtor = (id: string, name: string) => {
    if (confirm(`Urashaka koko gusiba ideni rya ${name}? Ibi ntibizashobora kugarurwa.`)) {
      db.deleteDebtor(id);
      reloadData();
    }
  };

  // Open Edit Debtor Modal (pre-fill form)
  const handleOpenEditDebtor = (debtor: DebtorRecord) => {
    setEditingDebtor(debtor);
    setEditName(debtor.customerName);
    setEditPhone(debtor.customerPhone);
    setEditTotalAmount(String(debtor.totalAmountRwf));
    setEditDueDate(debtor.dueDate || '');
    setEditNotes(debtor.notes || '');
    setEditSuccess(null);
  };

  // Save Debtor Edits
  const handleSaveDebtorEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebtor) return;

    const amount = parseFloat(editTotalAmount) || 0;
    if (!editName.trim()) {
      alert('Izina ry\'umukiriya ntirishobora kuba ubusa (Customer name is required).');
      return;
    }
    if (amount <= 0) {
      alert('Amafaranga y\'ideni agomba kuba arenze 0 RWF.');
      return;
    }

    const updated = db.updateDebtor(editingDebtor.id, {
      customerName: editName.trim(),
      customerPhone: editPhone.trim(),
      totalAmountRwf: amount,
      dueDate: editDueDate || undefined,
      notes: editNotes.trim() || undefined
    });

    setEditSuccess(`Ideni rya ${updated.customerName} ryahinduwe neza. Asigaye: ${updated.remainingBalanceRwf.toLocaleString()} RWF.`);
    setTimeout(() => {
      setEditSuccess(null);
      setEditingDebtor(null);
    }, 2000);

    reloadData();
  };

  return (
    <div className="space-y-6">
      {/* 4-KPI Metric Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40">
          <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
            <span>Outstanding Credit</span>
            <AlertCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">
            {totalOutstanding.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-purple-300/80 mt-1 font-medium">
            {activeDebtorsCount} Active debtors with balance
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Recovered / Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {totalDebtRecovered.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            {totalDebtIssued > 0 ? Math.round((totalDebtRecovered / totalDebtIssued) * 100) : 0}% recovery rate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Credit Issued</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {totalDebtIssued.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Lifetime credit sales &amp; advances
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Automated Status</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400">
            Live Sync
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Auto-logged from POS Credit Sales
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Shakisha ku izina, telefone, cyangwa numero ya fagitire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
          />
        </div>

        {/* Status Filter & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            {(['ALL', 'UNPAID', 'PARTIALLY_PAID', 'SETTLED'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Bose' : st === 'UNPAID' ? 'Batarishyura' : st === 'PARTIALLY_PAID' ? 'Abishyuwe Igice' : 'Barangije'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ongeramo Ideni Rishya</span>
          </button>
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Customer &amp; Phone</th>
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Total Debt</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Remaining Balance</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nta makuru y'amadeni aboneka mu byiciro wahisemo.
                  </td>
                </tr>
              ) : (
                filteredDebtors.map(debtor => {
                  const percentPaid = Math.min(100, Math.round((debtor.paidAmountRwf / debtor.totalAmountRwf) * 100));
                  const isSettled = debtor.status === 'SETTLED';

                  return (
                    <tr key={debtor.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{debtor.customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Phone className="w-3 h-3 text-purple-400" />
                          <span>{debtor.customerPhone}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {debtor.receiptNumber ? (
                          <span className="text-blue-400 font-semibold">{debtor.receiptNumber}</span>
                        ) : (
                          <span className="text-slate-500">Manual Entry</span>
                        )}
                      </td>

                      <td className="p-3.5 font-bold text-slate-200">
                        {debtor.totalAmountRwf.toLocaleString()} RWF
                      </td>

                      <td className="p-3.5 text-emerald-400 font-medium">
                        {debtor.paidAmountRwf.toLocaleString()} RWF
                        <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-400 rounded-full" 
                            style={{ width: `${percentPaid}%` }} 
                          />
                        </div>
                      </td>

                      <td className="p-3.5 font-bold font-mono text-purple-400">
                        {debtor.remainingBalanceRwf.toLocaleString()} RWF
                      </td>

                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {debtor.dueDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{debtor.dueDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSettled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : debtor.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {debtor.status === 'SETTLED' ? 'Yarishyuwe' : debtor.status === 'PARTIALLY_PAID' ? 'Igice' : 'Ntiyishyuye'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSettled && (
                            <button
                              id={`btn-settle-${debtor.id}`}
                              type="button"
                              onClick={() => {
                                setSettlingDebtor(debtor);
                                setSettleAmount(debtor.remainingBalanceRwf.toString());
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Kwishyuza</span>
                            </button>
                          )}

                          {debtor.settlements.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setViewHistoryDebtor(debtor)}
                              title="Reba uko yagiye yishyura"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditDebtor(debtor)}
                            title="Hindura amakuru y'ideni"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDebtor(debtor.id, debtor.customerName)}
                            title="Siba ideni"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETTLEMENT MODAL */}
      {settlingDebtor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#0b1329] border border-purple-800/60 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  <span>Kwishyuza Ideni (Debt Settlement)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Umukiriya: <strong className="text-white">{settlingDebtor.customerName}</strong> ({settlingDebtor.customerPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettlingDebtor(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settleSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{settleSuccess}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSettlement} className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Asigaye kwishyura:</span>
                <span className="text-base font-bold text-purple-400 font-mono">
                  {settlingDebtor.remainingBalanceRwf.toLocaleString()} RWF
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amafaranga Yishyuwe Ubu (Amount Paid) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  max={settlingDebtor.remainingBalanceRwf}
                  min={100}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold outline-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSettleAmount(settlingDebtor.remainingBalanceRwf.toString())}
                    className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 rounded-lg text-[11px] font-semibold"
                  >
                    Kwishyura Yose (Full: {settlingDebtor.remainingBalanceRwf.toLocaleString()} RWF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(Math.round(settlingDebtor.remainingBalanceRwf / 2).toString())}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px]"
                  >
                    Igice (50%)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Uburyo Yishyuwemo (Payment Channel)
                </label>
                <select
                  value={settlePaymentMethod}
                  onChange={(e: any) => setSettlePaymentMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                >
                  <option value="CASH">Cash mu Ntoki</option>
                  <option value="MOMO_MTN">MTN Mobile Money</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Icyitonderwa / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yishyuwe kuri MoMo nimero y'iduka"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettlingDebtor(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg cursor-pointer"
                >
                  Emeza Ubwishyu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SETTLEMENT HISTORY MODAL */}
      {viewHistoryDebtor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  <span>Amateka yo Kwishyura (Payment History)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {viewHistoryDebtor.customerName} &bull; Total: {viewHistoryDebtor.totalAmountRwf.toLocaleString()} RWF
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryDebtor(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {viewHistoryDebtor.settlements.map((st, idx) => (
                <div key={st.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-400">
                      +{st.amountPaidRwf.toLocaleString()} RWF
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(st.paidAt).toLocaleDateString()} &bull; {st.paymentMethod}
                    </div>
                    {st.notes && <div className="text-[10px] text-slate-500 italic">{st.notes}</div>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Byakiriwe na:</span>
                    <div className="font-semibold text-white">{st.receivedBy}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewHistoryDebtor(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Funga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL NEW DEBTOR MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#0b1329] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                <span>Ongeramo Ideni Rishya mu Gitabo</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualDebtor} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Izina ry'Umukiriya (Customer Full Name) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paul Kagabo"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Telefoni y'Umukiriya (Phone Number) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+250 788 000 000"
                  value={manualCustomerPhone}
                  onChange={(e) => setManualCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amafaranga Yose y'Ideni (Total Debt Amount RWF) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  placeholder="e.g. 50000"
                  value={manualTotalAmount}
                  onChange={(e) => setManualTotalAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Itariki yo Kwishyura (Due Date)
                </label>
                <input
                  type="date"
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ibisobanuro / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ibicuruzwa byafashwe ku ideni ku munsi w'isoko"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  Bika Ideni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEBTOR MODAL */}
      {editingDebtor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#0b1329] border border-amber-800/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-400" />
                  <span>Hindura Ideni (Edit Debtor)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ihinduze amakuru y'umukiriya: <strong className="text-white">{editingDebtor.customerName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDebtor(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDebtorEdits} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Izina ry'Umukiriya (Customer Full Name) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Telefoni y'Umukiriya (Phone Number)
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Amafaranga Yose y'Ideni (Total Debt RWF) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Itariki yo Kwishyura (Due Date)
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ibisobanuro / Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Yishyuwe:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {editingDebtor.paidAmountRwf.toLocaleString()} RWF
                </span>
              </div>

              {editSuccess && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDebtor(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Bika</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
