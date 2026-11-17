/**
 * RKStride - Athlete Profile, Race Periodization, & Nutrition Preferences Contracts
 */
import { z } from 'zod';

export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;

export const HrMaxFormulaSchema = z.enum(['tanaka', 'gellish', 'custom']);
export type HrMaxFormula = z.infer<typeof HrMaxFormulaSchema>;

export const ExperienceLevelSchema = z.enum(['beginner', 'intermediate', 'expert']);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const AthleteAuthSessionSchema = z.object({
  athleteName: z.string(),
  email: z.string(),
  experienceLevel: ExperienceLevelSchema,
  loggedInAt: z.string(),
});
export type AthleteAuthSession = z.infer<typeof AthleteAuthSessionSchema>;

export const UserProfileSchema = z.object({
  id: z.string().optional(),
  athleteName: z.string().optional(),
  email: z.string().optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
  age: z.number().int().min(10).max(110),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  restingHrBaseline: z.number().positive(),
  maxHr: z.number().int().min(100).max(230).optional(),
  hrMaxFormula: HrMaxFormulaSchema.optional(),
  gender: GenderSchema.optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const RaceCategorySchema = z.enum([
  '5k',
  '10k',
  'half_marathon',
  'marathon',
  'hyrox',
  'none',
]);
export type RaceCategory = z.infer<typeof RaceCategorySchema>;

export const RaceTargetConfigSchema = z.object({
  id: z.string().optional(),
  eventName: z.string(),
  category: RaceCategorySchema,
  raceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetTimeMinutes: z.number().positive().optional(),
  priority: z.enum(['A', 'B', 'C']).optional(),
});
export type RaceTargetConfig = z.infer<typeof RaceTargetConfigSchema>;

export const PeriodizationPhaseSchema = z.enum([
  'base',
  'build',
  'peak',
  'taper',
  'race_week',
  'recovery',
]);
export type PeriodizationPhase = z.infer<typeof PeriodizationPhaseSchema>;

export const NutritionGoalSchema = z.enum(['maintenance', 'muscle_gain', 'fat_loss']);
export type NutritionGoal = z.infer<typeof NutritionGoalSchema>;

export const DailyActivityLevelSchema = z.enum([
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
]);
export type DailyActivityLevel = z.infer<typeof DailyActivityLevelSchema>;

export const NutritionPrefsSchema = z.object({
  goal: NutritionGoalSchema,
  activityLevel: DailyActivityLevelSchema,
});
export type NutritionPrefs = z.infer<typeof NutritionPrefsSchema>;
