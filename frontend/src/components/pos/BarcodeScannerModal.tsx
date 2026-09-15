import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, Zap, AlertCircle } from 'lucide-react';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanProduct: (product: Product) => void;
  products: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanProduct,
  products
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } else {
        setCameraError('Camera access not supported on this device/browser.');
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Camera permission denied or camera not found. Use the quick simulator below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSelectProduct = (prod: Product) => {
    onScanProduct(prod);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const found = products.find(p => p.barcode === manualCode.trim() || p.id === manualCode.trim());
    if (found) {
      onScanProduct(found);
      setManualCode('');
      onClose();
    } else {
      alert(`No product found with barcode "${manualCode}". Try one of the quick simulator items.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-white font-bold">
            <Scan className="w-5 h-5 text-emerald-400" />
            <span>Barcode & Quick-Scan Terminal</span>
          </div>
          <button
            id="btn-close-scanner"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Camera Viewfinder Box */}
          <div className="relative aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  {cameraError || 'Camera inactive. Using laser scanner or high-speed tap simulation.'}
                </p>
              </div>
            )}

            {/* Laser Line Overlay */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse"></div>
            <div className="absolute inset-8 border-2 border-dashed border-emerald-500/40 rounded-lg pointer-events-none"></div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              id="input-manual-barcode"
              type="text"
              placeholder="Enter or paste barcode (e.g. 6161100010012)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 outline-none font-mono"
            />
            <button
              id="btn-submit-manual-code"
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl"
            >
              Scan
            </button>
          </form>

          {/* 1-Tap Quick Simulator for Retail Testing */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Tap Rwandan Barcode Simulator (Instant Match)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {products.slice(0, 9).map((prod) => (
                <button
                  key={prod.id}
                  id={`btn-sim-scan-${prod.id}`}
                  onClick={() => handleSelectProduct(prod)}
                  className="text-left p-2.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/50 rounded-xl transition group"
                >
                  <div className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                    {prod.name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                    <span className="font-mono text-emerald-400">{prod.sellingPriceRwf.toLocaleString()} RWF</span>
                    <span className="font-mono text-neutral-500">{prod.barcode.slice(-5)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Supports USB laser handheld scanners (Honeywell, Zebra, Netum) or device camera.</span>
        </div>
      </div>
    </div>
  );
};
