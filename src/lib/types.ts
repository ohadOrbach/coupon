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

export type Coupon = {
  id: string; // uuid
  type?: CouponType;
  name: string;
  code: string; // TEXT, not number (preserves letters, dashes, leading zeros)
  codeFormat?: CodeFormat;
  barcodeSymbology?: string; // e.g. 'code128', 'ean13' (later phase: barcode render)
  link?: string; // URL to the online coupon/ticket; source of truth for tickets
  source: string; // store/retailer
  amount?: number;
  amountType?: AmountType;
  currency: string; // default 'ILS'
  expiryDate?: string | null; // ISO datetime (time optional); null = no expiry
  status: CouponStatus;
  notes?: string; // free text for secondary IDs or stray detail
  rawText?: string; // original message (later phase: re-extraction)
  imageUri?: string; // local path to captured photo (later phase)
  sourceChannel?: SourceChannel;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

// Fields the user edits in the MVP add/edit form. `id`, `status`, timestamps,
// and the later-phase fields are managed by the app, not typed by the user.
export type CouponDraft = Pick<
  Coupon,
  | 'type'
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
>;

export const DEFAULT_CURRENCY = 'ILS';

// Dropdown of known stores; the form also allows free-text "other".
export const KNOWN_STORES = [
  'מפעל הפיס',
  'ביחד בשבילך',
  'KSP',
  'סופר-פארם',
] as const;
