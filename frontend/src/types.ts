export type UserRole = 'superadmin' | 'owner' | 'employee' | 'auditor';

export type ShiftType = 
  | 'WHOLE_DAY' 
  | 'PART_TIME_MORNING' 
  | 'PART_TIME_EVENING'
  | 'MORNING_SHIFT'
  | 'AFTERNOON_SHIFT'
  | 'NIGHT_SHIFT';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  shiftType: ShiftType;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'PRESENT' | 'ON_DUTY' | 'COMPLETED' | 'LATE';
  hoursLogged?: number;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  pin: string; // 4-digit PIN for quick cashier auth
  shopName: string;
  systemPassword?: string;
  shiftType?: ShiftType;
  avatarUrl?: string;
  active: boolean;
  isNewUser?: boolean;
  isDemo?: boolean;
  subscriptionStatus?: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PENDING' | 'DEMO';
  mtnTxRef?: string;
  mtnTransactionId?: string;
  cvFileName?: string;
  cvDataUrl?: string;
  contractFileName?: string;
}

export type ProductCategory = 
  | 'Alimentation & Groceries'
  | 'Beverages & Drinks'
  | 'Personal Care & Beauty'
  | 'Household & Cleaning'
  | 'Electronics & Airtime'
  | 'Boutique & Clothing';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  barcode?: string;         // Optional (barcodes removed from manual product entry)
  costPriceRwf: number;      // Chiffre d'achat (Wholesale buy cost) - Visible ONLY to Owner
  sellingPriceRwf: number;   // Official selling price
  minSellingPriceRwf: number;// Floor price (cannot sell below without owner OTP)
  currentStock: number;      // Current system on-hand quantity
  unit: string;              // 'pcs', 'bottle', 'kg', 'pack', 'card'
  reorderLevel: number;      // Alert when below this quantity
  isVatApplicable: boolean;  // RRA 18% VAT applicable (true) vs Exempt (false)
  expiryDate?: string;       // YYYY-MM-DD for expiry tracking
  imageUrl?: string;
  lastRestockedAt: string;
  shopName?: string;         // Business/shop this product belongs to (unset = legacy shared catalog)
}

export interface BusinessGoals {
  dailySalesTargetRwf: number;    // e.g., 200,000 RWF/day
  maxDailyExpenseLimitRwf: number;// e.g., 30,000 RWF/day
  monthlyProfitGoalRwf: number;   // e.g., 1,500,000 RWF/month
  autoSmsSummaryEnabled: boolean; // Daily auto-SMS summary toggle
  smsRecipientPhone: string;      // Phone number to receive daily summary
}

export type PaymentMethod = 'CASH' | 'MOMO_MTN' | 'AIRTEL_MONEY' | 'SPLIT' | 'CREDIT';

export interface DebtorSettlement {
  id: string;
  amountRwf: number;
  paymentMethod: 'CASH' | 'MOMO_MTN' | 'AIRTEL_MONEY' | 'BANK';
  timestamp: string;
  receivedBy: string;
  note?: string;
}

export interface DebtorRecord {
  id: string;
  saleId: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmountRwf: number;
  paidAmountRwf: number;
  remainingBalanceRwf: number;
  dueDate?: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'SETTLED';
  createdAt: string;
  settledAt?: string;
  notes?: string;
  settlements: DebtorSettlement[];
}

export interface CustomerSalesAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatCustomerRatePercent: number;
  churnRatePercent: number;
  customerGrowthPercent: number;
  growthTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  topMovingItems: {
    productId: string;
    productName: string;
    unitsSold: number;
    revenueRwf: number;
    unit: string;
  }[];
  salesSummary: {
    totalRevenueRwf: number;
    totalCostRwf: number;
    grossProfitRwf: number;
    profitMarginPercent: number;
    totalTransactions: number;
    averageTicketRwf: number;
    vatCollectedRwf: number;
  };
  debtSummary: {
    totalDebtIssuedRwf: number;
    totalRecoveredRwf: number;
    outstandingBalanceRwf: number;
    activeDebtorsCount: number;
  };
  generatedAt: string;
}

