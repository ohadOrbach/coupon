import type { Coupon, CouponStatus } from './types';

/**
 * Derives the effective status of a coupon.
 *
 * - `used` is set by the user and is sticky: once a coupon is used it stays
 *   used, regardless of its expiry date.
 * - Otherwise, a coupon with an expiry date strictly in the past is `expired`.
 * - Everything else (future expiry, or no expiry at all) is `active`.
 *
 * `now` is injected so the logic stays pure and testable.
 */
export function computeStatus(coupon: Pick<Coupon, 'status' | 'expiryDate'>, now: Date): CouponStatus {
  if (coupon.status === 'used') {
    return 'used';
  }

  if (!coupon.expiryDate) {
    return 'active';
  }

  const expiry = new Date(coupon.expiryDate).getTime();
  if (Number.isNaN(expiry)) {
    // Unparseable dates should never silently expire a coupon.
    return 'active';
  }

  return expiry < now.getTime() ? 'expired' : 'active';
}
