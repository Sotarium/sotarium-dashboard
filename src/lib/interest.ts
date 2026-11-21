/**
 * Tiered interest rate — every $25 reduces rate by 5%, minimum 10%:
 *  $0–$24   → 25%
 *  $25–$49  → 20%
 *  $50–$74  → 15%
 *  $75+     → 10% (minimum)
 */
export function getInterestRate(principal: number): number {
  return Math.max(0.10, 0.25 - Math.floor(principal / 25) * 0.05);
}

export function getTotalDue(principal: number): number {
  return Math.round(principal * (1 + getInterestRate(principal)) * 100) / 100;
}

export function getInterest(principal: number): number {
  return Math.round(principal * getInterestRate(principal) * 100) / 100;
}
