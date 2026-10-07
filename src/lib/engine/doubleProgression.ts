/**
 * RKStride - Double Progression Engine (Resistance Training)
 * Pure, deterministic logic for safe progressive overload in hybrid athletes.
 *
 * Literature Citations:
 * 1. Helms, E. R., et al. (2016). Application of the repetitions in reserve-based rating of
 *    perceived exertion scale for resistance training. Strength & Conditioning Journal, 38(4), 42-49.
 * 2. Schoenfeld, B. J., et al. (2021). Loading recommendations for muscle strength, hypertrophy,
 *    and local muscular endurance: A re-examination. Sports, 9(3), 32.
 */

import { DOUBLE_PROGRESSION_CONSTANTS } from './constants';
import { StrengthSet } from '@/types/workout';
import { DoubleProgressionEvaluation } from '@/types/productFeatures';

/**
 * Determine if an exercise is lower body based on name or category
 */
export function isLowerBodyExercise(namaGerakan: string, category?: string): boolean {
  if (category === 'legs') return true;
  return /squat|deadlift|leg|calf|quad|hamstring|lunge|hip thrust|press leg/i.test(namaGerakan);
}

/**
 * Evaluate sets against target rep range for double progression recommendation
 * @param namaGerakan - Name of exercise
 * @param workingSets - Non-warmup sets performed
 * @param targetMinReps - Lower bound of rep range (e.g. 6 or 8)
 * @param targetMaxReps - Upper bound of rep range (e.g. 8, 10, or 12)
 * @param category - Optional category ('push' | 'pull' | 'legs')
 */
export function evaluateDoubleProgression(
  namaGerakan: string,
  workingSets: Pick<StrengthSet, 'bebanKg' | 'reps' | 'rpe' | 'isWarmup'>[],
  targetMinReps: number = 8,
  targetMaxReps: number = 10,
  category?: string
): DoubleProgressionEvaluation {
  // Filter out warmup sets
  const validSets = workingSets.filter((s) => !s.isWarmup && s.reps > 0);

  if (validSets.length === 0) {
    return {
      shouldIncreaseWeight: false,
      currentWeightKg: 0,
      suggestedWeightKg: 0,
      suggestedRepRange: `${targetMinReps}-${targetMaxReps}`,
      isTargetAchieved: false,
      message: 'Belum ada set kerja yang dicatat.',
      nextSessionGoal: `Lakukan ${targetMinReps}-${targetMaxReps} repetisi per set.`,
    };
  }

  // Current working weight is determined from the first working set
  const currentWeightKg = validSets[0].bebanKg;
  const isLower = isLowerBodyExercise(namaGerakan, category);
  const incrementKg = isLower
    ? DOUBLE_PROGRESSION_CONSTANTS.LOWER_BODY_WEIGHT_INCREMENT_KG
    : DOUBLE_PROGRESSION_CONSTANTS.UPPER_BODY_WEIGHT_INCREMENT_KG;

  // Criteria for weight progression:
  // 1. Every working set achieves or exceeds targetMaxReps
  // 2. Average RPE across working sets is <= 8.0 (at least 2 Reps in Reserve)
  const allHitMaxReps = validSets.every((s) => s.reps >= targetMaxReps);
  const avgRpe = validSets.reduce((sum, s) => sum + (s.rpe || 8), 0) / validSets.length;
  const safeEffort = avgRpe <= DOUBLE_PROGRESSION_CONSTANTS.MAX_TRIGGER_RPE;

  const shouldIncreaseWeight = allHitMaxReps && safeEffort;

  if (shouldIncreaseWeight) {
    const suggestedWeightKg = Math.round((currentWeightKg + incrementKg) * 10) / 10;
    return {
      shouldIncreaseWeight: true,
      currentWeightKg,
      suggestedWeightKg,
      suggestedRepRange: `${targetMinReps}-${targetMaxReps}`,
      isTargetAchieved: true,
      message: `TARGET TERCAPAI: Seluruh set memenuhi batas atas ${targetMaxReps} reps dengan cadangan tenaga aman (RPE ${Math.round(avgRpe * 10) / 10}).`,
      nextSessionGoal: `Tingkatkan beban menjadi ${suggestedWeightKg} kg (+${incrementKg} kg) dan mulai kembali dari ${targetMinReps} repetisi.`,
    };
  }

  // Not yet ready for weight jump: suggest adding reps
  const setsHittingMax = validSets.filter((s) => s.reps >= targetMaxReps).length;
  return {
    shouldIncreaseWeight: false,
    currentWeightKg,
    suggestedWeightKg: currentWeightKg,
    suggestedRepRange: `${targetMinReps}-${targetMaxReps}`,
    isTargetAchieved: false,
    message: `Pertahankan beban ${currentWeightKg} kg. ${setsHittingMax}/${validSets.length} set mencapai target ${targetMaxReps} reps.`,
    nextSessionGoal: `Target sesi berikutnya: Tambah 1-2 repetisi pada set yang belum mencapai ${targetMaxReps} reps sebelum menaikkan beban.`,
  };
}
