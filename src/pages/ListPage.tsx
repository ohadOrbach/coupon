import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { StatusBadge } from '@/components/StatusBadge';
import {
  exportData,
  importData,
  listCoupons,
  listSources,
  type CouponFilters,
} from '@/db/coupons';
import { formatAmount, formatExpiry } from '@/lib/format';
import type { Coupon, CouponStatus } from '@/lib/types';

const STATUS_OPTIONS: { value: CouponStatus | 'all'; label: string }[] = [
  { value: 'active', label: 'בתוקף' },
  { value: 'used', label: 'נוצלו' },
  { value: 'expired', label: 'פגו' },
  { value: 'all', label: 'הכול' },
];

// A coupon is "soon" if it's active and expires within 7 days from now.
function isSoon(c: Coupon, now: Date): boolean {
  if (c.status !== 'active' || !c.expiryDate) return false;
  const expiry = new Date(c.expiryDate).getTime();
  if (Number.isNaN(expiry)) return false;
  const days = (expiry - now.getTime()) / (24 * 60 * 60 * 1000);
  return days >= 0 && days <= 7;
}

export function ListPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('active');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  const reload = useCallback(async () => {
    const filters: CouponFilters = {};
    if (search.trim()) filters.search = search.trim();
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (sourceFilter) filters.source = sourceFilter;
    const [list, srcs] = await Promise.all([listCoupons(filters), listSources()]);
    setCoupons(list);
    setSources(srcs);
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  const soonCount = coupons.filter((c) => isSoon(c, now)).length;

  async function handleExport() {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const { imported } = await importData(text);
      await reload();
      alert(`יובאו ${imported} קופונים.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'לא ניתן לייבא את הקובץ.');
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>הקופונים שלי</h1>
        <button type="button" className="link-btn" onClick={handleExport}>
          ייצוא
        </button>
        <button type="button" className="link-btn" onClick={() => fileInputRef.current?.click()}>
          ייבוא
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </header>

      <div className="content">
        <input
          className="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, חנות או קוד…"
          type="search"
        />

        <div className="filters">
          <div className="seg">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={statusFilter === opt.value ? 'active' : ''}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {sources.length > 0 && (
          <div className="chips">
            <button
              type="button"
              className={`chip ${sourceFilter === null ? 'active' : ''}`}
              onClick={() => setSourceFilter(null)}
            >
              כל החנויות
            </button>
            {sources.map((src) => (
              <button
                key={src}
                type="button"
                className={`chip ${sourceFilter === src ? 'active' : ''}`}
                onClick={() => setSourceFilter((cur) => (cur === src ? null : src))}
              >
                {src}
              </button>
            ))}
          </div>
        )}

        {soonCount > 0 && statusFilter !== 'used' && statusFilter !== 'expired' && (
          <div className="banner">
            ⏰ {soonCount === 1 ? 'קופון אחד פג בתוך שבוע' : `${soonCount} קופונים פגים בתוך שבוע`}
          </div>
        )}

        {coupons.length === 0 ? (
          <div className="empty">
            <h2>אין עדיין קופונים</h2>
            <p>הקש על כפתור ה־+ כדי להוסיף קופון, שובר או כרטיס ראשון.</p>
          </div>
        ) : (
          <div className="list">
            {coupons.map((c) => (
              <CouponCard key={c.id} coupon={c} now={now} />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="fab"
        aria-label="הוספת קופון"
        onClick={() => navigate('/coupon/new')}
      >
        +
      </button>
    </>
  );
}

function CouponCard({ coupon, now }: { coupon: Coupon; now: Date }) {
  const amount = formatAmount(coupon.amount, coupon.amountType, coupon.currency);
  const expiry = formatExpiry(coupon.expiryDate, now);
  const soon = isSoon(coupon, now);

  return (
    <Link className="card" to={`/coupon/${coupon.id}`}>
      <div className="card-top">
        <span className="card-name">{coupon.name || '(ללא שם)'}</span>
        <StatusBadge status={coupon.status} />
      </div>
      <div className="card-meta">
        {coupon.source ? <span className="card-source">{coupon.source}</span> : <span />}
        {amount && <span className="card-amount">{amount}</span>}
      </div>
      <div className={`card-expiry ${soon ? 'soon' : ''}`}>{expiry}</div>
    </Link>
  );
}
