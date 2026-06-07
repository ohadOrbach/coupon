import { computeStatus } from '@/lib/status';
import type { Coupon, CouponDraft, CouponStatus } from '@/lib/types';
import { getAllStored, getStored, putStored, removeStored } from './storage';

export type CouponFilters = {
  search?: string;
  source?: string;
  status?: CouponStatus;
};

function now(): string {
  return new Date().toISOString();
}

// Refresh a coupon's effective status (auto-expiry) and persist the change so
// the stored value stays truthful.
async function refreshStatus(coupon: Coupon): Promise<Coupon> {
  const effective = computeStatus(coupon, new Date());
  if (effective !== coupon.status) {
    const updated = { ...coupon, status: effective };
    await putStored(updated);
    return updated;
  }
  return coupon;
}

function sortByExpiry(a: Coupon, b: Coupon): number {
  // Coupons with no expiry sort last; otherwise soonest expiry first.
  const ae = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
  const be = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
  if (ae !== be) return ae - be;
  // Tie-break: newest first.
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function listCoupons(filters: CouponFilters = {}): Promise<Coupon[]> {
  const all = await getAllStored();
  const refreshed = await Promise.all(all.map(refreshStatus));

  const search = filters.search?.trim().toLowerCase();

  const filtered = refreshed.filter((c) => {
    if (filters.source && c.source !== filters.source) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (search) {
      const haystack = `${c.name} ${c.source} ${c.notes ?? ''} ${c.code}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return filtered.sort(sortByExpiry);
}

export async function getCoupon(id: string): Promise<Coupon | null> {
  const found = await getStored(id);
  if (!found) return null;
  return refreshStatus(found);
}

/** Distinct stores already used, for the filter dropdown. */
export async function listSources(): Promise<string[]> {
  const all = await getAllStored();
  const set = new Set<string>();
  for (const c of all) {
    if (c.source) set.add(c.source);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export async function createCoupon(draft: CouponDraft): Promise<Coupon> {
  const timestamp = now();
  const coupon: Coupon = {
    id: crypto.randomUUID(),
    status: 'active',
    sourceChannel: 'manual',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...draft,
    code: draft.code ?? '',
    currency: draft.currency || 'ILS',
  };
  // Honour auto-expiry if a past date was entered.
  coupon.status = computeStatus(coupon, new Date());
  await putStored(coupon);
  return coupon;
}

export async function updateCoupon(id: string, draft: CouponDraft): Promise<Coupon> {
  const existing = await getStored(id);
  if (!existing) {
    throw new Error(`Coupon ${id} not found`);
  }
  const updated: Coupon = {
    ...existing,
    ...draft,
    code: draft.code ?? '',
    currency: draft.currency || 'ILS',
    updatedAt: now(),
  };
  updated.status = computeStatus(updated, new Date());
  await putStored(updated);
  return updated;
}

export async function markUsed(id: string): Promise<void> {
  const existing = await getStored(id);
  if (!existing) return;
  await putStored({ ...existing, status: 'used', updatedAt: now() });
}

export async function deleteCoupon(id: string): Promise<void> {
  await removeStored(id);
}

// --- Backup: export/import the whole dataset to/from a JSON file ---

export async function exportData(): Promise<string> {
  const all = await getAllStored();
  return JSON.stringify({ version: 1, exportedAt: now(), coupons: all }, null, 2);
}

export type ImportResult = { imported: number };

/**
 * Imports coupons from a previously exported JSON file. Existing coupons with
 * the same id are overwritten; everything else is added. Throws on malformed
 * input so the UI can show an error.
 */
export async function importData(json: string): Promise<ImportResult> {
  const parsed = JSON.parse(json);
  const coupons: unknown = parsed?.coupons;
  if (!Array.isArray(coupons)) {
    throw new Error('הקובץ אינו גיבוי קופונים תקין.');
  }

  let imported = 0;
  for (const item of coupons) {
    if (item && typeof item === 'object' && typeof (item as Coupon).id === 'string') {
      await putStored(item as Coupon);
      imported += 1;
    }
  }
  return { imported };
}
