import { useRef, useState } from 'react';

import { formatExpiry } from '@/lib/format';
import { DEFAULT_CURRENCY, KNOWN_STORES, type CouponDraft } from '@/lib/types';

const CURRENCY_OPTIONS = [
  { value: 'ILS', label: '₪ ש״ח' },
  { value: 'USD', label: '$ דולר' },
  { value: 'EUR', label: '€ יורו' },
];

const OTHER_STORE = '__other__';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Stored ISO (UTC) -> value for <input type="datetime-local"> (local time).
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

// datetime-local value (local time) -> stored ISO.
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
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
  const [imageUri, setImageUri] = useState<string | undefined>(initial?.imageUri);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const source = storeChoice === OTHER_STORE ? otherStore.trim() : storeChoice;

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      setImageUri(await fileToDownscaledDataUrl(file));
    } catch {
      setError('לא ניתן לטעון את התמונה.');
    } finally {
      setImageBusy(false);
    }
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
      source,
      amount: validAmount,
      // Amounts are always a plain prepaid/coupon value in this app.
      amountType: validAmount !== undefined ? 'value' : undefined,
      currency,
      expiryDate,
      notes: notes.trim() || undefined,
      link: normalizeUrl(link),
      imageUri,
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
          type="datetime-local"
          value={isoToLocalInput(expiryDate)}
          onChange={(e) => setExpiryDate(localInputToIso(e.target.value))}
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
        <label>תמונה</label>
        {imageUri ? (
          <div className="image-preview">
            <img src={imageUri} alt="תמונת הקופון" />
            <button type="button" className="link-btn" onClick={() => setImageUri(undefined)}>
              הסר תמונה
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={imageBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {imageBusy ? 'טוען…' : 'הוספת תמונה'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
