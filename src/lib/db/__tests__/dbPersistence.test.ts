import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, CURRENT_DB_VERSION, RKStrideDatabase } from '../database';
import {
  saveWorkoutSessionAtomic,
  deleteWorkoutSessionAtomic,
} from '../workoutRepo';
import {
  saveProfileAndRaceAtomic,
  loadProfileAndRace,
  saveNutritionPrefs,
  loadNutritionPrefs,
  saveAcwrMethod,
  loadAcwrMethod,
} from '../profileRepo';
import {
  RKStrideExportPayloadSchema,
  CURRENT_SCHEMA_VERSION,
} from '@/contracts/backup.schema';
import type { DailyLog, StoredDebrief } from '@/contracts/workout.schema';
import type { UserProfile } from '@/contracts/profile.schema';

describe('Database & Persistence Architecture (Dexie v3)', () => {
  it('declares CURRENT_DB_VERSION matching CURRENT_SCHEMA_VERSION (3)', () => {
    expect(CURRENT_DB_VERSION).toBe(3);
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
    expect(db.name).toBe('RKStrideDB');
  });

  it('declares valid stores across all Dexie schema migrations (v1, v2, v3)', () => {
    const testDb = new RKStrideDatabase();
    expect(testDb.tables.some((t) => t.name === 'workoutLogs')).toBe(true);
    expect(testDb.tables.some((t) => t.name === 'dailyReadiness')).toBe(true);
    expect(testDb.tables.some((t) => t.name === 'userProfile')).toBe(true);
    expect(testDb.tables.some((t) => t.name === 'weeklySchedule')).toBe(true);
    expect(testDb.tables.some((t) => t.name === 'appSettings')).toBe(true);
    expect(testDb.tables.some((t) => t.name === 'postWorkoutDebrief')).toBe(true);
  });

  describe('workoutRepo - atomic multi-session management', () => {
    let mockStore: Map<string, DailyLog>;
    let debriefStore: Map<string, StoredDebrief>;

    beforeEach(() => {
      mockStore = new Map();
      debriefStore = new Map();

      vi.spyOn(db, 'transaction').mockImplementation((async (...args: unknown[]) => {
        const fn = args[args.length - 1] as () => Promise<unknown>;
        return fn();
      }) as unknown as typeof db.transaction);

      vi.spyOn(db.workoutLogs, 'get').mockImplementation((async (key: unknown) => {
        return mockStore.get(String(key));
      }) as unknown as typeof db.workoutLogs.get);

      vi.spyOn(db.workoutLogs, 'put').mockImplementation((async (item: unknown) => {
        const dailyLog = item as DailyLog;
        mockStore.set(dailyLog.tanggal, dailyLog);
        return dailyLog.tanggal;
      }) as unknown as typeof db.workoutLogs.put);

      vi.spyOn(db.workoutLogs, 'delete').mockImplementation((async (key: unknown) => {
        mockStore.delete(String(key));
      }) as unknown as typeof db.workoutLogs.delete);

      vi.spyOn(db.postWorkoutDebrief, 'put').mockImplementation((async (item: unknown) => {
        const debrief = item as StoredDebrief;
        debriefStore.set(debrief.id, debrief);
        return debrief.id;
      }) as unknown as typeof db.postWorkoutDebrief.put);
    });

    it('saves a session with mode "replace_day" and creates a debrief', async () => {
      const result = await saveWorkoutSessionAtomic(
        {
          targetDate: '2026-11-17',
          mode: 'replace_day',
          sessionId: 'session-1',
          strengthExercises: [
            {
              namaGerakan: 'Barbell Bench Press',
              category: 'push',
              sets: [{ bebanKg: 80, reps: 8, rpe: 8 }],
            },
          ],
          runningSessions: [],
        },
        [],
        'rolling_coupled'
      );

      expect(result.dailyLog.tanggal).toBe('2026-11-17');
      expect(result.dailyLog.sessions).toHaveLength(1);
      expect(result.dailyLog.sessions?.[0].sessionId).toBe('session-1');
      expect(result.dailyLog.totalLoadScore).toBeGreaterThan(0);
      expect(result.debrief.id).toBe('latest');
      expect(result.debrief.hasUpperWorkout).toBe(true);
      expect(result.debrief.hasLegWorkout).toBe(false);
    });

    it('appends a second session to the same day and recalculates total load', async () => {
      // First session: Strength Push
      await saveWorkoutSessionAtomic(
        {
          targetDate: '2026-11-17',
          mode: 'replace_day',
          sessionId: 'session-am',
          strengthExercises: [
            {
              namaGerakan: 'Incline Dumbbell Press',
              category: 'push',
              sets: [{ bebanKg: 30, reps: 10, rpe: 8 }],
            },
          ],
          runningSessions: [],
        },
        [],
        'rolling_coupled'
      );

      // Second session: Evening Run (append mode)
      const appendResult = await saveWorkoutSessionAtomic(
        {
          targetDate: '2026-11-17',
          mode: 'append',
          sessionId: 'session-pm',
          strengthExercises: [],
          runningSessions: [
            {
              jarakKm: 5,
              durasiMenit: 30,
              avgPace: 6.0,
              avgHeartRate: 140,
              runningType: 'easy',
            },
          ],
        },
        [],
        'rolling_coupled'
      );

      expect(appendResult.dailyLog.sessions).toHaveLength(2);
      expect(appendResult.dailyLog.strengthWorkouts).toHaveLength(1);
      expect(appendResult.dailyLog.runningWorkouts).toHaveLength(1);
      expect(appendResult.debrief.hasRunWorkout).toBe(true);
      expect(appendResult.debrief.hasUpperWorkout).toBe(false);
    });

    it('deletes a single session and leaves remaining session on that date', async () => {
      // Seed day with two sessions
      mockStore.set('2026-11-17', {
        tanggal: '2026-11-17',
        sessions: [
          {
            sessionId: 'sess-1',
            loggedAt: '2026-11-17T08:00:00Z',
            strengthWorkouts: [{ namaGerakan: 'Squat', category: 'legs', sets: [{ bebanKg: 100, reps: 5, rpe: 8 }] }],
            runningWorkouts: [],
            sessionLoadScore: 150,
            durationMinutes: 45,
          },
          {
            sessionId: 'sess-2',
            loggedAt: '2026-11-17T17:00:00Z',
            strengthWorkouts: [],
            runningWorkouts: [{ jarakKm: 4, durasiMenit: 25, avgPace: 6.25, avgHeartRate: 135, runningType: 'recovery' }],
            sessionLoadScore: 80,
            durationMinutes: 25,
          },
        ],
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 230,
      });

      const updated = await deleteWorkoutSessionAtomic('2026-11-17', 'sess-1');
      expect(updated).not.toBeNull();
      expect(updated?.sessions).toHaveLength(1);
      expect(updated?.sessions?.[0].sessionId).toBe('sess-2');
    });

    it('removes date record completely when the last remaining session is deleted', async () => {
      mockStore.set('2026-11-17', {
        tanggal: '2026-11-17',
        sessions: [
          {
            sessionId: 'sess-only',
            loggedAt: '2026-11-17T08:00:00Z',
            strengthWorkouts: [],
            runningWorkouts: [],
            sessionLoadScore: 50,
            durationMinutes: 20,
          },
        ],
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 50,
      });

      const updated = await deleteWorkoutSessionAtomic('2026-11-17', 'sess-only');
      expect(updated).toBeNull();
      expect(mockStore.has('2026-11-17')).toBe(false);
    });
  });

  describe('profileRepo - atomic profile, race, and settings persistence', () => {
    let profileStore: Map<string, unknown>;
    let settingsStore: Map<string, unknown>;

    beforeEach(() => {
      profileStore = new Map();
      settingsStore = new Map();

      vi.spyOn(db, 'transaction').mockImplementation((async (...args: unknown[]) => {
        const fn = args[args.length - 1] as () => Promise<unknown>;
        return fn();
      }) as unknown as typeof db.transaction);

      vi.spyOn(db.userProfile, 'get').mockImplementation((async (key: unknown) => {
        return profileStore.get(String(key));
      }) as unknown as typeof db.userProfile.get);

      vi.spyOn(db.userProfile, 'put').mockImplementation((async (item: unknown) => {
        const profile = item as { id: string };
        profileStore.set(profile.id, profile);
        return profile.id;
      }) as unknown as typeof db.userProfile.put);

      vi.spyOn(db.appSettings, 'get').mockImplementation((async (key: unknown) => {
        return settingsStore.get(String(key));
      }) as unknown as typeof db.appSettings.get);

      vi.spyOn(db.appSettings, 'put').mockImplementation((async (item: unknown) => {
        const setting = item as { key: string };
        settingsStore.set(setting.key, setting);
        return setting.key;
      }) as unknown as typeof db.appSettings.put);
    });

    it('saves athlete profile and target race atomically via saveProfileAndRaceAtomic', async () => {
      const profile: UserProfile = {
        age: 30,
        weightKg: 75,
        heightCm: 180,
        restingHrBaseline: 50,
        maxHr: 192,
        hrMaxFormula: 'tanaka',
        gender: 'male',
      };

      const result = await saveProfileAndRaceAtomic({
        profile,
        raceConfig: {
          eventName: 'Jakarta Marathon',
          category: 'marathon',
          raceDate: '2026-12-15',
        },
      });

      expect(result.profile.age).toBe(30);
      expect(result.raceConfig?.eventName).toBe('Jakarta Marathon');
      expect(profileStore.get('current_user')).toBeDefined();
      expect(settingsStore.get('targetRaceConfig')).toBeDefined();
    });

    it('loads stored profile and race config cleanly', async () => {
      profileStore.set('current_user', {
        id: 'current_user',
        age: 26,
        weightKg: 68,
        heightCm: 172,
        restingHrBaseline: 54,
        maxHr: 195,
        hrMaxFormula: 'gellish',
        gender: 'female',
      });

      settingsStore.set('targetRaceConfig', {
        key: 'targetRaceConfig',
        value: {
          eventName: 'Bali 10K',
          category: '10k',
          raceDate: '2026-11-30',
        },
      });

      const loaded = await loadProfileAndRace();
      expect(loaded.profile?.gender).toBe('female');
      expect(loaded.raceConfig?.category).toBe('10k');
    });

    it('persists and retrieves nutrition preferences and ACWR method', async () => {
      await saveNutritionPrefs({ goal: 'fat_loss', activityLevel: 'very_active' });
      expect(settingsStore.get('nutritionPrefs')).toBeDefined();
      const prefs = await loadNutritionPrefs();
      expect(prefs?.goal).toBe('fat_loss');

      await saveAcwrMethod('ewma');
      expect(settingsStore.get('acwrMethod')).toBeDefined();
      const method = await loadAcwrMethod();
      expect(method).toBe('ewma');
    });
  });

  describe('Backup payload safety (Zod Schema & sanitization)', () => {
    it('enforces backup payload schema and validates sanitization', () => {
      const validPayload = {
        format: 'RKStride_Backup',
        version: 3,
        exportedAt: new Date().toISOString(),
        workoutLogs: [],
        dailyReadiness: [],
        weeklySchedule: [],
        postWorkoutDebrief: null,
      };

      const parsed = RKStrideExportPayloadSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);

      // Ensures format must be literal 'RKStride_Backup'
      const invalidFormat = { ...validPayload, format: 'Other_Backup' };
      expect(RKStrideExportPayloadSchema.safeParse(invalidFormat).success).toBe(false);
    });
  });
});
