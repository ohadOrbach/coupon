import { computeStatus } from './status';
import type { Coupon } from './types';

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'c1',
    name: 'Test',
    code: 'ABC123',
    source: 'Shufersal',
    currency: 'ILS',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const NOW = new Date('2026-06-07T12:00:00.000Z');

describe('computeStatus', () => {
  it('keeps a coupon active when its expiry is in the future', () => {
    const c = makeCoupon({ expiryDate: '2026-12-31T00:00:00.000Z' });
    expect(computeStatus(c, NOW)).toBe('active');
  });

  it('flags a coupon expired when its expiry is in the past', () => {
    const c = makeCoupon({ expiryDate: '2026-01-01T00:00:00.000Z' });
    expect(computeStatus(c, NOW)).toBe('expired');
  });

  it('treats a coupon with no expiry as active (never expires)', () => {
    const c = makeCoupon({ expiryDate: null });
    expect(computeStatus(c, NOW)).toBe('active');
  });

  it('treats an undefined expiry as active', () => {
    const c = makeCoupon({ expiryDate: undefined });
    expect(computeStatus(c, NOW)).toBe('active');
  });

  it('never overrides a user-set "used" status, even when expired', () => {
    const c = makeCoupon({ status: 'used', expiryDate: '2026-01-01T00:00:00.000Z' });
    expect(computeStatus(c, NOW)).toBe('used');
  });

  it('keeps "used" even when the expiry is still in the future', () => {
    const c = makeCoupon({ status: 'used', expiryDate: '2026-12-31T00:00:00.000Z' });
    expect(computeStatus(c, NOW)).toBe('used');
  });

  it('treats an expiry exactly equal to now as still active (expires after the instant passes)', () => {
    const c = makeCoupon({ expiryDate: NOW.toISOString() });
    expect(computeStatus(c, NOW)).toBe('active');
  });
});
