import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  FileText, 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  Building, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Download,
  CreditCard,
  Banknote,
  FileCheck,
  Users
} from 'lucide-react';
import { PurchaseInvoice, ShopExpense, User } from '../../../types';
import { db } from '../../../services/db';
import { DebtorsDashboardTab } from './DebtorsDashboardTab';

interface Card4InvoicesExpensesModalProps {
  currentUser: User;
  onClose: () => void;
  onRefreshData?: () => void;
  initialTab?: 'invoices' | 'expenses' | 'debtors';
}

export const Card4InvoicesExpensesModal: React.FC<Card4InvoicesExpensesModalProps> = ({
  currentUser,
  onClose,
  onRefreshData,
  initialTab = 'invoices'
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'debtors'>(initialTab);

  // Local state from DB
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(() => db.getInvoices());
  const [expenses, setExpenses] = useState<ShopExpense[]>(() => db.getExpenses());
  const [activeDebtorsCount, setActiveDebtorsCount] = useState<number>(() => {
    return db.getDebtors().filter(d => d.status !== 'SETTLED').length;
  });

  // Invoice Form State
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-5)}`);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceAmountRwf, setInvoiceAmountRwf] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOMO_MTN' | 'BANK_TRANSFER' | 'CREDIT'>('MOMO_MTN');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIALLY_PAID' | 'CREDIT_DEBT'>('PAID');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceFileAttached, setInvoiceFileAttached] = useState<string | null>(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);

  // Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<ShopExpense['category']>('ELECTRICITY_REG');
  const [expenseAmountRwf, setExpenseAmountRwf] = useState('');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'CASH' | 'MOMO_MTN' | 'AIRTEL_MONEY' | 'BANK'>('CASH');
  // MANDATORY DESCRIPTION FIELD
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const reloadData = () => {
    setInvoices(db.getInvoices());
    setExpenses(db.getExpenses());
    setActiveDebtorsCount(db.getDebtors().filter(d => d.status !== 'SETTLED').length);
    if (onRefreshData) onRefreshData();
  };

  // Submit Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !invoiceAmountRwf.trim()) {
      alert('Shyiramo izina rya Supplier n\'amafaranga yishyuwe.');
      return;
    }

    const amount = parseFloat(invoiceAmountRwf) || 0;
    const newInvoice: PurchaseInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim(),
      supplierName: supplierName.trim(),
      totalAmountRwf: amount,
      paymentMethod,
      paymentStatus,
      date: new Date().toISOString().split('T')[0],
      itemsSummary: invoiceNotes.trim() || 'General shop restock items',
      attachmentName: invoiceFileAttached || undefined,
      createdAt: new Date().toISOString()
    };

    db.saveInvoice(newInvoice);
    setInvoiceSuccess(`Facture #${newInvoice.invoiceNumber} ya ${newInvoice.supplierName} yabitswe neza!`);
    setTimeout(() => setInvoiceSuccess(null), 3500);

    // Reset Form
    setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`);
    setSupplierName('');
    setInvoiceAmountRwf('');
    setInvoiceNotes('');
    setInvoiceFileAttached(null);
    reloadData();
  };

  // Delete Invoice
  const handleDeleteInvoice = (id: string, num: string) => {
    if (confirm(`Urashaka gusiba Facture #${num}?`)) {
      db.deleteInvoice(id);
      reloadData();
    }
  };

  // Submit Expense with MANDATORY description validation
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError(null);

    const amount = parseFloat(expenseAmountRwf) || 0;
    if (amount <= 0) {
      setExpenseError('Shyiramo amafaranga asohotse arenze 0 RWF.');
      return;
    }

    // MANDATORY DESCRIPTION VALIDATION: Must not be empty and must be detailed
    if (!expenseDescription.trim() || expenseDescription.trim().length < 8) {
      setExpenseError('Ibisobanuro by\'amafaranga asohotse birakenewe (Mandatory description required, min 8 chars). Sobanura impamvu ayo mafaranga asohotse.');
      return;
    }

    const newExpense: ShopExpense = {
      id: `exp-${Date.now()}`,
      category: expenseCategory,
      amountRwf: amount,
      description: expenseDescription.trim(),
      paidTo: 'Provider / Vendor',
      approvedBy: currentUser.name,
      paymentMethod: expensePaymentMethod,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    db.saveExpense(newExpense);
    setExpenseSuccess(`Amafaranga asohotse ${amount.toLocaleString()} RWF (${expenseCategory}) yanditswe neza!`);
    setTimeout(() => setExpenseSuccess(null), 3500);

    // Reset Form
    setExpenseAmountRwf('');
    setExpenseDescription('');
    reloadData();
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (confirm('Urashaka gusiba aya makuru y\'amafaranga asohotse?')) {
      db.deleteExpense(id);
      reloadData();
    }
  };

  // Mock Upload attachment for invoice
  const handleUploadInvoiceAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        setInvoiceFileAttached(file.name);
      }
    };
    input.click();
  };

  // Aggregates
  const totalInvoicesValue = useMemo(() => {
    return invoices.reduce((acc, i) => acc + i.totalAmountRwf, 0);
  }, [invoices]);

  const totalExpensesValue = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.amountRwf, 0);
  }, [expenses]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(i => i.supplierName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
  }, [invoices, searchQuery]);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(e => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
  }, [expenses, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Restock, Invoices & Expense Tracking (Kurangura)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Card 4
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kubika Facture/Invoices z'ibyo waranguye no kwandika amakuru y'amafaranga asohoka (expenses & payroll).
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
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-800 flex gap-2 bg-slate-900/30 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'invoices'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Facture zo Kurangura (Invoices) ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'expenses'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Amafaranga Asoka (Expenses) ({expenses.length})</span>
          </button>

          <button
            id="tab-debtors-dashboard"
            type="button"
            onClick={() => setActiveTab('debtors')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'debtors'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Igitabo cy'Amadeni (Debtors Dashboard)</span>
            {activeDebtorsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {activeDebtorsCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: PURCHASE INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* Aggregate Metric Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Total Invoices Recorded:</span>
                    <div className="text-xl font-bold text-white mt-0.5">{invoices.length} Factures</div>
                  </div>
                  <FileCheck className="w-8 h-8 text-amber-400/50" />
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-300 uppercase font-semibold">Total Restock Spend (Ayaranguwe):</span>
                    <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                      {totalInvoicesValue.toLocaleString()} RWF
                    </div>
                  </div>
                  <Receipt className="w-8 h-8 text-amber-400/60" />
                </div>
              </div>

              {invoiceSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{invoiceSuccess}</span>
                </div>
              )}

              {/* Add Purchase Invoice Form */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Kwandika Facture Nshya yo Kurangura (Record Purchase Invoice)</span>
                </h3>

                <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Inimero ya Facture (Invoice #) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Izina rya Supplier / Depot <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="urugero: Bralirwa, Inyange, Kimironko Depot..."
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Amafaranga Yose Yishyuwe (Amount RWF) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="urugero: 350000"
                        value={invoiceAmountRwf}
                        onChange={(e) => setInvoiceAmountRwf(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-amber-300 font-bold placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Uburyo Bwishyuwemo (Payment Method)
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="MOMO">MTN MoMo Pay / Airtel Money</option>
                        <option value="CASH">Cash (Amafaranga mu Ntoki)</option>
                        <option value="BANK_TRANSFER">Bank Transfer (BK, Equity, I&M)</option>
                        <option value="CREDIT">Ideni (Supplier Credit / Icyemezo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Status y'Ubwishyu (Payment Status)
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="PAID">PAID (Byose Byishyuwe)</option>
                        <option value="PARTIALLY_PAID">PARTIALLY PAID (Hishyuwe Igice)</option>
                        <option value="PENDING">PENDING (Bitegereje Kwishyurwa)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Ifoto cyangwa PDF ya Facture
                      </label>
                      <button
                        type="button"
                        onClick={handleUploadInvoiceAttachment}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-300 flex items-center justify-center gap-2 transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">{invoiceFileAttached || 'Shyiraho File (Upload)'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Ibyaranguwe / Ibisobanuro (Items / Delivery Notes)
                    </label>
                    <input
                      type="text"
                      placeholder="urugero: Amakarito 10 ya Primus, Amakarito 5 ya Mutzig, Fanta Orange..."
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-amber-950/40"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Bika Facture muri Sisitemu (Save Invoice)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Invoices List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Urutonde rwa Facture Zimaze Kubikwa ({invoices.length}):
                  </h4>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Shakisha supplier cyangwa #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{inv.supplierName}</span>
                            <span className="font-mono text-xs text-slate-400">({inv.invoiceNumber})</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{inv.itemsSummary}</p>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span>Date: {inv.date}</span>
                            <span>&bull;</span>
                            <span>Paid via: {inv.paymentMethod}</span>
                            {inv.attachmentName && (
                              <>
                                <span>&bull;</span>
                                <span className="text-amber-400 flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> {inv.attachmentName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-amber-300 font-mono">
                            {inv.totalAmountRwf.toLocaleString()} RWF
                          </span>
                          <span className="text-[10px] text-slate-500 block">Restock Value</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Siba Facture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHOP EXPENSES (AMAFARANGA ASOHOKA) */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Aggregate Banner */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold">Total Expenses Recorded:</span>
                  <div className="text-2xl font-bold text-rose-400 font-mono mt-0.5">
                    {totalExpensesValue.toLocaleString()} RWF
                  </div>
                  <span className="text-[11px] text-slate-500">Rent, electricity, transport, payroll & repairs</span>
                </div>
                <CreditCard className="w-8 h-8 text-rose-400/60" />
              </div>

              {expenseSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{expenseSuccess}</span>
                </div>
              )}

              {expenseError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{expenseError}</span>
                </div>
              )}

              {/* Add Expense Form */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Kwandika Amafaranga Asohotse (Record Store Expense)</span>
                </h3>

                <form onSubmit={handleCreateExpense} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Icyiciro cy'Amafaranga (Expense Category) <span className="text-amber-400">*</span>
                      </label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="UTILITIES">Umuriro na Amazi (REG & WASAC)</option>
                        <option value="RENT">Ubukode bw'Inzu (Shop Rent)</option>
                        <option value="SALARY">Umushahara / Advance (Staff Payroll)</option>
                        <option value="TRANSPORT">Transport (Ikamyo, Moto, Taxi)</option>
                        <option value="CLEANING">Isuku n'Ibikoresho (Cleaning)</option>
                        <option value="SECURITY">Umutekano (Night Guard / Security)</option>
                        <option value="OTHER">Ibindi Bidasanzwe (Other Operations)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Amafaranga Yasohotse (Amount RWF) <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="urugero: 15000"
                        value={expenseAmountRwf}
                        onChange={(e) => setExpenseAmountRwf(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-rose-400 font-bold placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Uburyo Yishyuwemo (Payment Method)
                      </label>
                      <select
                        value={expensePaymentMethod}
                        onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="CASH">Cash mu Isanduku (From Cash Drawer)</option>
                        <option value="MOMO">MTN Mobile Money</option>
                        <option value="BANK_TRANSFER">Bank Account Transfer</option>
                      </select>
                    </div>
                  </div>

                  {/* MANDATORY REQUIRED DESCRIPTION FIELD */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Impamvu n'Ibisobanuro By'Amafaranga Yasohotse (Mandatory Description / Reason) <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Urugero: Kwishyura umuriro wa Cashpower w'ukwezi kwa 3 (Meter: 04231899...) cyangwa Advance ya Jean Bosco..."
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Itangaze impamvu ifatika n'ubusobanuro kugira ngo ibarura ry'amafaranga asohoka ryemerwe.
                    </span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-rose-950/40"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Andika Ayo Mafaranga (Log Expense)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Expense History List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Amakuru y'Amafaranga Yasohotse (Expense Log History):
                </h4>

                <div className="space-y-2.5">
                  {filteredExpenses.map(exp => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{exp.category}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {exp.paymentMethod}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                            {exp.description}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Date: {exp.date} &bull; Approved by: {exp.approvedBy}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-rose-400 font-mono">
                            -{exp.amountRwf.toLocaleString()} RWF
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Siba iyi expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEBTORS DASHBOARD */}
          {activeTab === 'debtors' && (
            <DebtorsDashboardTab
              currentUser={currentUser}
              onRefreshData={reloadData}
            />
          )}
        </div>
      </div>
    </div>
  );
};
