import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { User, ShiftRegister } from '../types';
import { ActiveShiftBadge } from './ActiveShiftBadge';
import { useLanguage } from '../contexts/LanguageContext';

export type ActiveTab = 'landing' | 'pos' | 'inventory' | 'reconciliation' | 'fraud_dashboard' | 'architecture' | 'owner_dashboard' | 'superadmin_dashboard';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  currentShift: ShiftRegister | null;
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  pendingSyncCount: number;
  onSyncOfflineData: () => void;
  unreadAlertsCount: number;
  onOpenNewShiftModal: () => void;
  smsCount?: number;
  onOpenReconciliation?: () => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchUser,
  allUsers,
  currentShift,
  isOffline,
  setIsOffline,
  pendingSyncCount,
  onSyncOfflineData,
  unreadAlertsCount,
  onOpenNewShiftModal,
  smsCount = 0,
  onOpenReconciliation,
  onLogout,
  onOpenProfile
}) => {
  const { language, setLanguage, t } = useLanguage();

  // Live real-time clock for Cashier terminal
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // STRICT CASHIER INTERFACE: If current user is employee, render simplified cashier navbar only
  if (currentUser.role === 'employee') {
    return (
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Official Logo "SmartStock RWANDA" with Emerald Green Shield */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  SMARTSTOCK <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 uppercase font-mono">RWANDA</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate max-w-[110px] sm:max-w-xs">
                {currentUser.shopName} &bull; <span className="text-emerald-400 font-medium">Kigali, RW</span>
              </p>
            </div>
          </div>

          {/* Center: Live Real-time Clock + Current Shift Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-200 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-white">{timeStr}</span>
              <span className="text-neutral-500 hidden sm:inline">•</span>
              <span className="text-neutral-400 hidden sm:inline">{dateStr}</span>
            </div>

            {/* Dynamic Navbar Shift Badge */}
            <ActiveShiftBadge
              currentUser={currentUser}
              currentShift={currentShift}
              allUsers={allUsers}
            />
          </div>

          {/* Right: Clickable Cashier Profile Badge (Opens Profile Modal) + Red Logout/End Shift Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
            {/* Clickable User Badge: Opens Personal Profile Modal */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700 hover:border-slate-600 px-2.5 md:px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-xs select-none transition cursor-pointer"
              title="View / Edit Profile"
            >
              <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden md:inline truncate max-w-[210px]">
                {currentUser.name || 'Eric Nshimiyimana'} (Cashier / Employee)
              </span>
            </button>

            {/* Logout / Shift Switch Control: The ONLY way to exit current cashier session */}
            <button
              id="btn-cashier-logout-end-shift"
              onClick={() => {
                if (onOpenReconciliation) {
                  onOpenReconciliation();
                } else if (onLogout) {
                  onLogout();
                }
              }}
              className="px-2.5 md:px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 shadow-md shadow-red-950/50 active:scale-95"
              title="End Shift / Blind Reconciliation"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="md:hidden whitespace-nowrap">End Shift</span>
              <span className="hidden md:inline whitespace-nowrap">End Shift / Blind Reconciliation</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // DEFAULT / STORE OWNER NAVBAR (Ultra-Clean Single Bar - Minimalist Header)
  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Primary System Logo "SMARTSTOCK" (Clean static brand mark, not a navigation link) */}
        <div 
          className="flex items-center gap-3 select-none"
          title="SmartStock"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
              SMARTSTOCK
            </span>
            {currentUser.role === 'superadmin' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 uppercase font-mono font-bold">
                Super Admin
              </span>
            )}
          </div>
        </div>

        {/* Right: Language Selector switch (Kinyarwanda | English | Français) + Online/Offline indicator */}
        <div className="flex items-center gap-2 sm:gap-3 justify-end flex-wrap">
          {/* Language Selector Switch */}
          <div 
            id="header-language-switch"
            className="flex items-center bg-slate-950/90 border border-slate-800 rounded-full p-0.5 shadow-xs"
          >
            <button
              type="button"
              onClick={() => setLanguage('rw')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                language === 'rw' 
                  ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kinyarwanda"
            >
              <span className="text-xs">🇷🇼</span>
              <span className="hidden sm:inline">Kinyarwanda</span>
              <span className="sm:hidden font-mono text-[10px]">RW</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                language === 'en' 
                  ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="English"
            >
              <span className="text-xs">🇬🇧</span>
              <span className="hidden sm:inline">English</span>
              <span className="sm:hidden font-mono text-[10px]">EN</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('fr')}
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-full transition flex items-center gap-1.5 cursor-pointer ${
                language === 'fr' 
                  ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Français"
            >
              <span className="text-xs">🇫🇷</span>
              <span className="hidden sm:inline">Français</span>
              <span className="sm:hidden font-mono text-[10px]">FR</span>
            </button>
          </div>

          {/* Online/Offline status indicator pill */}
          <button
            id="btn-toggle-offline"
            onClick={() => setIsOffline(!isOffline)}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-full text-xs font-medium text-slate-300 transition shadow-xs cursor-pointer"
            title={isOffline ? "Status: Offline (Click to toggle)" : "Status: Online (Click to toggle)"}
          >
            <span 
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                isOffline 
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                  : 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50'
              }`} 
            />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300">
              {isOffline ? t.common.offline : t.common.online}
            </span>
          </button>

          {/* Owner Profile Button: Opens Personal Profile Modal */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 rounded-full text-xs font-medium text-slate-300 hover:text-white transition shadow-xs cursor-pointer"
            title="View / Edit Profile"
          >
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
          </button>

          {/* Owner Logout: Authorized exit redirect back to login/landing */}
          <button
            id="btn-owner-logout"
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-700 text-rose-300 hover:text-rose-100 rounded-full text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Log Out (Sohoka)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
