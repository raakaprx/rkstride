/**
 * RKStride - Local Device Date Key Utilities
 * Prevents UTC midnight drift (e.g., 00:00-06:59 WIB / UTC+7) by always
 * formatting and comparing YYYY-MM-DD keys in the device's local timezone.
 */

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Format a Date instance into a local YYYY-MM-DD string.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return a local YYYY-MM-DD key offset by a number of days from referenceDate.
 */
export function addDaysToLocalDateKey(dateKey: string, deltaDays: number): string {
  const base = parseLocalDateKey(dateKey);
  base.setDate(base.getDate() + deltaDays);
  return getLocalDateKey(base);
}

/**
 * Parse a YYYY-MM-DD key into a local Date anchored at 12:00:00 local time
 * to avoid DST or UTC boundary shifts during day arithmetic.
 */
export function parseLocalDateKey(dateKey: string): Date {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid local date key "${dateKey}". Expected YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return new Date(year, month, day, 12, 0, 0, 0);
}

/**
 * Signed whole-day difference (newerKey - olderKey) in local calendar days.
 */
export function diffDaysBetweenDateKeys(olderKey: string, newerKey: string): number {
  const older = parseLocalDateKey(olderKey);
  const newer = parseLocalDateKey(newerKey);
  const utcOlder = Date.UTC(older.getFullYear(), older.getMonth(), older.getDate());
  const utcNewer = Date.UTC(newer.getFullYear(), newer.getMonth(), newer.getDate());
  return Math.round((utcNewer - utcOlder) / MS_PER_DAY);
}

/**
 * Non-negative hour difference between two YYYY-MM-DD keys (24h per calendar day).
 */
export function diffHoursBetweenDateKeys(olderKey: string, newerKey: string): number {
  const days = diffDaysBetweenDateKeys(olderKey, newerKey);
  return Math.max(0, days * 24);
}

/**
 * Check whether a YYYY-MM-DD key is strictly in the future relative to referenceDate.
 */
export function isFutureDateKey(dateKey: string, referenceDate: Date = new Date()): boolean {
  const todayKey = getLocalDateKey(referenceDate);
  return diffDaysBetweenDateKeys(todayKey, dateKey) > 0;
}

/**
 * Return Monday=0 .. Sunday=6 dayIndex for a given Date in local time.
 */
export function getLocalDayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}
