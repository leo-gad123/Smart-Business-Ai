import { Product, User, ShiftRegister, FraudAlert, SaleTransaction, SMSLog, OnboardingRegistration, PurchaseInvoice, ShopExpense, EmployeeContract, StaffShiftRecord, DebtorRecord } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-owner-1',
    name: 'Patrick Niyonzima',
    phone: '+250 788 314 520',
    email: 'patrick.niyonzima@gmail.com',
    role: 'owner',
    pin: '8899',
    systemPassword: 'Password123!',
    shopName: 'Simba Supermarket & Provisions (Kimironko, Gasabo)',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    shiftType: 'WHOLE_DAY',
    active: true
  },
  {
    id: 'usr-cashier-1',
    name: 'Emmanuel Habimana',
    phone: '+250 785 462 178',
    email: 'emmanuel.habimana@gmail.com',
    role: 'employee',
    pin: '1234',
    systemPassword: 'Password123!',
    shopName: 'Simba Supermarket & Provisions (Kimironko, Gasabo)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    shiftType: 'WHOLE_DAY',
    active: true
  },
  {
    id: 'usr-cashier-2',
    name: 'Chantal Uwimana',
    phone: '+250 783 651 290',
    email: 'chantal.uwimana@gmail.com',
    role: 'employee',
    pin: '4321',
    systemPassword: 'Password123!',
    shopName: 'Simba Supermarket & Provisions (Kimironko, Gasabo)',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    shiftType: 'MORNING_SHIFT',
    active: true
  },
  {
    id: 'usr-cashier-3',
    name: 'Jean Bosco Nshizirungwa',
    phone: '+250 782 743 865',
    email: 'jeanbosco.nshi@gmail.com',
    role: 'employee',
    pin: '5678',
    systemPassword: 'Password123!',
    shopName: 'Simba Supermarket & Provisions (Kimironko, Gasabo)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    shiftType: 'AFTERNOON_SHIFT',
    active: true
  },
  {
    id: 'usr-superadmin-1',
    name: 'Kevin Ntagwaba Anwake',
    phone: '+250 788 100 200',
    email: 'ntagerereranwakevin@gmail.com',
    role: 'superadmin',
    pin: '1024',
    systemPassword: 'smartai',
    shopName: 'SmartStock Rwanda HQ',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
    shiftType: 'WHOLE_DAY',
    active: true,
    isNewUser: false,
    isDemo: false,
    subscriptionStatus: 'ACTIVE'
  }
];

// Fresh Owner initial state: zero items in stock (0 SKUs)
export const INITIAL_PRODUCTS: Product[] = [];

