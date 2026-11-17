/**
 * RKStride - Heart Rate Zones (Karvonen HRR) & Running Protocol Presets
 */
import type {
  HeartRateZone,
  RunningIntervalBlock,
  RunningType,
  UserProfile,
} from '@/types/workout';
import {
  EDWARDS_ZONE_WEIGHTS,
  KARVONEN_PERCENTAGES,
  PHYSIOLOGICAL_DEFAULTS,
} from './constants';

export const ZONE_WEIGHTS = EDWARDS_ZONE_WEIGHTS;

/**
 * Estimate Maximum Heart Rate based on evidence-based formulas.
 * Tanaka et al. (2001): 208 - (0.7 * age)
 * Gellish et al. (2007): 207 - (0.7 * age)
 */
export function estimateMaxHeartRate(
  age: number,
  formula: 'tanaka' | 'gellish' = 'tanaka'
): number {
  const safeAge = Math.max(10, Math.min(100, age));
  if (formula === 'gellish') {
    return Math.round(207 - 0.7 * safeAge);
  }
  return Math.round(208 - 0.7 * safeAge);
}

/**
 * Calculate personalized Heart Rate Zones using Karvonen Heart Rate Reserve (HRR) formula:
 * Target HR = RHR + Percentage * (HRmax - RHR)
 */
export function calculateKarvonenHeartRateZones(
  profile?: Partial<UserProfile>
): Record<HeartRateZone, { min: number; max: number; label: string }> {
  const age = profile?.age ?? PHYSIOLOGICAL_DEFAULTS.DEFAULT_AGE;
  const rhr = profile?.restingHrBaseline ?? PHYSIOLOGICAL_DEFAULTS.DEFAULT_RESTING_HR;
  const maxHr =
    profile?.maxHr ??
    estimateMaxHeartRate(age, profile?.hrMaxFormula === 'gellish' ? 'gellish' : 'tanaka');
  const hrr = Math.max(30, maxHr - rhr);

  const getBpm = (fraction: number) => Math.round(rhr + fraction * hrr);

  return {
    1: {
      min: getBpm(KARVONEN_PERCENTAGES.ZONE_1.min),
      max: getBpm(KARVONEN_PERCENTAGES.ZONE_1.max),
      label: 'Zone 1: Active Recovery (50-60% HRR)',
    },
    2: {
      min: getBpm(KARVONEN_PERCENTAGES.ZONE_2.min),
      max: getBpm(KARVONEN_PERCENTAGES.ZONE_2.max),
      label: 'Zone 2: Aerobic Base (60-70% HRR)',
    },
    3: {
      min: getBpm(KARVONEN_PERCENTAGES.ZONE_3.min),
      max: getBpm(KARVONEN_PERCENTAGES.ZONE_3.max),
      label: 'Zone 3: Aerobic Tempo (70-80% HRR)',
    },
    4: {
      min: getBpm(KARVONEN_PERCENTAGES.ZONE_4.min),
      max: getBpm(KARVONEN_PERCENTAGES.ZONE_4.max),
      label: 'Zone 4: Anaerobic Threshold (80-90% HRR)',
    },
    5: {
      min: getBpm(KARVONEN_PERCENTAGES.ZONE_5.min),
      max: maxHr,
      label: 'Zone 5: VO2 Max / Anaerobic (90-100% HRR)',
    },
  };
}

/**
 * Determine Heart Rate Zone from Average Heart Rate (bpm).
 */
export function getHeartRateZoneFromBpm(
  bpm: number,
  profile?: Partial<UserProfile>
): HeartRateZone {
  const zones = calculateKarvonenHeartRateZones(profile);

  if (bpm < zones[2].min) return 1;
  if (bpm < zones[3].min) return 2;
  if (bpm < zones[4].min) return 3;
  if (bpm < zones[5].min) return 4;
  return 5;
}