export interface WeeklyPerformanceReport {
  id: string;
  period: 'WEEKLY' | 'DAILY';
  weekLabel: string;
  generatedAt: string;
  recipientEmail: string;
  recipientPhone: string;
  salesVolumeRwf: number;
  grossProfitRwf: number;
  profitMarginPercent: number;
  customerGrowthPercent: number;
  customerGrowthTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  newCustomersCount: number;
  returningCustomersCount: number;
  churnRatePercent: number;
  outstandingCreditRwf: number;
  activeDebtorsCount: number;
  topMovingItems: {
    name: string;
    unitsSold: number;
    revenueRwf: number;
  }[];
  aiSuggestedPrompt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPriceRwf: number;      // Captured at time of sale
  appliedDiscountRwf: number;
  totalRwf: number;
}

export interface RRAInvoiceDetails {
  tin: string;                      // Taxpayer Identification Number (e.g., 102938475)
  bhfId: string;                    // Branch ID (e.g., "00")
  cisId: string;                    // Cashier Invoice System ID
  sdcId: string;                    // Sales Data Controller ID
  sdcReceiptNumber: string;         // Official SDC counter
  globalReceiptCounter: number;     // Sequential transaction count
  taxableAmountA_18: number;        // Taxable Base for standard 18% VAT
  vatAmountA_18: number;            // 18% VAT component (Total A * 18/118)
  taxExemptAmountB: number;         // 0% VAT exempt items
  totalAmountRwf: number;           // Total payable
  receiptSignature: string;         // SDC verification cryptographic hash
  qrVerificationUrl: string;        // Official RRA verification link
  buyerTin?: string;                // Optional B2B buyer TIN
  buyerName?: string;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  items: {
    productId: string;
    productName: string;
    barcode?: string;
    quantity: number;
    unitPriceRwf: number;
    costPriceRwf: number;           // Recorded in DB, hidden from cashier UI
    totalRwf: number;
    isVatApplicable: boolean;
  }[];
  subtotalRwf: number;
  discountRwf: number;
  totalRwf: number;
  totalCostRwf: number;             // Hidden from cashier
  grossProfitRwf: number;           // Hidden from cashier
  paymentMethod: PaymentMethod;
  cashTenderedRwf: number;
  changeGivenRwf: number;
  momoReference?: string;
  customerPhone?: string;
  customerName?: string;
  customerReceiptSent: boolean;
  customerReceiptMedium?: 'SMS' | 'WHATSAPP' | 'PRINTED';
  rraInvoice: RRAInvoiceDetails;    // Official RRA EBM Invoicing Metadata
  timestamp: string;
  isVoided: boolean;
  voidReason?: string;
  voidApprovedBy?: string;
  offlineQueued?: boolean;
}

export type AdjustmentReason = 
  | 'RESTOCK_PURCHASE'
  | 'DAMAGED_BROKEN'
  | 'EXPIRED_SPOILED'
  | 'OWNER_PERSONAL_USE'
  | 'THEFT_SHRINKAGE'
  | 'COUNTING_CORRECTION';

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  adjustedStock: number;
  delta: number;                    // e.g. -2 or +10
  reason: AdjustmentReason;
  notes: string;
  performedBy: string;
  performedByRole: UserRole;
  timestamp: string;
  costImpactRwf: number;
  smsAlertsDispatched: number;      // Number of staff notified via SMS
}

export interface CashDenominationCount {
  note20000?: number;
  note10000?: number;
  note5000: number;
  note2000: number;
  note1000: number;
  note500: number;
  coins: number;                    // 100, 50 RWF coins
  coin100?: number;
  coin50?: number;
}