// Quick-load default retail catalog (Real Rwandan market products, standard Kigali commodity prices as of Sept 2026)
export const DEFAULT_RETAIL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Inyange Whole Milk (500ml Tetra)',
    category: 'Beverages & Drinks',
    costPriceRwf: 420,
    sellingPriceRwf: 600,
    minSellingPriceRwf: 550,
    currentStock: 48,
    unit: 'pcs',
    reorderLevel: 10,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Bralirwa Primus Beer (50cl Bottle)',
    category: 'Beverages & Drinks',
    costPriceRwf: 820,
    sellingPriceRwf: 1200,
    minSellingPriceRwf: 1100,
    currentStock: 72,
    unit: 'bottle',
    reorderLevel: 15,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-02T11:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Azam Wheat Flour Super (1kg)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 1050,
    sellingPriceRwf: 1400,
    minSellingPriceRwf: 1300,
    currentStock: 35,
    unit: 'pack',
    reorderLevel: 8,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-01T09:00:00Z'
  },
  {
    id: 'prod-4',
    name: 'Savon Gorilla Bar Soap (800g)',
    category: 'Household & Cleaning',
    costPriceRwf: 750,
    sellingPriceRwf: 1100,
    minSellingPriceRwf: 1000,
    currentStock: 25,
    unit: 'pcs',
    reorderLevel: 5,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-01T14:00:00Z'
  },
  {
    id: 'prod-5',
    name: 'Skol Malt Lager (50cl)',
    category: 'Beverages & Drinks',
    costPriceRwf: 870,
    sellingPriceRwf: 1300,
    minSellingPriceRwf: 1200,
    currentStock: 40,
    unit: 'bottle',
    reorderLevel: 12,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-02T16:00:00Z'
  },
  {
    id: 'prod-6',
    name: 'Kinazi Cassava Flour (2kg Pack)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 1500,
    sellingPriceRwf: 2200,
    minSellingPriceRwf: 2000,
    currentStock: 20,
    unit: 'pack',
    reorderLevel: 6,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-03T08:00:00Z'
  },
  {
    id: 'prod-7',
    name: 'Colgate Herbal Toothpaste (100ml)',
    category: 'Personal Care & Beauty',
    costPriceRwf: 1150,
    sellingPriceRwf: 1700,
    minSellingPriceRwf: 1500,
    currentStock: 18,
    unit: 'pcs',
    reorderLevel: 5,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-03T11:00:00Z'
  },
  {
    id: 'prod-8',
    name: 'MTN Airtime Scratch Card (1,000 RWF)',
    category: 'Electronics & Airtime',
    costPriceRwf: 950,
    sellingPriceRwf: 1000,
    minSellingPriceRwf: 1000,
    currentStock: 100,
    unit: 'card',
    reorderLevel: 20,
    isVatApplicable: false,
    lastRestockedAt: '2026-09-04T07:00:00Z'
  },
  {
    id: 'prod-9',
    name: 'Coca-Cola Original (500ml PET)',
    category: 'Beverages & Drinks',
    costPriceRwf: 350,
    sellingPriceRwf: 500,
    minSellingPriceRwf: 450,
    currentStock: 60,
    unit: 'bottle',
    reorderLevel: 15,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-03T14:00:00Z'
  },
  {
    id: 'prod-10',
    name: 'Blue Band Margarine (500g)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 900,
    sellingPriceRwf: 1250,
    minSellingPriceRwf: 1150,
    currentStock: 22,
    unit: 'pcs',
    reorderLevel: 6,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-02T09:30:00Z'
  },
  {
    id: 'prod-11',
    name: 'Sunseed Cooking Oil (1L Bottle)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 2800,
    sellingPriceRwf: 3500,
    minSellingPriceRwf: 3300,
    currentStock: 14,
    unit: 'bottle',
    reorderLevel: 5,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'prod-12',
    name: 'Vaseline Petrolatum Jelly (100ml)',
    category: 'Personal Care & Beauty',
    costPriceRwf: 650,
    sellingPriceRwf: 950,
    minSellingPriceRwf: 900,
    currentStock: 15,
    unit: 'pcs',
    reorderLevel: 4,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-04T12:00:00Z'
  },
  {
    id: 'prod-13',
    name: 'Simba Ketchup Chips (Salt & Vinegar 45g)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 200,
    sellingPriceRwf: 350,
    minSellingPriceRwf: 300,
    currentStock: 80,
    unit: 'pcs',
    reorderLevel: 20,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-03T15:00:00Z'
  },
  {
    id: 'prod-14',
    name: 'Lucky Rice (5kg Bag)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 4200,
    sellingPriceRwf: 5500,
    minSellingPriceRwf: 5200,
    currentStock: 10,
    unit: 'bag',
    reorderLevel: 4,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'prod-15',
    name: 'Mama Gold Beans (2kg Pack)',
    category: 'Alimentation & Groceries',
    costPriceRwf: 2600,
    sellingPriceRwf: 3400,
    minSellingPriceRwf: 3200,
    currentStock: 12,
    unit: 'pack',
    reorderLevel: 4,
    isVatApplicable: true,
    lastRestockedAt: '2026-09-02T08:00:00Z'
  }
];

