import type { AmountType, CouponStatus } from './types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Human-readable amount for a coupon, accounting for what the number means:
 * a fixed discount, a percentage, a gift-card balance, or a prepaid value.
 */
export function formatAmount(
  amount: number | undefined,
  amountType: AmountType | undefined,
  currency: string,
): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '';
  }

  const sym = currencySymbol(currency);

  switch (amountType) {
    case 'percent':
      return `${amount}% הנחה`;
    case 'fixed':
      return `${sym}${amount} הנחה`;
    case 'balance':
      return `יתרה ${sym}${amount}`;
    case 'value':
      return `${sym}${amount}`;
    default:
      return `${sym}${amount}`;
  }
}

/**
 * Short, human label (Hebrew) for an expiry date relative to `now`.
 * Returns 'ללא תוקף' when there is no expiry, '' when the date is invalid.
 */
export function formatExpiry(expiryDate: string | null | undefined, now: Date): string {
  if (!expiryDate) {
    return 'ללא תוקף';
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return '';
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
  const diffDays = Math.round((startOfExpiry - startOfToday) / dayMs);

  const dateLabel = expiry.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (diffDays < 0) {
    return `פג ב-${dateLabel}`;
  }
  if (diffDays === 0) {
    return `פג היום (${dateLabel})`;
  }
  if (diffDays === 1) {
    return `פג מחר (${dateLabel})`;
  }
  if (diffDays <= 30) {
    return `פג בעוד ${diffDays} ימים (${dateLabel})`;
  }
  return `בתוקף עד ${dateLabel}`;
}

export function statusLabel(status: CouponStatus): string {
  switch (status) {
    case 'active':
      return 'בתוקף';
    case 'used':
      return 'נוצל';
    case 'expired':
      return 'פג';
  }
}
