import React, { useState } from 'react';
import { X, Search, CheckCircle, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { Product, SpotCheckAudit, SpotCheckItem, User } from '../../types';

interface SpotCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUser: User;
  onRecordSpotCheck: (audit: SpotCheckAudit) => void;
}

export const SpotCheckModal: React.FC<SpotCheckModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUser,
  onRecordSpotCheck
}) => {
  if (!isOpen) return null;

  // Pick 4 random fast-moving items for surprise count
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    return products.slice(0, 4).map(p => p.id);
  });

  const [countedQuantities, setCountedQuantities] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    products.slice(0, 4).forEach(p => {
      map[p.id] = String(p.currentStock); // default to match or allow owner to enter actual
    });
    return map;
  });

  const [cashierOnDuty, setCashierOnDuty] = useState('Eric Nshimiyimana');

  const handleShuffleItems = () => {
    const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 4);
    const newIds = shuffled.map(p => p.id);
    setSelectedProductIds(newIds);
    const map: Record<string, string> = {};
    shuffled.forEach(p => {
      map[p.id] = String(p.currentStock);
    });
    setCountedQuantities(map);
  };

  const handleCountChange = (productId: string, val: string) => {
    setCountedQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  // Compute variances
  const auditedItems: SpotCheckItem[] = selectedProducts.map(p => {
    const physical = parseInt(countedQuantities[p.id] || '0', 10);
    const variance = physical - p.currentStock;
    const varianceCostRwf = variance < 0 ? Math.abs(variance) * p.costPriceRwf : 0;
    return {
      productId: p.id,
      productName: p.name,
      systemExpectedCount: p.currentStock,
      physicalCounted: physical,
      variance,
      varianceCostRwf
    };
  });

  const totalVarianceUnits = auditedItems.reduce((acc, i) => acc + i.variance, 0);
  const totalVarianceCost = auditedItems.reduce((acc, i) => acc + i.varianceCostRwf, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const audit: SpotCheckAudit = {
      id: `spot-${Date.now()}`,
      auditedBy: currentUser.name,
      timestamp: new Date().toISOString(),
      cashierOnDuty,
      items: auditedItems,
      totalVarianceUnits,
      totalVarianceCostRwf: totalVarianceCost,
      verdict: totalVarianceUnits < 0 ? 'FLAGGED_SHORTAGE' : 'PASS'
    };

    onRecordSpotCheck(audit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Surprise Physical Stock Spot-Check</h3>
              <p className="text-[11px] text-neutral-400">Random 3-minute count to catch shelf theft while cashier is on duty</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Cashier On Duty</label>
              <input
                type="text"
                value={cashierOnDuty}
                onChange={(e) => setCashierOnDuty(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleShuffleItems}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pick Random Items</span>
            </button>
          </div>

          {/* Items to physically count */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-[10px] block">
              Physical Count vs System Records
            </label>
            {auditedItems.map((item) => (
              <div
                key={item.productId}
                className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="font-bold text-white">{item.productName}</div>
                  <div className="text-[11px] text-neutral-400">
                    Expected in System: <span className="text-neutral-200 font-mono font-bold">{item.systemExpectedCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-neutral-400 block">Physical Count</label>
                    <input
                      type="number"
                      min="0"
                      value={countedQuantities[item.productId] ?? ''}
                      onChange={(e) => handleCountChange(item.productId, e.target.value)}
                      className="w-20 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="w-24 text-right font-mono">
                    <span className={`text-xs font-bold ${item.variance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.variance === 0 ? '✓ Balanced' : `${item.variance > 0 ? '+' : ''}${item.variance} units`}
                    </span>
                    {item.variance < 0 && (
                      <span className="text-[10px] text-red-400/80 block">
                        -{item.varianceCostRwf.toLocaleString()} RWF
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Summary Box */}
          <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Total Units Variance:</span>
              <span className={`font-mono font-bold ${totalVarianceUnits < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {totalVarianceUnits} units
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Estimated Capital Loss:</span>
              <span className={`font-mono font-bold ${totalVarianceCost > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {totalVarianceCost.toLocaleString()} RWF
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 text-white font-semibold text-xs rounded-xl flex-1 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl flex-1 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Log Spot-Check Verdict</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
