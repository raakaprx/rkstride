/**
 * RKStride - Universal Workload Quantification (Foster sRPE, Volume Load, Edwards TRIMP)
 */
import type { HeartRateZone, RunSession, StrengthExercise } from '@/types/workout';
import { EDWARDS_ZONE_WEIGHTS, SRPE_CONFIG } from './constants';
import { getHeartRateZoneFromBpm } from './hrZones';

/**
 * Universal Foster Session RPE (sRPE): durationMinutes * rpe (scale 1-10).
 */
export function calculateSessionRpe(durationMinutes: number, rpe: number): number {
  const clampedRpe = Math.min(Math.max(rpe, SRPE_CONFIG.MIN_RPE), SRPE_CONFIG.MAX_RPE);
  const safeDuration = Math.max(0, durationMinutes);
  return Math.round(safeDuration * clampedRpe);
}

/**
 * Secondary Metric for Resistance Training: Volume Load (kg x repetitions).
 */
export function calculateStrengthVolumeLoad(exercises: StrengthExercise[]): number {
  if (!exercises || exercises.length === 0) return 0;
  let totalVolume = 0;
  for (const ex of exercises) {
    if (!ex.sets) continue;
    for (const set of ex.sets) {
      if (set.isWarmup) continue;
      totalVolume += Math.max(0, set.bebanKg) * Math.max(0, set.reps);
    }
  }
  return Math.round(totalVolume);
}

/**
 * Primary Metric for Resistance Training: Universal sRPE Workload.
 * Estimates duration via SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET (2.5 min/set) when omitted.
 */
export function calculateStrengthLoad(
  exercises: StrengthExercise[],
  explicitSessionDurationMinutes?: number
): number {
  if (!exercises || exercises.length === 0) return 0;

  let totalSets = 0;
  let weightedRpeSum = 0;

  for (const ex of exercises) {
    if (!ex.sets) continue;
    for (const set of ex.sets) {
      const clampedRpe = Math.min(Math.max(set.rpe || 7, SRPE_CONFIG.MIN_RPE), SRPE_CONFIG.MAX_RPE);
      weightedRpeSum += clampedRpe;
      totalSets++;
    }
  }

  if (totalSets === 0) return 0;

  const avgRpe = weightedRpeSum / totalSets;
  const duration =
    explicitSessionDurationMinutes ??
    Math.round(totalSets * SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET);

  return calculateSessionRpe(duration, avgRpe);
}

/**
 * Secondary Metric for Running: Edwards TRIMP (Edwards, 1993).
 */
export function calculateEdwardsTrimp(
  run: RunSession,
  customWeights?: Record<HeartRateZone, number>
): number {
  const weights = customWeights || EDWARDS_ZONE_WEIGHTS;

  if (run.blocks && run.blocks.length > 0) {
    const rawTotal = run.blocks.reduce((sum, block) => {
      const weight = weights[block.zone] ?? 2.0;
      return sum + block.durationMinutes * weight;
    }, 0);
    return Math.round(rawTotal * 10) / 10;
  }

  if (run.avgHeartRate && run.avgHeartRate > 0) {
    const zone = getHeartRateZoneFromBpm(run.avgHeartRate);
    const weight = weights[zone] ?? 2.0;
    return Math.round(run.durasiMenit * weight * 10) / 10;
  }

  return Math.round(run.durasiMenit * (weights[2] ?? 2.0) * 10) / 10;
}

/**
 * Primary Metric for Running: Universal sRPE Workload.
 */
export function calculateRunningLoad(run: RunSession): number {
  if (!run || run.durasiMenit <= 0) return 0;

  if (run.rpe && run.rpe > 0) {
    return calculateSessionRpe(run.durasiMenit, run.rpe);
  }

  if (run.blocks && run.blocks.length > 0) {
    const zoneToRpe: Record<HeartRateZone, number> = { 1: 5, 2: 6, 3: 7, 4: 8.5, 5: 9.5 };
    const totalWeightedRpe = run.blocks.reduce((sum, block) => {
      return sum + block.durationMinutes * zoneToRpe[block.zone];
    }, 0);
    return Math.round(totalWeightedRpe);
  }

  if (run.avgHeartRate && run.avgHeartRate > 0) {
    const zone = getHeartRateZoneFromBpm(run.avgHeartRate);
    const zoneToRpe: Record<HeartRateZone, number> = { 1: 5, 2: 6, 3: 7, 4: 8.5, 5: 9.5 };
    return calculateSessionRpe(run.durasiMenit, zoneToRpe[zone]);
  }

  return calculateSessionRpe(run.durasiMenit, 6);
}
