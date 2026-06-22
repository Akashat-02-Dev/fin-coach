/**
 * Financial mathematical formulas for projecting investments.
 */

/**
 * Calculates the future value of a lumpsum investment compounded annually.
 * Formula: FV = P * (1 + r)^n
 *
 * @param principal The initial lumpsum amount invested.
 * @param annualRate CAGR / annual rate of return (e.g. 7 for 7%).
 * @param years Duration of investment in years.
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (annualRate === 0) return principal;
  return principal * Math.pow(1 + annualRate / 100, years);
}

/**
 * Calculates the future value of a monthly recurring investment (SIP) using monthly compounding.
 * Assumes payments are made at the beginning of each period (annuity due).
 * Formula: FV = P * [((1 + i)^n - 1) / i] * (1 + i)
 *
 * @param monthlyContribution Amount invested each month.
 * @param annualRate CAGR / annual rate of return (e.g. 12 for 12%).
 * @param years Duration of investment in years.
 */
export function calculateFutureValueOfAnnuity(
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  if (monthlyRate === 0) {
    return monthlyContribution * months;
  }

  return (
    monthlyContribution *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate)
  );
}

/**
 * Helper to calculate total amount invested.
 */
export function calculateTotalInvested(
  amount: number,
  years: number,
  isMonthly: boolean
): number {
  if (isMonthly) {
    return amount * 12 * years;
  }
  return amount;
}
