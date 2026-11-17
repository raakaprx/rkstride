/**
 * RKStride - Daily Bio-Readiness Repository
 * Single gateway for dailyReadiness IndexedDB operations.
 */
import { db, type StoredReadinessLog } from './database';
import type { ReadinessCheckIn } from '@/contracts/workout.schema';

export async function getReadinessByDate(
  dateKey: string
): Promise<StoredReadinessLog | undefined> {
  return db.dailyReadiness.get(dateKey);
}

/**
 * Retrieve up to `limitDays` most recent readiness logs (sorted newest first).
 * Optionally excludes `excludeDateKey` (e.g. today) when computing personal baseline stats.
 */
export async function getRecentReadinessHistory(
  limitDays = 28,
  excludeDateKey?: string
): Promise<StoredReadinessLog[]> {
  const all = await db.dailyReadiness.toArray();
  return all
    .filter((entry) => !excludeDateKey || entry.tanggal !== excludeDateKey)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, limitDays);
}

export async function saveDailyReadiness(
  dateKey: string,
  entry: ReadinessCheckIn
): Promise<StoredReadinessLog> {
  const record: StoredReadinessLog = {
    ...entry,
    tanggal: dateKey,
  };
  await db.dailyReadiness.put(record);
  return record;
}
