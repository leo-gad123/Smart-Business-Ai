import { Product, SMSLog, SMSType, User } from '../types';
import { pushCollection } from './mongoSync';

const STORAGE_KEY_SMS = 'smartstock_sms_logs_v1';

export class SMSService {
  private static _pushTimer: ReturnType<typeof setTimeout> | null = null;

  public static getLogs(): SMSLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLogs(logs: SMSLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_SMS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to write SMS logs:', e);
    }
    // Debounced push to MongoDB (fire-and-forget, 250ms debounce)
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this._pushTimer = null;
      void pushCollection('smslogs', logs);
    }, 250);
  }

  public static getAllLogs(): SMSLog[] {
    return this.getLogs();
  }

  /**
   * Broadcasts SMS alerts to all active staff members whenever the Owner adds or updates a product/stock count
   */
  public static broadcastStaffStockAlert(params: {
    product: Product;
    previousStock: number;
    newStock: number;
    ownerName: string;
    staffList: User[];
  }): SMSLog[] {
    const delta = params.newStock - params.previousStock;
    const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
    const message = `[SmartStock Alert] ${params.ownerName} updated stock for "${params.product.name}". New Stock: ${params.newStock} ${params.product.unit} (${deltaStr}). Selling Price: ${params.product.sellingPriceRwf.toLocaleString()} RWF.`;

    const logs = this.getLogs();
    const newLogs: SMSLog[] = [];

    // Filter staff members (cashiers/employees)
    const staffMembers = params.staffList.filter(u => u.role === 'employee' || u.role === 'auditor');

    for (const staff of staffMembers) {
      const logEntry: SMSLog = {
        id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipientPhone: staff.phone || '+250788000000',
        recipientName: staff.name,
        recipientRole: 'STAFF',
        message,
        type: 'STAFF_RESTOCK_ALERT',
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
        referenceId: params.product.id,
        costRwf: 15 // Standard telecom SMS unit cost in RWF
      };
      newLogs.push(logEntry);
      logs.unshift(logEntry);
    }

    this.saveLogs(logs);
    return newLogs;
  }

  /**
   * Sends an automated digital e-receipt to a customer via SMS
   */
  public static sendCustomerDigitalReceipt(params: {
    customerPhone: string;
    shopName: string;
    receiptNumber: string;
    totalAmountRwf: number;
    vatAmountRwf: number;
    itemCount: number;
    qrVerificationUrl: string;
    sdcReceiptNumber: string;
  }): SMSLog {
    const message = `[SmartStock e-Receipt] ${params.shopName}
Receipt: ${params.receiptNumber} (${params.itemCount} items)
Total: ${params.totalAmountRwf.toLocaleString()} RWF (18% RRA VAT: ${params.vatAmountRwf.toLocaleString()} RWF)
EBM SDC: ${params.sdcReceiptNumber}
Verify RRA e-Tax: ${params.qrVerificationUrl}
Thank you for shopping with us!`;

    const logEntry: SMSLog = {
      id: `sms-cust-${Date.now()}`,
      recipientPhone: params.customerPhone,
      recipientName: 'Customer',
      recipientRole: 'CUSTOMER',
      message,
      type: 'CUSTOMER_RECEIPT',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
      referenceId: params.receiptNumber,
      costRwf: 15
    };

    const logs = this.getLogs();
    logs.unshift(logEntry);
    this.saveLogs(logs);

    return logEntry;
  }

  /**
   * Triggers an urgent SMS to the Shop Owner when a shift closing discrepancy >= 500 RWF is logged
   */
  public static sendOwnerDiscrepancyAlert(params: {
    ownerPhone: string;
    ownerName: string;
    cashierName: string;
    shiftCode: string;
    shortageRwf: number;
    expectedCashRwf: number;
    actualCashRwf: number;
    note?: string;
  }): SMSLog {
    const message = `[SmartStock Anti-Theft Alert] ⚠️ DISCREPANCY DETECTED!
Cashier ${params.cashierName} closed ${params.shiftCode} with a shortage of ${params.shortageRwf.toLocaleString()} RWF.
Expected: ${params.expectedCashRwf.toLocaleString()} RWF | Counted: ${params.actualCashRwf.toLocaleString()} RWF.
Note: "${params.note || 'No explanation provided'}".
Please review drawer reconciliation report.`;

    const logEntry: SMSLog = {
      id: `sms-alert-${Date.now()}`,
      recipientPhone: params.ownerPhone,
      recipientName: params.ownerName,
      recipientRole: 'OWNER',
      message,
      type: 'OWNER_DISCREPANCY_ALERT',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
      referenceId: params.shiftCode,
      costRwf: 15
    };

    const logs = this.getLogs();
    logs.unshift(logEntry);
    this.saveLogs(logs);

    return logEntry;
  }

  /**
   * Sends the official Shift Closing & Reconciliation Audit SMS to the Store Owner
   */
  public static sendOwnerShiftCloseReport(params: {
    ownerPhone: string;
    ownerName: string;
    cashierName: string;
    shiftCode: string;
    expectedTotalRwf: number;
    countedTotalRwf: number;
    varianceRwf: number;
    cashCountedRwf: number;
    momoCountedRwf: number;
    note?: string;
  }): SMSLog {
    let resultHeader = '';
    if (params.varianceRwf === 0) {
      resultHeader = '✅ Inyerezwa: 0 RWF (Exact Match - Kase iruzuye neza)';
    } else if (params.varianceRwf < 0) {
      resultHeader = `⚠️ Habuzemo: -${Math.abs(params.varianceRwf).toLocaleString()} RWF (Discrepancy Shortage)`;
    } else {
      resultHeader = `ℹ️ Harenzeho: +${params.varianceRwf.toLocaleString()} RWF (Surplus)`;
    }

    const message = `[SmartStock Shift Report] ${resultHeader}
Umukozi: ${params.cashierName}
Shift Code: ${params.shiftCode}
Ayo System Yiteze: ${params.expectedTotalRwf.toLocaleString()} RWF
Ayabaruwe Yose: ${params.countedTotalRwf.toLocaleString()} RWF (Kase: ${params.cashCountedRwf.toLocaleString()} RWF | MoMo: ${params.momoCountedRwf.toLocaleString()} RWF)
${params.note ? `Icyitonderwa: "${params.note}"` : ''}
Isaha: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Kigali`;

    const logEntry: SMSLog = {
      id: `sms-shift-close-${Date.now()}`,
      recipientPhone: params.ownerPhone,
      recipientName: params.ownerName,
      recipientRole: 'OWNER',
      message,
      type: params.varianceRwf < 0 ? 'OWNER_DISCREPANCY_ALERT' : 'OWNER_DAILY_SUMMARY',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
      referenceId: params.shiftCode,
      costRwf: 15
    };

    const logs = this.getLogs();
    logs.unshift(logEntry);
    this.saveLogs(logs);

    return logEntry;
  }

  /**
   * Logs a manual confirmation notification or customer receipt
   */
  public static logManualNotification(params: {
    type: SMSType;
    recipientPhone: string;
    recipientName?: string;
    recipientRole?: 'OWNER' | 'STAFF' | 'ADMIN' | 'CUSTOMER';
    message: string;
    referenceId?: string;
    costRwf?: number;
  }): SMSLog {
    const logEntry: SMSLog = {
      id: `sms-notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName || 'Subscriber',
      recipientRole: params.recipientRole || 'OWNER',
      message: params.message,
      type: params.type,
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
      referenceId: params.referenceId,
      costRwf: params.costRwf || 15
    };
    const logs = this.getLogs();
    logs.unshift(logEntry);
    this.saveLogs(logs);
    return logEntry;
  }
}
