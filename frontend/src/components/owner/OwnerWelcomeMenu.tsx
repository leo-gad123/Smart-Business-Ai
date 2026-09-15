import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Boxes, 
  ArrowRight, 
  Store, 
  CheckCircle2, 
  UserCheck, 
  Layers, 
  Zap,
  TrendingUp
} from 'lucide-react';

export interface OwnerWelcomeMenuProps {
  isNewUser?: boolean;
  onToggleUserStatus?: () => void;
  shopName?: string;
  ownerName?: string;
  onSelectLanding: () => void;
  onSelectSetupMenu: () => void;
  onSelectInventory: () => void;
}

export const OwnerWelcomeMenu: React.FC<OwnerWelcomeMenuProps> = ({
  isNewUser = false,
  onToggleUserStatus,
  shopName = 'SmartStock Shop Kigali',
  ownerName = 'Store Owner',
  onSelectLanding,
  onSelectSetupMenu,
  onSelectInventory
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
      {/* Dynamic Status Pill & Context Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 shadow-lg mb-4">
        <Store className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-200">
          {shopName} &bull; {ownerName}
        </span>
        {onToggleUserStatus && (
          <button
            type="button"
            onClick={onToggleUserStatus}
            className="ml-2 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition cursor-pointer"
            title="Click to test both Returning & New User greetings"
          >
            Mode: {isNewUser ? 'New Registration' : 'Returning Merchant'} (Switch)
          </button>
        )}
      </div>

      {/* 1. DYNAMIC GREETING LOGIC */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
        {isNewUser ? 'Welcome to your shop!' : 'Welcome back to your shop!'}
      </h1>

      {/* Sub-heading for BOTH user types */}
      <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium mt-3 max-w-2xl mx-auto">
        What are we going to do now?
      </p>

      {/* 2. INTERACTIVE BOX MENU GRID (SAME FOR ALL USERS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-10 text-left">
        {/* CARD 1: Landing & Pricing */}
        <div
          id="box-card-landing"
          onClick={onSelectLanding}
          className="group relative bg-[#0b1329] border border-slate-700/60 rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all duration-200">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                Public Overview
              </span>
            </div>

            <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Landing & Pricing
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Explore the public landing page, pricing plans, POS features, and retail system capabilities.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
            <span>View Landing Page</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 2: Store Owner Room & Operations */}
        <div
          id="box-card-owner-room"
          onClick={onSelectSetupMenu}
          className="group relative bg-[#0b1329] border border-slate-700/60 rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all duration-200">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>

              {/* Operations Badge Tag */}
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                Operations
              </span>
            </div>

            <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
              <span>Store Owner Room</span>
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Stock registration, staff shifts & contracts, revenue analytics, invoice tracking, and AI business assistant.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
            <span>Open Owner Dashboard</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 3: Inventory & Cost Prices */}
        <div
          id="box-card-inventory"
          onClick={onSelectInventory}
          className="group relative bg-[#0b1329] border border-slate-700/60 rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all duration-200">
                <Boxes className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                Cost & Stock
              </span>
            </div>

            <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              Inventory & Cost Prices
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Wholesale cost prices (Chiffre d'achat), margin calculations, stock counts, and anti-theft audits.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:text-amber-300">
            <span>Manage Inventory & Margins</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerWelcomeMenu;
