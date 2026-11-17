/**
 * RKStride - Workout & Physiological Telemetry Zod Contracts (Single Source of Truth)
 */
import { z } from 'zod';

export const WorkoutCategorySchema = z.enum([
  'push',
  'pull',
  'legs',
  'arms',
  'core',
  'run_recovery',
  'run_easy',
  'run_tempo',
  'run_long',
  'run_intervals',
  'norwegian_4x4',
  'mobility_recovery',
]);
export type WorkoutCategory = z.infer<typeof WorkoutCategorySchema>;

export const HeartRateZoneSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type HeartRateZone = z.infer<typeof HeartRateZoneSchema>;

export const RunningTypeSchema = z.enum([
  'recovery',
  'easy',
  'tempo',
  'norwegian_4x4',
  'intervals',
  'long_run',
  'strides',
]);
export type RunningType = z.infer<typeof RunningTypeSchema>;

export const RunningIntervalBlockSchema = z.object({
  zone: HeartRateZoneSchema,
  durationMinutes: z.number().nonnegative(),
  description: z.string().optional(),
  targetBpmRange: z
    .object({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
    })
    .optional(),
});
export type RunningIntervalBlock = z.infer<typeof RunningIntervalBlockSchema>;

export const StrengthSetSchema = z.object({
  bebanKg: z.number().nonnegative({ message: 'Beban kg harus berupa angka non-negatif' }), // @legacy-alias
  reps: z.number().int().nonnegative({ message: 'Reps harus berupa bilangan bulat non-negatif' }),
  rpe: z.number().min(1).max(10, { message: 'RPE harus dalam rentang 1 - 10' }),
  isWarmup: z.boolean().optional(),
});
export type StrengthSet = z.infer<typeof StrengthSetSchema>;

export const StrengthExerciseSchema = z.object({
  namaGerakan: z.string().min(1, { message: 'Nama gerakan tidak boleh kosong' }), // @legacy-alias
  category: WorkoutCategorySchema.optional(),
  sets: z.array(StrengthSetSchema),
  durationMinutes: z.number().nonnegative().optional(),
  isLegExercise: z.boolean().optional(),
});
export type StrengthExercise = z.infer<typeof StrengthExerciseSchema>;

export const RunSessionSchema = z.object({
  jarakKm: z.number().nonnegative(), // @legacy-alias
  durasiMenit: z.number().nonnegative(), // @legacy-alias
  avgPace: z.number().nonnegative(),
  avgHeartRate: z.number().nonnegative(),
  runningType: RunningTypeSchema.optional(),
  blocks: z.array(RunningIntervalBlockSchema).optional(),
  rpe: z.number().min(1).max(10).optional(),
  sRpe: z.number().nonnegative().optional(),
  trimp: z.number().nonnegative().optional(),
  thresholdPace: z.number().positive().optional(),
  isOverridden: z.boolean().optional(),
});
export type RunSession = z.infer<typeof RunSessionSchema>;

export const WorkoutSessionEntrySchema = z.object({
  sessionId: z.string().min(1),
  loggedAt: z.string().min(1),
  strengthWorkouts: z.array(StrengthExerciseSchema),
  runningWorkouts: z.array(RunSessionSchema),
  sessionLoadScore: z.number().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  isOverridden: z.boolean().optional(),
});
export type WorkoutSessionEntry = z.infer<typeof WorkoutSessionEntrySchema>;

export const DailyLogSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' }), // @legacy-alias
  strengthWorkouts: z.array(StrengthExerciseSchema),
  runningWorkouts: z.array(RunSessionSchema),
  totalLoadScore: z.number().nonnegative({ message: 'Total load score harus non-negatif' }),
  volumeLoadSecondary: z.number().nonnegative().optional(),
  runningTrimpSecondary: z.number().nonnegative().optional(),
  sessions: z.array(WorkoutSessionEntrySchema).optional(),
});
export type DailyLog = z.infer<typeof DailyLogSchema>;

export const ReadinessCheckInSchema = z.object({
  sleepHours: z.number().min(0).max(24),
  muscleSoreness: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  legFatigue: z.boolean(),
  energyLevel: z.enum(['low', 'moderate', 'high']),
  restingHeartRate: z.number().min(30).max(220).optional(),
  hrvRmssd: z.number().min(5).max(300).optional(),
  tendonJointPain: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  tendonPainArea: z.string().optional(),
});
export type ReadinessCheckIn = z.infer<typeof ReadinessCheckInSchema>;

export const StoredReadinessLogSchema = ReadinessCheckInSchema.extend({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // @legacy-alias
});
export type StoredReadinessLog = z.infer<typeof StoredReadinessLogSchema>;

export const CanonicalACWRStatusSchema = z.enum([
  'insufficient_data',
  'undertraining',
  'sweet_spot',
  'danger',
]);
export type CanonicalACWRStatus = z.infer<typeof CanonicalACWRStatusSchema>;

/**
 * Legacy-compatible ACWR status schema ('warning' deprecated, removed after Sprint 4 UI cleanup).
 */
export const ACWRStatusSchema = z.enum([
  'insufficient_data',
  'undertraining',
  'sweet_spot',
  'warning',
  'danger',
]);
export type ACWRStatus = z.infer<typeof ACWRStatusSchema>;

export const ACWRMethodSchema = z.enum(['rolling_coupled', 'rolling_uncoupled', 'ewma']);
export type ACWRMethod = z.infer<typeof ACWRMethodSchema>;

export const StoredDebriefSchema = z.object({
  id: z.string().min(1),
  sessionLoad: z.number().nonnegative(),
  projectedACWR: z.number().nonnegative(),
  acwrStatus: ACWRStatusSchema,
  hasLegWorkout: z.boolean(),
  hasRunWorkout: z.boolean(),
  hasUpperWorkout: z.boolean(),
  totalDurationMin: z.number().nonnegative(),
});
export type StoredDebrief = z.infer<typeof StoredDebriefSchema>;
