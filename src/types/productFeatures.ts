/**
 * RKStride - Types for Fase 3 Product Features
 * Includes:
 * 1. Competition Periodization & Dynamic Tapering
 * 2. Hybrid Athlete Nutrition & Energy Balance
 * 3. Double Progression & Resistance Training
 */

export type RaceCategory = '5k' | '10k' | 'half_marathon' | 'marathon' | 'hyrox' | 'none';

export interface RaceTargetConfig {
  id?: string;
  eventName: string;
  category: RaceCategory;
  raceDate: string; // YYYY-MM-DD
  targetTimeMinutes?: number;
  priority?: 'A' | 'B' | 'C';
}

export type PeriodizationPhase =
  | 'base'
  | 'build'
  | 'peak'
  | 'taper'
  | 'race_week'
  | 'recovery';

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

export type NutritionGoal = 'maintenance' | 'muscle_gain' | 'fat_loss';

export type DailyActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

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
