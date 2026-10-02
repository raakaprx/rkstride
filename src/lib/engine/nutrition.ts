/**
 * RKStride - Hybrid Athlete Nutrition & Energy Balance Engine
 * Pure, deterministic sports nutrition calculations based on exercise physiology literature.
 *
 * Literature Citations:
 * 1. Mifflin, M. D., et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals.
 *    The American Journal of Clinical Nutrition, 51(2), 241-247.
 * 2. Morton, R. W., et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein
 *    supplementation on resistance training-induced gains in muscle mass and strength. BJSM, 52(6), 376-384.
 * 3. Burke, L. M., et al. (2011). Carbohydrates for training and competition. Journal of Sports Sciences, 29(sup1), S17-S27.
 * 4. Sawka, M. N., et al. (2007). ACSM Position Stand: Exercise and fluid replacement. MSSE, 39(2), 377-390.
 */

import { NUTRITION_CONSTANTS } from './constants';
import { UserProfile } from '@/types/workout';
import { AthleteNutritionPlan, NutritionGoal, DailyActivityLevel } from '@/types/productFeatures';

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor formula
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' = 'male'
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 1600;

  // Mifflin-St Jeor Equation:
  // Male: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
  // Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'female' ? base - 161 : base + 5;
  return Math.round(bmr);
}

/**
 * Activity Multipliers for Total Daily Energy Expenditure (TDEE)
 */
const ACTIVITY_MULTIPLIERS: Record<DailyActivityLevel, number> = {
  sedentary: 1.2, // Desk job, little moving
  lightly_active: 1.375, // Light daily walking
  moderately_active: 1.55, // Moderate daily non-exercise activity
  very_active: 1.725, // Active physical job or heavy daily movement
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * Includes baseline NEAT + deliberate workout energy expenditure
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: DailyActivityLevel = 'lightly_active',
  workoutCaloriesBurned: number = 0
): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  const baseTdee = bmr * multiplier;
  return Math.round(baseTdee + Math.max(0, workoutCaloriesBurned));
}

/**
 * Calculate complete nutritional targets tailored for hybrid athletes
 */
export function calculateAthleteNutritionPlan(
  profile: Pick<UserProfile, 'weightKg' | 'heightCm' | 'age'> & { gender?: 'male' | 'female' },
  goal: NutritionGoal = 'maintenance',
  activityLevel: DailyActivityLevel = 'lightly_active',
  workoutMinutesToday: number = 0,
  workoutCaloriesBurned: number = 0
): AthleteNutritionPlan {
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, profile.age, profile.gender || 'male');
  const tdee = calculateTDEE(bmr, activityLevel, workoutCaloriesBurned);

  // Calorie adjustments based on athlete goal
  let targetCalories = tdee;
  if (goal === 'muscle_gain') {
    targetCalories = Math.round(tdee + 300); // Mild lean surplus
  } else if (goal === 'fat_loss') {
    targetCalories = Math.round(tdee - 400); // Sustainable deficit protecting lean mass
  }

  // 1. Protein Target: Morton et al. (2018) recommends 1.6 - 2.2 g/kg
  let proteinPerKg: number = NUTRITION_CONSTANTS.PROTEIN_G_PER_KG.HYPERTROPHY_ENDURANCE; // 2.0 g/kg default
  if (goal === 'fat_loss') {
    proteinPerKg = NUTRITION_CONSTANTS.PROTEIN_G_PER_KG.HYPO_CALORIC_CUTTING; // 2.2 g/kg during deficit
  } else if (goal === 'maintenance') {
    proteinPerKg = NUTRITION_CONSTANTS.PROTEIN_G_PER_KG.MAINTENANCE; // 1.6 g/kg
  }
  const proteinGrams = Math.round(profile.weightKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // 2. Fat Target: 20-30% of total calories (0.8 - 1.0 g/kg minimum for hormonal health)
  const fatsCalories = Math.round(targetCalories * NUTRITION_CONSTANTS.FAT_CALORIE_PERCENT.DEFAULT);
  const fatsGrams = Math.round(fatsCalories / 9);

  // 3. Carbohydrate Target: Remaining calories allocated to fuel glycogen
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - (proteinCalories + fatsCalories));
  const carbsGrams = Math.round(remainingCaloriesForCarbs / 4);
  const carbsCalories = carbsGrams * 4;
  const carbsPerKg = Math.round((carbsGrams / profile.weightKg) * 10) / 10;

  // 4. Hydration: Baseline 35ml/kg + 12ml per min of workout (Sawka et al., 2007)
  const hydrationLiters = calculateDailyHydrationTarget(profile.weightKg, workoutMinutesToday);

  return {
    bmr,
    tdee,
    targetCalories,
    goal,
    proteinGrams,
    proteinCalories,
    carbsGrams,
    carbsCalories,
    fatsGrams,
    fatsCalories,
    hydrationLiters,
    proteinPerKg,
    carbsPerKg,
  };
}

/**
 * Calculate daily hydration requirement in Liters
 */
export function calculateDailyHydrationTarget(
  weightKg: number,
  workoutMinutes: number = 0
): number {
  if (weightKg <= 0) return 2.5;
  const baseMl = weightKg * NUTRITION_CONSTANTS.BASELINE_WATER_ML_PER_KG;
  const workoutMl = workoutMinutes * NUTRITION_CONSTANTS.EXERCISE_WATER_ML_PER_MINUTE;
  const totalLiters = (baseMl + workoutMl) / 1000;
  return Math.round(totalLiters * 10) / 10;
}
