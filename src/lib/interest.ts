/**
 * Tiered interest rates:
 * - Loan >= $25 → 20% interest
 * - Loan <  $25 → 25% interest
 */
export function getInterestRate(principal: number): number {
  return principal >= 25 ? 0.20 : 0.25;
}

export function getTotalDue(principal: number): number {
  return Math.round(principal * (1 + getInterestRate(principal)) * 100) / 100;
}

export function getInterest(principal: number): number {
  return Math.round(principal * getInterestRate(principal) * 100) / 100;
}
