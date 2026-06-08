import { useRef, useState } from 'react';

import { formatExpiry } from '@/lib/format';
import {
  CATEGORY_OPTIONS,
  DEFAULT_CURRENCY,
  KIND_OPTIONS,
  KNOWN_STORES,
  couponImages,
  type CouponCategory,
  type CouponDraft,
  type CouponKind,
} from '@/lib/types';

const CURRENCY_OPTIONS = [
  { value: 'ILS', label: '₪ ש״ח' },
  { value: 'USD', label: '$ דולר' },
  { value: 'EUR', label: '€ יורו' },
];

const OTHER_STORE = '__other__';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Stored ISO -> value for <input type="date"> (local date, no time).
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// date value (YYYY-MM-DD) -> stored ISO at the END of that local day, so a
// coupon "valid until the 10th" stays valid through the whole of the 10th.
function dateInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// Add a scheme if the user typed a bare domain, so the link is openable.
function normalizeUrl(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });
}

// Read an image file, downscale it, and return a JPEG data URL. Keeping the
// longest side <= 1280px and quality 0.8 keeps on-device storage and backup
// files reasonable while staying readable. Falls back to the original data URL
// if canvas rendering isn't available.
async function fileToDownscaledDataUrl(file: File, maxDim = 1280, quality = 0.8): Promise<string> {
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function CouponForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<CouponDraft>;
  submitLabel: string;
  onSubmit: (draft: CouponDraft) => void;
}) {
  const initialSource = initial?.source ?? '';
  const initialKnown = (KNOWN_STORES as readonly string[]).includes(initialSource);

  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [kind, setKind] = useState<CouponKind | undefined>(initial?.kind);
  const [category, setCategory] = useState<CouponCategory | undefined>(initial?.category);
  const [storeChoice, setStoreChoice] = useState(
    initialSource ? (initialKnown ? initialSource : OTHER_STORE) : '',
  );
  const [otherStore, setOtherStore] = useState(initialKnown ? '' : initialSource);
  const [amount, setAmount] = useState(
    initial?.amount !== undefined && initial?.amount !== null ? String(initial.amount) : '',
  );
  const [currency, setCurrency] = useState(initial?.currency || DEFAULT_CURRENCY);
  const [expiryDate, setExpiryDate] = useState<string | null>(initial?.expiryDate ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [images, setImages] = useState<string[]>(initial ? couponImages(initial) : []);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const source = storeChoice === OTHER_STORE ? otherStore.trim() : storeChoice;

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setImageBusy(true);
    try {
      const added = await Promise.all(files.map((f) => fileToDownscaledDataUrl(f)));
      setImages((prev) => [...prev, ...added]);
    } catch {
      setError('לא ניתן לטעון את התמונה.');
    } finally {
      setImageBusy(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('נא להזין שם.');
      return;
    }
    if (!source) {
      setError('נא לבחור או להזין חנות.');
      return;
    }
    setError(null);

    const parsedAmount = amount.trim() === '' ? undefined : Number(amount.replace(',', '.'));
    const validAmount = parsedAmount !== undefined && !Number.isNaN(parsedAmount) ? parsedAmount : undefined;

    onSubmit({
      name: name.trim(),
      code: code.trim(),
      kind,
      category,
      source,
      amount: validAmount,
      // Amounts are always a plain prepaid/coupon value in this app.
      amountType: validAmount !== undefined ? 'value' : undefined,
      currency,
      expiryDate,
      notes: notes.trim() || undefined,
      link: normalizeUrl(link),
      imageUris: images,
      imageUri: undefined, // migrate off the legacy single-image field
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">שם *</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: 50₪ הנחה בסופר"
        />
      </div>

      <div className="field">
        <label>סוג</label>
        <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </div>

      <div className="field">
        <label>קטגוריה</label>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${category === opt.value ? 'active' : ''}`}
              onClick={() => setCategory((cur) => (cur === opt.value ? undefined : opt.value))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>חנות *</label>
        <div className="chips" style={{ flexWrap: 'wrap', overflow: 'visible' }}>
          {KNOWN_STORES.map((store) => (
            <button
              key={store}
              type="button"
              className={`chip ${storeChoice === store ? 'active' : ''}`}
              onClick={() => setStoreChoice(store)}
            >
              {store}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${storeChoice === OTHER_STORE ? 'active' : ''}`}
            onClick={() => setStoreChoice(OTHER_STORE)}
          >
            אחר…
          </button>
        </div>
        {storeChoice === OTHER_STORE && (
          <input
            value={otherStore}
            onChange={(e) => setOtherStore(e.target.value)}
            placeholder="שם החנות"
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      <div className="field">
        <label htmlFor="code">קוד</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="קוד קופון / מספר אישור"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          dir="ltr"
        />
      </div>

      <div className="field">
        <label htmlFor="link">קישור</label>
        <input
          id="link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          dir="ltr"
        />
      </div>

      <div className="field">
        <label htmlFor="amount">סכום</label>
        <input
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="לדוגמה: 50"
          inputMode="decimal"
        />
      </div>

      <div className="field">
        <label>מטבע</label>
        <Segmented options={CURRENCY_OPTIONS} value={currency} onChange={setCurrency} />
      </div>

      <div className="field">
        <label htmlFor="expiry">תוקף</label>
        <input
          id="expiry"
          type="date"
          value={isoToDateInput(expiryDate)}
          onChange={(e) => setExpiryDate(dateInputToIso(e.target.value))}
        />
        {expiryDate && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="muted">{formatExpiry(expiryDate, new Date())}</span>
            <button type="button" className="link-btn" onClick={() => setExpiryDate(null)}>
              נקה
            </button>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="notes">הערות</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="מספר הזמנה, קודים נוספים, וכל פרט אחר"
        />
      </div>

      <div className="field">
        <label>תמונות</label>
        {images.length > 0 && (
          <div className="image-grid">
            {images.map((src, i) => (
              <div key={i} className="image-thumb">
                <img src={src} alt={`תמונה ${i + 1}`} />
                <button
                  type="button"
                  className="image-remove"
                  aria-label="הסר תמונה"
                  onClick={() => removeImage(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          disabled={imageBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          {imageBusy ? 'טוען…' : images.length ? 'הוספת תמונה נוספת' : 'הוספת תמונה'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImage}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" className="btn">
        {submitLabel}
      </button>
    </form>
  );
}
