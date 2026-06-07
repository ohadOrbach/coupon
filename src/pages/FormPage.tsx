import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { CouponForm } from '@/components/CouponForm';
import { createCoupon, getCoupon, updateCoupon } from '@/db/coupons';
import type { Coupon, CouponDraft } from '@/lib/types';

export function FormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    let active = true;
    if (!id) return;
    (async () => {
      const found = await getCoupon(id);
      if (active) {
        setCoupon(found);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(draft: CouponDraft) {
    try {
      if (isEdit && coupon) {
        await updateCoupon(coupon.id, draft);
        navigate(`/coupon/${coupon.id}`);
      } else {
        await createCoupon(draft);
        navigate('/');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'השמירה נכשלה.');
    }
  }

  const backTo = isEdit && id ? `/coupon/${id}` : '/';

  if (loading) {
    return (
      <>
        <Header isEdit={isEdit} backTo={backTo} />
        <div className="content" />
      </>
    );
  }

  if (isEdit && !coupon) {
    return (
      <>
        <Header isEdit={isEdit} backTo={backTo} />
        <div className="content">
          <div className="empty">
            <h2>הקופון לא נמצא</h2>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header isEdit={isEdit} backTo={backTo} />
      <div className="content">
        <CouponForm
          initial={coupon ?? undefined}
          submitLabel={isEdit ? 'שמירת שינויים' : 'שמירת קופון'}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}

function Header({ isEdit, backTo }: { isEdit: boolean; backTo: string }) {
  return (
    <header className="app-header">
      <Link className="back-link" to={backTo}>
        <span aria-hidden="true"></span> חזרה
      </Link>
      <h1 style={{ textAlign: 'center' }}>{isEdit ? 'עריכת קופון' : 'הוספת קופון'}</h1>
    </header>
  );
}
