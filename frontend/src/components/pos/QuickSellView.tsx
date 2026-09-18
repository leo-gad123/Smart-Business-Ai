import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  AlertCircle, 
  Check, 
  ShoppingBag,
  Sparkles,
  RefreshCcw,
  Layers,
  PhoneCall,
  TrendingUp,
  Lock,
  Boxes,
  Loader2,
  FileText,
  BookOpen,
  UserCheck,
  Calendar
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, User, ShiftRegister, SaleTransaction, ProductCategory } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import { FraudDetectionEngine } from '../../services/fraudEngine';

interface QuickSellViewProps {
  products: Product[];
  currentUser: User;
  currentShift: ShiftRegister | null;
  onRecordSale: (saleData: any) => SaleTransaction;
  onOpenShiftModal: () => void;
  onRaiseAlert: (alertData: any) => void;
  onOpenReconciliation?: () => void;
  onSeedDefaultProducts?: () => void;
}

const CATEGORIES: ('ALL' | ProductCategory)[] = [
  'ALL',
  'Alimentation & Groceries',
  'Beverages & Drinks',
  'Personal Care & Beauty',
  'Household & Cleaning',
  'Electronics & Airtime',
  'Boutique & Clothing'
];

export const QuickSellView: React.FC<QuickSellViewProps> = ({
  products,
  currentUser,
  currentShift,
  onRecordSale,
  onOpenShiftModal,
  onRaiseAlert,
  onOpenReconciliation,
  onSeedDefaultProducts
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [momoRef, setMomoRef] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [creditDueDate, setCreditDueDate] = useState<string>('');
  const [creditNotes, setCreditNotes] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  // PHOTO 2: RRA EBM VAT Toggle (Enabled by default, 18% VAT)
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(true);
  // PHOTO 3: Post-Sale PDF Receipt generation loading state
  const [isGeneratingPdfReceipt, setIsGeneratingPdfReceipt] = useState<boolean>(false);

  // Live shift revenue for this cashier
  const cashierTodaySalesRwf = useMemo(() => {
    if (!currentShift) return 0;
    return (currentShift.totalCashSalesRwf || 0) + (currentShift.totalMomoSalesRwf || 0);
  }, [currentShift]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const subtotalRwf = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.totalRwf, 0);
  }, [cart]);

  // PHOTO 2: When toggled OFF, set RRA VAT Base & Amount calculation directly to 0 RWF, updating the Total Amount accordingly.
  const vatBaseRwf = useMemo(() => {
    if (!isVatEnabled) return 0;
    return Math.round(subtotalRwf / 1.18);
  }, [subtotalRwf, isVatEnabled]);

  const vatAmountRwf = useMemo(() => {
    if (!isVatEnabled) return 0;
    return Math.round(subtotalRwf - (subtotalRwf / 1.18));
  }, [subtotalRwf, isVatEnabled]);

  const totalAmountRwf = useMemo(() => {
    if (!isVatEnabled) {
      return Math.round(subtotalRwf / 1.18);
    }
    return subtotalRwf;
  }, [subtotalRwf, isVatEnabled]);

  const totalCostRwf = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.costPriceRwf * item.quantity), 0);
  }, [cart]);

  const totalUnits = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const numericCashTendered = parseFloat(cashTendered) || 0;
  const changeRwf = Math.max(0, numericCashTendered - totalAmountRwf);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`⚠️ "${product.name}" is currently out of stock. Please restock or adjust inventory.`);
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        const newQty = item.quantity + 1;
        if (newQty > product.currentStock) {
          alert(`Cannot add more than available stock (${product.currentStock} units).`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          totalRwf: newQty * item.unitPriceRwf
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPriceRwf: product.sellingPriceRwf,
            appliedDiscountRwf: 0,
            totalRwf: product.sellingPriceRwf
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.currentStock) {
            alert(`Maximum stock reached (${item.product.currentStock} ${item.product.unit}).`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            totalRwf: newQty * item.unitPriceRwf
          };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Price tampering validation handler
  const handlePriceChange = (item: CartItem, newPrice: number) => {
    const validation = FraudDetectionEngine.validateItemPrice(
      item.product,
      newPrice,
      currentUser.name
    );

    if (!validation.valid && validation.alert) {
      alert(`🛑 FRAUD ALERT: You cannot sell "${item.product.name}" below minimum price (${item.product.minSellingPriceRwf.toLocaleString()} RWF) without Owner PIN.`);
      onRaiseAlert(validation.alert);
      return;
    }

    setCart(prev => prev.map(i => {
      if (i.product.id === item.product.id) {
        return {
          ...i,
          unitPriceRwf: newPrice,
          totalRwf: newPrice * i.quantity
        };
      }
      return i;
    }));
  };

  // Process completed checkout (PHOTO 3: loading state "Irikurema Facture ya PDF...")
  const handleCompleteSale = () => {
    if (cart.length === 0 || isGeneratingPdfReceipt) return;

    if (paymentMethod === 'CASH' && numericCashTendered < totalAmountRwf) {
      alert(`Cash tendered (${numericCashTendered.toLocaleString()} RWF) is less than total amount (${totalAmountRwf.toLocaleString()} RWF).`);
      return;
    }

    if (paymentMethod === 'CREDIT') {
      if (!customerName.trim()) {
        alert("⚠️ Kwikopesha bisaba kwandika Izina ry'Umukiriya (Customer Full Name) kugira ngo byandikwe mu gitabo cy'amadeni.");
        return;
      }
      if (!customerPhone.trim()) {
        alert("⚠️ Kwikopesha bisaba kwandika Nimero ya Telefoni y'Umukiriya (Phone Number) kugira ngo yohererezwe inyemezabwishyu n'ikibutso cyo kwishyura.");
        return;
      }
    }

    // Trigger temporary loading state
    setIsGeneratingPdfReceipt(true);

    // Safety timeout: the loading state must ALWAYS end, never an infinite spinner
    const safetyTimer = window.setTimeout(() => {
      setIsGeneratingPdfReceipt(false);
    }, 10000);

    try {
      // Auto-generate MoMo Reference if empty
      const finalMomoRef = momoRef.trim() || (paymentMethod === 'MOMO_MTN' ? `MTN-${Math.floor(100000 + Math.random() * 900000)}` : paymentMethod === 'AIRTEL_MONEY' ? `AIR-${Math.floor(100000 + Math.random() * 900000)}` : undefined);

      // Pass items in the format db.recordSale expects: { product: Product, ... }[]
      const saleRecord = onRecordSale({
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        items: cart.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unitPriceRwf: item.unitPriceRwf,
          costPriceRwf: item.product.costPriceRwf,
          totalRwf: item.totalRwf
        })),
        subtotalRwf: totalAmountRwf,
        discountRwf: 0,
        totalRwf: totalAmountRwf,
        totalCostRwf,
        grossProfitRwf: totalAmountRwf - totalCostRwf,
        paymentMethod,
        cashTenderedRwf: paymentMethod === 'CASH' ? numericCashTendered : totalAmountRwf,
        changeGivenRwf: paymentMethod === 'CASH' ? changeRwf : 0,
        momoReference: finalMomoRef,
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
        isVatDisabled: !isVatEnabled
      });

      window.clearTimeout(safetyTimer);

      // Sale completed — reset cart and show receipt (PDF auto-downloads inside ReceiptModal)
      setIsGeneratingPdfReceipt(false);
      setLastCompletedSale(saleRecord);
      setCart([]);
      setIsCheckoutOpen(false);
      setCashTendered('');
      setMomoRef('');
      setCustomerPhone('');
      setCustomerName('');
      setCreditDueDate('');
      setCreditNotes('');
    } catch (err) {
      window.clearTimeout(safetyTimer);
      console.error('Sale recording failed:', err);
      setIsGeneratingPdfReceipt(false);
      alert(`Sale recording failed: ${err instanceof Error ? err.message : String(err)}. Please try again.`);
    }
  };

  // Void cart handler (security-tracked)
  const handleCancelCart = () => {
    if (cart.length === 0) return;
    setVoidConfirmOpen(true);
  };

  const confirmVoidCart = () => {
    if (!voidReason.trim()) {
      alert('Please specify a reason for voiding this cart.');
      return;
    }

    onRaiseAlert({
      title: `Cart Voided: ${subtotalRwf.toLocaleString()} RWF`,
      description: `Cashier ${currentUser.name} cancelled a basket with ${totalUnits} items (${cart.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}). Reason: "${voidReason}".`,
      severity: subtotalRwf > 5000 ? 'HIGH' : 'MEDIUM',
      category: 'PHANTOM_VOID',
      relatedCashierName: currentUser.name,
      amountAtRiskRwf: subtotalRwf,
      suggestedAction: 'Review transaction log to confirm customer walked away.'
    });

    setCart([]);
    setVoidConfirmOpen(false);
    setVoidReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-3 sm:py-4">
      {/* Shift Warning Banner if Shift is Closed */}
      {!currentShift && (
        <div className="mb-4 p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-200">No Cash Register Shift Currently Open</p>
              <p className="text-[11px] text-amber-300/80">Opening float ensures blind drawer auditing and catches daily cash discrepancies.</p>
            </div>
          </div>
          <button
            id="btn-open-shift-banner"
            onClick={onOpenShiftModal}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl transition shadow-sm"
          >
            Open Shift Float
          </button>
        </div>
      )}

      {/* Main Grid: Left Products Grid, Right Active Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Catalog & Quick-Sell (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search Row */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-pos-search"
              type="text"
              placeholder="Shakisha igicuruzwa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-emerald-500 outline-none shadow-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`btn-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-neutral-100 text-neutral-950 font-bold shadow-xs'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat === 'ALL' ? '🌟 Byose (All Items)' : cat}
              </button>
            ))}
          </div>

          {/* Touch-Friendly Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[62vh] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-neutral-900/60 border border-neutral-800 rounded-2xl space-y-3">
                <Boxes className="w-10 h-10 mx-auto text-emerald-400/80" />
                <h4 className="font-bold text-sm text-white">
                  {products.length === 0 ? "Nta bicuruzwa birashyirwamo (No Stock yet)" : "Nta gicuruzwa gihuye n'ibyo ushakishije"}
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {products.length === 0 
                    ? "Kanda hasi ushyiremo ibicuruzwa by'ibanze bigurishwa cyane mu Rwanda (Inyange Milk, Bralirwa Primus, Azam Flour, Savon Gorilla...) kugira ngo utangire gucuruza."
                    : "Hindura ijambo ryo gushakisha cyangwa uhitemo category yose."}
                </p>
                {products.length === 0 && onSeedDefaultProducts && (
                  <button
                    id="btn-seed-fast-sellers"
                    onClick={onSeedDefaultProducts}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition shadow-md"
                  >
                    + Injiza Ibicuruzwa by'Ibanze (Seed Ready Fast-Sellers)
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.currentStock <= product.reorderLevel;
                const isOutOfStock = product.currentStock <= 0;

                return (
                  <button
                    key={product.id}
                    id={`btn-product-item-${product.id}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition group relative ${
                      isOutOfStock
                        ? 'bg-neutral-900/40 border-neutral-800/40 opacity-50 cursor-not-allowed'
                        : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-emerald-500/60 active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 line-clamp-1">
                          {product.category.split(' ')[0]}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isOutOfStock 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : isLowStock 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {product.currentStock} {product.unit}
                        </span>
                      </div>

                      <h3 className="font-semibold text-xs sm:text-sm text-neutral-100 group-hover:text-emerald-400 line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="font-mono font-bold text-xs sm:text-sm text-white">
                        {product.sellingPriceRwf.toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">RWF</span>
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-neutral-950 text-emerald-400 flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Live Cart, Cashier Today Sales Counter & Blind Reconciliation (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* 1. Cashier Today Sales Badge */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-950/60 via-neutral-900 to-neutral-900 border border-emerald-500/30 rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Amafaranga Majije Gucuruza
                </div>
                <div className="text-lg sm:text-xl font-extrabold font-mono text-white flex items-baseline gap-1">
                  <span>{cashierTodaySalesRwf.toLocaleString()}</span>
                  <span className="text-xs text-emerald-400 font-sans font-bold">RWF</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] bg-neutral-950/90 border border-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {currentShift?.totalSalesCount || 0} fagitire
              </span>
              <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {currentShift ? currentShift.shiftCode : 'SHIFT-2026-09-04'}
              </div>
            </div>
          </div>

          {/* 2. Prominent Red Action Button: Gusoza Shift / Blind Reconciliation */}
          {onOpenReconciliation && (
            <button
              id="btn-pos-blind-reconciliation"
              type="button"
              onClick={onOpenReconciliation}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-red-950/40 active:scale-[0.98]"
            >
              <Lock className="w-4 h-4" />
              <span>Gusoza Shift / Blind Reconciliation</span>
            </button>
          )}

          {/* 3. Live Shopping Cart Container */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-fit lg:min-h-[52vh] shadow-xl overflow-hidden">
            {/* Cart Header */}
            <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Live Shopping Cart</span>
                <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                  {totalUnits} items
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  id="btn-void-cart"
                  onClick={handleCancelCart}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Void Cart</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-3 space-y-2.5 flex-1 max-h-[34vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-neutral-700 stroke-1" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-neutral-600">Kanda ku gicuruzwa cyo mu bubiko kugira ngo ucyinjize muri fagitire</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.product.id}
                    className="p-2.5 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-white leading-tight">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {item.unitPriceRwf.toLocaleString()} RWF / {item.product.unit}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-400">
                        {item.totalRwf.toLocaleString()} RWF
                      </span>
                    </div>

                    {/* Quantity & Adjustment Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-900">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center justify-center transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Summary & Pay Button */}
            <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 space-y-3">
              {/* PHOTO 2: Enable/Disable RRA EBM Tax (18% VAT) Toggle Switch */}
              <div className="flex items-center justify-between p-2 bg-neutral-900/90 border border-neutral-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isVatEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>RRA EBM Tax (18% VAT)</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isVatEnabled 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}>
                        {isVatEnabled ? 'Active (18%)' : 'Disabled (0%)'}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {isVatEnabled ? 'Standard Rwandan EBM v2 Code A' : 'Exempt / VAT calculation set to 0 RWF'}
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  id="toggle-ebm-vat"
                  type="button"
                  role="switch"
                  aria-checked={isVatEnabled}
                  onClick={() => setIsVatEnabled(!isVatEnabled)}
                  title={isVatEnabled ? 'Disable RRA EBM Tax (18% VAT)' : 'Enable RRA EBM Tax (18% VAT)'}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isVatEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isVatEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Total Units:</span>
                  <span className="font-mono text-white">{totalUnits}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>18% RRA VAT EBM Base:</span>
                  <span className={`font-mono ${isVatEnabled ? 'text-neutral-300' : 'text-neutral-500 line-through'}`}>
                    {vatBaseRwf.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>18% RRA VAT Amount:</span>
                  <span className={`font-mono font-semibold ${isVatEnabled ? 'text-emerald-400' : 'text-neutral-500 line-through'}`}>
                    {vatAmountRwf.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-neutral-900">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">Total Amount:</span>
                    {!isVatEnabled && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                        Tax Exempt (0 RWF VAT)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400">
                      {totalAmountRwf.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-400 font-sans ml-1">RWF</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-pos-pay-now"
                disabled={cart.length === 0}
                onClick={() => {
                  setCashTendered(String(totalAmountRwf));
                  setIsCheckoutOpen(true);
                }}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                  cart.length === 0
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-950/40'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Gukora Fagitire / Checkout ({totalAmountRwf > 0 ? `${totalAmountRwf.toLocaleString()} RWF` : 'Sale'})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* PHOTO 3: Temporary loading state overlay when generating PDF receipt */}
            {isGeneratingPdfReceipt && (
              <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl">
                  <FileText className="w-7 h-7 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-white font-bold text-base">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span>Irikurema Facture ya PDF...</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Generating certified EBM v2 fiscal receipt & PDF invoice...
                  </p>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Complete Transaction</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isVatEnabled && (
                  <span className="text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded font-mono">
                    0% VAT
                  </span>
                )}
                <span className="font-mono font-bold text-base text-emerald-400">
                  {totalAmountRwf.toLocaleString()} RWF
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">Select Rwandan Payment Channel</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    id="btn-pay-cash"
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Cash in Hand</span>
                  </button>

                  <button
                    id="btn-pay-momo"
                    type="button"
                    onClick={() => setPaymentMethod('MOMO_MTN')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'MOMO_MTN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-amber-400" />
                    <span className="text-xs">MTN MoMo</span>
                  </button>

                  <button
                    id="btn-pay-airtel"
                    type="button"
                    onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'AIRTEL_MONEY'
                        ? 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-red-400" />
                    <span className="text-xs">Airtel Money</span>
                  </button>

                  <button
                    id="btn-pay-credit"
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      paymentMethod === 'CREDIT'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <span className="text-xs">Kwikopesha / Credit</span>
                  </button>
                </div>
              </div>

              {/* Cash Denomination Quick Tender Buttons */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">Cash Tendered (RWF)</label>
                    <input
                      id="input-cash-tendered"
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Rwandan Banknote Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {[totalAmountRwf, 1000, 2000, 5000, 10000, 20000].map((amt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCashTendered(String(amt))}
                        className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-300 hover:text-white transition"
                      >
                        {amt === totalAmountRwf ? 'Exact' : `${amt.toLocaleString()} RWF`}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Change Due to Customer:</span>
                    <span className={`font-mono font-bold text-sm ${changeRwf >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {changeRwf.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              )}

              {/* Mobile Money Details */}
              {(paymentMethod === 'MOMO_MTN' || paymentMethod === 'AIRTEL_MONEY') && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Customer Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="+250 788 000 000"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Transaction Reference ID (from SMS)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MP260902.1523.A9812 (or leave empty to auto-generate)"
                      value={momoRef}
                      onChange={(e) => setMomoRef(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Always verify the customer's SMS debit alert before completing the sale.</span>
                  </div>
                </div>
              )}

              {/* Credit / Kwikopesha Section (Mandatory Customer Name & Phone Number) */}
              {paymentMethod === 'CREDIT' && (
                <div className="space-y-3.5 p-3.5 bg-purple-950/20 border border-purple-800/40 rounded-xl">
                  <div className="flex items-start gap-2 text-xs text-purple-300 bg-purple-900/20 p-2.5 rounded-lg border border-purple-800/30">
                    <AlertCircle className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-purple-200">Kwikopesha / Credit Sale (Automated Debt Record):</p>
                      <p className="text-[11px] text-purple-300/90">
                        Iyi fagitire irahita yandikwa ako kanya mu gitabo cy'abafite ibirarane (Debtors Dashboard) by'ubucuruzi.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-200 block mb-1">
                      Izina ry'Umukiriya (Customer Full Name) <span className="text-red-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-credit-customer-name"
                        type="text"
                        required
                        placeholder="e.g. Jean-Pierre Hakizimana"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 focus:border-purple-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 font-medium outline-none transition"
                      />
                    </div>
                    {!customerName.trim() && (
                      <p className="text-[10px] text-amber-400 mt-1">Required to log debtor into the Owner Room.</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-200 block mb-1">
                      Nimero ya Telefoni yo Kwishyuza (Phone Number) <span className="text-red-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="input-credit-customer-phone"
                        type="text"
                        required
                        placeholder="+250 788 123 456"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 focus:border-purple-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-500 font-mono outline-none transition"
                      />
                    </div>
                    {!customerPhone.trim() && (
                      <p className="text-[10px] text-amber-400 mt-1">Required to send reminder & digital debt receipt.</p>
                    )}
                  </div>

                  <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Total Unpaid Balance Logged:</span>
                    <span className="font-bold text-purple-400 text-sm">
                      {totalAmountRwf.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex gap-2">
              <button
                id="btn-cancel-checkout"
                type="button"
                disabled={isGeneratingPdfReceipt}
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-sale"
                type="button"
                disabled={isGeneratingPdfReceipt || (paymentMethod === 'CREDIT' && (!customerName.trim() || !customerPhone.trim()))}
                onClick={handleCompleteSale}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {isGeneratingPdfReceipt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Irikurema Facture ya PDF...</span>
                  </>
                ) : paymentMethod === 'CREDIT' && (!customerName.trim() || !customerPhone.trim()) ? (
                  <span>Shyiramo Izina & Telefoni By'Umukiriya</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Issue Receipt ({totalAmountRwf.toLocaleString()} RWF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Cart Confirmation Modal (Anti-Theft reason requirement) */}
      {voidConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Anti-Theft Void Reason Required</span>
            </div>
            <p className="text-xs text-neutral-300">
              Voiding an active cart of <span className="font-bold text-white">{subtotalRwf.toLocaleString()} RWF</span> will be permanently logged in the audit ledger to protect against unrecorded cash collections.
            </p>

            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">Reason for Void</label>
              <select
                aria-label="Reason for Void"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="">Select reason...</option>
                <option value="Customer changed mind / lacked funds">Customer changed mind / lacked funds</option>
                <option value="Accidental quantity addition">Accidental quantity addition</option>
                <option value="Wrong product selected / customer swapped item">Wrong product selected / customer swapped item</option>
                <option value="Item damaged during handling">Item damaged during handling</option>
                <option value="Owner testing register">Owner testing register</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidConfirmOpen(false)}
                className="px-4 py-2 bg-neutral-800 text-white font-semibold text-xs rounded-xl flex-1"
              >
                Keep Cart
              </button>
              <button
                type="button"
                onClick={confirmVoidCart}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex-1"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReceiptModal
        sale={lastCompletedSale}
        onClose={() => setLastCompletedSale(null)}
        onNextSale={() => {
          setLastCompletedSale(null);
          setCart([]);
          setSearchQuery('');
          setIsCheckoutOpen(false);
        }}
      />
    </div>
  );
};
