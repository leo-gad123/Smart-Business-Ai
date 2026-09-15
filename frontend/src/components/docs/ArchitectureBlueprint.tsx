import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  Layers, 
  Copy, 
  Check, 
  Cpu, 
  ShieldCheck, 
  Smartphone, 
  GitBranch, 
  ListOrdered,
  FileCode,
  Terminal,
  Server,
  Workflow
} from 'lucide-react';

export const ArchitectureBlueprint: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'sql_schema' | 'workflows' | 'antitheft_rules' | 'wireframes'>('architecture');

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const SQL_SCHEMA = `-- =========================================================================
-- MURINZI ANTI-THEFT INVENTORY & CASH RECONCILIATION ENGINE
-- Target: PostgreSQL 15+ / SQLite 3 (Offline Edge Compatible)
-- Currency Standard: Rwandan Franc (RWF)
-- =========================================================================

-- 1. USERS & ROLES
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL, -- e.g. +250788123456
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'CASHIER', 'AUDITOR')),
    pin_hash VARCHAR(255) NOT NULL,           -- 4-digit quick POS PIN
    shop_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS & PRICING FLOORS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    barcode VARCHAR(64) NOT NULL,              -- EAN-13 or Code-128
    cost_price_rwf DECIMAL(12,2) NOT NULL,    -- Chiffre d'achat (Wholesale buy cost)
    selling_price_rwf DECIMAL(12,2) NOT NULL, -- Official retail selling price
    min_selling_price_rwf DECIMAL(12,2) NOT NULL, -- Hard floor: blocks unauthorized discounts
    current_stock INT NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs',           -- pcs, bottle, kg, pack
    reorder_level INT DEFAULT 5,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_shop_barcode UNIQUE(shop_id, barcode)
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_shop_stock ON products(shop_id, current_stock);

-- 3. SHIFT REGISTERS & BLIND RECONCILIATION
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    shift_code VARCHAR(50) UNIQUE NOT NULL,    -- e.g. SHIFT-2026-09-03-ERIC
    cashier_id UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    
    -- Opening Floats
    opening_cash_float_rwf DECIMAL(12,2) NOT NULL DEFAULT 0,
    opening_momo_float_rwf DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Live Computed Totals (Updated via triggers or sale writes)
    total_cash_sales_rwf DECIMAL(12,2) DEFAULT 0,
    total_momo_sales_rwf DECIMAL(12,2) DEFAULT 0,
    total_sales_count INT DEFAULT 0,
    total_void_count INT DEFAULT 0,
    total_void_amount_rwf DECIMAL(12,2) DEFAULT 0,
    
    -- Expected Cash in Drawer
    expected_cash_in_drawer_rwf DECIMAL(12,2) GENERATED ALWAYS AS (opening_cash_float_rwf + total_cash_sales_rwf) STORED,
    expected_momo_in_account_rwf DECIMAL(12,2) GENERATED ALWAYS AS (opening_momo_float_rwf + total_momo_sales_rwf) STORED,
    
    -- Blind Cash Closing Count (Entered by cashier WITHOUT seeing expected totals)
    actual_cash_counted_rwf DECIMAL(12,2),
    actual_momo_counted_rwf DECIMAL(12,2),
    
    -- Cash Breakdown (Denominations JSON: 20k, 10k, 5k, 2k, 1k, 500, coins)
    cash_denominations_json JSONB,
    
    -- Discrepancies & Variances (actual - expected)
    cash_variance_rwf DECIMAL(12,2),          -- Negative is cash theft / shortage!
    momo_variance_rwf DECIMAL(12,2),
    
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED_BALANCED', 'CLOSED_SHORTAGE', 'CLOSED_SURPLUS')),
    discrepancy_note TEXT,
    closed_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_shifts_cashier_status ON shifts(cashier_id, status);

-- 4. SALES TRANSACTIONS
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    shift_id UUID REFERENCES shifts(id),
    cashier_id UUID NOT NULL REFERENCES users(id),
    receipt_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. RW-20260903-1001
    subtotal_rwf DECIMAL(12,2) NOT NULL,
    discount_rwf DECIMAL(12,2) DEFAULT 0,
    total_rwf DECIMAL(12,2) NOT NULL,
    total_cost_rwf DECIMAL(12,2) NOT NULL,
    gross_profit_rwf DECIMAL(12,2) NOT NULL,
    
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'MOMO_MTN', 'AIRTEL_MONEY', 'SPLIT')),
    cash_tendered_rwf DECIMAL(12,2) DEFAULT 0,
    change_given_rwf DECIMAL(12,2) DEFAULT 0,
    momo_reference VARCHAR(60),                -- SMS Reference ID
    customer_phone VARCHAR(20),
    
    is_voided BOOLEAN DEFAULT FALSE,
    void_reason TEXT,
    void_approved_by UUID REFERENCES users(id),
    voided_at TIMESTAMPTZ,
    
    offline_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_receipt ON sales(receipt_number);
CREATE INDEX idx_sales_shift ON sales(shift_id);

-- 5. SALE ITEMS
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(150) NOT NULL,
    barcode VARCHAR(64) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_rwf DECIMAL(12,2) NOT NULL,
    cost_price_rwf DECIMAL(12,2) NOT NULL,
    total_rwf DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. IMMUTABLE STOCK ADJUSTMENTS & SHRINKAGE AUDIT
CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    previous_stock INT NOT NULL,
    adjusted_stock INT NOT NULL,
    delta INT NOT NULL,                        -- e.g. -2 (shrinkage) or +24 (intake)
    reason VARCHAR(40) NOT NULL CHECK (reason IN (
        'RESTOCK_PURCHASE',
        'DAMAGED_BROKEN',
        'EXPIRED_SPOILED',
        'OWNER_PERSONAL_USE',
        'THEFT_SHRINKAGE',
        'COUNTING_CORRECTION'
    )),
    notes TEXT,
    cost_impact_rwf DECIMAL(12,2) NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SPOT-CHECK SURPRISE AUDITS
CREATE TABLE spot_check_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    audited_by UUID NOT NULL REFERENCES users(id),
    cashier_on_duty_id UUID REFERENCES users(id),
    total_variance_units INT NOT NULL,
    total_variance_cost_rwf DECIMAL(12,2) NOT NULL,
    verdict VARCHAR(30) NOT NULL CHECK (verdict IN ('PASS', 'FLAGGED_SHORTAGE', 'INVESTIGATION_REQUIRED')),
    items_audited_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FRAUD & DISCREPANCY REAL-TIME ALERTS
CREATE TABLE fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'CASH_SHORTAGE',
        'PRICE_TAMPERING',
        'PHANTOM_VOID',
        'STOCK_SHRINKAGE',
        'OFF_HOURS_SALE',
        'MOMO_MISMATCH'
    )),
    related_cashier_id UUID REFERENCES users(id),
    amount_at_risk_rwf DECIMAL(12,2) NOT NULL,
    suggested_action TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Murinzi System Blueprint & Architectural Specifications</span>
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl mt-0.5">
            Full-stack design documentation, database DDL schemas, employee vs owner audit workflows, and anti-theft algorithms for Rwandan micro-retailers.
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 text-xs">
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
            activeTab === 'architecture' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-emerald-400" />
          <span>1. System Architecture & Tech Stack</span>
        </button>

        <button
          onClick={() => setActiveTab('sql_schema')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
            activeTab === 'sql_schema' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>2. Database Schema (SQL DDL)</span>
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
            activeTab === 'workflows' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Workflow className="w-4 h-4 text-teal-400" />
          <span>3. Employee vs Owner Workflows</span>
        </button>

        <button
          onClick={() => setActiveTab('antitheft_rules')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
            activeTab === 'antitheft_rules' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-red-400" />
          <span>4. Anti-Theft Core Algorithms</span>
        </button>

        <button
          onClick={() => setActiveTab('wireframes')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition ${
            activeTab === 'wireframes' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>5. Mobile Wireframes & Ergonomics</span>
        </button>
      </div>

      {/* Tab 1: System Architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Tier */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Client Tier (Offline-First PWA)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                <li>&bull; <strong className="text-white">React 19 + TypeScript + Vite:</strong> Ultra-fast rendering on sub-$80 Android phones (Tecno, Infinix, Itel).</li>
                <li>&bull; <strong className="text-white">IndexedDB / LocalStorage Cache:</strong> 100% offline sales recording during Kigali fiber/3G cutouts.</li>
                <li>&bull; <strong className="text-white">Web Barcode API:</strong> Hardware laser scanner (USB OTG) & camera fallback.</li>
                <li>&bull; <strong className="text-white">ESC/POS Thermal Printing:</strong> Bluetooth / USB 58mm receipts with anti-tamper QR hashes.</li>
              </ul>
            </div>

            {/* Application Backend */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Server className="w-4 h-4" />
                <span>Backend Tier (Sync & Reconciliation)</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                <li>&bull; <strong className="text-white">Node.js / Express:</strong> Lightweight REST & WebSocket API endpoints.</li>
                <li>&bull; <strong className="text-white">Conflict Resolution:</strong> Last-Write-Wins (LWW) with append-only immutable audit ledgers.</li>
                <li>&bull; <strong className="text-white">MoMo Webhooks:</strong> MTN MoMo OpenAPI / Airtel Money instant payment verification.</li>
                <li>&bull; <strong className="text-white">SMS/WhatsApp Dispatch:</strong> End-of-shift discrepancy reports sent directly to Owner's phone.</li>
              </ul>
            </div>

            {/* Database & Security */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>Database & Forensics Tier</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                <li>&bull; <strong className="text-white">PostgreSQL / Cloud SQL:</strong> Row-level security, ACID transactions, generated columns.</li>
                <li>&bull; <strong className="text-white">Gemini 2.5 Flash:</strong> AI Forensic Auditor detecting compounding leakage trends.</li>
                <li>&bull; <strong className="text-white">Immutable Ledger:</strong> Zero hard deletes allowed on sales or shift variances.</li>
              </ul>
            </div>
          </div>

          {/* Sync Lifecycle Diagram */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Offline-to-Cloud Synchronization Lifecycle</span>
            </h3>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <span>[1. Transaction Scanned]</span> → Deducts local memory stock → Generates receipt QR with tamper hash
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span>[2. Network Check]</span> → If 3G/4G down: Appends to <code className="text-amber-400">IndexedDB offline_queue</code>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span>[3. Background Worker]</span> → Once internet resumes: Batches sales upstream with idempotency keys
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <span>[4. Server Reconciliation]</span> → Validates MoMo references, recalculates expected cash float
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span>[5. Anomaly Trigger]</span> → If cash variance &lt; -300 RWF, sends immediate SMS alert to owner
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SQL DDL Schema */}
      {activeTab === 'sql_schema' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Production-ready PostgreSQL & SQLite Schema DDL with Triggers, Foreign Keys, and Constraints
            </span>
            <button
              onClick={() => copyToClipboard(SQL_SCHEMA, 'sql')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition"
            >
              {copiedSection === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-x-auto max-h-[60vh]">
            <pre className="text-xs font-mono text-neutral-300 leading-relaxed select-all">
              {SQL_SCHEMA}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Workflows */}
      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee Daily Workflow */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm pb-2 border-b border-neutral-800">
              <Workflow className="w-4 h-4" />
              <span>Employee (Cashier) Daily Shift Workflow</span>
            </div>

            <ol className="space-y-3 text-xs text-neutral-300 list-decimal list-inside">
              <li className="pl-1">
                <strong className="text-white">Morning Shift Check-in:</strong> Enter 4-digit PIN, count cash float (e.g. 20,000 RWF for change) and MoMo float. System locks starting numbers.
              </li>
              <li className="pl-1">
                <strong className="text-white">Live Quick-Sell:</strong> Scan product barcodes or tap quick items. System auto-calculates selling price and denies discounts below min floor price.
              </li>
              <li className="pl-1">
                <strong className="text-white">Payment Acceptance:</strong> 
                Take Cash or trigger MTN MoMo prompt. Print or show thermal receipt with QR code hash.
              </li>
              <li className="pl-1">
                <strong className="text-white">Protected Voids:</strong> If customer walks away without paying, cashier must select a mandatory anti-theft reason (logged permanently).
              </li>
              <li className="pl-1">
                <strong className="text-white">Evening "Blind" Cash Drop:</strong> 
                Count physical notes and coins into the register. The computer <span className="text-amber-300 font-bold">does NOT display</span> expected total. Submit blind count.
              </li>
            </ol>
          </div>

          {/* Owner Daily Audit Workflow */}
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pb-2 border-b border-neutral-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Owner (Gérant) Daily & Weekly Audit Workflow</span>
            </div>

            <ol className="space-y-3 text-xs text-neutral-300 list-decimal list-inside">
              <li className="pl-1">
                <strong className="text-white">Surprise Spot-Checks:</strong> Randomly audit 4 fast-moving SKUs (e.g. Primus, Mutzig, Inyange Milk) twice weekly. App flags missing physical bottles vs sales.
              </li>
              <li className="pl-1">
                <strong className="text-white">Blind Variance Review:</strong> Open daily shift reports. System highlights any cash drawer variance with cashier notes.
              </li>
              <li className="pl-1">
                <strong className="text-white">Phantom Void & Price Override Log:</strong> Inspect cancelled carts to confirm cashier did not take cash and void after customer left.
              </li>
              <li className="pl-1">
                <strong className="text-white">Stock Intake Restocking:</strong> Log new inventory batches with wholesale buying prices (Chiffre d'achat) to lock in profit margin baselines.
              </li>
              <li className="pl-1">
                <strong className="text-white">AI Forensic Diagnostics:</strong> Run 1-click anomaly scanner to project 90-day compounding losses and receive targeted prevention directives.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 4: Anti-Theft Core Algorithms */}
      {activeTab === 'antitheft_rules' && (
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <span>Anti-Theft Detection Algorithms & Rupture Points</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Rule 1: Blind Reconciliation */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
              <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                <span>1. Blind Shift Closing (Zero-Knowledge Register)</span>
              </h4>
              <p className="text-neutral-300 leading-normal">
                Standard POS systems display "Total Due: 84,500 RWF". Dishonest cashiers use this to match numbers while skimming surplus change. Murinzi forces physical denomination counting before calculating variance:
              </p>
              <div className="p-2 bg-neutral-900 rounded font-mono text-[11px] text-emerald-400">
                Variance = (Counted Cash + Counted MoMo) - (Float + Sales - Approved Voids)
              </div>
            </div>

            {/* Rule 2: Price Tampering Lock */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
              <h4 className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                <span>2. Hard Floor Price Protection</span>
              </h4>
              <p className="text-neutral-300 leading-normal">
                Prevents cashiers from giving unauthorized discounts to friends or charging full price to customers while ringing up discounted items:
              </p>
              <div className="p-2 bg-neutral-900 rounded font-mono text-[11px] text-amber-400">
                IF input_price &lt; min_selling_price → BLOCK & RAISE_FRAUD_ALERT
              </div>
            </div>

            {/* Rule 3: Phantom Void Detection */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
              <h4 className="font-bold text-teal-400 text-xs flex items-center gap-1.5">
                <span>3. Phantom Void & Post-Scan Cancellation Trap</span>
              </h4>
              <p className="text-neutral-300 leading-normal">
                Detects when an item is scanned, total announced to customer, cash taken, and cart subsequently voided within 90 seconds without printed receipt.
              </p>
            </div>

            {/* Rule 4: Compounding Leakage Alert */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
              <h4 className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                <span>4. Micro-Theft Compounding Warning</span>
              </h4>
              <p className="text-neutral-300 leading-normal">
                Flags cashiers who consistently finish shifts with "small" 300–800 RWF shortages, warning the owner of the projected 180,000–1,000,000 RWF annual leakage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Wireframes & Ergonomics */}
      {activeTab === 'wireframes' && (
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm text-white">Mobile View Wireframes & East African Retail Ergonomics</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Screen 1 */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="font-bold text-white text-xs">Screen 1: Fast Touch Quick-Sell</div>
              <p className="text-neutral-400 text-[11px]">
                Optimized for one-handed portrait smartphone use by cashier behind the counter.
              </p>
              <div className="border border-dashed border-neutral-700 p-2.5 rounded-lg space-y-1.5 font-mono text-[10px] text-neutral-400">
                <div className="bg-neutral-900 p-1 rounded text-center text-emerald-400 font-bold">[ Top: Barcode Scan + Search Bar ]</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="bg-neutral-900 p-2 rounded text-center">Milk 500ml<br/><span className="text-white">600 RWF</span></div>
                  <div className="bg-neutral-900 p-2 rounded text-center">Primus 50cl<br/><span className="text-white">1,200 RWF</span></div>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded text-center text-emerald-300 font-bold">[ Bottom Sticky: Charge 1,800 RWF ]</div>
              </div>
            </div>

            {/* Screen 2 */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="font-bold text-white text-xs">Screen 2: Rwandan Banknote Tender</div>
              <p className="text-neutral-400 text-[11px]">
                Large touch tiles for RWF currency notes to compute change in under 3 seconds.
              </p>
              <div className="border border-dashed border-neutral-700 p-2.5 rounded-lg space-y-1.5 font-mono text-[10px] text-neutral-400">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-neutral-900 p-1.5 rounded text-white font-bold">500</div>
                  <div className="bg-neutral-900 p-1.5 rounded text-white font-bold">1,000</div>
                  <div className="bg-neutral-900 p-1.5 rounded text-white font-bold">2,000</div>
                  <div className="bg-neutral-900 p-1.5 rounded text-white font-bold">5,000</div>
                  <div className="bg-neutral-900 p-1.5 rounded text-white font-bold">10,000</div>
                  <div className="bg-neutral-900 p-1.5 rounded text-white font-bold">20,000</div>
                </div>
                <div className="bg-neutral-900 p-1.5 rounded text-center text-emerald-400">Change Due: 200 RWF</div>
              </div>
            </div>

            {/* Screen 3 */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="font-bold text-white text-xs">Screen 3: Blind End-of-Day Drop</div>
              <p className="text-neutral-400 text-[11px]">
                Cashier enters bill counts; variance is computed server-side only upon submit.
              </p>
              <div className="border border-dashed border-neutral-700 p-2.5 rounded-lg space-y-1.5 font-mono text-[10px] text-neutral-400">
                <div className="bg-neutral-900 p-1 rounded text-center text-amber-300">Total Expected: [ HIDDEN ]</div>
                <div className="bg-neutral-900 p-1 rounded text-center">5,000s: [ 6 notes ]</div>
                <div className="bg-neutral-900 p-1 rounded text-center">1,000s: [ 24 notes ]</div>
                <div className="bg-amber-500/20 p-2 rounded text-center text-amber-300 font-bold">[ Submit Blind Count ]</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