export interface ShiftRegister {
  id: string;
  shiftCode: string;                // e.g. SHIFT-2026-09-03-M
  shiftType?: ShiftType;
  shiftTypeName?: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingCashFloatRwf: number;
  openingMomoFloatRwf: number;
  
  // Computed live totals
  totalCashSalesRwf: number;
  totalMomoSalesRwf: number;
  totalSalesCount: number;
  totalVoidCount: number;
  totalVoidAmountRwf: number;
  
  expectedCashInDrawerRwf: number;
  expectedMomoInAccountRwf: number;
  
  // Blind reconciliation results
  actualCashCountedRwf?: number;
  actualMomoCountedRwf?: number;
  cashDenominations?: CashDenominationCount;
  
  cashVarianceRwf?: number;         // actual - expected (negative is shortage/theft)
  momoVarianceRwf?: number;
  
  status: 'OPEN' | 'CLOSED_BALANCED' | 'CLOSED_SHORTAGE' | 'CLOSED_SURPLUS';
  discrepancyNote?: string;
  closedByAuditorName?: string;
  ownerSmsAlertSent?: boolean;      // True if discrepancy >= 500 RWF triggered SMS to Owner
}

export interface SpotCheckItem {
  productId: string;
  productName: string;
  systemExpectedCount: number;
  physicalCounted: number;
  variance: number;                 // physical - system
  varianceCostRwf: number;
}

export interface SpotCheckAudit {
  id: string;
  auditedBy: string;
  timestamp: string;
  cashierOnDuty: string;
  items: SpotCheckItem[];
  totalVarianceUnits: number;
  totalVarianceCostRwf: number;
  verdict: 'PASS' | 'FLAGGED_SHORTAGE' | 'INVESTIGATION_REQUIRED';
}

export type FraudAlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: FraudAlertSeverity;
  category: 'CASH_SHORTAGE' | 'PRICE_TAMPERING' | 'PHANTOM_VOID' | 'STOCK_SHRINKAGE' | 'OFF_HOURS_SALE' | 'MOMO_MISMATCH';
  relatedCashierName?: string;
  amountAtRiskRwf: number;
  suggestedAction: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export type SMSType = 
  | 'STAFF_RESTOCK_ALERT' 
  | 'CUSTOMER_RECEIPT' 
  | 'OWNER_DISCREPANCY_ALERT' 
  | 'OWNER_DAILY_SUMMARY'
  | 'ONBOARDING_CONFIRMATION'
  | 'SUBSCRIPTION_RENEWAL'
  | 'OTP_VERIFICATION';

export interface SMSLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  recipientRole: 'STAFF' | 'CUSTOMER' | 'OWNER' | 'ADMIN';
  message: string;
  type: SMSType;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  timestamp: string;
  referenceId?: string; // sale ID, product ID, or shift ID
  costRwf: number;      // e.g. 15 RWF standard SMS gateway cost in Rwanda
}

export interface OnboardingRegistration {
  id: string;
  shopName: string;
  ownerFullName: string;
  ownerPhone: string;
  ownerEmail: string;
  recoveryPhone?: string;
  districtLocation: string; // e.g. 'Nyarugenge, Kigali', 'Gasabo', 'Kicukiro', 'Rubavu', 'Musanze', 'Huye'
  shopType: 'Supermarket' | 'Alimentation / Grocery' | 'Liquor & Beverage Store' | 'Boutique' | 'Wholesale';
  staffCount: number;
  workerCount?: number; // required for plan determination (1, 3, 8, 15 from selector)
  setupFeePaidRwf: number; // 15,000 or 30,000 RWF (server-computed)
  monthlyPlanRwf: number;  // 4,000 or 8,000 RWF/mo (server-computed)
  paymentMethod: 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD';
  paymentReference: string;
  mtnTxRef?: string;
  mtnTransactionId?: string;
  mtnStatus?: string;
  trainingScheduledDate: string;
  status: 'ACTIVE' | 'PENDING_TRAINING';
  createdAt: string;
}

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'TRIAL'
  | 'PAYMENT_DUE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED';

