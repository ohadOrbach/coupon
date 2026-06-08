import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { CheckoutCode } from '@/components/CheckoutCode';
import { StatusBadge } from '@/components/StatusBadge';
import { deleteCoupon, getCoupon, markUsed } from '@/db/coupons';
import { formatAmount, formatExpiry } from '@/lib/format';
import { CATEGORY_LABELS, KIND_LABELS, couponImages, type Coupon } from '@/lib/types';

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());

  const reload = useCallback(async () => {
    if (!id) return;
    setCoupon(await getCoupon(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="content" />
      </>
    );
  }

  if (!coupon) {
    return (
      <>
        <Header />
        <div className="content">
          <div className="empty">
            <h2>הקופון לא נמצא</h2>
          </div>
        </div>
      </>
    );
  }

  const amount = formatAmount(coupon.amount, coupon.amountType, coupon.currency);
  const images = couponImages(coupon);

  async function handleMarkUsed() {
    await markUsed(coupon!.id);
    reload();
  }

  async function handleDelete() {
    if (!confirm('למחוק את הקופון? לא ניתן לבטל פעולה זו.')) return;
    await deleteCoupon(coupon!.id);
    navigate('/');
  }

  return (
    <>
      <Header />
      <div className="content">
        <div className="detail-title">
          <h2>{coupon.name || '(ללא שם)'}</h2>
          <StatusBadge status={coupon.status} />
        </div>

        <CheckoutCode code={coupon.code} />

        {images.map((src, i) => (
          <a key={i} href={src} target="_blank" rel="noreferrer" className="coupon-image">
            <img src={src} alt={`תמונה ${i + 1}`} />
          </a>
        ))}

        <div className="details">
          <DetailRow label="חנות" value={coupon.source} />
          {coupon.kind && <DetailRow label="סוג" value={KIND_LABELS[coupon.kind]} />}
          {coupon.category && <DetailRow label="קטגוריה" value={CATEGORY_LABELS[coupon.category]} />}
          {amount && <DetailRow label="סכום" value={amount} />}
          <DetailRow label="תוקף" value={formatExpiry(coupon.expiryDate, now)} />
          {coupon.notes && <DetailRow label="הערות" value={coupon.notes} />}
        </div>

        {coupon.link && (
          <div className="btn-row">
            <a className="btn btn-secondary" href={coupon.link} target="_blank" rel="noreferrer">
              פתיחת קישור
            </a>
          </div>
        )}

        <div className="btn-row">
          {coupon.status !== 'used' && (
            <button type="button" className="btn btn-secondary" onClick={handleMarkUsed}>
              סימון כנוצל
            </button>
          )}
          <Link className="btn" to={`/coupon/${coupon.id}/edit`}>
            עריכה
          </Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            מחיקה
          </button>
        </div>
      </div>
    </>
  );
}

function Header() {
  return (
    <header className="app-header">
      <Link className="back-link" to="/">
        <span aria-hidden="true"></span> חזרה
      </Link>
      <h1 style={{ textAlign: 'center' }}>קופון</h1>
    </header>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
