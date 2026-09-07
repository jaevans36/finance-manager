/**
 * Date helpers. All "today" boundaries are computed in the host's local timezone —
 * life-api stores UTC but the useful notion of "due today" is the user's local day.
 */

/** YYYY-MM-DD for the given date (local). */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local start-of-day (00:00:00.000). */
export function startOfDay(d: Date = new Date()): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

/** Local end-of-day (23:59:59.999). */
export function endOfDay(d: Date = new Date()): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export function plusDays(d: Date, days: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
}

/** Whole days `later` is after `earlier` (by local calendar day, floored, never negative). */
export function daysBetween(earlier: Date, later: Date): number {
  const a = startOfDay(earlier).getTime();
  const b = startOfDay(later).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * A sentence embedding today's date, for appending to tool descriptions so the LLM
 * anchors relative dates correctly.
 */
export function todayHint(now: Date = new Date()): string {
  return `Today is ${isoDate(now)}. Provide dates as ISO 8601 (e.g. ${isoDate(now)} or ${isoDate(now)}T09:00:00).`;
}
