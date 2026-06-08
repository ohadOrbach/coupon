// Approximate, FIXED conversion rates to ILS. The app is offline/serverless,
// so we don't fetch live rates — these are rough values for totalling mixed-
// currency coupons in shekels. Update them here if rates drift a lot.
export const ILS_RATES: Record<string, number> = {
  ILS: 1,
  USD: 3.7,
  EUR: 4.0,
  GBP: 4.6,
};

// Convert an amount in the given currency to ILS. Unknown currencies are
// treated as already being in ILS (rate 1) so nothing is silently dropped.
export function toIls(amount: number, currency: string): number {
  const rate = ILS_RATES[currency] ?? 1;
  return amount * rate;
}
