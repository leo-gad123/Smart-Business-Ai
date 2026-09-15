import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Receipt, 
  Sparkles, 
  Bot, 
  ArrowRight,
  Mail,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import { 
  Product, 
  User as UserType, 
  BusinessGoals, 
  SaleTransaction, 
  ShiftRegister 
} from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card1StockProductModal } from './modals/Card1StockProductModal';
import { Card2EmployeeShiftModal } from './modals/Card2EmployeeShiftModal';
import { Card3RevenueAnalyticsModal } from './modals/Card3RevenueAnalyticsModal';
import { Card4InvoicesExpensesModal } from './modals/Card4InvoicesExpensesModal';
import { Card5SmartAIAssistantModal } from './modals/Card5SmartAIAssistantModal';
import { WeeklyPerformanceReportModal } from './modals/WeeklyPerformanceReportModal';
import { MtnMomoPaymentModal } from '../payment/MtnMomoPaymentModal';
import { OwnerSubscriptionDashboard } from './modals/OwnerSubscriptionDashboard';

interface OwnerDashboardProps {
  products: Product[];
  currentUser: UserType;
  allUsers: UserType[];
  businessGoals: BusinessGoals;
  sales?: SaleTransaction[];
  shifts?: ShiftRegister[];
  onSaveProduct: (product: Product) => void;
  onSaveUser: (user: UserType) => void;
  onSaveBusinessGoals: (goals: BusinessGoals) => void;
  onResetToZeroData?: () => void;
  onNavigateToPOS: () => void;
  onNavigateToLanding?: () => void;
  onNavigateToInventory?: () => void;
  onRefreshData?: () => void;
  isNewUser?: boolean;
}

