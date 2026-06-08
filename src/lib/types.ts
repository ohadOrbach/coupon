// Core data model for the coupon app. Mirrors the build brief's `Coupon` type.
// The full shape is defined now (including fields only used by later phases such
// as barcode rendering and share-ingest) so the SQLite schema never needs a
// migration when those phases land. The MVP UI only reads/writes a subset.

export type CouponType = 'coupon' | 'voucher' | 'ticket' | 'giftcard';

export type CodeFormat = 'text' | 'barcode' | 'qr';

// fixed = "50 off", percent = "20%", balance = gift-card balance,
// value = prepaid value (e.g. an event ticket).
export type AmountType = 'fixed' | 'percent' | 'balance' | 'value';

export type CouponStatus = 'active' | 'used' | 'expired';

export type SourceChannel = 'sms' | 'email' | 'image' | 'url' | 'manual';

// "Tag" — is this a coupon (discount) or a credit/refund voucher (זיכוי)?
export type CouponKind = 'coupon' | 'credit';

export type CouponCategory = 'restaurants' | 'attractions' | 'spa' | 'stores' | 'other';

export type Coupon = {
  id: string; // uuid
  type?: CouponType;
  kind?: CouponKind; // קופון / זיכוי
  category?: CouponCategory; // מסעדות / אטרקציות / ...
  name: string;
  code: string; // TEXT, not number (preserves letters, dashes, leading zeros)
  codeFormat?: CodeFormat;
  barcodeSymbology?: string; // e.g. 'code128', 'ean13' (later phase: barcode render)
  link?: string; // URL to the online coupon/ticket; source of truth for tickets
  source: string; // store/retailer
  amount?: number;
  amountType?: AmountType;
  currency: string; // default 'ILS'
  expiryDate?: string | null; // ISO datetime (stored at end of the chosen day); null = no expiry
  status: CouponStatus;
  notes?: string; // free text for secondary IDs or stray detail
  rawText?: string; // original message (later phase: re-extraction)
  imageUri?: string; // legacy single image (kept for backward compatibility)
  imageUris?: string[]; // attached photos (data URLs), stored on-device
  sourceChannel?: SourceChannel;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

// All images for a coupon, tolerating the legacy single-image field.
export function couponImages(c: Pick<Coupon, 'imageUri' | 'imageUris'>): string[] {
  if (c.imageUris && c.imageUris.length) return c.imageUris;
  return c.imageUri ? [c.imageUri] : [];
}

// Fields the user edits in the MVP add/edit form. `id`, `status`, timestamps,
// and the later-phase fields are managed by the app, not typed by the user.
export type CouponDraft = Pick<
  Coupon,
  | 'type'
  | 'kind'
  | 'category'
  | 'name'
  | 'code'
  | 'source'
  | 'amount'
  | 'amountType'
  | 'currency'
  | 'expiryDate'
  | 'notes'
  | 'link'
  | 'imageUri'
  | 'imageUris'
>;

export const DEFAULT_CURRENCY = 'ILS';

// Dropdown of known stores; the form also allows free-text "other".
export const KNOWN_STORES = [
  'מפעל הפיס',
  'ביחד בשבילך',
  'KSP',
  'Mami',
] as const;

export const KIND_OPTIONS: { value: CouponKind; label: string }[] = [
  { value: 'coupon', label: 'קופון' },
  { value: 'credit', label: 'זיכוי' },
];

export const KIND_LABELS: Record<CouponKind, string> = {
  coupon: 'קופון',
  credit: 'זיכוי',
};

export const CATEGORY_OPTIONS: { value: CouponCategory; label: string }[] = [
  { value: 'restaurants', label: 'מסעדות' },
  { value: 'attractions', label: 'אטרקציות' },
  { value: 'spa', label: 'ספא וחופשות' },
  { value: 'stores', label: 'חנויות' },
  { value: 'other', label: 'אחר' },
];

export const CATEGORY_LABELS: Record<CouponCategory, string> = {
  restaurants: 'מסעדות',
  attractions: 'אטרקציות',
  spa: 'ספא וחופשות',
  stores: 'חנויות',
  other: 'אחר',
};
