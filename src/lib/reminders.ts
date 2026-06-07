// Pure logic for deciding when expiry reminders are "soon". In the web build
// there are no OS notifications, so this drives the in-app "expiring soon"
// banner on the list screen. Kept pure so it stays easy to unit-test.

const DAY_MS = 24 * 60 * 60 * 1000;

// Reminders fire this many days before expiry.
export const REMINDER_DAYS_BEFORE = [7, 1] as const;

export type ReminderTime = {
  daysBefore: number;
  date: Date;
};

/**
 * Given an expiry datetime, returns the reminder times that are still in the
 * future relative to `now`. Reminders whose moment has already passed are
 * dropped (e.g. the 7-day reminder for a coupon expiring in 3 days).
 *
 * Returns an empty array when there is no expiry, the expiry is unparseable,
 * or every reminder would be in the past.
 */
export function reminderTimes(expiryDate: string | null | undefined, now: Date): ReminderTime[] {
  if (!expiryDate) {
    return [];
  }

  const expiry = new Date(expiryDate).getTime();
  if (Number.isNaN(expiry)) {
    return [];
  }

  const nowMs = now.getTime();

  return REMINDER_DAYS_BEFORE.map((daysBefore) => ({
    daysBefore,
    date: new Date(expiry - daysBefore * DAY_MS),
  })).filter((reminder) => reminder.date.getTime() > nowMs);
}