type ModalCardType = 'card1_stock' | 'card2_employee' | 'card3_revenue' | 'card4_invoices' | 'card5_ai' | 'weekly_report' | null;

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  products,
  currentUser,
  allUsers,
  sales = [],
  shifts = [],
  onSaveProduct,
  onSaveUser,
  onNavigateToPOS,
  onNavigateToInventory,
  onRefreshData
}) => {
  const { t } = useLanguage();

  // Modal state - null by default ensuring uncluttered screen
  const [activeModal, setActiveModal] = useState<ModalCardType>(null);
  const [card4Tab, setCard4Tab] = useState<'invoices' | 'expenses' | 'debtors'>('invoices');
  const [aiPrompt, setAiPrompt] = useState<string | undefined>(undefined);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* ========================================================================= */}
        {/* OWNER DASHBOARD HEADER - CLEAN COMPACT TYPOGRAPHIC HIERARCHY */}
        {/* ========================================================================= */}
        <div className="text-center space-y-2 pt-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome, {currentUser.name || 'Jean-Claude Mugabo'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Select an action for today:
          </p>

          {/* MTN MoMo Subscription Status / Demo Mode Indicator */}
          {(!currentUser.subscriptionStatus || currentUser.subscriptionStatus !== 'ACTIVE' || currentUser.isDemo || currentUser.isNewUser) ? (
            <div className="max-w-md mx-auto mt-2 p-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">Temporary Demo Mode</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                      Restricted
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Activate via MTN MoMo Mobile Money RWF
                  </p>
                </div>
              </div>
              <button
                id="btn-owner-activate-mtn-momo"
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shrink-0 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activate</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active Subscriber • MTN MoMo Verified</span>
              {currentUser.mtnTxRef && (
                <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Ref: {currentUser.mtnTxRef.slice(-8)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Empty Clean Space to avoid UI clutter (Deleted metrics row) */}
        <div className="flex-1 min-h-[8px]" />

        {/* ========================================================================= */}
        {/* SUBSCRIPTION & BILLING DASHBOARD */}
        {/* ========================================================================= */}
        <div className="pt-1">
          <OwnerSubscriptionDashboard currentUser={currentUser} onUserUpdated={onSaveUser} />
        </div>

        {/* ========================================================================= */}
        {/* MODULAR 5-CARD DASHBOARD GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD 1: Register New Stock & Add Product */}
          <div
            id="card-1-register-stock"
            onClick={() => setActiveModal('card1_stock')}
            className="group relative bg-[#0b1329] border border-slate-800 rounded-xl hover:border-emerald-500 p-6 sm:p-7 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-xl overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all duration-200">
                  <Package className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t.ownerDashboard.card1.tag}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t.ownerDashboard.card1.title}
              </h2>
              <p className="text-xs text-emerald-400/90 font-medium mt-1">
                {t.ownerDashboard.card1.subtitle}
              </p>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                {t.ownerDashboard.card1.desc}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>{t.ownerDashboard.card1.action}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 2: Employee Management & Shift Tracking */}
          <div
            id="card-2-employee-shifts"
            onClick={() => setActiveModal('card2_employee')}
            className="group relative bg-[#0b1329] border border-slate-800 rounded-xl hover:border-emerald-500 p-6 sm:p-7 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-xl overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 group-hover:bg-purple-500/20 transition-all duration-200">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {t.ownerDashboard.card2.tag}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t.ownerDashboard.card2.title}
              </h2>
              <p className="text-xs text-purple-400/90 font-medium mt-1">
                {t.ownerDashboard.card2.subtitle}
              </p>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                {t.ownerDashboard.card2.desc}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>{t.ownerDashboard.card2.action}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 3: Business Management & Revenue Analytics */}
          <div
            id="card-3-revenue-analytics"
            onClick={() => setActiveModal('card3_revenue')}
            className="group relative bg-[#0b1329] border border-slate-800 rounded-xl hover:border-emerald-500 p-6 sm:p-7 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-xl overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all duration-200">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t.ownerDashboard.card3.tag}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t.ownerDashboard.card3.title}
              </h2>
              <p className="text-xs text-emerald-400/90 font-medium mt-1">
                {t.ownerDashboard.card3.subtitle}
              </p>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                {t.ownerDashboard.card3.desc}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>{t.ownerDashboard.card3.action}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 4: Restock, Invoices & Expense Tracking (Kurangura) */}
          <div
            id="card-4-invoices-expenses"
            onClick={() => {
              setCard4Tab('invoices');
              setActiveModal('card4_invoices');
            }}
            className="group relative bg-[#0b1329] border border-slate-800 rounded-xl hover:border-emerald-500 p-6 sm:p-7 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-xl overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all duration-200">
                  <Receipt className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t.ownerDashboard.card4.tag}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t.ownerDashboard.card4.title}
              </h2>
              <p className="text-xs text-amber-400/90 font-medium mt-1">
                {t.ownerDashboard.card4.subtitle}
              </p>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                {t.ownerDashboard.card4.desc}
              </p>

              {/* Debtors Quick Access Pill */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCard4Tab('debtors');
                    setActiveModal('card4_invoices');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Igitabo cy'Amadeni (Debtors)</span>
                </button>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>{t.ownerDashboard.card4.action}</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 5: Smart AI Assistant (AI Business Companion) */}
          <div
            id="card-5-ai-assistant"
            onClick={() => {
              setAiPrompt(undefined);
              setActiveModal('card5_ai');
            }}
            className="group relative bg-[#0b1329] border border-slate-800 rounded-xl hover:border-emerald-500 p-6 sm:p-7 flex flex-col justify-between hover:scale-[1.02] transition-all duration-200 cursor-pointer shadow-xl overflow-hidden md:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all duration-200">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {t.ownerDashboard.card5.tag}
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span>{t.ownerDashboard.card5.title}</span>
              </h2>
              <p className="text-xs text-blue-300 font-medium mt-1">
                {t.ownerDashboard.card5.subtitle}
              </p>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                {t.ownerDashboard.card5.desc}
              </p>

              {/* Quick AI & Executive Report Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAiPrompt("Nigute abakiriya babaye benshi cyangwa bagabanutse? Mbwira imibare y'abashya, abagarutse, na churn rate.");
                    setActiveModal('card5_ai');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>👥 Ubwiyongere bw'Abakiriya (Customer Trends & Churn)</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal('weekly_report');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>📊 Raporo y'Icyumweru (Weekly Executive Report)</span>
                </button>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                <span>{t.ownerDashboard.card5.action}</span>
              </span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Clean Empty Space replacing the sub-header bar */}
        <div className="py-2" />
      </div>

      {/* ========================================================================= */}
      {/* 5 MODULAR FULL-SCREEN MODALS */}
      {/* ========================================================================= */}

      {/* CARD 1 MODAL: Register New Stock & Add Product */}
      {activeModal === 'card1_stock' && (
        <Card1StockProductModal
          products={products}
          onClose={() => setActiveModal(null)}
          onSaveProduct={onSaveProduct}
          onRefreshData={onRefreshData}
        />
      )}

      {/* CARD 2 MODAL: Employee Management & Shift Tracking */}
      {activeModal === 'card2_employee' && (
        <Card2EmployeeShiftModal
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setActiveModal(null)}
          onSaveUser={onSaveUser}
          onRefreshData={onRefreshData}
        />
      )}

      {/* CARD 3 MODAL: Business Management & Revenue Analytics */}
      {activeModal === 'card3_revenue' && (
        <Card3RevenueAnalyticsModal
          products={products}
          sales={sales}
          shifts={shifts}
          allUsers={allUsers}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* CARD 4 MODAL: Restock, Invoices & Expense Tracking (Kurangura) + Debtors */}
      {activeModal === 'card4_invoices' && (
        <Card4InvoicesExpensesModal
          currentUser={currentUser}
          onClose={() => setActiveModal(null)}
          onRefreshData={onRefreshData}
          initialTab={card4Tab}
        />
      )}

      {/* CARD 5 MODAL: Smart AI Assistant (AI Business Companion) */}
      {activeModal === 'card5_ai' && (
        <Card5SmartAIAssistantModal
          currentUser={currentUser}
          products={products}
          sales={sales}
          shifts={shifts}
          allUsers={allUsers}
          onClose={() => setActiveModal(null)}
          initialPrompt={aiPrompt}
        />
      )}

      {/* WEEKLY EXECUTIVE PERFORMANCE REPORT MODAL */}
      {activeModal === 'weekly_report' && (
        <WeeklyPerformanceReportModal
          currentUser={currentUser}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* MTN MOMO PAYMENT MODAL (MOBILE MONEY RWF) */}
      <MtnMomoPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amountRwf={30000}
        customerName={currentUser.name}
        customerEmail={currentUser.email || 'owner@smartstock.rw'}
        customerPhone={currentUser.phone || '+250 788 123 456'}
        shopName={currentUser.shopName || 'SmartStock Rwanda'}
        user={currentUser}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false);
          onRefreshData?.();
        }}
        onNavigateToOwner={() => {
          setIsPaymentModalOpen(false);
          onRefreshData?.();
        }}
        onNavigateToPOS={() => {
          setIsPaymentModalOpen(false);
          onRefreshData?.();
          onNavigateToPOS();
        }}
      />
    </div>
  );
};