export const INITIAL_SHIFTS: ShiftRegister[] = [
  {
    id: 'shift-1001',
    shiftCode: 'SHIFT-2026-09-02-EVENING',
    shiftType: 'WHOLE_DAY',
    shiftTypeName: 'Whole Day',
    cashierId: 'usr-cashier-1',
    cashierName: 'Emmanuel Habimana',
    openedAt: '2026-09-02T07:30:00Z',
    closedAt: '2026-09-02T20:15:00Z',
    openingCashFloatRwf: 15000,
    openingMomoFloatRwf: 40000,
    totalCashSalesRwf: 127800,
    totalMomoSalesRwf: 89400,
    totalSalesCount: 63,
    totalVoidCount: 2,
    totalVoidAmountRwf: 1800,
    expectedCashInDrawerRwf: 142800,
    expectedMomoInAccountRwf: 129400,
    actualCashCountedRwf: 142200,
    actualMomoCountedRwf: 129400,
    cashVarianceRwf: -600,
    momoVarianceRwf: 0,
    status: 'CLOSED_SHORTAGE',
    discrepancyNote: 'Cash drawer short 600 RWF. Two voided receipts (1,800 RWF) documented. Pending owner review.',
    closedByAuditorName: 'Patrick Niyonzima',
    ownerSmsAlertSent: true
  }
];

export const INITIAL_ALERTS: FraudAlert[] = [
  {
    id: 'alert-1001',
    timestamp: '2026-09-02T20:18:00Z',
    title: '600 RWF Cash Drawer Shortage on Shift Close',
    description: 'Cashier Emmanuel Habimana closed shift SHIFT-2026-09-02-EVENING with -600 RWF variance against physical blind count. Expected 142,800 RWF, counted 142,200 RWF. Two voided receipts (1,800 RWF total) were processed during shift.',
    severity: 'MEDIUM',
    category: 'CASH_SHORTAGE',
    relatedCashierName: 'Emmanuel Habimana',
    amountAtRiskRwf: 600,
    suggestedAction: 'Review CCTV footage of shift period and verify both voided receipts with original customers.',
    status: 'PENDING'
  },
  {
    id: 'alert-1002',
    timestamp: '2026-09-01T15:42:00Z',
    title: 'Suspicious Cart Void After Payment Received',
    description: 'Receipt RW-20260901-4892 for 3x Coca-Cola (1,500 RWF) was voided 30 seconds after MoMo payment confirmed. Customer reference MP260901.1540.K2918 was not refunded.',
    severity: 'HIGH',
    category: 'PHANTOM_VOID',
    relatedCashierName: 'Jean Bosco Nshizirungwa',
    amountAtRiskRwf: 1500,
    suggestedAction: 'Verify MoMo refund was not issued. Cross-check MTN merchant statement for reference MP260901.1540.K2918.',
    status: 'PENDING'
  },
  {
    id: 'alert-1003',
    timestamp: '2026-08-30T11:15:00Z',
    title: 'Floor Price Override Attempt Blocked',
    description: 'Attempt to sell Sunseed Cooking Oil (1L) at 3,000 RWF (below floor price 3,300 RWF) without owner OTP authorization. Transaction rejected by system.',
    severity: 'LOW',
    category: 'PRICE_TAMPERING',
    relatedCashierName: 'Chantal Uwimana',
    amountAtRiskRwf: 300,
    suggestedAction: 'Confirm if this was a legitimate customer discount request. If so, owner should apply OTP override for future cases.',
    status: 'RESOLVED'
  }
];

