import { formatAmount, formatExpiry, currencySymbol } from './format';

describe('formatAmount', () => {
  it('formats a percentage discount', () => {
    expect(formatAmount(20, 'percent', 'ILS')).toBe('20% הנחה');
  });

  it('formats a fixed discount with the currency symbol', () => {
    expect(formatAmount(50, 'fixed', 'ILS')).toBe('₪50 הנחה');
  });

  it('formats a gift-card balance', () => {
    expect(formatAmount(100, 'balance', 'ILS')).toBe('יתרה ₪100');
  });

  it('formats a prepaid value', () => {
    expect(formatAmount(250, 'value', 'ILS')).toBe('₪250');
  });

  it('returns an empty string when there is no amount', () => {
    expect(formatAmount(undefined, 'fixed', 'ILS')).toBe('');
  });

  it('falls back to the currency code for unknown currencies', () => {
    expect(currencySymbol('XYZ')).toBe('XYZ');
  });
});

describe('formatExpiry', () => {
  const NOW = new Date('2026-06-07T12:00:00');

  it('labels no expiry', () => {
    expect(formatExpiry(null, NOW)).toBe('ללא תוקף');
  });

  it('labels today', () => {
    expect(formatExpiry('2026-06-07T20:00:00', NOW)).toMatch(/^פג היום/);
  });

  it('labels tomorrow', () => {
    expect(formatExpiry('2026-06-08T09:00:00', NOW)).toMatch(/^פג מחר/);
  });

  it('labels a near-future expiry in days', () => {
    expect(formatExpiry('2026-06-12T09:00:00', NOW)).toMatch(/^פג בעוד 5 ימים/);
  });

  it('labels a past expiry as expired', () => {
    expect(formatExpiry('2026-06-01T09:00:00', NOW)).toMatch(/^פג ב-/);
  });

  it('labels a far-future expiry with a valid-until label', () => {
    expect(formatExpiry('2026-12-31T09:00:00', NOW)).toMatch(/^בתוקף עד/);
  });
});
