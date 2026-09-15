import { CartItem, Product, RRAInvoiceDetails } from '../types';

export class RRATaxService {
  public static readonly DEFAULT_TIN = '108392019';
  public static readonly DEFAULT_BHF = '00';
  public static readonly DEFAULT_CIS = 'CIS-SMARTSTOCK-RW-01';
  public static readonly DEFAULT_SDC = 'SDC-RRA-KGL-0492';
  public static readonly VAT_RATE = 0.18; // 18% Rwanda Standard VAT

  /**
   * Generates official RRA EBM details for a transaction
   */
  public static generateEBMInvoice(params: {
    items: { product: Product; quantity: number; unitPriceRwf: number; totalRwf: number }[];
    totalAmountRwf: number;
    globalCounter: number;
    buyerTin?: string;
    buyerName?: string;
    isVatDisabled?: boolean;
  }): RRAInvoiceDetails {
    // Separate taxable items (Standard 18% VAT - Code A) vs Exempt (Code B)
    let taxableTotal = 0;
    let exemptTotal = 0;

    if (params.isVatDisabled) {
      // When RRA VAT is disabled/toggled OFF: Base = 0, VAT = 0, Exempt = Total
      taxableTotal = 0;
      exemptTotal = params.totalAmountRwf;
    } else {
      for (const item of params.items) {
        if (item.product.isVatApplicable !== false) {
          taxableTotal += item.totalRwf;
        } else {
          exemptTotal += item.totalRwf;
        }
      }
    }

    // In Rwandan VAT-inclusive retail pricing:
    // Taxable Base = Total / 1.18
    // VAT Amount = Total - (Total / 1.18) = Total * (18 / 118)
    const vatAmount = params.isVatDisabled ? 0 : Math.round(taxableTotal * (RRATaxService.VAT_RATE / (1 + RRATaxService.VAT_RATE)));
    const taxableBase = params.isVatDisabled ? 0 : taxableTotal - vatAmount;

    const receiptNum = `SDC/${RRATaxService.DEFAULT_SDC.slice(-4)}/${new Date().getFullYear()}/${String(params.globalCounter).padStart(5, '0')}`;
    
    // Cryptographic signature simulation based on RRA EBM v2 SDC spec
    const rawSignaturePayload = `${RRATaxService.DEFAULT_TIN}-${receiptNum}-${params.totalAmountRwf}-${Date.now()}`;
    const hash = RRATaxService.simpleHash(rawSignaturePayload);
    const receiptSignature = `RRA-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`.toUpperCase();

    const qrVerificationUrl = `https://ebm.rra.gov.rw/verify?tin=${RRATaxService.DEFAULT_TIN}&bhf=${RRATaxService.DEFAULT_BHF}&rc=${params.globalCounter}&sig=${receiptSignature}`;

    return {
      tin: RRATaxService.DEFAULT_TIN,
      bhfId: RRATaxService.DEFAULT_BHF,
      cisId: RRATaxService.DEFAULT_CIS,
      sdcId: RRATaxService.DEFAULT_SDC,
      sdcReceiptNumber: receiptNum,
      globalReceiptCounter: params.globalCounter,
      taxableAmountA_18: taxableBase,
      vatAmountA_18: vatAmount,
      taxExemptAmountB: exemptTotal,
      totalAmountRwf: params.totalAmountRwf,
      receiptSignature,
      qrVerificationUrl,
      buyerTin: params.buyerTin,
      buyerName: params.buyerName
    };
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16) + 'abcdef1234567890';
    return hex.slice(0, 16);
  }

  /**
   * Formats SMS digital receipt text with RRA tax breakdown & verify link
   */
  public static formatCustomerSMSReceipt(params: {
    shopName: string;
    receiptNumber: string;
    totalAmountRwf: number;
    vatAmountRwf: number;
    itemCount: number;
    rraInvoice: RRAInvoiceDetails;
  }): string {
    return `[SmartStock e-Receipt] ${params.shopName}
Receipt: ${params.receiptNumber}
Items: ${params.itemCount}
Total: ${params.totalAmountRwf.toLocaleString()} RWF (Inc. 18% RRA VAT: ${params.vatAmountRwf.toLocaleString()} RWF)
EBM SDC: ${params.rraInvoice.sdcReceiptNumber}
Sig: ${params.rraInvoice.receiptSignature}
Verify RRA: ${params.rraInvoice.qrVerificationUrl}
Murakoze cyane!`;
  }
}
