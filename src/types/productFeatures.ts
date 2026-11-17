/**
 * RKStride - Types for Product Features
 * Domain contracts re-exported from @/contracts/profile.schema
 */

export type {
  RaceCategory,
  RaceTargetConfig,
  PeriodizationPhase,
  NutritionGoal,
  DailyActivityLevel,
  NutritionPrefs,
} from '@/contracts/profile.schema';

import type { NutritionGoal, PeriodizationPhase } from '@/contracts/profile.schema';

export interface PeriodizationPlan {
  currentPhase: PeriodizationPhase;
  phaseName: string;
  daysToRace: number;
  weeksToRace: number;
  isTaperActive: boolean;
  volumeAdjustmentPercent: number; // e.g. -30 to -50% during taper
  intensityGuideline: string;
  strengthGuideline: string;
  advice: string;
}

export interface AthleteNutritionPlan {
  bmr: number;
  tdee: number;
  targetCalories: number;
  goal: NutritionGoal;
  proteinGrams: number;
  proteinCalories: number;
  carbsGrams: number;
  carbsCalories: number;
  fatsGrams: number;
  fatsCalories: number;
  hydrationLiters: number;
  proteinPerKg: number;
  carbsPerKg: number;
}

export interface DoubleProgressionEvaluation {
  shouldIncreaseWeight: boolean;
  currentWeightKg: number;
  suggestedWeightKg: number;
  suggestedRepRange: string;
  isTargetAchieved: boolean;
  message: string;
  nextSessionGoal: string;
}
