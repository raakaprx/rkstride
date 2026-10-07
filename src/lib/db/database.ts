/**
 * RKStride - Local IndexedDB Storage via Dexie
 * Privacy-first: all user biometric data, logs, profile, and settings are stored locally on device.
 * Schema versions and migrations are explicitly declared.
 */

import Dexie, { type EntityTable } from 'dexie';
import { DailyLog, ReadinessCheckIn, UserProfile } from '@/types/workout';
import { ScheduledDay } from '@/types/schedule';
import { defaultWeeklySchedule } from '@/data/defaultSchedule';

export interface AppSettingItem {
  key: string;
  value: any;
  updatedAt: string;
}

export interface StoredReadinessLog extends ReadinessCheckIn {
  tanggal: string; // Primary key: YYYY-MM-DD
}

/**
 * RKStride IndexedDB Database Class
 */
export class RKStrideDatabase extends Dexie {
  workoutLogs!: EntityTable<DailyLog, 'tanggal'>;
  dailyReadiness!: EntityTable<StoredReadinessLog, 'tanggal'>;
  userProfile!: EntityTable<UserProfile & { id: string }, 'id'>;
  weeklySchedule!: EntityTable<ScheduledDay, 'dayIndex'>;
  appSettings!: EntityTable<AppSettingItem, 'key'>;

  constructor() {
    super('RKStrideDB');

    // Schema Version 1
    this.version(1).stores({
      workoutLogs: 'tanggal, totalLoadScore',
      dailyReadiness: 'tanggal, sleepHours, restingHeartRate',
      userProfile: 'id',
      weeklySchedule: 'dayIndex, category',
      appSettings: 'key',
    });
  }
}

export const db = new RKStrideDatabase();

/**
 * Seed initial baseline data if database is empty on first launch.
 * Phase 1 (kejujuran data): NO workout logs, NO readiness history,
 * NO smartwatch state are seeded. A fresh user starts empty so the
 * ACWR cold-start guard can fire and no fabricated numbers are shown.
 * Only the default weekly schedule template, a neutral athlete profile,
 * and default app settings are created.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const scheduleCount = await db.weeklySchedule.count();
    if (scheduleCount === 0) {
      await db.weeklySchedule.bulkAdd(defaultWeeklySchedule);
    }

    const profileCount = await db.userProfile.count();
    if (profileCount === 0) {
      await db.userProfile.add({
        id: 'current_user',
        age: 28,
        weightKg: 72,
        heightCm: 175,
        restingHrBaseline: 52,
        maxHr: 190,
        hrMaxFormula: 'tanaka',
      });
    }

    // Default privacy settings
    const settingsCount = await db.appSettings.count();
    if (settingsCount === 0) {
      await db.appSettings.bulkAdd([
        { key: 'sendTelemetryToAiCoach', value: true, updatedAt: new Date().toISOString() },
        { key: 'acwrMethod', value: 'rolling_coupled', updatedAt: new Date().toISOString() },
        { key: 'aiCoachMode', value: 'byok', updatedAt: new Date().toISOString() }, // 'byok' or 'proxy'
        { key: 'aiProxyUrl', value: '', updatedAt: new Date().toISOString() },
        { key: 'disclaimerAccepted', value: false, updatedAt: new Date().toISOString() },
      ]);
    }
  } catch (err) {
    console.error('Failed to initialize seed data in IndexedDB:', err);
  }
}
