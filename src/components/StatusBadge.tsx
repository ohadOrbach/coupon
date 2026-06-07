import { statusLabel } from '@/lib/format';
import type { CouponStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: CouponStatus }) {
  return <span className={`badge ${status}`}>{statusLabel(status)}</span>;
}
