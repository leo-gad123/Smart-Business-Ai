import { SaleTransaction, ShiftRegister, Product, FraudAlert, SpotCheckAudit } from '../types';

export interface FraudMetrics {
  totalShortageRwf: number;
  totalSurplusRwf: number;
  netVarianceRwf: number;
  averageDailyLossRwf: number;
  compoundedYearlyLossRwf: number;
  compoundedQuarterlyLossRwf: number;
  totalVoidLossRwf: number;
  highRiskCashierNames: string[];
  shrinkageRiskScore: number; // 0 to 100
  flaggedShiftsCount: number;
  priceTamperAttemptCount: number;
}

export class FraudDetectionEngine {
  /**
   * Calculates comprehensive leakage metrics across historical shifts and transactions
   */
  static calculateMetrics(
    shifts: ShiftRegister[],
    sales: SaleTransaction[],
    alerts: FraudAlert[],
    spotChecks: SpotCheckAudit[]
  ): FraudMetrics {
    let totalShortageRwf = 0;
    let totalSurplusRwf = 0;
    let flaggedShiftsCount = 0;
    const cashierDiscrepancies: Record<string, { totalShortage: number; count: number }> = {};

    for (const shift of shifts) {
      const cashVar = shift.cashVarianceRwf || 0;
      if (cashVar < 0) {
        const shortage = Math.abs(cashVar);
        totalShortageRwf += shortage;
        flaggedShiftsCount++;

        if (!cashierDiscrepancies[shift.cashierName]) {
          cashierDiscrepancies[shift.cashierName] = { totalShortage: 0, count: 0 };
        }
        cashierDiscrepancies[shift.cashierName].totalShortage += shortage;
        cashierDiscrepancies[shift.cashierName].count += 1;
      } else if (cashVar > 0) {
        totalSurplusRwf += cashVar;
      }
    }

    // Spot check losses
    for (const sc of spotChecks) {
      if (sc.totalVarianceCostRwf > 0 && sc.totalVarianceUnits < 0) {
        totalShortageRwf += sc.totalVarianceCostRwf;
      }
    }

    const netVarianceRwf = totalSurplusRwf - totalShortageRwf;
    const shiftCount = Math.max(1, shifts.length);
    const averageDailyLossRwf = totalShortageRwf / shiftCount;
    const compoundedYearlyLossRwf = averageDailyLossRwf * 365;
    const compoundedQuarterlyLossRwf = averageDailyLossRwf * 90;

    // Calculate total void losses
    const voidedSales = sales.filter(s => s.isVoided);
    const totalVoidLossRwf = voidedSales.reduce((acc, s) => acc + s.totalRwf, 0);

    // High risk cashiers (more than 2 shortages or > 1,500 RWF shortage)
    const highRiskCashierNames = Object.entries(cashierDiscrepancies)
      .filter(([_, data]) => data.count >= 2 || data.totalShortage >= 1500)
      .map(([name]) => name);

    // Calculate price tampering count
    const priceTamperAttemptCount = alerts.filter(a => a.category === 'PRICE_TAMPERING').length;

    // Shrinkage risk score (0 - 100)
    let riskScore = 15;
    if (totalShortageRwf > 500) riskScore += 25;
    if (totalShortageRwf > 5000) riskScore += 30;
    if (voidedSales.length > 2) riskScore += 15;
    if (highRiskCashierNames.length > 0) riskScore += 15;
    const shrinkageRiskScore = Math.min(100, riskScore);

    return {
      totalShortageRwf,
      totalSurplusRwf,
      netVarianceRwf,
      averageDailyLossRwf,
      compoundedYearlyLossRwf,
      compoundedQuarterlyLossRwf,
      totalVoidLossRwf,
      highRiskCashierNames,
      shrinkageRiskScore,
      flaggedShiftsCount,
      priceTamperAttemptCount
    };
  }

  /**
   * Rule: Price Tampering Validator
   * Checks if an employee is entering an arbitrary lower price without owner authorization
   */
  static validateItemPrice(
    product: Product,
    inputPriceRwf: number,
    cashierName: string
  ): { valid: boolean; alert?: Omit<FraudAlert, 'id' | 'timestamp' | 'status'> } {
    if (inputPriceRwf < product.minSellingPriceRwf) {
      const discountTaken = product.sellingPriceRwf - inputPriceRwf;
      return {
        valid: false,
        alert: {
          title: `Unauthorized Markdown Blocked: ${product.name}`,
          description: `Cashier ${cashierName} attempted to sell "${product.name}" at ${inputPriceRwf.toLocaleString()} RWF (Minimum allowed: ${product.minSellingPriceRwf.toLocaleString()} RWF, Normal: ${product.sellingPriceRwf.toLocaleString()} RWF).`,
          severity: 'HIGH',
          category: 'PRICE_TAMPERING',
          relatedCashierName: cashierName,
          amountAtRiskRwf: discountTaken,
          suggestedAction: 'Require Owner PIN authorization before selling below minimum floor price.'
        }
      };
    }
    return { valid: true };
  }

  /**
   * Compounding loss calculator for micro-losses
   * (e.g. 500 RWF per day)
   */
  static computeCompoundingLoss(dailyLeakageRwf: number, days: number = 365): {
    daily: number;
    monthly: number;
    sixMonths: number;
    yearly: number;
    equivalentBaskets: { item: string; quantity: number }[];
  } {
    const daily = dailyLeakageRwf;
    const monthly = daily * 30;
    const sixMonths = daily * 180;
    const yearly = daily * 365;

    return {
      daily,
      monthly,
      sixMonths,
      yearly,
      equivalentBaskets: [
        { item: '500ml Inyange Milk cartons', quantity: Math.floor(yearly / 600) },
        { item: 'Bralirwa Primus crates (24 btls)', quantity: Math.floor(yearly / (1200 * 24)) },
        { item: '25kg Azam Flour sacks', quantity: Math.floor(yearly / 32000) },
        { item: 'Months of shop rent (~150k RWF)', quantity: Math.round((yearly / 150000) * 10) / 10 }
      ]
    };
  }
}
