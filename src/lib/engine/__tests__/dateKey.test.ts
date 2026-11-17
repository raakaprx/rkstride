import { describe, it, expect } from 'vitest';
import {
  getLocalDateKey,
  addDaysToLocalDateKey,
  parseLocalDateKey,
  diffDaysBetweenDateKeys,
  diffHoursBetweenDateKeys,
  isFutureDateKey,
  getLocalDayIndex,
} from '../dateKey';

describe('dateKey - Local Device Date Utilities', () => {
  it('formats local date components without UTC midnight drift', () => {
    const earlyMorningLocal = new Date(2026, 10, 17, 0, 30, 0); // 00:30 local
    const lateNightLocal = new Date(2026, 10, 17, 23, 59, 59); // 23:59 local

    expect(getLocalDateKey(earlyMorningLocal)).toBe('2026-11-17');
    expect(getLocalDateKey(lateNightLocal)).toBe('2026-11-17');
  });

  it('adds and subtracts days accurately across month boundaries', () => {
    expect(addDaysToLocalDateKey('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysToLocalDateKey('2026-12-01', -1)).toBe('2026-11-30');
  });

  it('computes exact day and hour differences between date keys', () => {
    expect(diffDaysBetweenDateKeys('2026-11-14', '2026-11-17')).toBe(3);
    expect(diffHoursBetweenDateKeys('2026-11-15', '2026-11-17')).toBe(48);
    expect(diffHoursBetweenDateKeys('2026-11-17', '2026-11-15')).toBe(0);
  });

  it('detects future date keys relative to reference date', () => {
    const ref = new Date(2026, 10, 17, 9, 0, 0);
    expect(isFutureDateKey('2026-11-18', ref)).toBe(true);
    expect(isFutureDateKey('2026-11-17', ref)).toBe(false);
    expect(isFutureDateKey('2026-11-16', ref)).toBe(false);
  });

  it('throws on invalid date key formats', () => {
    expect(() => parseLocalDateKey('2026/11/17')).toThrow();
  });

  it('maps Monday=0 through Sunday=6 for local dayIndex', () => {
    // 2026-11-16 is Monday
    expect(getLocalDayIndex(new Date(2026, 10, 16, 10, 0, 0))).toBe(0);
    // 2026-11-22 is Sunday
    expect(getLocalDayIndex(new Date(2026, 10, 22, 10, 0, 0))).toBe(6);
  });
});
