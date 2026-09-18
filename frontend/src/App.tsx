/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from './services/db';
import { SMSService } from './services/smsService';
import { User, Product, ShiftRegister, SaleTransaction, StockAdjustment, FraudAlert, SpotCheckAudit, CashDenominationCount, OnboardingRegistration, BusinessGoals } from './types';
import { Navigation, ActiveTab } from './components/Navigation';
import { LandingPage } from './components/landing/LandingPage';
import { QuickSellView } from './components/pos/QuickSellView';
import { InventoryManager } from './components/inventory/InventoryManager';
import { BlindCashAudit } from './components/reconciliation/BlindCashAudit';
import { FraudDiscrepancyDashboard } from './components/audit/FraudDiscrepancyDashboard';
import { ArchitectureBlueprint } from './components/docs/ArchitectureBlueprint';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { BlindReconciliationModal } from './components/pos/BlindReconciliationModal';
import { LanguageProvider } from './contexts/LanguageContext';
import { SuperAdminLogin } from './components/superadmin/SuperAdminLogin';
import { PersonalProfileModal } from './components/PersonalProfileModal';
import { superAdminLogout, superAdminCheckSession } from './services/superAdminAuthApi';
import { Lock, Unlock, X, Banknote, Smartphone } from 'lucide-react';