export type SubscriptionPlanType = 'SINGLE_WORKER' | 'MULTIPLE_WORKERS';

export interface SubscriptionPlan {
  planType: SubscriptionPlanType;
  setupFee: number;
  monthlyFee: number;
  trialMonths: number;
  maxWorkers: number | null;
  label: string;
  description: string;
}

export interface Subscription {
  id: string;
  businessId: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessName?: string;
  planType: SubscriptionPlanType;
  workerCount: number;
  setupFee: number;
  monthlyFee: number;
  trialMonths: number;
  subscriptionStartDate: string;
  trialEndDate: string;
  nextPaymentDate: string;
  lastPaymentDate?: string;
  status: SubscriptionStatus;
  paymentProvider: 'MTN_MOMO' | 'AIRTEL_MONEY';
  paymentReference?: string;
  paymentMethod?: string;
  mtnReferenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  businessId?: string;
  ownerId?: string;
  businessName?: string;
  ownerName?: string;
  billingPeriod: string; // 'SETUP' | '2026-10' | ...
  amountRwf: number;
  type: 'SETUP_FEE' | 'MONTHLY' | 'REFUND' | 'ADJUSTMENT';
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  paymentProvider: 'MTN_MOMO' | 'AIRTEL_MONEY';
  paymentReference: string;
  providerReferenceId?: string;
  providerTransactionId?: string;
  description?: string;
  createdAt: string;
  paidAt?: string;
}

export interface SubscriptionQuote {
  workerCount: number;
  setupFee: number;
  monthlyFee: number;
  trialMonths: number;
  trialEndDate: string;
  nextPaymentDate: string;
}

export type ExpenseCategory = 
  | 'SALARIES_PAYROLL' 
  | 'SHOP_RENT' 
  | 'ELECTRICITY_REG' 
  | 'WATER_WASAC' 
  | 'TRANSPORT_LOGISTICS' 
  | 'PACKAGING_BAGS' 
  | 'COMMUNICATIONS_AIRTIME' 
  | 'EQUIPMENT_REPAIR' 
  | 'OTHER_MISC';

export interface ShopExpense {
  id: string;
  category: ExpenseCategory;
  amountRwf: number;
  date: string;
  paidTo: string;
  description: string; // MANDATORY quote/reason explaining expense
  quoteRef?: string;
  paymentMethod: 'CASH' | 'MOMO_MTN' | 'AIRTEL_MONEY' | 'BANK';
  approvedBy: string;
  createdAt: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string; // e.g. BRAL-2026-089
  supplierName: string;  // e.g. Bralirwa Ltd, Inyange Industries, Kimironko Depot
  date: string;
  totalAmountRwf: number;
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'CREDIT_DEBT';
  paymentMethod: 'CASH' | 'MOMO_MTN' | 'BANK_TRANSFER' | 'CREDIT';
  itemsSummary: string; // Summary of items restocked
  notes?: string;
  attachmentName?: string;
  attachmentData?: string; // Base64 or mock receipt document
  createdAt: string;
}

export interface EmployeeContract {
  id: string;
  userId: string;
  employeeName: string;
  nationalIdOrPassport: string;
  role: UserRole;
  monthlySalaryRwf: number;
  shiftType: ShiftType;
  startDate: string;
  endDate?: string;
  contractType: 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'PROBATION';
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
  pdfFileName?: string;
  pdfDataUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface StaffShiftRecord {
  id: string;
  userId: string;
  employeeName: string;
  shiftType: ShiftType;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  status: 'ON_DUTY' | 'COMPLETED' | 'ABSENT' | 'LATE';
  hoursLogged?: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  insights?: {
    type?: 'stock' | 'sales' | 'payroll' | 'discrepancy' | 'general';
    metric?: string;
    actionableTip?: string;
  };
}
