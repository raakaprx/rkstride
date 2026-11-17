/**
 * RKStride - Local IndexedDB Storage via Dexie
 * Privacy-first: all user biometric data, logs, profile, and settings are stored locally on device.
 * Schema versions and migrations are explicitly declared.
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  DailyLog,
  StoredReadinessLog,
  StoredDebrief,
} from '@/contracts/workout.schema';
import type { UserProfile, RaceCategory } from '@/contracts/profile.schema';
import type { ScheduledDay } from '@/contracts/schedule.schema';
import { CURRENT_SCHEMA_VERSION } from '@/contracts/backup.schema';
import { defaultWeeklySchedule } from '@/data/defaultSchedule';
import {
  calculateEdwardsTrimp,
  calculateStrengthVolumeLoad,
} from '@/lib/engine/workload';

export const CURRENT_DB_VERSION = CURRENT_SCHEMA_VERSION;

export interface AppSettingItem {
  key: string;
  value: unknown;
  updatedAt: string;
}

export type { StoredReadinessLog, StoredDebrief };

/**
 * RKStride IndexedDB Database Class
 */
export class RKStrideDatabase extends Dexie {
  workoutLogs!: EntityTable<DailyLog, 'tanggal'>;
  dailyReadiness!: EntityTable<StoredReadinessLog, 'tanggal'>;
  userProfile!: EntityTable<UserProfile & { id: string }, 'id'>;
  weeklySchedule!: EntityTable<ScheduledDay, 'dayIndex'>;
  appSettings!: EntityTable<AppSettingItem, 'key'>;
  postWorkoutDebrief!: EntityTable<StoredDebrief, 'id'>;

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

    // Schema Version 2: adds postWorkoutDebrief table (Phase 5)
    this.version(2).stores({
      workoutLogs: 'tanggal, totalLoadScore',
      dailyReadiness: 'tanggal, sleepHours, restingHeartRate',
      userProfile: 'id',
      weeklySchedule: 'dayIndex, category',
      appSettings: 'key',
      postWorkoutDebrief: 'id',
    });

    // Schema Version 3: multi-session DailyLog.sessions[] + UserProfile.gender normalization
    this.version(3)
      .stores({
        workoutLogs: 'tanggal, totalLoadScore',
        dailyReadiness: 'tanggal, sleepHours, restingHeartRate',
        userProfile: 'id',
        weeklySchedule: 'dayIndex, category',
        appSettings: 'key',
        postWorkoutDebrief: 'id',
      })
      .upgrade(async (tx) => {
        // 1. Upgrade legacy single-entry DailyLogs into sessions[]
        await tx
          .table<DailyLog>('workoutLogs')
          .toCollection()
          .modify((log) => {
            const strengthWorkouts = log.strengthWorkouts ?? [];
            const runningWorkouts = log.runningWorkouts ?? [];
            if (!log.sessions || log.sessions.length === 0) {
              const strengthDur = strengthWorkouts.reduce(
                (sum, ex) => sum + (ex.durationMinutes ?? ex.sets.length * 2.5),
                0
              );
              const runDur = runningWorkouts.reduce((sum, r) => sum + r.durasiMenit, 0);
              const isOverridden = runningWorkouts.some((r) => r.isOverridden);
              log.sessions =
                strengthWorkouts.length > 0 || runningWorkouts.length > 0
                  ? [
                      {
                        sessionId: `legacy-${log.tanggal}`,
                        loggedAt: `${log.tanggal}T12:00:00`,
                        strengthWorkouts,
                        runningWorkouts,
                        sessionLoadScore: log.totalLoadScore ?? 0,
                        durationMinutes: Math.round(strengthDur + runDur),
                        ...(isOverridden ? { isOverridden: true } : {}),
                      },
                    ]
                  : [];
            }
            if (log.volumeLoadSecondary === undefined) {
              log.volumeLoadSecondary = calculateStrengthVolumeLoad(strengthWorkouts);
            }
            if (log.runningTrimpSecondary === undefined) {
              log.runningTrimpSecondary = Math.round(
                runningWorkouts.reduce((sum, r) => sum + calculateEdwardsTrimp(r), 0) * 10
              ) / 10;
            }
          });

        // 2. Normalize UserProfile: ensure gender & move stray targetRace* fields to appSettings
        const profileTable = tx.table<
          UserProfile & {
            id: string;
            targetRaceCategory?: RaceCategory;
            targetRaceDate?: string;
            targetRaceName?: string;
          }
        >('userProfile');
        const settingsTable = tx.table<AppSettingItem>('appSettings');
        const existingProfile = await profileTable.get('current_user');

        if (existingProfile) {
          const existingRaceSetting = await settingsTable.get('targetRaceConfig');
          if (
            !existingRaceSetting &&
            existingProfile.targetRaceCategory &&
            existingProfile.targetRaceDate
          ) {
            await settingsTable.put({
              key: 'targetRaceConfig',
              value: {
                eventName: existingProfile.targetRaceName || 'Target Race',
                category: existingProfile.targetRaceCategory,
                raceDate: existingProfile.targetRaceDate,
              },
              updatedAt: new Date().toISOString(),
            });
          }

          const {
            targetRaceCategory: _cat,
            targetRaceDate: _date,
            targetRaceName: _name,
            ...cleanProfile
          } = existingProfile;

          await profileTable.put({
            ...cleanProfile,
            gender: cleanProfile.gender ?? 'male',
          });
        }
      });
  }
}

export const db = new RKStrideDatabase();

/**
 * Seed initial baseline data if database is empty on first launch.
 * Phase 1 (kejujuran data): NO workout logs, NO readiness history,
 * NO smartwatch state are seeded. A fresh user starts empty so the
 * ACWR cold-start guard can fire and no fabricated numbers are shown.
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
        gender: 'male',
      });
    }

    const settingsCount = await db.appSettings.count();
    if (settingsCount === 0) {
      await db.appSettings.bulkAdd([
        { key: 'disclaimerAccepted', value: false, updatedAt: new Date().toISOString() },
      ]);
    }
  } catch (err) {
    console.error('Failed to initialize seed data in IndexedDB:', err);
  }
}