export const INITIAL_SALES: SaleTransaction[] = [
  {
    id: 'tx-2001',
    receiptNumber: 'RW-20260902-2001',
    cashierId: 'usr-cashier-1',
    cashierName: 'Emmanuel Habimana',
    items: [
      {
        productId: 'prod-1',
        productName: 'Inyange Whole Milk (500ml Tetra)',
        barcode: '6161100010012',
        quantity: 3,
        unitPriceRwf: 600,
        costPriceRwf: 420,
        totalRwf: 1800,
        isVatApplicable: true
      },
      {
        productId: 'prod-9',
        productName: 'Coca-Cola Original (500ml PET)',
        quantity: 2,
        unitPriceRwf: 500,
        costPriceRwf: 350,
        totalRwf: 1000,
        isVatApplicable: true
      },
      {
        productId: 'prod-13',
        productName: 'Simba Ketchup Chips (Salt & Vinegar 45g)',
        quantity: 1,
        unitPriceRwf: 350,
        costPriceRwf: 200,
        totalRwf: 350,
        isVatApplicable: true
      }
    ],
    subtotalRwf: 3150,
    discountRwf: 0,
    totalRwf: 3150,
    totalCostRwf: 1960,
    grossProfitRwf: 1190,
    paymentMethod: 'MOMO_MTN',
    cashTenderedRwf: 3150,
    changeGivenRwf: 0,
    momoReference: 'MP260902.1523.A9812',
    customerPhone: '+250 783 214 780',
    customerName: 'Jean d\'Arc Mukamana',
    customerReceiptSent: true,
    customerReceiptMedium: 'SMS',
    rraInvoice: {
      tin: '108473926',
      bhfId: '00',
      cisId: 'CIS-SIMBA-KIM-01',
      sdcId: 'SDC-RRA-KGL-0731',
      sdcReceiptNumber: 'SDC/0731/2026/00421',
      globalReceiptCounter: 421,
      taxableAmountA_18: 2680,
      vatAmountA_18: 470,
      taxExemptAmountB: 0,
      totalAmountRwf: 3150,
      receiptSignature: 'RRA-4A7C-12F8-B9D3',
      qrVerificationUrl: 'https://ebm.rra.gov.rw/verify?tin=108473926&bhf=00&rc=421&sig=RRA-4A7C-12F8-B9D3'
    },
    timestamp: '2026-09-02T15:23:10Z',
    isVoided: false
  },
  {
    id: 'tx-2002',
    receiptNumber: 'RW-20260902-2002',
    cashierId: 'usr-cashier-1',
    cashierName: 'Emmanuel Habimana',
    items: [
      {
        productId: 'prod-3',
        productName: 'Azam Wheat Flour Super (1kg)',
        quantity: 2,
        unitPriceRwf: 1400,
        costPriceRwf: 1050,
        totalRwf: 2800,
        isVatApplicable: true
      },
      {
        productId: 'prod-11',
        productName: 'Sunseed Cooking Oil (1L Bottle)',
        quantity: 1,
        unitPriceRwf: 3500,
        costPriceRwf: 2800,
        totalRwf: 3500,
        isVatApplicable: true
      }
    ],
    subtotalRwf: 6300,
    discountRwf: 0,
    totalRwf: 6300,
    totalCostRwf: 4900,
    grossProfitRwf: 1400,
    paymentMethod: 'CASH',
    cashTenderedRwf: 7000,
    changeGivenRwf: 700,
    customerReceiptSent: false,
    rraInvoice: {
      tin: '108473926',
      bhfId: '00',
      cisId: 'CIS-SIMBA-KIM-01',
      sdcId: 'SDC-RRA-KGL-0731',
      sdcReceiptNumber: 'SDC/0731/2026/00422',
      globalReceiptCounter: 422,
      taxableAmountA_18: 5365,
      vatAmountA_18: 935,
      taxExemptAmountB: 0,
      totalAmountRwf: 6300,
      receiptSignature: 'RRA-8E2B-6F14-CD7A',
      qrVerificationUrl: 'https://ebm.rra.gov.rw/verify?tin=108473926&bhf=00&rc=422&sig=RRA-8E2B-6F14-CD7A'
    },
    timestamp: '2026-09-02T16:45:00Z',
    isVoided: false
  },
  {
    id: 'tx-2003',
    receiptNumber: 'RW-20260901-4892',
    cashierId: 'usr-cashier-3',
    cashierName: 'Jean Bosco Nshizirungwa',
    items: [
      {
        productId: 'prod-9',
        productName: 'Coca-Cola Original (500ml PET)',
        quantity: 3,
        unitPriceRwf: 500,
        costPriceRwf: 350,
        totalRwf: 1500,
        isVatApplicable: true
      }
    ],
    subtotalRwf: 1500,
    discountRwf: 0,
    totalRwf: 1500,
    totalCostRwf: 1050,
    grossProfitRwf: 450,
    paymentMethod: 'MOMO_MTN',
    cashTenderedRwf: 1500,
    changeGivenRwf: 0,
    momoReference: 'MP260901.1540.K2918',
    customerPhone: '+250 788 931 205',
    customerReceiptSent: true,
    customerReceiptMedium: 'SMS',
    rraInvoice: {
      tin: '108473926',
      bhfId: '00',
      cisId: 'CIS-SIMBA-KIM-01',
      sdcId: 'SDC-RRA-KGL-0731',
      sdcReceiptNumber: 'SDC/0731/2026/00398',
      globalReceiptCounter: 398,
      taxableAmountA_18: 1273,
      vatAmountA_18: 227,
      taxExemptAmountB: 0,
      totalAmountRwf: 1500,
      receiptSignature: 'RRA-3C9D-A712-EF58',
      qrVerificationUrl: 'https://ebm.rra.gov.rw/verify?tin=108473926&bhf=00&rc=398&sig=RRA-3C9D-A712-EF58'
    },
    timestamp: '2026-09-01T15:40:12Z',
    isVoided: true,
    voidReason: 'Customer claimed duplicate MoMo charge. Pending refund verification.',
    voidApprovedBy: 'Patrick Niyonzima'
  }
];

