import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  DollarSign,
  History,
  CheckCircle,
  X
} from 'lucide-react';
import { Product, ProductCategory, User, StockAdjustment } from '../../types';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface InventoryManagerProps {
  products: Product[];
  currentUser: User;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onRecordStockAdjustment: (params: any) => void;
  adjustmentsHistory: StockAdjustment[];
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

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  currentUser,
  onSaveProduct,
  onDeleteProduct,
  onRecordStockAdjustment,
  adjustmentsHistory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ProductCategory>('ALL');
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'history'>('catalog');

  // Form State for Add / Edit Product
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Alimentation & Groceries');
  const [formCostPrice, setFormCostPrice] = useState('1000');
  const [formSellingPrice, setFormSellingPrice] = useState('1300');
  const [formMinPrice, setFormMinPrice] = useState('1250');
  const [formStock, setFormStock] = useState('20');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formReorderLevel, setFormReorderLevel] = useState('5');

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

  // Overall metrics
  const totalStockUnits = useMemo(() => products.reduce((acc, p) => acc + p.currentStock, 0), [products]);
  const totalWholesaleValueRwf = useMemo(() => products.reduce((acc, p) => acc + (p.currentStock * p.costPriceRwf), 0), [products]);
  const totalRetailValueRwf = useMemo(() => products.reduce((acc, p) => acc + (p.currentStock * p.sellingPriceRwf), 0), [products]);
  const projectedGrossMarginRwf = totalRetailValueRwf - totalWholesaleValueRwf;
  const lowStockCount = useMemo(() => products.filter(p => p.currentStock <= p.reorderLevel).length, [products]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Alimentation & Groceries');
    setFormCostPrice('1000');
    setFormSellingPrice('1300');
    setFormMinPrice('1250');
    setFormStock('20');
    setFormUnit('pcs');
    setFormReorderLevel('5');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormCostPrice(String(prod.costPriceRwf));
    setFormSellingPrice(String(prod.sellingPriceRwf));
    setFormMinPrice(String(prod.minSellingPriceRwf));
    setFormStock(String(prod.currentStock));
    setFormUnit(prod.unit);
    setFormReorderLevel(String(prod.reorderLevel));
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (prod: Product) => {
    if (!onDeleteProduct) return;
    if (confirm(`Urashaka gusiba "${prod.name}" mu katalogi? Ibi ntibikunika kuba ngombwa kandi uko byagenda kose ntabwo bishobora kuvaho.`)) {
      onDeleteProduct(prod.id);
    }
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(formCostPrice) || 0;
    const selling = parseFloat(formSellingPrice) || 0;
    const minPrice = parseFloat(formMinPrice) || cost;
    const stock = parseInt(formStock, 10) || 0;
    const reorder = parseInt(formReorderLevel, 10) || 5;

    if (!formName.trim()) {
      alert('Izina ry\'igicuruzwa rirakenewe (Product name is required).');
      return;
    }

    if (minPrice < cost) {
      if (!confirm('Warning: Minimum selling price is lower than wholesale cost price. Proceed anyway?')) {
        return;
      }
    }

    const saved: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      costPriceRwf: cost,
      sellingPriceRwf: selling,
      minSellingPriceRwf: minPrice,
      currentStock: stock,
      unit: formUnit.trim() || 'pcs',
      reorderLevel: reorder,
      lastRestockedAt: editingProduct ? editingProduct.lastRestockedAt : new Date().toISOString(),
      isVatApplicable: editingProduct ? (editingProduct.isVatApplicable ?? true) : true
    };

    onSaveProduct(saved);
    setIsProductModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-4">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="text-neutral-400 text-xs flex items-center justify-between">
            <span>Total Catalog Items</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {products.length} <span className="text-xs text-neutral-400 font-sans">SKUs</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {totalStockUnits.toLocaleString()} units on shelves
          </div>
        </div>

        <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="text-neutral-400 text-xs flex items-center justify-between">
            <span>Wholesale Inventory Value</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {totalWholesaleValueRwf.toLocaleString()} <span className="text-xs text-neutral-400 font-sans">RWF</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Chiffre d'achat (Capital tied)
          </div>
        </div>

        <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="text-neutral-400 text-xs flex items-center justify-between">
            <span>Expected Retail Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {totalRetailValueRwf.toLocaleString()} <span className="text-xs text-neutral-400 font-sans">RWF</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-0.5 font-mono">
            +{projectedGrossMarginRwf.toLocaleString()} RWF projected margin
          </div>
        </div>

        <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="text-neutral-400 text-xs flex items-center justify-between">
            <span>Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
            {lowStockCount} <span className="text-xs text-neutral-400 font-sans">items below reorder</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            Restock prompt to prevent lost sales
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Category, SubTabs, Add Product */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Shakisha igicuruzwa ku izina cyangwa icycategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveSubTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeSubTab === 'catalog' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                activeSubTab === 'history' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Stock Logs ({adjustmentsHistory.length})</span>
            </button>
          </div>
        </div>

        {currentUser.role === 'owner' ? (
          <button
            id="btn-add-product"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Product</span>
          </button>
        ) : (
          <span className="text-[11px] text-neutral-500 italic">
            Owner login required to add/edit cost prices.
          </span>
        )}
      </div>

      {/* Category Pills (if catalog view) */}
      {activeSubTab === 'catalog' && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-neutral-100 text-neutral-950 font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat === 'ALL' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {activeSubTab === 'catalog' ? (
        /* Products Table */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 border-b border-neutral-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & Category</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost Price (Buy)</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Floor Price</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredProducts.map((prod) => {
                  const marginRwf = prod.sellingPriceRwf - prod.costPriceRwf;
                  const marginPct = prod.sellingPriceRwf > 0 ? Math.round((marginRwf / prod.sellingPriceRwf) * 100) : 0;
                  const isLow = prod.currentStock <= prod.reorderLevel;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-850/60 transition">
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white text-xs sm:text-sm">{prod.name}</div>
                        <div className="text-[11px] text-neutral-400">{prod.unit}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-neutral-300">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-[11px]">
                          {prod.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-right font-mono text-neutral-400">
                        {prod.costPriceRwf.toLocaleString()} RWF
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {prod.sellingPriceRwf.toLocaleString()} RWF
                      </td>

                      {/* Min Price Floor */}
                      <td className="py-3 px-4 text-right font-mono text-neutral-400">
                        {prod.minSellingPriceRwf.toLocaleString()} RWF
                      </td>

                      {/* Profit Margin */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-xs text-neutral-200">+{marginRwf.toLocaleString()} RWF</span>
                        <span className="text-[10px] text-emerald-400 block">({marginPct}%)</span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full font-bold ${
                          prod.currentStock === 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : isLow
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-adjust-stock-${prod.id}`}
                            onClick={() => setSelectedProductForAdjust(prod)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                            title="Restock or log physical discrepancy"
                          >
                            + Intake / Adjust
                          </button>
                          {currentUser.role === 'owner' && (
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                              title="Edit product details & prices"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {currentUser.role === 'owner' && onDeleteProduct && (
                            <button
                              onClick={() => handleDeleteProduct(prod)}
                              className="p-1 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                              title="Delete product from catalog"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Adjustments Audit History */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-white">Immutable Stock Movement & Shrinkage Log</h3>
            <span className="text-xs text-neutral-400">{adjustmentsHistory.length} total entries</span>
          </div>

          {adjustmentsHistory.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No manual stock adjustments recorded yet. Intake and shrinkage records will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {adjustmentsHistory.map((adj) => (
                <div key={adj.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{adj.productName}</span>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                        adj.delta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {adj.delta >= 0 ? `+${adj.delta}` : adj.delta} units ({adj.previousStock} → {adj.adjustedStock})
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Reason: <span className="text-neutral-200 font-semibold">{adj.reason.replace(/_/g, ' ')}</span> &bull; {adj.notes}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-neutral-400">
                    <div className="font-mono text-emerald-400 font-bold">Impact: {adj.costImpactRwf.toLocaleString()} RWF</div>
                    <div>By: {adj.performedBy} ({new Date(adj.timestamp).toLocaleString('en-GB')})</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
              <h3 className="font-bold text-sm text-white">
                {editingProduct ? 'Edit Product & Pricing Floor' : 'Register New Rwandan Retail Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Inyange Whole Milk (500ml Tetra)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  {CATEGORIES.filter(c => c !== 'ALL').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Cost Price (RWF)</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Selling Price (RWF)</label>
                  <input
                    type="number"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none font-bold text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Floor Price (Min RWF)</label>
                  <input
                    type="number"
                    value={formMinPrice}
                    onChange={(e) => setFormMinPrice(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>
              </div>

              {/* Stock and Unit */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Unit Label</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="pcs, bottle, kg"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Reorder Alert</label>
                  <input
                    type="number"
                    value={formReorderLevel}
                    onChange={(e) => setFormReorderLevel(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 text-white font-semibold text-xs rounded-xl flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl flex-1 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={!!selectedProductForAdjust}
        onClose={() => setSelectedProductForAdjust(null)}
        product={selectedProductForAdjust}
        currentUser={currentUser}
        onConfirmAdjustment={onRecordStockAdjustment}
      />
    </div>
  );
};
