import { useState } from 'react';

/**
 * Large tap-to-reveal code for showing at checkout. Hidden by default so a code
 * isn't exposed by accident; tapping reveals it big enough to read off the
 * phone screen.
 */
export function CheckoutCode({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!code) {
    return (
      <div className="checkout">
        <span className="hint">לא נשמר קוד לקופון זה.</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="checkout"
      aria-label={revealed ? 'הסתר קוד' : 'הצג קוד'}
      onClick={() => setRevealed((r) => !r)}
    >
      {revealed ? (
        <>
          <span className="code">{code}</span>
          <span className="hint">הקש כדי להסתיר</span>
        </>
      ) : (
        <>
          <span className="reveal">הקש כדי להציג את הקוד</span>
          <span className="hint">הצג בקופה</span>
        </>
      )}
    </button>
  );
}