export const INITIAL_SMS_LOGS: SMSLog[] = [
  {
    id: 'sms-5001',
    recipientPhone: '+250 785 462 178',
    recipientName: 'Emmanuel Habimana',
    recipientRole: 'STAFF',
    message: '[SmartStock Alert] Patrick Niyonzima updated stock for "Inyange Whole Milk (500ml Tetra)". New Stock: 48 pcs (+24). Selling Price: 600 RWF.',
    type: 'STAFF_RESTOCK_ALERT',
    status: 'DELIVERED',
    timestamp: '2026-09-02T14:15:00Z',
    referenceId: 'prod-1',
    costRwf: 15
  },
  {
    id: 'sms-5002',
    recipientPhone: '+250 788 314 520',
    recipientName: 'Patrick Niyonzima',
    recipientRole: 'OWNER',
    message: '[SmartStock Anti-Theft Alert] DISCREPANCY DETECTED! Cashier Emmanuel Habimana closed SHIFT-2026-09-02-EVENING with a shortage of 600 RWF. Expected: 142,800 RWF | Counted: 142,200 RWF. Voided receipts (2x, 1,800 RWF) logged.',
    type: 'OWNER_DISCREPANCY_ALERT',
    status: 'DELIVERED',
    timestamp: '2026-09-02T20:15:10Z',
    referenceId: 'shift-1001',
    costRwf: 15
  },
  {
    id: 'sms-5003',
    recipientPhone: '+250 783 214 780',
    recipientName: 'Jean d\'Arc Mukamana',
    recipientRole: 'CUSTOMER',
    message: '[SmartStock e-Receipt] Simba Supermarket Kimironko. Receipt: RW-20260902-2001. Total: 3,150 RWF (18% RRA VAT: 470 RWF). EBM SDC: SDC/0731/2026/00421. Verify RRA: https://ebm.rra.gov.rw/verify?tin=108473926&bhf=00&rc=421&sig=RRA-4A7C-12F8-B9D3. Murakoze cyane!',
    type: 'CUSTOMER_RECEIPT',
    status: 'DELIVERED',
    timestamp: '2026-09-02T15:23:15Z',
    referenceId: 'tx-2001',
    costRwf: 15
  }
];

export const INITIAL_ONBOARDING: OnboardingRegistration[] = [
  {
    id: 'onb-2001',
    shopName: 'Simba Supermarket & Provisions',
    ownerFullName: 'Patrick Niyonzima',
    ownerPhone: '+250 788 314 520',
    ownerEmail: 'patrick.niyonzima@gmail.com',
    districtLocation: 'Gasabo (Kimironko), Kigali',
    shopType: 'Supermarket',
    staffCount: 3,
    setupFeePaidRwf: 30000,
    monthlyPlanRwf: 8000,
    paymentMethod: 'MTN_MOMO',
    paymentReference: 'MOMO-SETUP-28471',
    trainingScheduledDate: '2026-09-05',
    status: 'ACTIVE',
    createdAt: '2026-09-01T10:00:00Z'
  }
];

