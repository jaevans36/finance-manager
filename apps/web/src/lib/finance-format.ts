import type { Bill, BillFrequency } from '../types/finance';

export const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

// Matches the backend's BillExtensions.MonthlyEquivalent() exactly (52/12, not the
// 4.33 approximation) so bill totals never drift between the two.
export function monthlyEquivalentAmount(amount: number, frequency: BillFrequency): number {
  switch (frequency) {
    case 'Monthly': return amount;
    case 'Weekly': return amount * 52 / 12;
    case 'Quarterly': return amount / 3;
    case 'Annual': return amount / 12;
    default: return amount;
  }
}

export function monthlyEquivalent(bill: Bill): number {
  return monthlyEquivalentAmount(bill.amount, bill.frequency);
}
