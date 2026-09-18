import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Store,
  Users,
  Plus,
  Search,
  X,
  Power,
  Trash2,
  KeyRound,
  Building2,
  AlertTriangle,
  Receipt,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Eye,
  EyeOff,
  Crown,
  LockKeyhole
} from 'lucide-react';
import { User as UserType, SaleTransaction, FraudAlert, OnboardingRegistration, UserRole } from '../../types';
import { db } from '../../services/db';
import { useLanguage } from '../../contexts/LanguageContext';
import { AdminSubscriptionDashboard } from './AdminSubscriptionDashboard';

interface SuperAdminDashboardProps {
  currentUser: UserType;
  allUsers: UserType[];
  sales: SaleTransaction[];
  alerts: FraudAlert[];
  onLoginAsOwner: (user: UserType) => void;
  onRefreshData: () => void;
}

const SHOP_TYPES: OnboardingRegistration['shopType'][] = [
  'Supermarket',
  'Alimentation / Grocery',
  'Liquor & Beverage Store',
  'Boutique',
  'Wholesale'
];

const DISTRICTS = [
  'Gasabo (Kimironko / Kacyiru / Remera), Kigali',
  'Nyarugenge (Nyamirambo / City Center), Kigali',
  'Kicukiro (Gikondo / Sonatubes / Kabeza), Kigali',
  'Rubavu (Gisenyi), Western Province',
  'Musanze (Ruhengeri), Northern Province',
  'Huye (Butare), Southern Province',
  'Rwamagana, Eastern Province',
  'Rusizi (Cyangugu), Western Province'
];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  allUsers,
  sales,
  alerts,
  onLoginAsOwner,
  onRefreshData
}) => {
  const { t } = useLanguage();

  const [owners, setOwners] = useState<UserType[]>([]);
  const [superAdminSnack, setSuperAdminSnack] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [revealedPinUsers, setRevealedPinUsers] = useState<Set<string>>(new Set());
  const [revealedPasswordUsers, setRevealedPasswordUsers] = useState<Set<string>>(new Set());

  // Add New User (any role) Form State
  const [userForm, setUserForm] = useState({
    fullName: '',
    role: 'employee' as UserRole,
    phone: '+250 78',
    email: '',
    password: '',
    shopName: '',
    shiftType: 'WHOLE_DAY' as UserType['shiftType'],
    subscriptionStatus: 'ACTIVE' as UserType['subscriptionStatus']
  });
  const [createdUser, setCreatedUser] = useState<{ user: UserType; password: string } | null>(null);

  // Create Owner Form State
  const [form, setForm] = useState({
    ownerFullName: '',
    ownerPhone: '+250 78',
    ownerEmail: '',
    ownerPassword: '',
    shopName: '',
    districtLocation: DISTRICTS[0],
    shopType: 'Supermarket' as OnboardingRegistration['shopType'],
    staffCount: '1',
    subscriptionStatus: 'ACTIVE' as UserType['subscriptionStatus']
  });
  const [generatedAccount, setGeneratedAccount] = useState<{ user: UserType; password: string } | null>(null);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = () => {
    setOwners(db.getAllOwnerAccounts());
  };

  const handleSnack = (msg: string) => {
    setSuperAdminSnack(msg);
    setTimeout(() => setSuperAdminSnack(''), 3000);
  };

  const filterOwners = (list: UserType[]) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.shopName.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      (o.email || '').toLowerCase().includes(q)
    );
  };

  const displayedOwners = filterOwners(owners);

  const totalRevenue = sales.reduce((sum, s) => sum + (s.isVoided ? 0 : s.totalRwf), 0);
  const transactionCount = sales.filter(s => !s.isVoided).length;
  const pendingAlerts = alerts.filter(a => a.status === 'PENDING');
  const criticalAlerts = pendingAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
  const activeOwners = owners.filter(o => o.active);
  const activeSubscribers = owners.filter(o => o.subscriptionStatus === 'ACTIVE');
  const employeeCount = allUsers.filter(u => u.role === 'employee').length;

  const handleToggleActive = (user: UserType) => {
    try {
      db.setUserActive(user.id, !user.active);
      reload();
      onRefreshData();
      handleSnack(`${user.name} ${user.active ? 'deactivated' : 'activated'} successfully.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOwner = (user: UserType) => {
    if (user.id === currentUser.id) return;
    if (window.confirm(`Delete owner account "${user.name}" (${user.shopName})? This cannot be undone.`)) {
      db.deleteUser(user.id);
      reload();
      onRefreshData();
      handleSnack(`Owner account "${user.name}" deleted.`);
    }
  };

  const handleResetPin = (user: UserType) => {
    const newPin = String(Math.floor(1000 + Math.random() * 9000));
    try {
      db.saveUser({ ...user, pin: newPin });
      reload();
      onRefreshData();
      handleSnack(`New PIN for ${user.name}: ${newPin}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = (user: UserType) => {
    const newPassword = window.prompt(
      `Assign a new login password for ${user.name} (${user.email || user.shopName}). Leave the field empty to auto-generate one.`,
      ''
    );
    if (newPassword === null) return;
    const trimmed = newPassword.trim();
    if (trimmed && trimmed.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }
    const assigned = trimmed || `Rwanda@${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      db.saveUser({ ...user, systemPassword: assigned });
      reload();
      onRefreshData();
      handleSnack(`Login password updated for ${user.name}. Hand it to the owner securely.`);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRevealPassword = (user: UserType) => {
    setRevealedPasswordUsers(prev => {
      const next = new Set(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.add(user.id);
      }
      return next;
    });
  };

  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ownerFullName.trim() || !form.shopName.trim() || !form.ownerPhone.trim()) {
      window.alert('Full name, shop name and phone are required.');
      return;
    }
    if (!form.ownerEmail.includes('@') || !form.ownerEmail.includes('.')) {
      window.alert('Enter a valid email address.');
      return;
    }
    if (form.ownerPassword.trim() && form.ownerPassword.trim().length < 6) {
      window.alert('Password must be at least 6 characters if manually assigned.');
      return;
    }
    const password = form.ownerPassword.trim() || `Rwanda@${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const result = db.createOwnerAccount({
        ownerFullName: form.ownerFullName.trim(),
        ownerPhone: form.ownerPhone.trim(),
        ownerEmail: form.ownerEmail.trim().toLowerCase(),
        shopName: form.shopName.trim(),
        districtLocation: form.districtLocation,
        shopType: form.shopType,
        staffCount: parseInt(form.staffCount) || 1,
        subscriptionStatus: form.subscriptionStatus,
        pin: String(Math.floor(1000 + Math.random() * 9000)),
        systemPassword: password
      });
      setGeneratedAccount({ user: result.user, password });
      reload();
      onRefreshData();
    } catch (err) {
      console.error(err);
      window.alert('Failed to create owner account. See console.');
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setGeneratedAccount(null);
    setForm({
      ownerFullName: '',
      ownerPhone: '+250 78',
      ownerEmail: '',
      ownerPassword: '',
      shopName: '',
      districtLocation: DISTRICTS[0],
      shopType: 'Supermarket',
      staffCount: '1',
      subscriptionStatus: 'ACTIVE'
    });
  };

  const handleCreateAnyUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.fullName.trim() || !userForm.phone.trim()) {
      window.alert('Full name and phone are required.');
      return;
    }
    if (!userForm.email.includes('@') || !userForm.email.includes('.')) {
      window.alert('Enter a valid email address.');
      return;
    }
    if (userForm.password.trim() && userForm.password.trim().length < 6) {
      window.alert('Password must be at least 6 characters if manually assigned.');
      return;
    }
    const password = userForm.password.trim() || `Rwanda@${Math.floor(1000 + Math.random() * 9000)}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const roleUser: UserType = {
      id: `usr-${userForm.role}-${Date.now()}`,
      name: userForm.fullName.trim(),
      role: userForm.role,
      phone: userForm.phone.trim(),
      email: userForm.email.trim().toLowerCase(),
      shopName: userForm.shopName.trim() || (userForm.role === 'employee' ? 'SmartStock Retail' : 'SmartStock HQ'),
      shiftType: userForm.shiftType,
      pin,
      systemPassword: password,
      active: true,
      subscriptionStatus: userForm.subscriptionStatus
    };
    try {
      db.saveUser(roleUser);
      setCreatedUser({ user: roleUser, password });
      onRefreshData();
    } catch (err) {
      console.error(err);
      window.alert('Failed to create user. See console.');
    }
  };

  const closeAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setCreatedUser(null);
    setUserForm({
      fullName: '',
      role: 'employee',
      phone: '+250 78',
      email: '',
      password: '',
      shopName: '',
      shiftType: 'WHOLE_DAY',
      subscriptionStatus: 'ACTIVE'
    });
  };

  const toggleRevealPin = (user: UserType) => {
    setRevealedPinUsers(prev => {
      const next = new Set(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.add(user.id);
      }
      return next;
    });
  };

  const statusStyle = (user: UserType): { badge: string; dot: string; label: string } => {
    if (user.subscriptionStatus === 'ACTIVE' && user.active) {
      return { badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-400', label: 'Active • Subscriber' };
    }
    if (user.active) {
      return { badge: 'bg-purple-500/15 text-purple-400 border border-purple-500/30', dot: 'bg-purple-400', label: 'Active • ' + (user.subscriptionStatus || 'PENDING') };
    }
    return { badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30', dot: 'bg-rose-400', label: 'Suspended' };
  };

  if (currentUser.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Access denied — Super Admin only.
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Toast Snack */}
        {superAdminSnack && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            {superAdminSnack}
          </div>
        )}

        {/* ============================ HEADER ============================ */}
        <div className="text-center space-y-2 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" />
            Super Admin Console — SmartStock Rwanda HQ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal max-w-2xl mx-auto">
            Manage all seller accounts, monitor the entire SmartStock platform and onboard new store owners.
          </p>
        </div>

        {/* ============================ KPI CARDS ============================ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-white">{owners.length}</span>
              <Store className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Total Sellers</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-white">{activeOwners.length}</span>
              <Power className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Active Accounts</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-white">{activeSubscribers.length}</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Paid Subscribers</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-white">{employeeCount}</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Cashiers</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold font-mono text-white">{transactionCount}</span>
              <Receipt className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Transactions</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0b1329] border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold font-mono text-emerald-400">{totalRevenue.toLocaleString()}</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">RWF Revenue</p>
          </div>
        </div>

        {/* ============================ SYSTEM HEALTH ROW ============================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0b1329] border border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{pendingAlerts.length} Pending Fraud Alerts</div>
              <p className="text-xs text-slate-400 mt-0.5">
                {criticalAlerts.length} flagged {criticalAlerts.length === 1 ? 'as HIGH/CRITICAL' : 'as HIGH/CRITICAL'} across all stores.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0b1329] border border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{owners.length} Registered Business Accounts</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Combined on the central SmartStock platform.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0b1329] border border-slate-800 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">RRA & Platform Compliant</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time sales activity is fully EBM enabled. Demo credentials are pre-seeded.
              </p>
            </div>
          </div>
        </div>

        {/* ============================ SUBSCRIPTIONS & BILLING ============================ */}
        <div className="pt-2">
          <AdminSubscriptionDashboard
            onError={(msg) => handleSnack(msg)}
          />
        </div>

        {/* ============================ SELLER MANAGEMENT ============================ */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                Seller Accounts ({owners.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create, activate, suspend or remove store owner accounts system-wide.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.common.search}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setGeneratedAccount(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Add New Owner</span>
              </button>
              <button
                onClick={() => {
                  setCreatedUser(null);
                  setIsAddUserModalOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Add New User</span>
              </button>
            </div>
          </div>

          {/* Seller Table */}
          <div className="rounded-xl border border-slate-800 overflow-x-auto bg-[#0b1329]/60">
            {displayedOwners.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No seller accounts found. Click "Add New Owner" to onboard the first store.
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-bold">Owner</th>
                    <th className="px-4 py-3 font-bold">Shop</th>
                    <th className="px-4 py-3 font-bold">Contact</th>
                    <th className="px-4 py-3 font-bold">Subscription</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOwners.map(user => {
                    const st = statusStyle(user);
                    const pinRevealed = revealedPinUsers.has(user.id);
                    const passwordRevealed = revealedPasswordUsers.has(user.id);
                    return (
                      <tr key={user.id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white">{user.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-300 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {user.shopName}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" /> {user.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" /> {user.email || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${st.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-rose-500'}`}
                            />
                            <span className="text-slate-400">{user.active ? 'Enabled' : 'Suspended'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleRevealPin(user)}
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                              title={pinRevealed ? 'Hide PIN' : 'Show PIN'}
                            >
                              {pinRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => toggleRevealPassword(user)}
                              className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                              title={passwordRevealed ? 'Hide login password' : 'Show login password'}
                            >
                              <LockKeyhole className="w-4 h-4" />
                            </button>
                            {(pinRevealed || passwordRevealed) && (
                              <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300 font-mono text-[10px]">
                                {pinRevealed ? `PIN ${user.pin}` : `PW ${user.systemPassword || '—'}`}
                              </span>
                            )}
                            <button
                              onClick={() => handleResetPin(user)}
                              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                              title="Reset PIN"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition"
                              title="Assign / reset login password"
                            >
                              <LockKeyhole className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`p-2 rounded-lg transition ${
                                user.active
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                              }`}
                              title={user.active ? 'Suspend account' : 'Activate account'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onLoginAsOwner(user)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition"
                              title="Impersonate owner"
                            >
                              Login As
                            </button>
                            <button
                              onClick={() => handleDeleteOwner(user)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Delete account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ============================ RECENT SYSTEM ACTIVITY ============================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Alerts */}
          <div className="rounded-xl bg-[#0b1329] border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Recent Fraud Alerts
            </h3>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500">No alerts recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 5).map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300'
                        : a.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {a.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5 font-semibold">{a.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl bg-[#0b1329] border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-purple-400" />
              Recent Sales Activity
            </h3>
            {sales.length === 0 ? (
              <p className="text-xs text-slate-500">No sales recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {sales.slice(0, 5).map(s => (
                  <div key={s.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{s.receiptNumber}</div>
                      <div className="text-[10px] text-slate-500">
                        {s.cashierName} • {s.items.length} item(s) • {new Date(s.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">{s.totalRwf.toLocaleString()} RWF</div>
                      <div className="text-[10px] text-slate-500">{s.paymentMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================ CREATE OWNER MODAL ============================ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Onboard New Owner Account</span>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generatedAccount ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Owner account created successfully!</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div><span className="text-slate-500">Name:</span> <strong className="text-white">{generatedAccount.user.name}</strong></div>
                    <div><span className="text-slate-500">Shop:</span> {generatedAccount.user.shopName}</div>
                    <div><span className="text-slate-500">Email:</span> {generatedAccount.user.email}</div>
                    <div><span className="text-slate-500">Login PIN:</span> <strong className="font-mono text-amber-300">{generatedAccount.user.pin}</strong></div>
                    <div><span className="text-slate-500">Password:</span> <strong className="font-mono text-amber-300">{generatedAccount.password}</strong></div>
                    <div><span className="text-slate-500">Subscription:</span> {generatedAccount.user.subscriptionStatus}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={closeCreateModal}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex-1 transition"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => onLoginAsOwner(generatedAccount.user)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl flex-1 transition"
                  >
                    Switch to New Owner
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOwner} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Owner Full Name *
                    </label>
                    <input
                      type="text"
                      value={form.ownerFullName}
                      onChange={(e) => setForm({ ...form, ownerFullName: e.target.value })}
                      placeholder="e.g., Alice Mukamurenzi"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      value={form.shopName}
                      onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                      placeholder="e.g., Kigali Fresh Mart"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Phone *
                    </label>
                    <input
                      type="text"
                      value={form.ownerPhone}
                      onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                      placeholder="+250 788 123 456"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.ownerEmail}
                      onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                      placeholder="owner@shop.rw"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Login Password
                    </label>
                    <input
                      type="text"
                      value={form.ownerPassword}
                      onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                      placeholder="Auto-generated if left blank (min 6 chars)"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    District / Location
                  </label>
                  <select
                    value={form.districtLocation}
                    onChange={(e) => setForm({ ...form, districtLocation: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Shop Type
                    </label>
                    <select
                      value={form.shopType}
                      onChange={(e) => setForm({ ...form, shopType: e.target.value as OnboardingRegistration['shopType'] })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    >
                      {SHOP_TYPES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Staff Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.staffCount}
                      onChange={(e) => setForm({ ...form, staffCount: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Subscription
                    </label>
                    <select
                      value={form.subscriptionStatus}
                      onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value as UserType['subscriptionStatus'] })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Paid)</option>
                      <option value="TRIAL">TRIAL</option>
                      <option value="PENDING">PENDING Payment</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full pt-3 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer mt-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Owner Account & Send SMS</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================ CREATE NEW USER (ANY ROLE) MODAL ============================ */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Add New User</span>
              </div>
              <button
                onClick={closeAddUserModal}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createdUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>User created successfully!</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div><span className="text-slate-500">Name:</span> <strong className="text-white">{createdUser.user.name}</strong></div>
                    <div><span className="text-slate-500">Role:</span> <strong className="text-white uppercase">{createdUser.user.role}</strong></div>
                    <div><span className="text-slate-500">Shop:</span> {createdUser.user.shopName}</div>
                    <div><span className="text-slate-500">Email:</span> {createdUser.user.email}</div>
                    <div><span className="text-slate-500">Login PIN:</span> <strong className="font-mono text-amber-300">{createdUser.user.pin}</strong></div>
                    <div><span className="text-slate-500">Password:</span> <strong className="font-mono text-amber-300">{createdUser.password}</strong></div>
                  </div>
                </div>

                <button
                  onClick={closeAddUserModal}
                  className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateAnyUser} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Role (Umwanya) *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="employee">Cashier (Umukozi wo gucuruza)</option>
                    <option value="owner">Owner (Nyene Iduka)</option>
                    <option value="auditor">Auditor (Isuzuma)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.fullName}
                      onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                      placeholder="e.g., Alice Mukamurenzi"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="+250 788 123 456"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="user@shop.rw"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Login Password
                  </label>
                  <input
                    type="text"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Auto-generated if left blank (min 6 chars)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={userForm.shopName}
                      onChange={(e) => setUserForm({ ...userForm, shopName: e.target.value })}
                      placeholder="e.g., Kigali Fresh Mart"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Shift Type
                    </label>
                    <select
                      value={userForm.shiftType as string}
                      onChange={(e) => setUserForm({ ...userForm, shiftType: e.target.value as UserType['shiftType'] })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="WHOLE_DAY">Whole Day</option>
                      <option value="PART_TIME_MORNING">Part Time - Morning</option>
                      <option value="PART_TIME_EVENING">Part Time - Evening</option>
                      <option value="MORNING_SHIFT">Morning Shift</option>
                      <option value="AFTERNOON_SHIFT">Afternoon Shift</option>
                      <option value="NIGHT_SHIFT">Night Shift</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};