export const INITIAL_INVOICES: PurchaseInvoice[] = [
  {
    id: 'inv-301',
    invoiceNumber: 'FACT-BRAL-2026-0901',
    supplierName: 'Bralirwa Ltd (Kimicukiro Depot)',
    date: '2026-09-01',
    totalAmountRwf: 172000,
    paymentStatus: 'PAID',
    paymentMethod: 'MOMO_MTN',
    itemsSummary: '12 Crates Primus (50cl), 6 Crates Skol Malt (50cl), 4 Crates Amstel (33cl)',
    notes: 'Depot delivery via Truck #RAC 891K. Invoice received with delivery note.',
    attachmentName: 'Facture_Bralirwa_0901.pdf',
    createdAt: '2026-09-01T09:30:00Z'
  },
  {
    id: 'inv-302',
    invoiceNumber: 'FACT-INY-2026-0903',
    supplierName: 'Inyange Industries Ltd (Masaka Plant)',
    date: '2026-09-03',
    totalAmountRwf: 84500,
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    itemsSummary: '10 Cartons Inyange Milk 500ml, 4 Cartons Inyange Apple & Mango Juice 300ml',
    notes: 'Paid via Bank of Kigali App transfer. Delivery note signed by Emmanuel H.',
    attachmentName: 'Inyange_Receipt_0903.pdf',
    createdAt: '2026-09-03T11:15:00Z'
  },
  {
    id: 'inv-303',
    invoiceNumber: 'DEP-NYAB-2026-0904',
    supplierName: 'Nyabugogo Wholesale Grain & Oil Depot',
    date: '2026-09-04',
    totalAmountRwf: 198000,
    paymentStatus: 'PARTIALLY_PAID',
    paymentMethod: 'CASH',
    itemsSummary: '4 Sacks Lucky Rice (25kg), 6 Jerrycans Sunseed Cooking Oil (20L), 3 Sacks Mama Gold Beans (10kg)',
    notes: 'Balance of 48,000 RWF to be settled on next delivery Friday. Goods inspected at warehouse.',
    attachmentName: 'Nyabugogo_Invoice_0904.pdf',
    createdAt: '2026-09-04T14:00:00Z'
  },
  {
    id: 'inv-304',
    invoiceNumber: 'INV-COK-2026-0905',
    supplierName: 'Coca-Cola Bottling Company (Nyakabanda Plant)',
    date: '2026-09-05',
    totalAmountRwf: 63000,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
    itemsSummary: '5 Crates Coca-Cola Original 500ml, 3 Crates Fanta Orange 500ml, 2 Crates Sprite 500ml',
    notes: 'Weekly restocking delivery. Delivery note Ref: COKE-KIM-0905.',
    attachmentName: 'CocaCola_Invoice_0905.pdf',
    createdAt: '2026-09-05T08:45:00Z'
  }
];