const SUPERADMIN_SESSION_KEY = 'smartstock_superadmin_session_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [currentShift, setCurrentShift] = useState<ShiftRegister | null>(null);
  const [shiftsHistory, setShiftsHistory] = useState<ShiftRegister[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [spotChecks, setSpotChecks] = useState<SpotCheckAudit[]>([]);
  const [smsLogsCount, setSmsLogsCount] = useState<number>(() => SMSService.getLogs().length);
  const [businessGoals, setBusinessGoals] = useState<BusinessGoals>(() => db.getBusinessGoals());

  // URL-based routing for /superadmin (the rest of the app uses activeTab)
  const [path, setPath] = useState<string>(() => window.location.pathname);
  const isSuperAdminRoute = path === '/superadmin';

  // Super Admin session (persisted in sessionStorage; tokens verified server-side)
  const [superAdminSession, setSuperAdminSession] = useState<{ token: string; user: User } | null>(() => {
    try {
      const raw = sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.user) return parsed;
      }
    } catch { /* ignore corrupt data */ }
    return null;
  });
  
  // Offline Simulation State
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<SaleTransaction[]>([]);
  
  // Open Shift Modal State
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [modalCashFloat, setModalCashFloat] = useState('20000');
  const [modalMomoFloat, setModalMomoFloat] = useState('50000');

  // Blind Cash Reconciliation Modal State
  const [isBlindReconModalOpen, setIsBlindReconModalOpen] = useState(false);

  // Personal Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load data on startup
  useEffect(() => {
    refreshAllData();
  }, []);

  // Listen to popstate for /superadmin URL routing
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // On mount: if path is /superadmin and a session exists, restore it; otherwise clear stale session
  useEffect(() => {
    if (window.location.pathname !== '/superadmin') return;
    if (!superAdminSession) return;
    // Restore the admin into the dashboard immediately, then verify server-side.
    db.setCurrentUser(superAdminSession.user);
    setCurrentUser(superAdminSession.user);
    setActiveTab('superadmin_dashboard');
    // Verify session is still valid on the backend
    superAdminCheckSession(superAdminSession.token).then((res) => {
      if (!res.ok) {
        setSuperAdminSession(null);
        sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
      }
    }).catch(() => {
      setSuperAdminSession(null);
      sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automated background trigger for Weekly/Daily Performance Report sent to owner
  useEffect(() => {
    const runAutomatedReportCheck = () => {
      try {
        const reports = db.getPerformanceReports();
        const latest = reports[0];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // If no report or last report was generated > 24 hours ago, auto-generate & dispatch
        if (!latest || (now - new Date(latest.generatedAt).getTime()) > oneDayMs) {
          const owner = users.find(u => u.role === 'owner') || currentUser;
          const recipientEmail = owner?.email || 'patrick.niyonzima@gmail.com';
          const recipientPhone = owner?.phone || '+250 788 314 520';
          db.generateWeeklyPerformanceReport('WEEKLY', recipientEmail, recipientPhone);
          setSmsLogsCount(SMSService.getLogs().length);
        }
      } catch (err) {
        console.warn('Automated report generator check:', err);
      }
    };

    runAutomatedReportCheck();
    // Check periodically every 15 minutes
    const intervalTimer = setInterval(runAutomatedReportCheck, 15 * 60 * 1000);
    return () => clearInterval(intervalTimer);
  }, [users, currentUser]);

  const refreshAllData = () => {
    setUsers(db.getUsers());
    setCurrentUser(db.getCurrentUser());
    setProducts(db.getProducts());
    setCurrentShift(db.getCurrentShift());
    setShiftsHistory(db.getShifts());
    setSales(db.getSales());
    setAlerts(db.getAlerts());
    setAdjustments(db.getAdjustments());
    setSpotChecks(db.getSpotChecks());
    setSmsLogsCount(SMSService.getLogs().length);
    setBusinessGoals(db.getBusinessGoals());
  };

  const handleSwitchUser = (user: User) => {
    db.setCurrentUser(user);
    setCurrentUser(user);
    if (user.role === 'employee') {
      setActiveTab('pos');
    } else if (user.role === 'superadmin') {
      setActiveTab('superadmin_dashboard');
    }
  };

  const handleLogout = () => {
    if (currentUser.role === 'employee' && currentShift) {
      setIsBlindReconModalOpen(true);
      return;
    }
    // If logging out from the superadmin session, invalidate server-side and clear state
    if (superAdminSession) {
      void superAdminLogout(superAdminSession.token).catch(() => {});
      setSuperAdminSession(null);
      sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
    }
    const fallbackUser = users.find(u => u.role === 'owner') || users.find(u => u.role === 'superadmin') || currentUser;
    db.setCurrentUser(fallbackUser);
    setCurrentUser(fallbackUser);
    setActiveTab('landing');
    if (window.location.pathname === '/superadmin') {
      window.history.pushState(null, '', '/');
      setPath('/');
    }
  };

  const handleEnterFromLanding = (role: 'owner' | 'employee' | 'superadmin', tab?: ActiveTab) => {
    const targetUser = users.find(u => u.role === role) || currentUser;
    handleSwitchUser(targetUser);
    if (tab) {
      setActiveTab(tab);
    } else if (role === 'owner') {
      setActiveTab('owner_dashboard');
    } else if (role === 'superadmin') {
      setActiveTab('superadmin_dashboard');
    } else {
      setActiveTab('pos');
    }
  };

  const handleRegisterShop = (data: Omit<OnboardingRegistration, 'id' | 'createdAt'>): OnboardingRegistration => {
    const reg = db.registerShopOnboarding(data);
    
    // Create new owner user for this registered shop
    const isSubscriberActive = data.status === 'ACTIVE';
    const newOwner: User = {
      id: `usr-owner-${Date.now()}`,
      name: data.ownerFullName,
      role: 'owner',
      phone: data.ownerPhone,
      email: data.ownerEmail,
      shopName: data.shopName,
      pin: '1234',
      active: true,
      isNewUser: !isSubscriberActive,
      isDemo: !isSubscriberActive,
      subscriptionStatus: isSubscriberActive ? 'ACTIVE' : 'PENDING',
      mtnTxRef: data.mtnTxRef,
      mtnTransactionId: data.mtnTransactionId
    };
    db.saveUser(newOwner);
    db.setCurrentUser(newOwner);

    // Activate subscription server-side (fire-and-forget; local db sync handles offline)
    if (isSubscriberActive) {
      import('./services/subscriptionApi').then(({ activateSubscription }) => {
        activateSubscription({
          businessId: data.shopName || 'smartstock-business',
          ownerId: newOwner.id,
          workerCount: data.workerCount || data.staffCount || 1,
          paymentProvider: 'MTN_MOMO',
          paymentReference: data.mtnTxRef || data.paymentReference || '',
          mtnReferenceId: data.mtnTransactionId || data.mtnTxRef,
          ownerName: data.ownerFullName,
          ownerEmail: data.ownerEmail,
          ownerPhone: data.ownerPhone,
          businessName: data.shopName,
        }).catch((err) => {
          console.warn('[SmartStock] Server subscription activation unavailable:', err.message);
        });
      });
    }

    refreshAllData();
    return reg;
  };

  const handleOpenShift = (cashier: User, cashFloat: number, momoFloat: number) => {
    const newShift = db.openShift(cashier, cashFloat, momoFloat);
    setCurrentShift(newShift);
    setShiftsHistory(db.getShifts());
    setIsOpenShiftModalOpen(false);
  };

  const handleCloseShiftBlind = (params: {
    actualCashCountedRwf: number;
    actualMomoCountedRwf: number;
    cashDenominations: CashDenominationCount;
    discrepancyNote?: string;
    closedByAuditorName: string;
  }) => {
    const { shift } = db.closeShiftWithBlindCount(params);
    setCurrentShift(null);
    setShiftsHistory(db.getShifts());
    setAlerts(db.getAlerts());
    setSmsLogsCount(SMSService.getLogs().length);
  };

  const handleRecordSale = (saleData: any): SaleTransaction => {
    if (isOffline) {
      // Simulate queuing offline transaction
      const offlineSale: SaleTransaction = {
        ...saleData,
        id: `tx-offline-${Date.now()}`,
        receiptNumber: `RW-OFFLINE-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        isVoided: false,
        offlineQueued: true
      };
      
      // Deduct local memory stock
      setProducts(prev => prev.map(p => {
        const item = saleData.items.find((i: any) => i.product?.id === p.id);
        if (item) return { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) };
        return p;
      }));

      setPendingSyncQueue(prev => [offlineSale, ...prev]);
      return offlineSale;
    }

    const recorded = db.recordSale(saleData);
    refreshAllData();
    return recorded;
  };

  const handleSyncOfflineData = () => {
    // Process pending offline items into main database
    for (const item of pendingSyncQueue) {
      db.recordSale({
        cashierId: item.cashierId,
        cashierName: item.cashierName,
        items: item.items.map(i => ({
          product: products.find(p => p.id === i.product?.id) || {
            id: i.product?.id || `restored-${Date.now()}`,
            name: i.product?.name || 'Restored Item',
            category: i.product?.category || 'Beverages',
            barcode: i.product?.barcode || '',
            costPriceRwf: i.costPriceRwf,
            sellingPriceRwf: i.unitPriceRwf,
            currentStock: 10,
            minimumStockThreshold: 2
          },
          quantity: i.quantity,
          unitPriceRwf: i.unitPriceRwf,
          costPriceRwf: i.costPriceRwf,
          totalRwf: i.totalRwf
        })),
        subtotalRwf: item.subtotalRwf,
        discountRwf: item.discountRwf,
        totalRwf: item.totalRwf,
        totalCostRwf: item.totalCostRwf,
        grossProfitRwf: item.grossProfitRwf,
        paymentMethod: item.paymentMethod,
        cashTenderedRwf: item.cashTenderedRwf,
        changeGivenRwf: item.changeGivenRwf,
        momoReference: item.momoReference,
        customerPhone: item.customerPhone
      });
    }
    setPendingSyncQueue([]);
    setIsOffline(false);
    refreshAllData();
    alert('✅ All offline transactions successfully reconciled and synced with central database!');
  };

  const handleSaveProduct = (product: Product) => {
    db.saveProduct(product);
    setProducts(db.getProducts());
    setSmsLogsCount(SMSService.getLogs().length);
  };

  const handleDeleteProduct = (productId: string) => {
    db.deleteProduct(productId);
    setProducts(db.getProducts());
  };

  const handleSaveUser = (user: User) => {
    db.saveUser(user);
    setUsers(db.getUsers());
    // If the current user updated their own profile, reflect changes immediately
    if (user.id === currentUser.id) {
      db.setCurrentUser(user);
      setCurrentUser(user);
    }
  };

  const handleSaveBusinessGoals = (goals: BusinessGoals) => {
    db.saveBusinessGoals(goals);
    setBusinessGoals(goals);
  };

  const handleResetToZeroData = () => {
    db.resetToZeroData();
    refreshAllData();
  };

  const handleRecordStockAdjustment = (params: any) => {
    db.recordStockAdjustment({
      ...params,
      performedBy: currentUser.name,
      performedByRole: currentUser.role
    });
    setProducts(db.getProducts());
    setAdjustments(db.getAdjustments());
    setSmsLogsCount(SMSService.getLogs().length);
  };

  const handleRaiseAlert = (alertData: any) => {
    const alert: FraudAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    db.addAlert(alert);
    setAlerts(db.getAlerts());
  };

  const handleResolveAlert = (alertId: string) => {
    db.resolveAlert(alertId);
    setAlerts(db.getAlerts());
  };

  const handleSuperAdminAuthenticated = (user: User, token: string) => {
    setSuperAdminSession({ token, user });
    sessionStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify({ token, user }));
    db.setCurrentUser(user);
    setCurrentUser(user);
    setActiveTab('superadmin_dashboard');
  };

  const handleBackToLanding = () => {
    window.history.pushState(null, '', '/');
    setPath('/');
  };

  const handleRecordSpotCheck = (audit: SpotCheckAudit) => {
    db.recordSpotCheck(audit);
    setSpotChecks(db.getSpotChecks());
    setAlerts(db.getAlerts());
  };

  const unreadAlertsCount = alerts.filter(a => a.status === 'PENDING').length;

  // Data isolation: non-superadmin users only see their own shop's users.
  // The Super Admin account is never exposed outside the admin console.
  const visibleUsers = useMemo(() => db.getUsersVisibleTo(currentUser), [users, currentUser]);

  // Each user only sees sales/shifts related to them: owners see their own
  // shop's activity, employees only their own cashier activity. Super Admin
  // keeps full platform visibility.
  const { visibleSales, visibleShifts } = useMemo(() => {
    if (!currentUser || currentUser.role === 'superadmin') {
      return { visibleSales: sales, visibleShifts: shiftsHistory };
    }
    const allowedIds = new Set(visibleUsers.map(u => u.id));
    const allowedNames = new Set(visibleUsers.map(u => u.name));
    if (currentUser.role === 'employee') {
      allowedIds.clear();
      allowedNames.clear();
      allowedIds.add(currentUser.id);
      allowedNames.add(currentUser.name);
    }
    return {
      visibleSales: sales.filter(s => allowedIds.has(s.cashierId) || allowedNames.has(s.cashierName)),
      visibleShifts: shiftsHistory.filter(s => allowedIds.has(s.cashierId) || allowedNames.has(s.cashierName)),
    };
  }, [sales, shiftsHistory, currentUser, visibleUsers]);

  const isOwnerRoom = currentUser.role === 'owner' && (activeTab === 'owner_dashboard' || activeTab === 'inventory');

  // Dedicated Super Admin route: rendered standalone, no public dashboard chrome.
  if (isSuperAdminRoute && !superAdminSession) {
    return (
      <SuperAdminLogin
        onAuthenticated={handleSuperAdminAuthenticated}
        onBackToLanding={handleBackToLanding}
      />
    );
  }

  return (
    <LanguageProvider>
      <div 
        className={`min-h-screen text-neutral-100 flex flex-col selection:bg-emerald-500 selection:text-neutral-950 pb-16 lg:pb-0 transition-all duration-300 ${
          isOwnerRoom 
            ? "bg-[url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center lg:bg-fixed" 
            : 'bg-neutral-950'
        }`}
      >
      {/* Light dark-tint overlay with blur for Store Owner Dashboard ensuring floating UI remains legible */}
      <div className={`min-h-screen flex flex-col ${isOwnerRoom ? 'bg-slate-950/40 backdrop-blur-sm' : ''}`}>
        {/* Top Header & Navigation - Only shown when logged in or inside the app, NEVER on standalone Landing Page */}
        {activeTab !== 'landing' && (
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
            allUsers={visibleUsers}
            currentShift={currentShift}
            isOffline={isOffline}
            setIsOffline={setIsOffline}
            pendingSyncCount={pendingSyncQueue.length}
            onSyncOfflineData={handleSyncOfflineData}
            unreadAlertsCount={unreadAlertsCount}
            onOpenNewShiftModal={() => setIsOpenShiftModalOpen(true)}
            smsCount={smsLogsCount}
            onOpenReconciliation={() => {
              if (currentShift) {
                setIsBlindReconModalOpen(true);
              } else {
                setIsOpenShiftModalOpen(true);
              }
            }}
            onLogout={handleLogout}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {/* Main View Container */}
        <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onEnterApp={handleEnterFromLanding}
            onRegisterShop={handleRegisterShop}
          />
        )}

        {activeTab === 'owner_dashboard' && (
          <OwnerDashboard
            products={products}
            currentUser={currentUser}
            allUsers={visibleUsers}
            businessGoals={businessGoals}
            sales={visibleSales}
            shifts={visibleShifts}
            onSaveProduct={handleSaveProduct}
            onSaveUser={handleSaveUser}
            onSaveBusinessGoals={handleSaveBusinessGoals}
            onResetToZeroData={handleResetToZeroData}
            onNavigateToPOS={() => setActiveTab('pos')}
            onNavigateToLanding={() => setActiveTab('landing')}
            onNavigateToInventory={() => setActiveTab('inventory')}
            onRefreshData={refreshAllData}
            isNewUser={currentUser.isNewUser}
          />
        )}

        {activeTab === 'superadmin_dashboard' && (
          <SuperAdminDashboard
            currentUser={currentUser}
            allUsers={users}
            sales={sales}
            alerts={alerts}
            onLoginAsOwner={(user) => {
              handleSwitchUser(user);
              setActiveTab('owner_dashboard');
            }}
            onRefreshData={refreshAllData}
          />
        )}

        {activeTab === 'pos' && (
          <QuickSellView
            products={products}
            currentUser={currentUser}
            currentShift={currentShift}
            onRecordSale={handleRecordSale}
            onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
            onRaiseAlert={handleRaiseAlert}
            onOpenReconciliation={() => {
              if (currentShift) {
                setIsBlindReconModalOpen(true);
              } else {
                setIsOpenShiftModalOpen(true);
              }
            }}
            onSeedDefaultProducts={() => {
              db.seedDefaultProducts();
              refreshAllData();
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            currentUser={currentUser}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onRecordStockAdjustment={handleRecordStockAdjustment}
            adjustmentsHistory={adjustments}
          />
        )}

        {activeTab === 'reconciliation' && (
          <BlindCashAudit
            currentShift={currentShift}
            currentUser={currentUser}
            shiftsHistory={visibleShifts}
            products={products}
            onOpenShift={handleOpenShift}
            onCloseShiftBlind={handleCloseShiftBlind}
            onRecordSpotCheck={handleRecordSpotCheck}
          />
        )}

        {activeTab === 'fraud_dashboard' && (
          <FraudDiscrepancyDashboard
            shifts={visibleShifts}
            sales={visibleSales}
            alerts={alerts}
            products={products}
            spotChecks={spotChecks}
            currentUser={currentUser}
            onResolveAlert={handleResolveAlert}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureBlueprint />
        )}
      </main>
      </div>

      {/* Dedicated Blind Cash Reconciliation Modal */}
      {isBlindReconModalOpen && currentShift && (
        <BlindReconciliationModal
          shift={currentShift}
          currentUser={currentUser}
          onClose={() => setIsBlindReconModalOpen(false)}
          onShiftClosed={(closedShift) => {
            // PHOTO 4: Clear active cashier session states & redirect to landscape Login/Landing Page ('/')
            setCurrentShift(null);
            setShiftsHistory(db.getShifts());
            setAlerts(db.getAlerts());
            setSmsLogsCount(SMSService.getLogs().length);
            setIsBlindReconModalOpen(false);

            // Clear cashier active session
            const ownerUser = users.find(u => u.role === 'owner') || users[0];
            db.setCurrentUser(ownerUser);
            setCurrentUser(ownerUser);

            // Immediately redirect view back to the main landscape Login/Landing Page ('/')
            setActiveTab('landing');
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState(null, '', '/');
            }
          }}
        />
      )}

      {/* Floating Modal: Open Register Shift */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Open Shift Register</span>
              </div>
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Establish the initial physical change float and MTN MoMo starting balance for <strong className="text-white">{currentUser.name}</strong>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOpenShift(currentUser, parseFloat(modalCashFloat) || 0, parseFloat(modalMomoFloat) || 0);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Cash Drawer Opening Float (RWF)
                </label>
                <div className="relative">
                  <Banknote className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={modalCashFloat}
                    onChange={(e) => setModalCashFloat(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  MTN Mobile Money Starting Float (RWF)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={modalMomoFloat}
                    onChange={(e) => setModalMomoFloat(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(false)}
                  className="px-4 py-2.5 bg-neutral-800 text-white font-semibold text-xs rounded-xl flex-1 hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl flex-1 transition flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Start Shift</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* Personal Profile Modal */}
      {isProfileModalOpen && currentUser && (
        <PersonalProfileModal
          user={currentUser}
          onSave={handleSaveUser}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </LanguageProvider>
  );
}
