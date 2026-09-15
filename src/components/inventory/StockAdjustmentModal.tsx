import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Product, StockAdjustment, AdjustmentReason, User } from '../../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  currentUser: User;
  onConfirmAdjustment: (params: {
    productId: string;
    newStock: number;
    reason: AdjustmentReason;
    notes: string;
  }) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  currentUser,
  onConfirmAdjustment
}) => {
  if (!isOpen || !product) return null;

  const [adjustmentType, setAdjustmentType] = useState<'INTAKE' | 'ADJUST'>('INTAKE');
  const [quantityInput, setQuantityInput] = useState<string>('10');
  const [reason, setReason] = useState<AdjustmentReason>('RESTOCK_PURCHASE');
  const [notes, setNotes] = useState<string>('');

  const numQty = parseInt(quantityInput, 10) || 0;
  const computedNewStock = adjustmentType === 'INTAKE' 
    ? product.currentStock + numQty
    : numQty;

  const delta = computedNewStock - product.currentStock;
  const costImpact = Math.abs(delta) * product.costPriceRwf;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (computedNewStock < 0) {
      alert('Stock cannot be negative.');
      return;
    }

    onConfirmAdjustment({
      productId: product.id,
      newStock: computedNewStock,
      reason: adjustmentType === 'INTAKE' ? 'RESTOCK_PURCHASE' : reason,
      notes: notes.trim() || (adjustmentType === 'INTAKE' ? `Restocked +${numQty} units` : `Stock count changed to ${computedNewStock}`)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Stock Intake & Inventory Adjustment</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Product Summary */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
            <div className="text-xs text-neutral-400">{product.category}</div>
            <div className="font-bold text-sm text-white">{product.name}</div>
            <div className="flex justify-between text-xs pt-1 border-t border-neutral-900 font-mono">
              <span className="text-neutral-400">Current On-Hand: <span className="text-white font-bold">{product.currentStock} {product.unit}</span></span>
              <span className="text-neutral-400">Cost Price: <span className="text-emerald-400 font-bold">{product.costPriceRwf.toLocaleString()} RWF</span></span>
            </div>
          </div>

          {/* Intake vs Manual Adjustment Switch */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAdjustmentType('INTAKE');
                setReason('RESTOCK_PURCHASE');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                adjustmentType === 'INTAKE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              + Stock Intake (Restock)
            </button>
            <button
              type="button"
              onClick={() => {
                setAdjustmentType('ADJUST');
                setReason('COUNTING_CORRECTION');
                setQuantityInput(String(product.currentStock));
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                adjustmentType === 'ADJUST'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Manual Count / Shrinkage
            </button>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {adjustmentType === 'INTAKE' ? 'Quantity to Add (+ Units)' : 'New Absolute Stock Count'}
            </label>
            <input
              type="number"
              min="0"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:border-emerald-500 outline-none"
              placeholder="e.g. 24"
              required
            />
          </div>

          {/* Reason Selector (if manual adjustment) */}
          {adjustmentType === 'ADJUST' && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Mandatory Anti-Theft Audit Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="COUNTING_CORRECTION">Periodic Physical Stock Audit</option>
                <option value="THEFT_SHRINKAGE">Suspected Theft / Unaccounted Shrinkage</option>
                <option value="DAMAGED_BROKEN">Broken / Spilled Goods</option>
                <option value="EXPIRED_SPOILED">Expired / Spoiled Product</option>
                <option value="OWNER_PERSONAL_USE">Owner / Staff Personal Consumption</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Audit Notes & Supplier Details
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wholesale delivery from Bralirwa depot / Inyange distributor"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Projected Impact Preview */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-neutral-400">
              <span>Resulting Stock:</span>
              <span className="font-mono text-white font-bold">
                {computedNewStock} {product.unit} ({delta >= 0 ? `+${delta}` : delta})
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Inventory Value Impact:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {costImpact.toLocaleString()} RWF
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-800 text-white font-semibold text-xs rounded-xl flex-1 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl flex-1 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save & Update Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