export const INITIAL_EXPENSES: ShopExpense[] = [
  {
    id: 'exp-401',
    category: 'SALARIES_PAYROLL',
    amountRwf: 70000,
    date: '2026-09-01',
    paidTo: 'Emmanuel Habimana (Senior Cashier)',
    description: 'Umuhembo wa Septemba (September salary). MoMo transfer Ref #8291.',
    quoteRef: 'PAY-SEP-2026-01',
    paymentMethod: 'MOMO_MTN',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-01T17:00:00Z'
  },
  {
    id: 'exp-402',
    category: 'SALARIES_PAYROLL',
    amountRwf: 55000,
    date: '2026-09-01',
    paidTo: 'Chantal Uwimana (Morning Cashier)',
    description: 'Umuhembo wa Septemba. MoMo transfer Ref #8292.',
    quoteRef: 'PAY-SEP-2026-02',
    paymentMethod: 'MOMO_MTN',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-01T17:05:00Z'
  },
  {
    id: 'exp-403',
    category: 'SALARIES_PAYROLL',
    amountRwf: 55000,
    date: '2026-09-01',
    paidTo: 'Jean Bosco Nshizirungwa (Evening Cashier)',
    description: 'Umuhembo wa Septemba. MoMo transfer Ref #8293.',
    quoteRef: 'PAY-SEP-2026-03',
    paymentMethod: 'MOMO_MTN',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-01T17:10:00Z'
  },
  {
    id: 'exp-404',
    category: 'SHOP_RENT',
    amountRwf: 150000,
    date: '2026-09-01',
    paidTo: 'Proprietor Uwimana Alexis',
    description: 'Ubukode bw\'iduka ukwezi kwa Nzeri (September rent - Kimironko Commercial Arcade, Ground Floor Unit 12).',
    quoteRef: 'RENT-REC-0926',
    paymentMethod: 'BANK',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-01T14:30:00Z'
  },
  {
    id: 'exp-405',
    category: 'ELECTRICITY_REG',
    amountRwf: 18500,
    date: '2026-09-03',
    paidTo: 'REG Rwanda Energy Group (EUCL)',
    description: 'Cashpower Token y\'umuriro (Meter #04281938475 - 92.6 kWh for shop & fridges). Token purchased via MTN MoMo.',
    quoteRef: 'REG-TK-6721',
    paymentMethod: 'MOMO_MTN',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-03T10:00:00Z'
  },
  {
    id: 'exp-406',
    category: 'PACKAGING_BAGS',
    amountRwf: 12000,
    date: '2026-09-04',
    paidTo: 'EcoPlast Kigali Ltd (REMA Approved)',
    description: 'Amashashi yemewe n\'REMA (3 Cartons biodegradable shopping bags, 500 pcs each). Delivery received & counted.',
    quoteRef: 'ECO-BAG-208',
    paymentMethod: 'CASH',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-04T16:20:00Z'
  },
  {
    id: 'exp-407',
    category: 'COMMUNICATIONS_AIRTIME',
    amountRwf: 5000,
    date: '2026-09-05',
    paidTo: 'MTN Rwanda (Business Airtime)',
    description: 'Shop mobile airtime bundle for staff SMS alerts & customer receipts (MTN Business Bundle 5,000 RWF).',
    quoteRef: 'MTN-BIZ-9051',
    paymentMethod: 'MOMO_MTN',
    approvedBy: 'Patrick Niyonzima',
    createdAt: '2026-09-05T09:00:00Z'
  }
];

export const INITIAL_CONTRACTS: EmployeeContract[] = [
  {
    id: 'cont-501',
    userId: 'usr-cashier-1',
    employeeName: 'Emmanuel Habimana',
    nationalIdOrPassport: '1 1995 7 0067823 0 31',
    role: 'employee',
    monthlySalaryRwf: 70000,
    shiftType: 'WHOLE_DAY',
    startDate: '2025-06-01',
    contractType: 'PERMANENT',
    status: 'ACTIVE',
    pdfFileName: 'Contract_Emmanuel_Habimana_SmartStock.pdf',
    notes: 'Senior Cashier & Stock Controller. RSSB registered. Over 1 year tenure.',
    createdAt: '2025-05-25T10:00:00Z'
  },
  {
    id: 'cont-502',
    userId: 'usr-cashier-2',
    employeeName: 'Chantal Uwimana',
    nationalIdOrPassport: '1 2000 4 0082145 0 18',
    role: 'employee',
    monthlySalaryRwf: 55000,
    shiftType: 'MORNING_SHIFT',
    startDate: '2026-03-01',
    contractType: 'FIXED_TERM',
    status: 'ACTIVE',
    pdfFileName: 'Contract_Chal_Uwimana_2026.pdf',
    notes: 'Morning shift cashier (07:00 - 15:00). Six-month contract renewed from March 2026.',
    createdAt: '2026-02-20T11:00:00Z'
  },
  {
    id: 'cont-503',
    userId: 'usr-cashier-3',
    employeeName: 'Jean Bosco Nshizirungwa',
    nationalIdOrPassport: '1 1998 11 0091567 0 54',
    role: 'employee',
    monthlySalaryRwf: 55000,
    shiftType: 'AFTERNOON_SHIFT',
    startDate: '2026-05-15',
    contractType: 'FIXED_TERM',
    status: 'ACTIVE',
    pdfFileName: 'Contract_JeanBosco_Nshizirungwa_2026.pdf',
    notes: 'Afternoon & Evening cashier (14:30 - 22:30). Three-month trial period.',
    createdAt: '2026-05-10T09:00:00Z'
  }
];

