import { describe, it, expect } from 'vitest';
import {
  CanonicalACWRStatusSchema,
  DailyLogSchema,
  StrengthExerciseSchema,
  RunSessionSchema,
} from '../workout.schema';
import {
  UserProfileSchema,
  NutritionPrefsSchema,
  RaceTargetConfigSchema,
} from '../profile.schema';
import {
  CURRENT_SCHEMA_VERSION,
  RKStrideExportPayloadSchema,
} from '../backup.schema';

describe('Zod Contracts (Single Source of Truth)', () => {
  it('CanonicalACWRStatusSchema accepts canonical statuses and rejects legacy warning', () => {
    expect(CanonicalACWRStatusSchema.safeParse('insufficient_data').success).toBe(true);
    expect(CanonicalACWRStatusSchema.safeParse('undertraining').success).toBe(true);
    expect(CanonicalACWRStatusSchema.safeParse('sweet_spot').success).toBe(true);
    expect(CanonicalACWRStatusSchema.safeParse('danger').success).toBe(true);
    expect(CanonicalACWRStatusSchema.safeParse('warning').success).toBe(false);
  });

  it('DailyLogSchema validates YYYY-MM-DD date and non-negative load', () => {
    const validLog = {
      tanggal: '2026-11-17',
      strengthWorkouts: [],
      runningWorkouts: [],
      totalLoadScore: 120,
    };
    expect(DailyLogSchema.safeParse(validLog).success).toBe(true);
    expect(DailyLogSchema.safeParse({ ...validLog, tanggal: '17-11-2026' }).success).toBe(false);
    expect(DailyLogSchema.safeParse({ ...validLog, totalLoadScore: -5 }).success).toBe(false);
  });

  it('StrengthExerciseSchema and RunSessionSchema enforce numeric bounds', () => {
    expect(
      StrengthExerciseSchema.safeParse({
        namaGerakan: 'Barbell Squat',
        category: 'legs',
        sets: [{ bebanKg: 100, reps: 5, rpe: 8 }],
      }).success
    ).toBe(true);

    expect(
      RunSessionSchema.safeParse({
        jarakKm: 10,
        durasiMenit: 50,
        avgPace: 5.0,
        avgHeartRate: 152,
        runningType: 'easy',
      }).success
    ).toBe(true);
  });

  it('UserProfileSchema, NutritionPrefsSchema, and RaceTargetConfigSchema validate cleanly', () => {
    expect(
      UserProfileSchema.safeParse({
        age: 28,
        weightKg: 72,
        heightCm: 175,
        restingHrBaseline: 52,
        maxHr: 190,
        hrMaxFormula: 'tanaka',
        gender: 'male',
      }).success
    ).toBe(true);

    expect(
      NutritionPrefsSchema.safeParse({
        goal: 'maintenance',
        activityLevel: 'moderately_active',
      }).success
    ).toBe(true);

    expect(
      RaceTargetConfigSchema.safeParse({
        eventName: 'Half Marathon',
        category: 'half_marathon',
        raceDate: '2026-12-20',
      }).success
    ).toBe(true);
  });

  it('RKStrideExportPayloadSchema enforces schema version <= CURRENT_SCHEMA_VERSION (3)', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
    const payload = {
      format: 'RKStride_Backup',
      version: 3,
      exportedAt: '2026-11-17T00:00:00.000Z',
      workoutLogs: [],
      postWorkoutDebrief: null,
    };
    expect(RKStrideExportPayloadSchema.safeParse(payload).success).toBe(true);
    expect(RKStrideExportPayloadSchema.safeParse({ ...payload, version: 4 }).success).toBe(false);
  });
});
