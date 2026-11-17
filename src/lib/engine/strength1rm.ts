/**
 * RKStride - 1RM Estimations, Personal Records & Weekly Productive Muscle Volume
 */
import type {
  DailyLog,
  OneRepMaxEstimate,
  StrengthSet,
  WeeklyMuscleVolume,
  WorkoutCategory,
} from '@/types/workout';
import { HARD_SET_MIN_RPE, SRPE_CONFIG } from './constants';
import { calculateSessionRpe } from './loadMetrics';

/**
 * 1RM Estimation via Epley (1985) and Brzycki (1993) formulas.
 */
export function estimate1RM(weightKg: number, reps: number): OneRepMaxEstimate {
  if (weightKg <= 0 || reps <= 0) {
    return { epley: 0, brzycki: 0, average: 0 };
  }

  if (reps === 1) {
    return { epley: weightKg, brzycki: weightKg, average: weightKg };
  }

  const epley = Math.max(weightKg, Math.round(weightKg * (1 + reps / 30) * 10) / 10);
  const brzycki =
    reps < 37
      ? Math.max(weightKg, Math.round(weightKg * (36 / (37 - reps)) * 10) / 10)
      : epley;
  const average = Math.max(weightKg, Math.round(((epley + brzycki) / 2) * 10) / 10);

  return { epley, brzycki, average };
}

/**
 * Detect Personal Record (PR) for an exercise compared against historical logs.
 */
export function detectPersonalRecord(
  exerciseName: string,
  newSets: StrengthSet[],
  history: DailyLog[]
): { isPR: boolean; previousBest1RM: number; newEstimated1RM: number } {
  let newBest = 0;
  for (const s of newSets) {
    const est = estimate1RM(s.bebanKg, s.reps).average;
    if (est > newBest) newBest = est;
  }

  let historicalBest = 0;
  for (const log of history) {
    for (const ex of log.strengthWorkouts) {
      if (ex.namaGerakan.toLowerCase() === exerciseName.toLowerCase()) {
        for (const s of ex.sets) {
          const est = estimate1RM(s.bebanKg, s.reps).average;
          if (est > historicalBest) historicalBest = est;
        }
      }
    }
  }

  const isPR = newBest > historicalBest && historicalBest > 0;
  return {
    isPR,
    previousBest1RM: historicalBest,
    newEstimated1RM: newBest,
  };
}

/**
 * Summarize weekly productive volume per muscle category (hard sets RPE >= 7.0, volume, sRPE).
 */
export function calculateWeeklyMuscleVolume(
  history7Days: DailyLog[]
): Record<string, WeeklyMuscleVolume> {
  const result: Record<string, WeeklyMuscleVolume> = {
    push: { category: 'push', hardSets: 0, totalVolumeKg: 0, sRpeTotal: 0 },
    pull: { category: 'pull', hardSets: 0, totalVolumeKg: 0, sRpeTotal: 0 },
    legs: { category: 'legs', hardSets: 0, totalVolumeKg: 0, sRpeTotal: 0 },
    arms: { category: 'arms', hardSets: 0, totalVolumeKg: 0, sRpeTotal: 0 },
    core: { category: 'core', hardSets: 0, totalVolumeKg: 0, sRpeTotal: 0 },
  };

  for (const log of history7Days) {
    for (const ex of log.strengthWorkouts) {
      const cat =
        ex.category ||
        (/bench|press|dip|push/i.test(ex.namaGerakan)
          ? 'push'
          : /pull|row|chin|deadlift/i.test(ex.namaGerakan)
          ? 'pull'
          : /squat|lunge|leg|calf|quad/i.test(ex.namaGerakan)
          ? 'legs'
          : /curl|tricep|bicep/i.test(ex.namaGerakan)
          ? 'arms'
          : 'core');

      if (!result[cat]) {
        result[cat] = {
          category: cat as WorkoutCategory,
          hardSets: 0,
          totalVolumeKg: 0,
          sRpeTotal: 0,
        };
      }

      for (const set of ex.sets) {
        if (set.rpe >= HARD_SET_MIN_RPE) {
          result[cat].hardSets++;
        }
        result[cat].totalVolumeKg += Math.round(set.bebanKg * set.reps);
        result[cat].sRpeTotal += calculateSessionRpe(
          SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET,
          set.rpe
        );
      }
    }
  }

  return result;
}