export const RUNNING_PRESETS = {
  norwegian_4x4: {
    id: 'norwegian_4x4',
    name: 'Norwegian 4x4 (VO2 Max Protocol)',
    type: 'norwegian_4x4' as RunningType,
    description:
      '10m Z2 warmup + 4x(4m Z4 @ 85-95% HRmax + 3m Z2 recovery) + 6m Z1 cooldown (Helgerud et al., 2007)',
    durationMinutes: 44,
    estimatedDistanceKm: 7.2,
    blocks: [
      { zone: 2 as HeartRateZone, durationMinutes: 10, description: 'Warm-up (Zone 2 @ 60-70% HRR)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 1 (Zone 4 @ 85-95% HRmax)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 1 (Zone 2 @ 60-70% HRR)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 2 (Zone 4 @ 85-95% HRmax)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 2 (Zone 2 @ 60-70% HRR)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 3 (Zone 4 @ 85-95% HRmax)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 3 (Zone 2 @ 60-70% HRR)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 4 (Zone 4 @ 85-95% HRmax)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 4 (Zone 2 @ 60-70% HRR)' },
      { zone: 1 as HeartRateZone, durationMinutes: 6, description: 'Cool-down Flush (Zone 1 @ 50-60% HRR)' },
    ] as RunningIntervalBlock[],
  },
  easy_run: {
    id: 'easy_run',
    name: 'Easy Run (Zone 2 Aerobic Base)',
    type: 'easy' as RunningType,
    description: '45 min steady conversational aerobic base run',
    durationMinutes: 45,
    estimatedDistanceKm: 7.5,
    blocks: [
      { zone: 2 as HeartRateZone, durationMinutes: 45, description: 'Zone 2 Steady Aerobic Base' },
    ] as RunningIntervalBlock[],
  },
  recovery_run: {
    id: 'recovery_run',
    name: 'Active Recovery Flush (Zone 1)',
    type: 'recovery' as RunningType,
    description: '30 min light flush for tissue regeneration and lactate clearance',
    durationMinutes: 30,
    estimatedDistanceKm: 4.5,
    blocks: [
      { zone: 1 as HeartRateZone, durationMinutes: 30, description: 'Zone 1 Active Recovery' },
    ] as RunningIntervalBlock[],
  },
  tempo_run: {
    id: 'tempo_run',
    name: 'Lactate Threshold Tempo',
    type: 'tempo' as RunningType,
    description: '15m Z2 warmup + 25m Z4 threshold + 10m Z1 cooldown',
    durationMinutes: 50,
    estimatedDistanceKm: 9.5,
    blocks: [
      { zone: 2 as HeartRateZone, durationMinutes: 15, description: 'Warm-up (Zone 2)' },
      { zone: 4 as HeartRateZone, durationMinutes: 25, description: 'Threshold Tempo (Zone 4)' },
      { zone: 1 as HeartRateZone, durationMinutes: 10, description: 'Cool-down (Zone 1)' },
    ] as RunningIntervalBlock[],
  },
  intervals_vo2max: {
    id: 'intervals_vo2max',
    name: 'VO2 Max Track Intervals (Zone 5)',
    type: 'intervals' as RunningType,
    description: '10m Z2 warmup + 5x(3m Z5 + 2m Z2 recovery) + 10m Z1 cooldown',
    durationMinutes: 45,
    estimatedDistanceKm: 8.0,
    blocks: [
      { zone: 2 as HeartRateZone, durationMinutes: 10, description: 'Warm-up (Zone 2)' },
      { zone: 5 as HeartRateZone, durationMinutes: 3, description: 'Sprint Rep 1 (Zone 5)' },
      { zone: 2 as HeartRateZone, durationMinutes: 2, description: 'Recovery 1 (Zone 2)' },
      { zone: 5 as HeartRateZone, durationMinutes: 3, description: 'Sprint Rep 2 (Zone 5)' },
      { zone: 2 as HeartRateZone, durationMinutes: 2, description: 'Recovery 2 (Zone 2)' },
      { zone: 5 as HeartRateZone, durationMinutes: 3, description: 'Sprint Rep 3 (Zone 5)' },
      { zone: 2 as HeartRateZone, durationMinutes: 2, description: 'Recovery 3 (Zone 2)' },
      { zone: 5 as HeartRateZone, durationMinutes: 3, description: 'Sprint Rep 4 (Zone 5)' },
      { zone: 2 as HeartRateZone, durationMinutes: 2, description: 'Recovery 4 (Zone 2)' },
      { zone: 5 as HeartRateZone, durationMinutes: 3, description: 'Sprint Rep 5 (Zone 5)' },
      { zone: 2 as HeartRateZone, durationMinutes: 2, description: 'Recovery 5 (Zone 2)' },
      { zone: 1 as HeartRateZone, durationMinutes: 10, description: 'Cool-down (Zone 1)' },
    ] as RunningIntervalBlock[],
  },
  long_run: {
    id: 'long_run',
    name: 'Long Run (Zone 2 Low Endurance)',
    type: 'long_run' as RunningType,
    description: '90 min steady aerobic endurance building tendon resilience',
    durationMinutes: 90,
    estimatedDistanceKm: 15.0,
    blocks: [
      { zone: 2 as HeartRateZone, durationMinutes: 90, description: 'Low Zone 2 Long Run' },
    ] as RunningIntervalBlock[],
  },
};
