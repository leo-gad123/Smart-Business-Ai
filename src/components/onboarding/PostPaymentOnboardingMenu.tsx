import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Package, 
  PlusCircle, 
  Users, 
  Activity, 
  Clock, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  DollarSign, 
  Phone, 
  Mail, 
  Lock, 
  KeyRound, 
  Copy, 
  Send, 
  Check, 
  ShieldAlert, 
  TrendingUp, 
  Calendar, 
  Eye, 
  AlertCircle
} from 'lucide-react';
import { Product, ProductCategory, User as UserType, ShiftType, AttendanceRecord, ShiftRegister } from '../../types';

export interface PostPaymentOnboardingMenuProps {
  shopName?: string;
  ownerName?: string;
  ownerPhone?: string;
  onSelectStep?: (stepId: number) => void;
  onSaveProduct?: (product: Product) => void;
  onSaveEmployee?: (user: UserType) => void;
  onNavigateToPOS?: () => void;
  onNavigateToStock?: () => void;
  onClose?: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Alimentation & Groceries',
  'Beverages & Drinks',
  'Personal Care & Beauty',
  'Household & Cleaning',
  'Electronics & Airtime',
  'Boutique & Clothing'
];

export const PostPaymentOnboardingMenu: React.FC<PostPaymentOnboardingMenuProps> = ({
  shopName = 'SmartStock Shop Kigali',
  ownerName = 'Gérant / Owner',
  ownerPhone = '+250 788 123 456',
  onSelectStep,
  onSaveProduct,
  onSaveEmployee,
  onNavigateToPOS,
  onNavigateToStock,
  onClose
}) => {
  // Modal State for the 5 actions
  const [activeModal, setActiveModal] = useState<number | null>(null);

  // Completed steps tracking
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]); // Step 1 pre-activated on registration

  // Notification / Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // STEP 1 STATE: Register Stock (Shyiraho Ububiko Bwawe)
  // ---------------------------------------------------------------------------
  const [stockName, setStockName] = useState(shopName);
  const [stockBranch, setStockBranch] = useState('Main Depot (Kigali)');
  const [stockSector, setStockSector] = useState('Alimentation & Retail');
  const [startingFloat, setStartingFloat] = useState('50000');
  const [rraEbmEnabled, setRraEbmEnabled] = useState(true);

  const handleRegisterStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompletedSteps(prev => Array.from(new Set([...prev, 1])));
    showToast(`Ububiko bwa "${stockName}" bwafunguwe neza muri system!`);
    setActiveModal(null);
  };

  // ---------------------------------------------------------------------------
  // STEP 2 STATE: Add Product to Stock (Injiza Ibicuruzwa - NO Barcode needed)
  // ---------------------------------------------------------------------------
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState<ProductCategory>('Alimentation & Groceries');
  const [prodUnit, setProdUnit] = useState('pcs');
  const [prodCostPrice, setProdCostPrice] = useState('');
  const [prodSellingPrice, setProdSellingPrice] = useState('');
  const [prodFloorPrice, setProdFloorPrice] = useState('');
  const [prodStockQty, setProdStockQty] = useState('');
  const [prodExpiry, setProdExpiry] = useState('');

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert("Izina ry'igicuruzwa rirakenewe.");
      return;
    }

    const cost = parseFloat(prodCostPrice) || 0;
    const selling = parseFloat(prodSellingPrice) || 0;
    const floor = parseFloat(prodFloorPrice) || cost;
    const qty = parseInt(prodStockQty, 10) || 0;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: prodName.trim(),
      category: prodCat,
      costPriceRwf: cost,
      sellingPriceRwf: selling,
      minSellingPriceRwf: floor,
      currentStock: qty,
      unit: prodUnit.trim() || 'pcs',
      reorderLevel: 5,
      isVatApplicable: true,
      expiryDate: prodExpiry || undefined,
      lastRestockedAt: new Date().toISOString()
    };

    if (onSaveProduct) {
      onSaveProduct(newProduct);
    }

    setCompletedSteps(prev => Array.from(new Set([...prev, 2])));
    showToast(`"${newProduct.name}" yinjijwe muri stock (${qty} ${newProduct.unit})!`);
    
    // Reset form
    setProdName('');
    setProdCostPrice('');
    setProdSellingPrice('');
    setProdFloorPrice('');
    setProdStockQty('');
    setProdExpiry('');
    setActiveModal(null);
  };

  // ---------------------------------------------------------------------------
  // STEP 3 STATE: Management of Employees & Roles (Gucunga Abakozi n'Inshingano)
  // ---------------------------------------------------------------------------
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState<'employee' | 'owner'>('employee');
  const [empShift, setEmpShift] = useState<ShiftType>('WHOLE_DAY');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState(`Rwanda@${Math.floor(1000 + Math.random() * 9000)}`);
  const [empPin, setEmpPin] = useState(String(Math.floor(1000 + Math.random() * 9000)));
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    phone: string;
    role: string;
    shift: string;
    pin: string;
    password: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const handleRegisterEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empPhone.trim()) {
      alert('Imyirondoro na telefone birakenewe.');
      return;
    }

    const newUser: UserType = {
      id: `usr-${Date.now()}`,
      name: empName.trim(),
      phone: empPhone.trim(),
      email: empEmail.trim() || `${empName.toLowerCase().replace(/\s+/g, '.')}@shop.rw`,
      role: empRole,
      shiftType: empShift,
      pin: empPin.trim() || '1234',
      systemPassword: empPassword.trim(),
      shopName: shopName,
      active: true
    };

    if (onSaveEmployee) {
      onSaveEmployee(newUser);
    }

    setCreatedCredentials({
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role === 'owner' ? 'Store Manager (Gérant)' : 'Cashier (POS Operator)',
      shift: newUser.shiftType === 'WHOLE_DAY' 
        ? 'Whole Day (07:30 - 21:30)' 
        : (newUser.shiftType === 'MORNING_SHIFT' || newUser.shiftType === 'PART_TIME_MORNING')
        ? 'Morning Shift (07:30 - 14:30)' 
        : (newUser.shiftType === 'AFTERNOON_SHIFT' || newUser.shiftType === 'PART_TIME_EVENING')
        ? 'Afternoon Shift (14:30 - 22:00)'
        : newUser.shiftType === 'NIGHT_SHIFT'
        ? 'Night Shift (22:00 - 06:00)'
        : 'Whole Day',
      pin: newUser.pin,
      password: newUser.systemPassword || 'Rwanda@2026'
    });

    setCompletedSteps(prev => Array.from(new Set([...prev, 3])));
    showToast(`Umukozi "${newUser.name}" yanditswe muri sisitemu!`);

    // Reset Form
    setEmpName('');
    setEmpPhone('');
    setEmpEmail('');
    setEmpPassword(`Rwanda@${Math.floor(1000 + Math.random() * 9000)}`);
    setEmpPin(String(Math.floor(1000 + Math.random() * 9000)));
  };

  const copyCredsToClipboard = () => {
    if (!createdCredentials) return;
    const txt = `SMARTSTOCK RWANDA - STAFF ACCESS
Shop: ${shopName}
Name: ${createdCredentials.name}
Role: ${createdCredentials.role}
Shift: ${createdCredentials.shift}
Phone: ${createdCredentials.phone}
POS PIN: ${createdCredentials.pin}
System Password: ${createdCredentials.password}`;
    navigator.clipboard.writeText(txt);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  // ---------------------------------------------------------------------------
  // STEP 4 STATE: Live Sales Tracking Hub (Igenzura ry'Ubucuruzi)
  // ---------------------------------------------------------------------------
  const [liveDrawerCash] = useState<number>(45600);
  const [liveDrawerMomo] = useState<number>(128400);
  const [liveSalesCount] = useState<number>(14);

  // ---------------------------------------------------------------------------
  // STEP 5 STATE: Attendance & Shift Logs (Gukurikirana Amasaha y'Abakozi)
  // ---------------------------------------------------------------------------
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([
    {
      id: 'att-1',
      userId: 'usr-cashier-1',
      userName: 'Emmanuel Habimana',
      userRole: 'employee',
      shiftType: 'WHOLE_DAY',
      date: '2026-09-04',
      checkInTime: '07:28 AM',
      status: 'ON_DUTY',
      hoursLogged: 6.2
    },
    {
      id: 'att-2',
      userId: 'usr-cashier-2',
      userName: 'Chantal Uwimana',
      userRole: 'employee',
      shiftType: 'MORNING_SHIFT',
      date: '2026-09-04',
      checkInTime: '07:35 AM',
      checkOutTime: '03:00 PM',
      status: 'COMPLETED',
      hoursLogged: 8.0
    }
  ]);

  const [clockInStaffName, setClockInStaffName] = useState('');
  const [clockInShiftType, setClockInShiftType] = useState<ShiftType>('WHOLE_DAY');

  const handleClockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInStaffName.trim()) return;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      userName: clockInStaffName.trim(),
      userRole: 'employee',
      shiftType: clockInShiftType,
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ON_DUTY',
      hoursLogged: 0.1
    };

    setAttendanceList(prev => [newRecord, ...prev]);
    setClockInStaffName('');
    setCompletedSteps(prev => Array.from(new Set([...prev, 5])));
    showToast(`Amasaha ya "${newRecord.userName}" yatangiye kubarwa (${newRecord.checkInTime})!`);
  };

  const handleClockOut = (attId: string) => {
    setAttendanceList(prev => prev.map(rec => {
      if (rec.id === attId) {
        return {
          ...rec,
          checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'COMPLETED'
        };
      }
      return rec;
    }));
    showToast('Umukozi asoje shift neza!');
  };

  // Menu items array with strict titles, subtexts, and icons
  const MENU_ITEMS = [
    {
      id: 1,
      icon: Package,
      title: '1. Register Stock (Shyiraho Ububiko Bwawe)',
      subtext: "Fungura stock nshya muri system nk'ubucuruzi bushya (Startup)",
      badge: completedSteps.includes(1) ? 'Yiteguye' : 'Intambwe 1'
    },
    {
      id: 2,
      icon: PlusCircle,
      title: '2. Add Product to Stock (Injiza Ibicuruzwa)',
      subtext: "Andika ibicuruzwa n'ibiciro byabyo (Ayaranguwe n'Ayo kuguza - NO Barcode needed)",
      badge: completedSteps.includes(2) ? 'Bikozwe' : 'Intambwe 2'
    },
    {
      id: 3,
      icon: Users,
      title: "3. Management of Employees & Roles (Gucunga Abakozi n'Inshingano)",
      subtext: 'Tanga access: Imyirondoro, Role (Cashier/Manager), Shift (Part-time/Whole Day), Email, Phone, & Login Password',
      badge: completedSteps.includes(3) ? 'Bikozwe' : 'Intambwe 3'
    },
    {
      id: 4,
      icon: Activity,
      title: "4. Management of Business & Live Monitoring (Igenzura ry'Ubucuruzi)",
      subtext: 'Automatically Activate System Live: Kurikirana ibirigucuruzwa mu kanyabyatita, kureba kase, no gufunga iminsi',
      badge: completedSteps.includes(4) ? 'Live' : 'Intambwe 4'
    },
    {
      id: 5,
      icon: Clock,
      title: "5. Attendance & Shift Logs (Gukurikirana Amasaha y'Abakozi)",
      subtext: "Genzura igihe abakozi binjirira n'ayo basohokera ku kazi mu buryo bw'otomatike",
      badge: completedSteps.includes(5) ? 'Bikozwe' : 'Intambwe 5'
    }
  ];

  const handleOpenItem = (itemId: number) => {
    setActiveModal(itemId);
    if (onSelectStep) {
      onSelectStep(itemId);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Toast alert feedback */}
      {toastMessage && (
        <div className="mb-4 p-3.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-between transition animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Clean Card Container */}
      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* ===================================================================== */}
        {/* 1. HEADER & BRANDING */}
        {/* ===================================================================== */}
        <div className="p-6 sm:p-7 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              title="Funga"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Official Logo with Emerald Green Shield Icon */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                SmartStock
              </span>
              <span className="text-xs font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                RWANDA
              </span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Ikaze muri SmartStock! Hitamo Icyo Gutangiriraho
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Konti yawe yafunguwe neza. Hitamo intambwe ukurikizaho gusettinga ubucuruzi bwawe.
          </p>

          {/* Shop detail pill */}
          <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Iduka: <strong className="text-slate-900">{shopName}</strong></span>
            <span className="text-slate-300">&bull;</span>
            <span>Gérant: <strong className="text-slate-900">{ownerName}</strong></span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. ONBOARDING MENU ITEMS (Clean White Vertical List Component) */}
        {/* ===================================================================== */}
        <div className="divide-y divide-slate-100">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isCompleted = completedSteps.includes(item.id);

            return (
              <div
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => handleOpenItem(item.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-emerald-50/50 transition-colors cursor-pointer group"
              >
                {/* Left side: Icon + Texts */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isCompleted 
                      ? 'bg-emerald-100/70 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:border-emerald-200'
                  }`}>
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {item.title}
                      </h2>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">Done</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug group-hover:text-slate-600">
                      {item.subtext}
                    </p>
                  </div>
                </div>

                {/* Right side: Badge & Emerald Chevron Right */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition">
                    {item.badge}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-transparent group-hover:bg-emerald-100 flex items-center justify-center transition">
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Card Footer: Quick Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>RRA 18% EBM Ready &bull; Anti-Theft Guard</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigateToStock && (
              <button
                onClick={onNavigateToStock}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition"
              >
                Kureba Ububiko (Stock)
              </button>
            )}

            {onNavigateToPOS && (
              <button
                onClick={onNavigateToPOS}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Fungura POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ACTION MODAL 1: REGISTER STOCK (Shyiraho Ububiko Bwawe) */}
      {/* ===================================================================== */}
      {activeModal === 1 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    1. Register Stock (Shyiraho Ububiko Bwawe)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fungura stock nshya muri system nk'ubucuruzi bushya (Startup)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterStockSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Izina ry'Ububiko / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={stockName}
                  onChange={(e) => setStockName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Ishami / Branch Depot
                  </label>
                  <input
                    type="text"
                    value={stockBranch}
                    onChange={(e) => setStockBranch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Icyiciro cy'Ubucuruzi (Sector)
                  </label>
                  <select
                    value={stockSector}
                    onChange={(e) => setStockSector(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Alimentation & Retail">Alimentation & Retail</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Pharmacy / Depôt">Pharmacy / Depôt</option>
                    <option value="Boutique & Fashion">Boutique & Fashion</option>
                    <option value="Quincaillerie / Hardware">Quincaillerie / Hardware</option>
                    <option value="Bar & Restaurant">Bar & Restaurant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Initial Cash Float / Ayo gutangirana muri Kase (RWF)
                </label>
                <input
                  type="number"
                  min="0"
                  value={startingFloat}
                  onChange={(e) => setStartingFloat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">RRA EBM 18% VAT Tax Configuration</span>
                  <span className="text-[11px] text-slate-500">Igenzura fagitire zemewe z'imisoro</span>
                </div>
                <input
                  type="checkbox"
                  checked={rraEbmEnabled}
                  onChange={(e) => setRraEbmEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Bireke
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Shyiraho Ububiko Bwawe (Activate Stock)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTION MODAL 2: ADD PRODUCT TO STOCK (NO Barcode needed) */}
      {/* ===================================================================== */}
      {activeModal === 2 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    2. Add Product to Stock (Injiza Ibicuruzwa)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Andika ibicuruzwa n'ibiciro byabyo (Ayaranguwe n'Ayo kuguza - NO Barcode needed)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Izina ry'Igicuruzwa (Product Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Urugero: Amata ya Inyange 500ml, Azam Kawunga 1kg..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Icyiciro (Category) *
                  </label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Igipimo (Unit)
                  </label>
                  <input
                    type="text"
                    value={prodUnit}
                    placeholder="pcs, bottle, kg, pack"
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 truncate" title="Ayaranguwe (Cost Price RWF)">
                    Ayaranguwe (Cost) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="450"
                    value={prodCostPrice}
                    onChange={(e) => setProdCostPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 truncate" title="Ayo Kugurisha (Selling Price RWF)">
                    Ayo Kugurisha *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="600"
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-emerald-700 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 truncate" title="Floor Price (Igiciro Ntarengwa)">
                    Floor Price (Min) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="580"
                    value={prodFloorPrice}
                    onChange={(e) => setProdFloorPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Umubare w'Ibicuruzwa (Stock Qty) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 50"
                    value={prodStockQty}
                    onChange={(e) => setProdStockQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Itariki y'Iherezo (Expiry Date)
                  </label>
                  <input
                    type="date"
                    value={prodExpiry}
                    onChange={(e) => setProdExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Nta barcode ikenewe! Igicuruzwa kizagaragara ako kanya kuri POS no mu bubiko.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Bireke
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Injiza Igicuruzwa muri Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTION MODAL 3: MANAGEMENT OF EMPLOYEES & ROLES */}
      {/* ===================================================================== */}
      {activeModal === 3 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    3. Management of Employees & Roles
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gucunga Abakozi n'Inshingano: Cashier/Manager, Shift, Phone, Password
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Credentials Callout */}
            {createdCredentials && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Access Credentials Ziteguwe!
                  </span>
                  <button
                    onClick={copyCredsToClipboard}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                  >
                    {copiedCreds ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCreds ? 'Byakopiwe!' : 'Kopera'}</span>
                  </button>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-[11px] font-mono grid grid-cols-2 gap-1.5 text-slate-700">
                  <div>Umukozi: <strong className="text-slate-900">{createdCredentials.name}</strong></div>
                  <div>Inshingano: <strong className="text-slate-900">{createdCredentials.role}</strong></div>
                  <div>Shift: <strong className="text-slate-900">{createdCredentials.shift}</strong></div>
                  <div>Telefone: <strong className="text-slate-900">{createdCredentials.phone}</strong></div>
                  <div>POS PIN: <strong className="text-emerald-700 font-bold">{createdCredentials.pin}</strong></div>
                  <div>Password: <strong className="text-slate-900">{createdCredentials.password}</strong></div>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterEmployeeSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Imyirondoro y'Umukozi (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kevine Mukamana, Patrick Habineza"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Role (Inshingano) *
                  </label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as 'employee' | 'owner')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                  >
                    <option value="employee">Cashier (POS Quick-Sell)</option>
                    <option value="owner">Manager (Gérant - Ububiko)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shift (Amasaha y'Akazi) *
                  </label>
                  <select
                    value={empShift}
                    onChange={(e) => setEmpShift(e.target.value as ShiftType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                  >
                    <option value="WHOLE_DAY">Whole Day (07:30 - 21:30)</option>
                    <option value="MORNING_SHIFT">Morning Shift (07:30 - 14:30)</option>
                    <option value="AFTERNOON_SHIFT">Afternoon Shift (14:30 - 22:00)</option>
                    <option value="NIGHT_SHIFT">Night Shift (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Nimero ya Telefone (Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+250 788 000 000"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Imeli y'Umukozi (Email - Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="kevine@shop.rw"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Login Password (Ijambobanga)
                  </label>
                  <input
                    type="text"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    4-Digit Quick POS PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={empPin}
                    onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-center text-emerald-700 focus:bg-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Funga
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Tanga Access & Kora Konti y'Umukozi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTION MODAL 4: LIVE MONITORING & SALES TRACKING HUB */}
      {/* ===================================================================== */}
      {activeModal === 4 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    4. Management of Business & Live Monitoring
                  </h3>
                  <p className="text-xs text-slate-500">
                    Igenzura ry'Ubucuruzi mu Kanyabyatita &bull; Kureba Kase no gufunga iminsi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Live KPI Tickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Cash in Drawer (Kase y'Amanota)
                  </span>
                  <div className="text-lg font-extrabold font-mono text-emerald-700 mt-1">
                    {liveDrawerCash.toLocaleString()} RWF
                  </div>
                  <span className="text-[10px] text-emerald-600">Amanota n'ibiceri biri muri kase</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    MTN MoMo / Airtel Balance
                  </span>
                  <div className="text-lg font-extrabold font-mono text-amber-700 mt-1">
                    {liveDrawerMomo.toLocaleString()} RWF
                  </div>
                  <span className="text-[10px] text-amber-600">Ayakiriwe kuri nimero y'ubucuruzi</span>
                </div>
              </div>

              {/* Total Daily Sales */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-semibold block">Ibyagurishijwe Uyu Munsi (Today's Sales):</span>
                  <span className="font-extrabold text-sm text-slate-900 font-mono">
                    {(liveDrawerCash + liveDrawerMomo).toLocaleString()} RWF
                  </span>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                  {liveSalesCount} Fagitire Zishyuwe
                </span>
              </div>

              {/* Live Status Indicators */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>System Live Telemetry:</span>
                  </span>
                  <strong className="text-emerald-700">Active & Syncing</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cashier ku Kazi (Active Operator):</span>
                  <strong className="text-slate-900">Kevine M. (Kigali POS-1)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anti-Theft Shift Lock:</span>
                  <strong className="text-slate-900">Blind Reconciliation Enabled</strong>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSteps(prev => Array.from(new Set([...prev, 4])));
                    showToast('Igenzura ryakoreshejwe!');
                    setActiveModal(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Funga
                </button>

                {onNavigateToPOS && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      onNavigateToPOS();
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <span>Fungura Live POS Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ACTION MODAL 5: ATTENDANCE & SHIFT LOGS */}
      {/* ===================================================================== */}
      {activeModal === 5 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    5. Attendance & Shift Logs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gukurikirana Amasaha y'Abakozi n'Igihe binjirira ku kazi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Quick Clock-in Form */}
              <form onSubmit={handleClockIn} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-800 block">Kwandika Kwinjira ku Kazi (Clock-in Staff)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Izina ry'umukozi winjiye..."
                    value={clockInStaffName}
                    onChange={(e) => setClockInStaffName(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
                  />
                  <select
                    value={clockInShiftType}
                    onChange={(e) => setClockInShiftType(e.target.value as ShiftType)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="WHOLE_DAY">Whole Day Shift</option>
                    <option value="PART_TIME_MORNING">Part-time Morning</option>
                    <option value="PART_TIME_EVENING">Part-time Evening</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
                >
                  Emeza Kwinjira ku Kazi (Clock In Now)
                </button>
              </form>

              {/* Attendance Table */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Amasaha yanditswe Uyu Munsi ({attendanceList.length})
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Umukozi</th>
                        <th className="py-2 px-3">Shift</th>
                        <th className="py-2 px-3">Injirira</th>
                        <th className="py-2 px-3">Sohokera</th>
                        <th className="py-2 px-3 text-right">Igikorwa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceList.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-800">{rec.userName}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[10px]">
                            {rec.shiftType === 'WHOLE_DAY' ? 'Whole Day' : 'Part-Time'}
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-700 font-semibold">
                            {rec.checkInTime}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {rec.checkOutTime || (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                On Duty
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {!rec.checkOutTime ? (
                              <button
                                onClick={() => handleClockOut(rec.id)}
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold"
                              >
                                Clock Out
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Yasoje</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Funga
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
