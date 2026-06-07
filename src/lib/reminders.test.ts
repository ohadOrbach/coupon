import { reminderTimes } from './reminders';

const NOW = new Date('2026-06-07T12:00:00.000Z');

describe('reminderTimes', () => {
  it('returns no reminders when there is no expiry', () => {
    expect(reminderTimes(null, NOW)).toEqual([]);
    expect(reminderTimes(undefined, NOW)).toEqual([]);
  });

  it('schedules 7-days-before and 1-day-before reminders for a far-future expiry', () => {
    const expiry = '2026-07-01T09:00:00.000Z';
    const result = reminderTimes(expiry, NOW);
    expect(result.map((r) => r.daysBefore)).toEqual([7, 1]);
    expect(result[0].date.toISOString()).toBe('2026-06-24T09:00:00.000Z');
    expect(result[1].date.toISOString()).toBe('2026-06-30T09:00:00.000Z');
  });

  it('skips the 7-day reminder when it would already be in the past', () => {
    // Expiry is 3 days out, so the 7-day reminder is in the past, 1-day is future.
    const expiry = '2026-06-10T12:00:00.000Z';
    const result = reminderTimes(expiry, NOW);
    expect(result.map((r) => r.daysBefore)).toEqual([1]);
    expect(result[0].date.toISOString()).toBe('2026-06-09T12:00:00.000Z');
  });

  it('returns no reminders when expiry is already past', () => {
    expect(reminderTimes('2026-01-01T00:00:00.000Z', NOW)).toEqual([]);
  });

  it('returns no reminders when both reminder times are in the past but expiry is imminent', () => {
    // Expiry in 12 hours: both 7-day and 1-day reminders are already past.
    const expiry = '2026-06-08T00:00:00.000Z';
    expect(reminderTimes(expiry, NOW)).toEqual([]);
  });

  it('ignores unparseable dates', () => {
    expect(reminderTimes('not-a-date', NOW)).toEqual([]);
  });
});
