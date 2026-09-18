import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  FileDown, 
  MessageCircle, 
  QrCode, 
  Check, 
  ArrowRight,
  Phone,
  Receipt,
  Copy,
  Loader2,
  Share2
} from 'lucide-react';
import type { jsPDF as JsPDFCtor } from 'jspdf';
import { SaleTransaction } from '../../types';
import { SMSService } from '../../services/smsService';

// jsPDF is ~350KB, so it is lazy-loaded only when the EBM receipt PDF is
// actually needed (instant receipt flow, faster first paint) and cached.
let jsPDFModulePromise: Promise<typeof JsPDFCtor> | null = null;
function loadJsPDF(): Promise<typeof JsPDFCtor> {
  if (!jsPDFModulePromise) {
    jsPDFModulePromise = import('jspdf').then((m: any) => m.jsPDF || m.default);
  }
  return jsPDFModulePromise;
}

/**
 * Builds the official RRA EBM v2.1 fiscal receipt PDF (80mm x 215mm thermal)
 * WITHOUT saving — so it can be generated once in the background and saved
 * instantly on demand. Pure vector text (no html2canvas), so no black/blank
 * canvas pages, and the footer is force-paginated so it never clips.
 */
async function generateReceiptPdf(sale: SaleTransaction): Promise<any> {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 215],
    compress: true,
  });
  doc.setProperties({
    title: `SmartStock-Invoice-${sale.receiptNumber}.pdf`,
    subject: 'RRA EBM v2.1 Fiscal Receipt',
    author: 'SmartStock Rwanda',
    creator: 'SmartStock POS',
  });

  const rra = sale.rraInvoice;
  const vatAmount = rra?.vatAmountA_18 ?? Math.round(sale.totalRwf * (18 / 118));
  const taxableAmount = rra?.taxableAmountA_18 ?? (sale.totalRwf - vatAmount);

  const pageWidth = 80;
  let y = 8;

  // Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.text('SMARTSTOCK RWANDA', pageWidth / 2, y, { align: 'center' });
  y += 4.5;
  doc.setFontSize(9);
  doc.text('MUGABO SUPERMARKET', pageWidth / 2, y, { align: 'center' });
  y += 3.8;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('Nyamirambo Commercial Ave, Kigali', pageWidth / 2, y, { align: 'center' });
  y += 3.2;
  doc.text('Tel: +250 788 123 456', pageWidth / 2, y, { align: 'center' });
  y += 3.8;
  doc.text('------------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // RRA Fiscal Details
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL RRA FISCAL RECEIPT', pageWidth / 2, y, { align: 'center' });
  y += 3.8;
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.text(`TIN: ${rra?.tin || '108392019'}   BHF: ${rra?.bhfId || '00'}`, 5, y);
  y += 3.2;
  doc.text(`SDC ID: ${rra?.sdcId || 'SDC-RRA-KGL-0492'}`, 5, y);
  y += 3.2;
  doc.text(`CIS ID: ${rra?.cisId || 'CIS-SMARTSTOCK-RW-01'}`, 5, y);
  y += 3.2;
  doc.text(`SDC Receipt: ${rra?.sdcReceiptNumber || 'SDC/0492/2026/00103'}`, 5, y);
  y += 3.2;
  doc.text(`Internal #: ${sale.receiptNumber}`, 5, y);
  y += 3.2;
  doc.text(`Date & Time: ${new Date(sale.timestamp).toLocaleString('en-GB')}`, 5, y);
  y += 3.2;
  doc.text(`Cashier: ${sale.cashierName}`, 5, y);
  y += 3.8;
  doc.text('------------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // Itemized Table Header
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.text('ITEM', 5, y);
  doc.text('QTY x PRICE', 42, y);
  doc.text('TOTAL', 75, y, { align: 'right' });
  y += 3.5;
  doc.setFont('courier', 'normal');

  // Itemized rows (auto page-break per item, never a clipped/blank page)
  sale.items.forEach((item) => {
    if (y > 195) {
      doc.addPage([80, 215]);
      y = 8;
    }
    const cleanName = item.productName.length > 20
      ? item.productName.substring(0, 19) + '..'
      : item.productName;
    doc.text(`${cleanName} ${item.isVatApplicable ? '(A)' : '(B)'}`, 5, y);
    y += 3.2;
    doc.text(`  ${item.quantity} x ${item.unitPriceRwf.toLocaleString()}`, 5, y);
    doc.text(`${item.totalRwf.toLocaleString()} RWF`, 75, y, { align: 'right' });
    y += 3.8;
  });

  // Force the tax/payment/SDC footer onto a fresh page if the current page is
  // nearly full — this is what prevents clipped blank footer content on the PDF.
  if (y > 200) {
    doc.addPage([80, 215]);
    y = 8;
  }

  doc.text('------------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // 18% VAT Tax Breakdown
  doc.setFont('courier', 'bold');
  doc.text('TAX BREAKDOWN', 5, y);
  y += 3.2;
  doc.setFont('courier', 'normal');
  doc.text('A: Standard 18% VAT', 5, y);
  y += 3.2;
  doc.text(`   Taxable Base: ${taxableAmount.toLocaleString()} RWF`, 5, y);
  y += 3.2;
  doc.text(`   18% VAT Amount: ${vatAmount.toLocaleString()} RWF`, 5, y);
  y += 3.8;

  if ((rra?.taxExemptAmountB || 0) > 0) {
    doc.text(`B: Exempt 0%: ${(rra?.taxExemptAmountB || 0).toLocaleString()} RWF`, 5, y);
    y += 3.5;
  }

  // Grand Total
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL INCL. VAT:', 5, y);
  doc.text(`${sale.totalRwf.toLocaleString()} RWF`, 75, y, { align: 'right' });
  y += 4.2;

  // Payment Breakdown
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  const modeLabel = sale.paymentMethod === 'MOMO_MTN' ? 'MTN Mobile Money' : sale.paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money' : sale.paymentMethod === 'CREDIT' ? 'Kwikopesha / Credit Sale' : 'Cash in Hand';
  doc.text(`Payment: ${modeLabel}`, 5, y);
  y += 3.2;

  if (sale.paymentMethod === 'CREDIT') {
    doc.text(`Debtor: ${sale.customerName || 'Registered Debtor'}`, 5, y);
    y += 3.2;
    if (sale.customerPhone) {
      doc.text(`Phone: ${sale.customerPhone}`, 5, y);
      y += 3.2;
    }
    doc.text(`Status: UNPAID (Logged in Debtors DB)`, 5, y);
    y += 3.8;
  } else if (sale.paymentMethod === 'CASH') {
    doc.text(`Cash Tendered: ${sale.cashTenderedRwf.toLocaleString()} RWF`, 5, y);
    y += 3.2;
    doc.text(`Change Returned: ${sale.changeGivenRwf.toLocaleString()} RWF`, 5, y);
    y += 3.8;
  } else if (sale.momoReference) {
    doc.text(`MoMo Ref: ${sale.momoReference}`, 5, y);
    y += 3.8;
  }

  doc.text('------------------------------------------', pageWidth / 2, y, { align: 'center' });
  y += 4;

  // SDC Signature & Verification
  doc.setFontSize(6.5);
  doc.text(`SDC Signature: ${rra?.receiptSignature || 'RRA-8F2B-91A4-32DE'}`, 5, y);
  y += 3.2;
  doc.text(`Counter: #${rra?.globalReceiptCounter || 103}`, 5, y);
  y += 3.2;
  doc.text(`Verify URL: ${rra?.qrVerificationUrl || 'https://ebm.rra.gov.rw/verify'}`, 5, y);
  y += 4.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('Murakoze Cyane / Thank You!', pageWidth / 2, y, { align: 'center' });

  return doc;
}

interface ReceiptModalProps {
  sale: SaleTransaction | null;
  onClose: () => void;
  onNextSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose, onNextSale }) => {
  const [phoneInput, setPhoneInput] = useState<string>(sale?.customerPhone || '');
  const [whatsappSent, setWhatsappSent] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);
  const [pdfReady, setPdfReady] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string>('');
  const [showQrExpanded, setShowQrExpanded] = useState<boolean>(false);
  const pdfDocRef = useRef<any>(null);
  const pdfBlobRef = useRef<Blob | null>(null);
  const pdfWarmedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (sale?.customerPhone) {
      setPhoneInput(sale.customerPhone);
    }
  }, [sale?.customerPhone]);

  // Reset PDF state whenever a different sale receipt is shown
  useEffect(() => {
    pdfDocRef.current = null;
    pdfBlobRef.current = null;
    setPdfReady(false);
    setPdfError(false);
    setPdfErrorMessage('');
    setIsGeneratingPdf(false);
    setIsSharingPdf(false);
  }, [sale?.receiptNumber]);

  // Warm the PDF cache in the background (fast, NO auto-download) so the first
  // "Download PDF" / "Share PDF" action is instant and no auto-spawned file
  // can be blank/black.
  useEffect(() => {
    if (!sale || pdfDocRef.current || sale.receiptNumber === pdfWarmedForRef.current) return;
    pdfWarmedForRef.current = sale.receiptNumber;
    generateReceiptPdf(sale)
      .then(doc => {
        pdfDocRef.current = doc;
        pdfBlobRef.current = doc.output('blob');
        setPdfReady(true);
        setPdfError(false);
      })
      .catch(() => {
        // Keep the Download/Share buttons functional; they will regenerate on click.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale?.receiptNumber]);

  if (!sale) return null;

  const rra = sale.rraInvoice;
  const vatAmount = rra?.vatAmountA_18 ?? Math.round(sale.totalRwf * (18 / 118));
  const taxableAmount = rra?.taxableAmountA_18 ?? (sale.totalRwf - vatAmount);
  const totalItemsCount = sale.items.reduce((acc, item) => acc + item.quantity, 0);

  // Close and reset cart for next sale
  const handleNextSale = () => {
    if (onNextSale) {
      onNextSale();
    } else {
      onClose();
    }
  };

  // Action 1: Send via WhatsApp (Formatted clean receipt text link)
  const handleSendWhatsApp = () => {
    let cleanPhone = phoneInput.replace(/[^0-9]/g, '');
    
    // Auto-normalize Rwandan numbers: 078XXXXXXX -> 25078XXXXXXX
    if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
      cleanPhone = '25' + cleanPhone;
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      cleanPhone = '250' + cleanPhone;
    }

    const receiptLines = sale.items.map(
      (item) => `• ${item.productName} (${item.quantity}x @ ${item.unitPriceRwf.toLocaleString()} RWF) = ${item.totalRwf.toLocaleString()} RWF`
    ).join('\n');

    const messageText = 
`🧾 *SMARTSTOCK RWANDA - OFFICIAL E-RECEIPT*
🏪 *MUGABO SUPERMARKET & BOUTIQUE*
📍 Nyamirambo Commercial Ave, Kigali
🇷🇼 *RRA EBM Certified (18% VAT)*
---------------------------------
Receipt #: *${sale.receiptNumber}*
SDC Receipt #: ${rra?.sdcReceiptNumber || 'SDC/0492/2026/00103'}
Date: ${new Date(sale.timestamp).toLocaleString('en-GB')}
Cashier: ${sale.cashierName}
---------------------------------
*ITEMS PURCHASED:*
${receiptLines}
---------------------------------
*TOTAL AMOUNT:* *${sale.totalRwf.toLocaleString()} RWF*
• Taxable Base: ${taxableAmount.toLocaleString()} RWF
• RRA 18% VAT: ${vatAmount.toLocaleString()} RWF

Payment Mode: ${sale.paymentMethod === 'MOMO_MTN' ? 'MTN Mobile Money' : sale.paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money' : sale.paymentMethod === 'CREDIT' ? 'Kwikopesha / Credit Sale (Debtor Account)' : 'Cash in Hand'}
${sale.paymentMethod === 'CREDIT'
  ? `*DEBTOR:* ${sale.customerName || 'Recorded Customer'} (${sale.customerPhone || 'N/A'})\n*STATUS:* OUTSTANDING CREDIT / IDENI`
  : sale.paymentMethod === 'CASH' 
    ? `Cash Tendered: ${sale.cashTenderedRwf.toLocaleString()} RWF\nChange Returned: ${sale.changeGivenRwf.toLocaleString()} RWF` 
    : sale.momoReference ? `MoMo Ref: ${sale.momoReference}` : ''}

🔒 SDC Signature: ${rra?.receiptSignature || 'RRA-8F2B-91A4-32DE'}
🌐 Verify RRA Authenticity:
${rra?.qrVerificationUrl || 'https://ebm.rra.gov.rw/verify'}

Murakoze cyane kubana natwe! / Thank you for shopping with us!`;

    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedText}` 
      : `https://wa.me/?text=${encodedText}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setWhatsappSent(true);

    // Also record in digital SMS/WhatsApp ledger
    if (cleanPhone) {
      SMSService.sendCustomerDigitalReceipt({
        customerPhone: cleanPhone,
        shopName: 'Mugabo Supermarket',
        receiptNumber: sale.receiptNumber,
        totalAmountRwf: sale.totalRwf,
        vatAmountRwf: vatAmount,
        itemCount: totalItemsCount,
        qrVerificationUrl: rra?.qrVerificationUrl || 'https://ebm.rra.gov.rw/verify',
        sdcReceiptNumber: rra?.sdcReceiptNumber || 'SDC/0492/2026/00103'
      });
    }
  };

  // Generate once (or reuse the pre-warmed doc/blob) — single source for
  // download AND share so the EBM PDF never needs to be built twice.
  const ensurePdf = async (): Promise<{ doc: any; blob: Blob }> => {
    if (pdfDocRef.current && pdfBlobRef.current) {
      return { doc: pdfDocRef.current, blob: pdfBlobRef.current };
    }
    const doc = await generateReceiptPdf(sale);
    const blob = doc.output('blob');
    pdfDocRef.current = doc;
    pdfBlobRef.current = blob;
    return { doc, blob };
  };

  const finishWithError = (err: unknown) => {
    console.error('EBM PDF generation failed:', err);
    setPdfError(true);
    setPdfErrorMessage(err instanceof Error ? err.message : String(err));
  };

  // Action 2: Download PDF Receipt (uses the pre-warmed jsPDF doc instantly)
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;

    const downloadName = `SmartStock-Invoice-${sale.receiptNumber}.pdf`;

    // Re-download the already-generated PDF instantly without regenerating
    if (pdfDocRef.current) {
      pdfDocRef.current.save(downloadName);
      setPdfReady(true);
      return;
    }

    setIsGeneratingPdf(true);
    setPdfError(false);
    setPdfReady(false);

    // Safety timeout: the generating state must ALWAYS end, never an infinite spinner
    const safetyTimer = window.setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 12000);

    try {
      const { doc } = await ensurePdf();
      doc.save(downloadName);
      setPdfReady(true);
      setPdfError(false);
    } catch (err) {
      finishWithError(err);
    } finally {
      window.clearTimeout(safetyTimer);
      setIsGeneratingPdf(false);
    }
  };

  // Action 2b: Share the EBM PDF file (native share sheet with the real PDF
  // attached — works in WhatsApp, Gmail, etc.). Falls back to a download when
  // the device has no sharing support.
  const handleSharePdf = async () => {
    if (isGeneratingPdf) return;

    const fileName = `SmartStock-Invoice-${sale.receiptNumber}.pdf`;

    if (pdfDocRef.current && !pdfBlobRef.current) {
      pdfBlobRef.current = pdfDocRef.current.output('blob');
    }
    if (pdfDocRef.current && pdfBlobRef.current) {
      setIsSharingPdf(true);
      try {
        await tryShareOrDownload(pdfBlobRef.current, fileName);
        setPdfReady(true);
        setIsSharingPdf(false);
        return;
      } catch (err) {
        setIsSharingPdf(false);
        if ((err as any)?.name !== 'AbortError') {
          finishWithError(err);
        }
        return;
      }
    }

    setIsGeneratingPdf(true);
    setPdfError(false);
    const safetyTimer = window.setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 12000);

    try {
      const { blob } = await ensurePdf();
      setIsSharingPdf(true);
      await tryShareOrDownload(blob, fileName);
      setPdfReady(true);
      setPdfError(false);
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        finishWithError(err);
      }
    } finally {
      setIsSharingPdf(false);
      window.clearTimeout(safetyTimer);
      setIsGeneratingPdf(false);
    }
  };

  const tryShareOrDownload = async (blob: Blob, fileName: string): Promise<void> => {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const nav = navigator as Navigator & {
      canShare?: (data: { files: File[] }) => boolean;
      share?: (data: { files: File[]; title: string; text: string }) => Promise<void>;
    };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: fileName,
          text: `RRA EBM Certified Invoice ${sale.receiptNumber} — ${sale.totalRwf.toLocaleString()} RWF`,
        });
        return;
      } catch (err) {
        // User cancelled the share sheet (AbortError) — fall through quietly.
        if ((err as any)?.name === 'AbortError') throw err;
      }
    }
    // Fallback: trigger the download instead of sharing
    pdfDocRef.current?.save(fileName);
  };

  // Action 3: Print Thermal Receipt (Triggers standard window.print formatted for 80mm roll)
  const handlePrintThermal = () => {
    window.print();
  };

  // Quick Copy Receipt Link
  const handleCopyLink = () => {
    const link = rra?.qrVerificationUrl || `https://ebm.rra.gov.rw/verify?rcp=${sale.receiptNumber}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      {/* Embedded print CSS targeting exactly 80mm thermal receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible !important;
          }
          #thermal-receipt-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-neutral-900 border border-neutral-750 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* 1. Header: Success Checkmark Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-neutral-900 to-neutral-900 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>Transaction Completed</span>
                <span className="text-emerald-400 font-mono">• {sale.totalRwf.toLocaleString()} RWF</span>
              </h3>
              <p className="text-xs text-emerald-400/90 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Invoice / Receipt Generated Successfully • RRA EBM Verified</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-receipt-modal"
            onClick={handleNextSale}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Paper Receipt Body - Official RRA EBM 80mm Thermal Format */}
        <div className="p-3 sm:p-4 bg-neutral-950">
          <div 
            id="thermal-receipt-printable" 
            className="bg-white text-neutral-900 rounded-xl p-4 sm:p-5 font-mono text-xs shadow-md border border-neutral-300 mx-auto max-w-[400px]"
          >
            {/* Store & Fiscal Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-400">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full border border-emerald-300 uppercase tracking-wide">
                🇷🇼 RRA EBM v2.1 Certified
              </div>
              <h2 className="font-extrabold text-sm sm:text-base tracking-wider uppercase text-neutral-950">
                SMARTSTOCK RETAIL RWANDA
              </h2>
              <p className="text-[11px] text-neutral-800 font-bold">MUGABO SUPERMARKET & BOUTIQUE</p>
              <p className="text-[10px] text-neutral-600">Nyamirambo Commercial Ave, Nyarugenge, Kigali</p>
              <p className="text-[10px] text-neutral-600">Tel: +250 788 123 456</p>
              
              {/* EBM Registration Data */}
              <div className="text-[10px] text-neutral-700 font-semibold space-y-0.5 pt-1">
                <p>TIN: <span className="font-bold">{rra?.tin || '108392019'}</span> | BHF ID: {rra?.bhfId || '00'}</p>
                <p>SDC ID: {rra?.sdcId || 'SDC-RRA-KGL-0492'} | CIS ID: {rra?.cisId || 'CIS-SMARTSTOCK-RW-01'}</p>
              </div>
            </div>

            {/* Receipt Identification Details */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-600">Receipt #:</span>
                <span className="font-bold text-neutral-950">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">SDC Receipt #:</span>
                <span className="font-bold text-emerald-850">{rra?.sdcReceiptNumber || 'SDC/0492/2026/00103'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Date & Time:</span>
                <span>{new Date(sale.timestamp).toLocaleString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Cashier on Duty:</span>
                <span className="font-semibold text-neutral-900">{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Payment Channel:</span>
                <span className="font-bold text-neutral-900">
                  {sale.paymentMethod === 'MOMO_MTN' ? 'MTN Mobile Money' : 
                   sale.paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money' : 
                   sale.paymentMethod === 'CREDIT' ? 'Kwikopesha / Credit Sale' : 'Cash in Hand'}
                </span>
              </div>
              {sale.paymentMethod === 'CREDIT' && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900">
                  <div className="flex justify-between font-medium">
                    <span>Debtor Customer:</span>
                    <span className="font-bold">{sale.customerName || 'Recorded Debtor'}</span>
                  </div>
                  {sale.customerPhone && (
                    <div className="flex justify-between font-mono text-[11px] text-amber-800">
                      <span>Phone:</span>
                      <span>{sale.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] font-bold text-amber-700 pt-0.5 border-t border-amber-200">
                    <span>Account Status:</span>
                    <span>Logged in Debtors Dashboard (UNPAID)</span>
                  </div>
                </div>
              )}
              {sale.momoReference && (
                <div className="flex justify-between text-neutral-700">
                  <span>MoMo Ref:</span>
                  <span className="font-mono">{sale.momoReference}</span>
                </div>
              )}
            </div>

            {/* Itemized List: Items purchased, quantity, unit price, total price */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-2">
              <div className="flex justify-between font-bold text-[10px] text-neutral-500 uppercase pb-0.5">
                <span>Description & Rate</span>
                <span>Total (RWF)</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-neutral-900">
                    <span className="truncate pr-2">
                      {item.productName} {item.isVatApplicable ? '(A)' : '(B)'}
                    </span>
                    <span className="font-mono">{item.totalRwf.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {item.quantity} x {item.unitPriceRwf.toLocaleString()} RWF
                  </div>
                </div>
              ))}
            </div>

            {/* 18% RRA VAT Breakdown Table */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold text-[10px] text-neutral-600 uppercase">
                <span>Tax Code / Description</span>
                <span>Taxable Base</span>
                <span>VAT (18%)</span>
              </div>
              <div className="flex justify-between text-neutral-700 font-mono">
                <span>A: Standard VAT (18%)</span>
                <span>{taxableAmount.toLocaleString()}</span>
                <span className="font-bold text-neutral-950">{vatAmount.toLocaleString()}</span>
              </div>
              {(rra?.taxExemptAmountB || 0) > 0 && (
                <div className="flex justify-between text-neutral-700 font-mono">
                  <span>B: Zero Rated / Exempt</span>
                  <span>{(rra?.taxExemptAmountB || 0).toLocaleString()}</span>
                  <span>0</span>
                </div>
              )}
            </div>

            {/* Total, Cash Tendered, and Change Returned */}
            <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-neutral-900">
              <div className="flex justify-between text-sm font-extrabold text-neutral-950">
                <span>TOTAL INCL. 18% VAT:</span>
                <span className="text-base font-mono text-emerald-800">{sale.totalRwf.toLocaleString()} RWF</span>
              </div>

              {sale.paymentMethod === 'CASH' && (
                <div className="pt-1 space-y-0.5 text-[11px] text-neutral-700 font-mono">
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>{sale.cashTenderedRwf.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Change Returned:</span>
                    <span className={sale.changeGivenRwf > 0 ? 'text-emerald-700' : 'text-neutral-900'}>
                      {sale.changeGivenRwf.toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SDC Device Signature & Fiscal Cryptographic Hash */}
            <div className="pt-2.5 text-center space-y-1.5 text-[10px] text-neutral-600">
              <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-left font-mono text-[9px] space-y-0.5">
                <div className="flex justify-between text-neutral-800">
                  <span className="font-bold">SDC Signature:</span>
                  <span className="font-bold font-mono text-neutral-950">
                    {rra?.receiptSignature || 'RRA-8F2B-91A4-32DE'}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>SDC Internal Counter:</span>
                  <span>#{rra?.globalReceiptCounter || 103}</span>
                </div>
              </div>

              {/* RRA QR Code Verification Block */}
              <div className="pt-1 flex flex-col items-center justify-center">
                <div 
                  onClick={() => setShowQrExpanded(!showQrExpanded)}
                  className="w-20 h-20 bg-neutral-950 p-1.5 rounded-lg flex flex-col items-center justify-center text-white cursor-pointer hover:scale-105 transition shadow-sm"
                  title="Click to view RRA verification QR code"
                >
                  <QrCode className="w-12 h-12 text-emerald-400" />
                  <span className="text-[7px] text-neutral-300 font-bold uppercase tracking-wider">RRA E-Verify</span>
                </div>
                <p className="text-[9px] text-neutral-500 mt-1">
                  Scan to verify genuine Rwanda Revenue Authority fiscal receipt.
                </p>
              </div>

              <p className="font-bold text-neutral-900 text-[10px] pt-1">
                Murakoze Cyane! Thank you for demanding an official EBM receipt.
              </p>
            </div>
          </div>
        </div>

        {/* 3. INSTANT ACTION BUTTONS (WhatsApp, PDF, Thermal Print, Next Sale) */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 space-y-3 no-print">
          {/* Customer Phone Input for WhatsApp Delivery */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer Phone Number for Instant WhatsApp e-Receipt</span>
              </span>
              {whatsappSent && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> WhatsApp Link Sent
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-whatsapp-phone"
                  type="tel"
                  placeholder="e.g., 0788XXXXXX or +250 788 123 456"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-neutral-500 focus:border-emerald-500 outline-none transition"
                />
              </div>

              {/* Action 1: "Send via WhatsApp" Button */}
              <button
                id="btn-whatsapp-send"
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shrink-0 shadow-md shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Bottom Responsive Action Buttons Grid: PDF, Share PDF, Thermal Print, Next Sale */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Action 2: "Download PDF Invoice" (Emerald File-Down Icon) */}
            <button
              id="btn-download-pdf-receipt"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="py-3 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isGeneratingPdf ? 'Generating...' : pdfReady ? 'Download PDF' : 'Download PDF'}</span>
            </button>

            {/* Action 2b: "Share EBM PDF" (Shares the real PDF file via share sheet) */}
            <button
              id="btn-share-pdf-receipt"
              type="button"
              onClick={handleSharePdf}
              disabled={isGeneratingPdf}
              className="py-3 px-3 bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 border border-sky-500/40 text-sky-300 hover:text-sky-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Share PDF</span>
            </button>

            {/* Action 3: "Print Thermal Receipt" (Gray Printer Icon) */}
            <button
              id="btn-print-thermal-receipt"
              type="button"
              onClick={handlePrintThermal}
              className="py-3 px-3 bg-neutral-800 hover:bg-neutral-750 active:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm col-span-2 sm:col-span-1"
            >
              <Printer className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>Print Thermal Receipt</span>
            </button>

            {/* Action 4: "Next Sale / New Transaction" (Emerald Green Button) */}
            <button
              id="btn-next-sale-transaction"
              type="button"
              onClick={handleNextSale}
              className="py-3 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 font-extrabold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 col-span-2 sm:col-span-3"
            >
              <ArrowRight className="w-4 h-4 text-neutral-950 shrink-0" />
              <span>Next Sale / New Transaction</span>
            </button>
          </div>

          {/* PDF Generation Status (never an infinite spinner on failure) */}
          {isGeneratingPdf && (
            <p className="text-center text-[11px] text-emerald-400 flex items-center justify-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating certified EBM v2 fiscal receipt & PDF invoice...</span>
            </p>
          )}
          {pdfReady && !isGeneratingPdf && (
            <p className="text-center text-[11px] text-emerald-400 flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>PDF Ready • SmartStock-Invoice-{sale.receiptNumber}.pdf</span>
            </p>
          )}
          {pdfError && !isGeneratingPdf && (
            <div className="text-center text-[11px] text-red-400 space-y-2">
              <p>
                Unable to generate PDF. Please try again.
                {pdfErrorMessage && (
                  <span className="block text-neutral-400 mt-1">Detail: {pdfErrorMessage}</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPdfError(false);
                  handleDownloadPdf();
                }}
                className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold rounded-lg text-[11px] hover:bg-rose-500/25 transition cursor-pointer"
              >
                Retry Download
              </button>
            </div>
          )}
          {isSharingPdf && (
            <p className="text-center text-[11px] text-sky-400 flex items-center justify-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Sharing EBM PDF...</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

