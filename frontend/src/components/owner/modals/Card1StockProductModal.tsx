import React, { useState, useMemo } from 'react';
import { 
  PackagePlus, 
  Plus, 
  X, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  DollarSign, 
  Calendar, 
  Search, 
  ArrowUpRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Product, ProductCategory, StockAdjustment } from '../../../types';
import { db } from '../../../services/db';

interface Card1StockProductModalProps {
  products: Product[];
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  onRefreshData?: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Alimentation & Groceries',
  'Beverages & Drinks',
  'Personal Care & Beauty',
  'Household & Cleaning',
  'Electronics & Airtime',
  'Boutique & Clothing'
];

export const Card1StockProductModal: React.FC<Card1StockProductModalProps> = ({
  products,
  onClose,
  onSaveProduct,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'new_product' | 'restock_existing'>('new_product');

  // --- Form 1: New Product State ---
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Alimentation & Groceries');
  const [costPriceRwf, setCostPriceRwf] = useState('');
  const [sellingPriceRwf, setSellingPriceRwf] = useState('');
  const [floorPriceRwf, setFloorPriceRwf] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [expiryDate, setExpiryDate] = useState('');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [isVatApplicable, setIsVatApplicable] = useState(true);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);

  // --- Form 2: Restock Existing State ---
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [restockQuantity, setRestockQuantity] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  const [supplierSource, setSupplierSource] = useState('');
  const [restockReason, setRestockReason] = useState('New shipment restock (Kurangura ibishya)');
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const filteredProductsForRestock = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 8);
    const q = searchProductQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, searchProductQuery]);

  // Handle New Product Submission
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Shyiramo izina ry\'igicuruzwa (Please provide a product title).');
      return;
    }

    const cost = parseFloat(costPriceRwf) || 0;
    const selling = parseFloat(sellingPriceRwf) || 0;
    const floor = parseFloat(floorPriceRwf) || cost;
    const qty = parseInt(quantity, 10) || 0;
    const reorder = parseInt(reorderLevel, 10) || 5;

    if (selling < cost) {
      if (!confirm('Iburira: Igiciro cyo kugurisha kiri munsi y\'icyo waranguye. Urashaka gukomeza? (Selling price is lower than cost price. Proceed?)')) {
        return;
      }
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      category,
      costPriceRwf: cost,
      sellingPriceRwf: selling,
      minSellingPriceRwf: floor,
      currentStock: qty,
      unit: unit.trim() || 'pcs',
      reorderLevel: reorder,
      isVatApplicable,
      expiryDate: expiryDate || undefined,
      lastRestockedAt: new Date().toISOString()
    };

    onSaveProduct(newProd);

    // Also record initial stock adjustment if qty > 0
    if (qty > 0) {
      db.recordStockAdjustment({
        productId: newProd.id,
        newStock: qty,
        reason: 'RESTOCK_PURCHASE',
        notes: `Initial inventory registration for new product "${newProd.name}"`,
        performedBy: 'Store Owner',
        performedByRole: 'owner'
      });
    }

    setProductSuccess(`"${newProd.name}" yongewe neza muri stock! (${qty} ${newProd.unit})`);
    setTimeout(() => setProductSuccess(null), 4000);

    // Reset Form
    setName('');
    setCostPriceRwf('');
    setSellingPriceRwf('');
    setFloorPriceRwf('');
    setQuantity('');
    setExpiryDate('');
    if (onRefreshData) onRefreshData();
  };

  // Handle Restocking Existing Product
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Hitamo igicuruzwa ushaka kongera muri stock (Please select a product to restock).');
      return;
    }

    const additionalQty = parseInt(restockQuantity, 10) || 0;
    if (additionalQty <= 0) {
      alert('Shyiramo umubare w\'ibicuruzwa byaje (Enter a valid quantity > 0).');
      return;
    }

    const updatedCost = newCostPrice.trim() ? (parseFloat(newCostPrice) || selectedProduct.costPriceRwf) : selectedProduct.costPriceRwf;
    const oldStock = selectedProduct.currentStock;
    const newStock = oldStock + additionalQty;

    const updatedProd: Product = {
      ...selectedProduct,
      currentStock: newStock,
      costPriceRwf: updatedCost,
      lastRestockedAt: new Date().toISOString()
    };

    onSaveProduct(updatedProd);

    // Log adjustment in DB
    db.recordStockAdjustment({
      productId: selectedProduct.id,
      newStock: newStock,
      reason: 'RESTOCK_PURCHASE',
      notes: `${restockReason}. Supplier: ${supplierSource || 'Local Kigali Depot'}.`,
      performedBy: 'Store Owner',
      performedByRole: 'owner'
    });

    setRestockSuccess(`Kongera stock kuri "${selectedProduct.name}" byakozwe neza! (+${additionalQty} ${selectedProduct.unit}, Stock nshya: ${newStock})`);
    setTimeout(() => setRestockSuccess(null), 4000);

    // Reset restock fields
    setRestockQuantity('');
    setNewCostPrice('');
    setSupplierSource('');
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with Title and Close Button */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Register New Stock & Add Product
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Card 1
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Kwandika ibicuruzwa bishya no kwongera umubare w'ibiri muri stock.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
            title="Close Modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab Navigation (New Product vs Restock Existing) */}
        <div className="px-5 sm:px-6 pt-4 border-b border-slate-800 flex gap-2 bg-slate-900/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('new_product')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 ${
              activeSubTab === 'new_product'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Kwandika Igicuruzwa Gishya (New Product)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('restock_existing')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 border-b-2 ${
              activeSubTab === 'restock_existing'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Kongera Umubare w'Ibiri muri Stock (Restock Existing)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: NEW PRODUCT FORM */}
          {activeSubTab === 'new_product' && (
            <form onSubmit={handleCreateProduct} className="space-y-5">
              {productSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{productSuccess}</span>
                </div>
              )}

              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Izina ry'Igicuruzwa (Product Title) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="urugero: Inyange Whole Milk (500ml), Gorilla Rice (25kg)..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Icyiciro (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Cost Price, Selling Price & Anti-Theft Floor Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Igiciro Waranguye (Cost Price RWF) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="urugero: 450"
                      value={costPriceRwf}
                      onChange={(e) => setCostPriceRwf(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-3.5 pr-12 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">RWF</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Igiciro cyo Kugurisha (Selling Price) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="urugero: 600"
                      value={sellingPriceRwf}
                      onChange={(e) => setSellingPriceRwf(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-3.5 pr-12 py-2.5 text-sm font-mono text-emerald-400 font-bold placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">RWF</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Igiciro cya Hasi (Anti-Theft Floor)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="Igiciro cya nyuma (Floor)"
                      value={floorPriceRwf}
                      onChange={(e) => setFloorPriceRwf(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-3.5 pr-12 py-2.5 text-sm font-mono text-amber-300 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">RWF</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Initial Stock Quantity, Unit, Expiry Date & Reorder Level */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Ingano muri Stock (Qty) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Igipimo (Unit)
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="bottles">Bottles (amacupa)</option>
                    <option value="cartons">Cartons (amakarito)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="packs">Packs</option>
                    <option value="sachets">Sachets</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Itariki y'Irangira (Expiry)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* VAT Option & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isVatApplicable}
                    onChange={(e) => setIsVatApplicable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs text-slate-300">
                    18% RRA VAT EBM Applicable
                  </span>
                </label>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    Funga (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Bika Igicuruzwa (Save Product)</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: RESTOCK EXISTING PRODUCT */}
          {activeSubTab === 'restock_existing' && (
            <form onSubmit={handleRestockSubmit} className="space-y-5">
              {restockSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{restockSuccess}</span>
                </div>
              )}

              {/* Search or Select Existing Product */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  1. Hitamo Igicuruzwa muri Stock ushaka kongerera umubare:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Shakisha igicuruzwa (Search by title or category)..."
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Product Select List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredProductsForRestock.map(p => {
                    const isSelected = selectedProductId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setNewCostPrice(String(p.costPriceRwf));
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-white line-clamp-1">{p.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {p.category} &bull; Cost: {p.costPriceRwf.toLocaleString()} RWF
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            p.currentStock <= p.reorderLevel ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-200'
                          }`}>
                            {p.currentStock} {p.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedProduct && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold">Igicuruzwa Wahisemo:</span>
                      <h4 className="text-sm font-bold text-white">{selectedProduct.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Umubare usanzwemo</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Umubare Waje (Additional Qty) <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="urugero: 24"
                        value={restockQuantity}
                        onChange={(e) => setRestockQuantity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Igiciro cyo Kurangura (New Cost RWF)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newCostPrice}
                        onChange={(e) => setNewCostPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Aho Byaranguwe (Supplier / Depot)
                      </label>
                      <input
                        type="text"
                        placeholder="urugero: Bralirwa Kicukiro, Inyange..."
                        value={supplierSource}
                        onChange={(e) => setSupplierSource(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Impamvu yo Kongera Stock (Restock Reason)
                    </label>
                    <select
                      value={restockReason}
                      onChange={(e) => setRestockReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="New shipment restock (Kurangura ibishya muri Depot)">New shipment restock (Kurangura ibishya muri Depot)</option>
                      <option value="Physical count correction (Ikosorwa ry'ibarura)">Physical count correction (Ikosorwa ry'ibarura)</option>
                      <option value="Customer returns / exchange (Ibyagarutse)">Customer returns / exchange (Ibyagarutse)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Funga (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={!selectedProduct}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Ongeraho muri Stock (Commit Restock)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