export const INITIAL_STAFF_SHIFTS: StaffShiftRecord[] = [
  {
    id: 'shift-rec-601',
    userId: 'usr-cashier-1',
    employeeName: 'Emmanuel Habimana',
    shiftType: 'WHOLE_DAY',
    date: '2026-09-06',
    clockInTime: '07:22 AM',
    clockOutTime: '08:05 PM',
    status: 'COMPLETED',
    hoursLogged: 12.7
  },
  {
    id: 'shift-rec-602',
    userId: 'usr-cashier-2',
    employeeName: 'Chantal Uwimana',
    shiftType: 'MORNING_SHIFT',
    date: '2026-09-06',
    clockInTime: '06:52 AM',
    clockOutTime: '03:05 PM',
    status: 'COMPLETED',
    hoursLogged: 8.2
  },
  {
    id: 'shift-rec-603',
    userId: 'usr-cashier-3',
    employeeName: 'Jean Bosco Nshizirungwa',
    shiftType: 'AFTERNOON_SHIFT',
    date: '2026-09-06',
    clockInTime: '02:25 PM',
    status: 'ON_DUTY',
    hoursLogged: 3.5
  }
];

export const INITIAL_DEBTORS: DebtorRecord[] = [
  {
    id: 'debt-701',
    saleId: 'tx-2001',
    receiptNumber: 'RW-20260901-4298',
    customerName: 'Alphonce Bizimana',
    customerPhone: '+250 784 519 630',
    totalAmountRwf: 22000,
    paidAmountRwf: 10000,
    remainingBalanceRwf: 12000,
    dueDate: '2026-09-15',
    status: 'PARTIALLY_PAID',
    createdAt: '2026-09-01T14:20:00Z',
    notes: 'Bought cooking oil (2x), rice (1x), and sugar on credit. Promised balance by 15th.',
    settlements: [
      {
        id: 'set-1001',
        amountRwf: 10000,
        paymentMethod: 'MOMO_MTN',
        timestamp: '2026-09-04T10:15:00Z',
        receivedBy: 'Emmanuel Habimana',
        note: 'Partial payment via MoMo. Ref: MP260904.1015.B7812'
      }
    ]
  },
  {
    id: 'debt-702',
    saleId: 'tx-2003',
    receiptNumber: 'RW-20260903-5129',
    customerName: 'Vestine Musabende',
    customerPhone: '+250 782 407 318',
    totalAmountRwf: 8500,
    paidAmountRwf: 0,
    remainingBalanceRwf: 8500,
    dueDate: '2026-09-10',
    status: 'UNPAID',
    createdAt: '2026-09-03T16:45:00Z',
    notes: 'Groceries on credit (beans, flour, soap). Due date already passed - follow up required.',
    settlements: []
  },
  {
    id: 'debt-703',
    saleId: 'tx-2002',
    receiptNumber: 'RW-20260905-6734',
    customerName: 'Dieudonné Mugiraneza',
    customerPhone: '+250 786 832 441',
    totalAmountRwf: 15000,
    paidAmountRwf: 5000,
    remainingBalanceRwf: 10000,
    dueDate: '2026-09-20',
    status: 'PARTIALLY_PAID',
    createdAt: '2026-09-05T11:10:00Z',
    notes: 'Wholesale-style purchase: 2x rice 5kg, 1x cooking oil 20L. Client is regular shop owner in Remera.',
    settlements: [
      {
        id: 'set-1002',
        amountRwf: 5000,
        paymentMethod: 'CASH',
        timestamp: '2026-09-07T09:30:00Z',
        receivedBy: 'Chantal Uwimana',
        note: 'Cash payment received at counter'
      }
    ]
  }
];
