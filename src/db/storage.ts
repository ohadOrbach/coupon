import { createStore, get, set, del, values } from 'idb-keyval';

import type { Coupon } from '@/lib/types';

// All coupons live in a single IndexedDB object store on the device. Nothing is
// ever sent anywhere — this is purely local, per-browser storage.
const couponStore = createStore('coupons-db', 'coupons');

/**
 * Asks the browser to mark our storage as persistent so it isn't silently
 * evicted under storage pressure. Best-effort: not all browsers support it,
 * and it never throws.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // Ignore — storage still works, just without the durability hint.
  }
}

export async function getAllStored(): Promise<Coupon[]> {
  return (await values<Coupon>(couponStore)) ?? [];
}

export async function getStored(id: string): Promise<Coupon | undefined> {
  return get<Coupon>(id, couponStore);
}

export async function putStored(coupon: Coupon): Promise<void> {
  await set(coupon.id, coupon, couponStore);
}

export async function removeStored(id: string): Promise<void> {
  await del(id, couponStore);
}
