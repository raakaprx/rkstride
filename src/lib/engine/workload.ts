/**
 * RKStride - Sports Science & Hybrid Workload Engine
 * Pure, deterministic mathematical functions for ACWR, sRPE, Karvonen HRR,
 * Edwards TRIMP, bidirectional soft interference guardrails, personal baseline readiness,
 * 1RM estimations, and weekly muscle volume.
 */

import {
  StrengthExercise,
  RunSession,
  DailyLog,
  ReadinessCheckIn,
  ACWRResult,
  ACWRStatus,
  ACWRMethod,
  RecommendationResult,
  HeartRateZone,
  RunningType,
  RunningIntervalBlock,
  UserProfile,
  SoftGuardrailResult,
  OneRepMaxEstimate,
  WeeklyMuscleVolume,
  WorkoutCategory,
  StrengthSet,
} from '@/types/workout';
import { ScheduledDay, ScheduleConflict } from '@/types/schedule';

import {
  ACWR_THRESHOLDS,
  ACWR_COLD_START_MIN_DAYS,
  EWMA_LAMBDA,
  WEEKLY_LOAD_SPIKE_THRESHOLD_PERCENT,
  DELOAD_ATTENUATION,
  SRPE_CONFIG,
  EDWARDS_ZONE_WEIGHTS,
  KARVONEN_PERCENTAGES,
  PHYSIOLOGICAL_DEFAULTS,
  INTERFERENCE_GUARDRAIL,
  READINESS_Z_WEIGHTS,
  HARD_SET_MIN_RPE,
} from './constants';

export const ZONE_WEIGHTS = EDWARDS_ZONE_WEIGHTS;

// =============================================================================
// 1. HEART RATE & KARVONEN (HEART RATE RESERVE) PHYSIOLOGY
// =============================================================================

/**
 * Estimate Maximum Heart Rate based on evidence-based formulas
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
  const maxHr = profile?.maxHr ?? estimateMaxHeartRate(age, profile?.hrMaxFormula === 'gellish' ? 'gellish' : 'tanaka');
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
 * Determine Heart Rate Zone from Average Heart Rate (bpm)
 * Evaluates against personalized Karvonen zones if profile is available.
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

// =============================================================================
// 2. RUNNING PRESETS & PROTOCOLS (NORWEGIAN 4x4 ACCORDING TO PROTOCOL)
// =============================================================================

export const RUNNING_PRESETS = {
  norwegian_4x4: {
    id: 'norwegian_4x4',
    name: 'Norwegian 4x4 (VO2 Max Protocol)',
    type: 'norwegian_4x4' as RunningType,
    description: '10m Z2 warmup + 4x(4m Z4 @ 85-95% HRmax + 3m Z2 recovery) + 6m Z1 cooldown (Helgerud et al., 2007)',
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

// =============================================================================
// 3. WORKLOAD QUANTIFICATION (sRPE UNIVERSAL & SECONDARY METRICS)
// =============================================================================

/**
 * Universal Foster Session RPE (sRPE)
 * Formula: durationMinutes * rpe (scale 1-10)
 * Reference: Foster et al. (2001)
 */
export function calculateSessionRpe(durationMinutes: number, rpe: number): number {
  const clampedRpe = Math.min(Math.max(rpe, SRPE_CONFIG.MIN_RPE), SRPE_CONFIG.MAX_RPE);
  const safeDuration = Math.max(0, durationMinutes);
  return Math.round(safeDuration * clampedRpe);
}

/**
 * Secondary Metric for Resistance Training: Volume Load (kg x repetitions)
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
 * Primary Metric for Resistance Training: Universal sRPE Workload
 * If explicit duration is not logged, estimates duration based on set count
 * (SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET = 2.5 min/set).
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
  const duration = explicitSessionDurationMinutes ?? Math.round(totalSets * SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET);

  return calculateSessionRpe(duration, avgRpe);
}

/**
 * Secondary Metric for Running: Edwards TRIMP (Training Impulse)
 * Formula: sum(blockDurationMinutes * zoneWeight)
 * Edwards multipliers: Z1=1.0, Z2=2.0, Z3=3.0, Z4=4.0, Z5=5.0
 * Reference: Edwards (1993)
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

  // Fallback using average Heart Rate if blocks are not specified
  if (run.avgHeartRate && run.avgHeartRate > 0) {
    const zone = getHeartRateZoneFromBpm(run.avgHeartRate);
    const weight = weights[zone] ?? 2.0;
    return Math.round(run.durasiMenit * weight * 10) / 10;
  }

  // Default fallback (Zone 2 pace)
  return Math.round(run.durasiMenit * (weights[2] ?? 2.0) * 10) / 10;
}

/**
 * Primary Metric for Running: Universal sRPE Workload
 * If RPE is provided: durationMinutes * RPE.
 * Fallback with sensor: maps HR zone to equivalent RPE.
 */
export function calculateRunningLoad(run: RunSession): number {
  if (!run || run.durasiMenit <= 0) return 0;

  // 1. Direct sRPE if RPE is recorded
  if (run.rpe && run.rpe > 0) {
    return calculateSessionRpe(run.durasiMenit, run.rpe);
  }

  // 2. Block-based derived RPE fallback
  if (run.blocks && run.blocks.length > 0) {
    const totalWeightedRpe = run.blocks.reduce((sum, block) => {
      // Map Zone 1->5, Zone 2->6, Zone 3->7, Zone 4->8.5, Zone 5->9.5
      const zoneToRpe: Record<HeartRateZone, number> = { 1: 5, 2: 6, 3: 7, 4: 8.5, 5: 9.5 };
      return sum + block.durationMinutes * zoneToRpe[block.zone];
    }, 0);
    return Math.round(totalWeightedRpe);
  }

  // 3. Heart rate derived RPE
  if (run.avgHeartRate && run.avgHeartRate > 0) {
    const zone = getHeartRateZoneFromBpm(run.avgHeartRate);
    const zoneToRpe: Record<HeartRateZone, number> = { 1: 5, 2: 6, 3: 7, 4: 8.5, 5: 9.5 };
    return calculateSessionRpe(run.durasiMenit, zoneToRpe[zone]);
  }

  // Default moderate RPE 6
  return calculateSessionRpe(run.durasiMenit, 6);
}

// =============================================================================
// 4. ACWR (ACUTE:CHRONIC WORKLOAD RATIO) ENGINE
// =============================================================================

/**
 * Detect weekly workload spikes (Weekly Load Increase > 15%)
 * Compares current 7 days with previous 7 days (days 7..13).
 */
export function detectWeeklyLoadSpike(history28Days: DailyLog[]): {
  spikeAlert: boolean;
  spikePercent: number;
} {
  if (!history28Days || history28Days.length < 14) {
    return { spikeAlert: false, spikePercent: 0 };
  }

  const currentWeekLoad = history28Days.slice(0, 7).reduce((sum, l) => sum + (l.totalLoadScore || 0), 0);
  const previousWeekLoad = history28Days.slice(7, 14).reduce((sum, l) => sum + (l.totalLoadScore || 0), 0);

  if (previousWeekLoad <= 0) {
    return { spikeAlert: false, spikePercent: 0 };
  }

  const percentChange = Math.round(((currentWeekLoad - previousWeekLoad) / previousWeekLoad) * 100);
  const spikeAlert = percentChange > WEEKLY_LOAD_SPIKE_THRESHOLD_PERCENT;

  return { spikeAlert, spikePercent: percentChange };
}

/**
 * Calculate Exponentially Weighted Moving Average (EWMA) for a load series
 * Formula: EWMA_t = Load_t * lambda + (1 - lambda) * EWMA_{t-1}
 * Reference: Williams et al. (2017)
 */
export function calculateEWMALoad(loadsChronological: number[], lambda: number): number {
  if (loadsChronological.length === 0) return 0;

  let ewma = loadsChronological[0];
  for (let i = 1; i < loadsChronological.length; i++) {
    ewma = loadsChronological[i] * lambda + (1 - lambda) * ewma;
  }
  return Math.round(ewma * 10) / 10;
}

/**
 * Comprehensive ACWR Calculation Engine
 * Supports:
 * - Method 1: 'rolling_coupled' (7-day vs 28-day coupled rolling average)
 * - Method 2: 'rolling_uncoupled' (7-day acute vs 21-day prior uncoupled chronic)
 * - Method 3: 'ewma' (Exponentially Weighted Moving Average)
 *
 * Cold-Start Safety:
 * - Requires at least ACWR_COLD_START_MIN_DAYS (21 days) of data to classify risk zones.
 * - Under 21 days is flagged as 'insufficient_data' with exact collection progress.
 *
 * Risk Zones (single 1.4 guardrail per AGENTS.md):
 * - < 0.8: 'undertraining'
 * - 0.8 - 1.4: 'sweet_spot'
 * - > 1.4: 'danger'
 */
export function calculateACWR(
  history28Days: DailyLog[],
  method: ACWRMethod = 'rolling_coupled'
): ACWRResult {
  const validLogs = history28Days || [];
  const daysCollected = validLogs.filter((l) => l.totalLoadScore !== undefined).length;
  const isColdStart = daysCollected < ACWR_COLD_START_MIN_DAYS;
  const coldStartProgressPercent = Math.min(100, Math.round((daysCollected / ACWR_COLD_START_MIN_DAYS) * 100));

  const loads: number[] = validLogs.map((log) => log.totalLoadScore || 0);
  while (loads.length < 28) {
    loads.push(0);
  }

  let acuteLoad = 0;
  let chronicLoad = 0;

  if (method === 'ewma') {
    // Reverse loads so array is chronological: oldest (day 27) -> today (day 0)
    const chronologicalLoads = [...loads.slice(0, 28)].reverse();
    acuteLoad = calculateEWMALoad(chronologicalLoads, EWMA_LAMBDA.ACUTE);
    chronicLoad = calculateEWMALoad(chronologicalLoads, EWMA_LAMBDA.CHRONIC);
  } else if (method === 'rolling_uncoupled') {
    // Uncoupled: Acute = average of days 0..6 (7 days), Chronic = average of days 7..27 (21 days prior)
    const acuteSum = loads.slice(0, 7).reduce((sum, val) => sum + val, 0);
    acuteLoad = Math.round((acuteSum / 7) * 10) / 10;

    const chronicSlice = loads.slice(7, 28);
    const chronicSum = chronicSlice.reduce((sum, val) => sum + val, 0);
    chronicLoad = Math.round((chronicSum / 21) * 10) / 10;
  } else {
    // Default coupled: Acute = days 0..6 (7 days), Chronic = days 0..27 (28 days)
    const acuteSum = loads.slice(0, 7).reduce((sum, val) => sum + val, 0);
    acuteLoad = Math.round((acuteSum / 7) * 10) / 10;

    const chronicSum = loads.slice(0, 28).reduce((sum, val) => sum + val, 0);
    chronicLoad = Math.round((chronicSum / 28) * 10) / 10;
  }

  let ratio = 1.0;
  if (chronicLoad > 0) {
    ratio = Math.round((acuteLoad / chronicLoad) * 100) / 100;
  }

  // Zone Classification: single 1.4 guardrail (AGENTS.md).
  // NOTE: 'warning' remains in the ACWRStatus union for legacy UI fallback
  // but the engine no longer emits it.
  let status: ACWRStatus;
  if (isColdStart) {
    status = 'insufficient_data';
  } else if (ratio < ACWR_THRESHOLDS.UNDERTRAINING_MAX) {
    status = 'undertraining';
  } else if (ratio <= ACWR_THRESHOLDS.SWEET_SPOT_MAX) {
    status = 'sweet_spot';
  } else {
    status = 'danger';
  }

  const { spikeAlert, spikePercent } = detectWeeklyLoadSpike(validLogs);

  return {
    acuteLoad,
    chronicLoad,
    ratio,
    status,
    method,
    daysCollected,
    coldStartProgressPercent,
    weeklySpikeAlert: spikeAlert,
    weeklySpikePercent: spikePercent,
  };
}

// =============================================================================
// 5. BIDIRECTIONAL SOFT INTERFERENCE GUARDRAIL
// =============================================================================

export interface EvaluateGuardrailParams {
  lastLegDayHoursAgo: number;
  lastFastRunHoursAgo?: number;
  intendedActivity: 'running' | 'legs' | 'upper_push_pull' | 'rest';
  runningType?: RunningType;
  runningDurationMinutes?: number;
  muscleSoreness: 1 | 2 | 3 | 4 | 5;
  legFatigue: boolean;
  readinessScore: number;
  isOverridden?: boolean;
}

/**
 * Graded, Bidirectional Soft Guardrail
 * Direction 1: Heavy Legs -> High-Intensity Running (48h window)
 * Direction 2: High-Intensity Running -> Heavy Lower Body Lifting (24h window)
 * Safe rule: Zone 1 or Zone 2 aerobic running <= 45 minutes is ALWAYS allowed.
 */
export function evaluateSoftGuardrail(params: EvaluateGuardrailParams): SoftGuardrailResult {
  const {
    lastLegDayHoursAgo,
    lastFastRunHoursAgo = 999,
    intendedActivity,
    runningType,
    runningDurationMinutes = 30,
    muscleSoreness,
    legFatigue,
    readinessScore,
    isOverridden = false,
  } = params;

  // Safe Exemption: Zone 1 or Zone 2 running <= 45 minutes is ALWAYS safe
  const isAerobicFlush =
    (runningType === 'recovery' || runningType === 'easy') &&
    runningDurationMinutes <= INTERFERENCE_GUARDRAIL.SAFE_AEROBIC_RECOVERY_MAX_MINUTES;

  if (isAerobicFlush) {
    return {
      level: 'none',
      canOverride: true,
      warningTitle: 'Sesi Pemulihan Aerobik Aman',
      warningMessage: 'Lari Zone 1-2 berdurasi <= 45 menit aman dilakukan untuk mempercepat klirens laktat dan regenerasi miofibril.',
      suggestedAction: 'Jaga detak jantung tetap berada di bawah ambang Zone 2 (kecepatan berbicara santai).',
      conflictDirection: 'none',
      allowedRunningTypes: ['recovery', 'easy'],
    };
  }

  // Direction 1: Legs -> Fast Running (< 48 hours)
  if (
    intendedActivity === 'running' &&
    lastLegDayHoursAgo < INTERFERENCE_GUARDRAIL.LEGS_TO_FAST_RUN_HOURS &&
    (runningType === 'norwegian_4x4' || runningType === 'intervals' || runningType === 'tempo')
  ) {
    const isHighRisk = legFatigue || muscleSoreness >= 4 || readinessScore < 50;

    return {
      level: isHighRisk ? 'high_risk' : 'caution',
      canOverride: true,
      warningTitle: isHighRisk
        ? 'Indikator Risiko Tinggi: Pemulihan Tendon & Otot Kaki'
        : 'Waspada: Jendela Pemulihan Kaki Sedang Berjalan',
      warningMessage: `Latihan kaki terakhir dilakukan ${lastLegDayHoursAgo} jam lalu (DOMS ${muscleSoreness}/5, Kesiapan ${readinessScore}/100). Menjalankan sesi lari berkecepatan tinggi dapat meningkatkan stres mekanis pada tendon patela dan menghambat adaptasi hipertrofi via persinyalan AMPK/mTORC1.`,
      suggestedAction: isOverridden
        ? 'Anda memilih tetap lanjut: Lakukan pemanasan dinamis 15 menit dan segera hentikan jika timbul nyeri sendi tajam.'
        : 'Disarankan mengalihkan sesi ke lari santai Zone 1/2 (< 45 menit) atau latihan kekuatan tubuh bagian atas (Upper Body Push/Pull).',
      conflictDirection: 'legs_to_run',
      allowedRunningTypes: isOverridden
        ? ['recovery', 'easy', 'tempo', 'norwegian_4x4', 'intervals']
        : ['recovery', 'easy'],
    };
  }

  // Direction 2: High-Intensity Run -> Heavy Legs (< 24 hours)
  if (
    intendedActivity === 'legs' &&
    lastFastRunHoursAgo < INTERFERENCE_GUARDRAIL.FAST_RUN_TO_LEGS_HOURS
  ) {
    const isHighRisk = legFatigue || readinessScore < 55;

    return {
      level: isHighRisk ? 'high_risk' : 'caution',
      canOverride: true,
      warningTitle: isHighRisk
        ? 'Indikator Risiko: Kelelahan Neuromuskular Pasca Lari Cepat'
        : 'Waspada: Pemulihan Pasca Sesi Lari Cepat',
      warningMessage: `Sesi lari intensitas tinggi (Interval/Tempo) selesai ${lastFastRunHoursAgo} jam lalu. Beban angkatan squat/deadlift berat saat glikogen otot kaki dan kekakuan tendon belum pulih dapat menurunkan kapasitas stabilisasi sendi.`,
      suggestedAction: isOverridden
        ? 'Anda memilih tetap lanjut: Turunkan beban kerja (RPE target <= 7) dan prioritaskan teknik gerakan.'
        : 'Pertimbangkan mengganti menu hari ini ke Upper Body atau deload mobility kaki.',
      conflictDirection: 'run_to_legs',
      allowedRunningTypes: ['recovery', 'easy'],
    };
  }

  return {
    level: 'none',
    canOverride: true,
    warningTitle: 'Jalur Latihan Terbuka',
    warningMessage: 'Tidak ada benturan fisiologis antara riwayat sesi kaki dan lari yang terdeteksi.',
    suggestedAction: 'Aman untuk mengeksekusi menu latihan sesuai rencana jadwal.',
    conflictDirection: 'none',
    allowedRunningTypes: ['recovery', 'easy', 'tempo', 'norwegian_4x4', 'intervals', 'long_run'],
  };
}

// =============================================================================
// 5b. WEEKLY SCHEDULE AUDIT (delegates to the engine guardrail)
// =============================================================================

const FAST_RUN_CATEGORIES: WorkoutCategory[] = ['run_tempo', 'run_intervals', 'norwegian_4x4'];

function mapScheduleCategoryToRunType(category: WorkoutCategory): RunningType {
  switch (category) {
    case 'run_tempo':
      return 'tempo';
    case 'run_intervals':
      return 'intervals';
    case 'norwegian_4x4':
      return 'norwegian_4x4';
    case 'run_recovery':
      return 'recovery';
    case 'run_long':
      return 'long_run';
    case 'run_easy':
    default:
      return 'easy';
  }
}

/**
 * Audit a 7-day planned schedule with the bidirectional engine guardrail.
 * - Direction 1 (legs -> fast run): previous day is legs, current day is a
 *   fast run. Consecutive days are ~24h apart (< 48h window).
 * - Direction 2 (fast run -> legs): previous day is a fast run, current day
 *   is legs. Assumes ~20h gap (evening run -> next-morning lift), inside the
 *   24h window.
 * - Recovery Exemption flows through automatically: easy/recovery runs
 *   <= 45 min return level 'none' and produce no conflict.
 */
export function auditWeeklySchedule(
  weeklySchedule: ScheduledDay[],
  readiness: ReadinessCheckIn,
  readinessScore: number
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  if (!weeklySchedule || weeklySchedule.length === 0) return conflicts;

  for (let i = 0; i < weeklySchedule.length; i++) {
    const current = weeklySchedule[i];
    const prev = weeklySchedule[(i - 1 + weeklySchedule.length) % weeklySchedule.length];

    const prevIsLegs = prev.category === 'legs';
    const prevIsFastRun = FAST_RUN_CATEGORIES.includes(prev.category);
    const currentIsLegs = current.category === 'legs';
    const currentIsFastRun = FAST_RUN_CATEGORIES.includes(current.category);

    let guardrail: SoftGuardrailResult | null = null;

    if (prevIsLegs && currentIsFastRun) {
      guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 24,
        intendedActivity: 'running',
        runningType: mapScheduleCategoryToRunType(current.category),
        runningDurationMinutes: current.targetDurationMinutes,
        muscleSoreness: readiness.muscleSoreness,
        legFatigue: readiness.legFatigue,
        readinessScore,
      });
    } else if (prevIsFastRun && currentIsLegs) {
      guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 999,
        lastFastRunHoursAgo: 20,
        intendedActivity: 'legs',
        muscleSoreness: readiness.muscleSoreness,
        legFatigue: readiness.legFatigue,
        readinessScore,
      });
    }

    if (guardrail && guardrail.level !== 'none') {
      conflicts.push({
        dayIndex: current.dayIndex,
        dayName: current.dayName,
        severity: guardrail.level === 'high_risk' ? 'danger' : 'warning',
        message: `${current.dayName} (${current.title}) ${guardrail.conflictDirection === 'legs_to_run' ? `dijadwalkan sehari setelah Leg Day (${prev.dayName})` : `berupa Leg Day sehari setelah lari cepat (${prev.dayName})`}: ${guardrail.warningTitle}.`,
        suggestion: guardrail.suggestedAction,
      });
    }
  }

  return conflicts;
}

// =============================================================================
// 6. PERSONAL BASELINE BIO-READINESS (Z-SCORE)
// =============================================================================

export interface ReadinessScoreResult {
  score: number;
  isProvisional: boolean;
  statusLabel: string;
  tendonAlert?: string;
}

/**
 * Calculate personalized readiness score (0-100) using individual baseline Z-Scores.
 * If data history < 7 days, returns a provisional estimation.
 * If tendon pain >= 2, generates targeted load reduction advice.
 */
export function calculateReadinessScore(
  today: ReadinessCheckIn,
  history14to28Days?: ReadinessCheckIn[]
): ReadinessScoreResult {
  const history = (history14to28Days || []).filter((h) => h !== undefined);
  const isProvisional = history.length < 7;

  let baseScore = 100;

  if (isProvisional) {
    // Population-based provisional heuristic
    if (today.sleepHours < 5) baseScore -= 30;
    else if (today.sleepHours < 6.5) baseScore -= 18;
    else if (today.sleepHours < 7.5) baseScore -= 8;

    baseScore -= (today.muscleSoreness - 1) * 10;
    if (today.legFatigue) baseScore -= 10;

    if (today.energyLevel === 'low') baseScore -= 20;
    else if (today.energyLevel === 'moderate') baseScore -= 8;

    if (today.restingHeartRate && today.restingHeartRate > 60) {
      baseScore -= Math.min(15, (today.restingHeartRate - 60) * 1.5);
    }
  } else {
    // Personal Baseline Z-Score (Mean & Standard Deviation)
    const sleepValues = history.map((h) => h.sleepHours);
    const rhrValues = history.map((h) => h.restingHeartRate || 55);
    const hrvValues = history.map((h) => h.hrvRmssd || 45);

    const calcMeanStd = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length || 1);
      return { mean, std: Math.sqrt(variance) || 1 };
    };

    const sleepStats = calcMeanStd(sleepValues);
    const rhrStats = calcMeanStd(rhrValues);
    const hrvStats = calcMeanStd(hrvValues);

    const zSleep = (today.sleepHours - sleepStats.mean) / sleepStats.std;
    const zRhr = -( (today.restingHeartRate || 55) - rhrStats.mean ) / rhrStats.std; // Lower RHR is positive
    const zHrv = today.hrvRmssd ? (today.hrvRmssd - hrvStats.mean) / hrvStats.std : 0;

    const subjectivePenalty = (today.muscleSoreness - 1) * 0.4 + (today.legFatigue ? 0.6 : 0) + (today.energyLevel === 'low' ? 0.8 : today.energyLevel === 'moderate' ? 0.2 : -0.3);

    const compositeZ =
      zSleep * READINESS_Z_WEIGHTS.SLEEP_DURATION +
      zRhr * READINESS_Z_WEIGHTS.RESTING_HR +
      zHrv * READINESS_Z_WEIGHTS.HRV_RMSSD -
      subjectivePenalty * READINESS_Z_WEIGHTS.SUBJECTIVE_DOMS_FATIGUE;

    // Normalizing Z-Score: Mean 50 + (Z * 16)
    baseScore = Math.round(50 + compositeZ * 16);
  }

  const finalScore = Math.max(10, Math.min(100, baseScore));

  let statusLabel = 'Optimal';
  if (finalScore < 45) statusLabel = 'Kelelahan Tinggi';
  else if (finalScore < 65) statusLabel = 'Moderat';

  let tendonAlert: string | undefined;
  if (today.tendonJointPain && today.tendonJointPain >= 2) {
    const area = today.tendonPainArea || 'sendi / tendon';
    tendonAlert = `Peringatan Nyeri Jaringan: Nyeri ${area} terdeteksi di tingkat ${today.tendonJointPain}/3. Kurangi beban kompresif dan hilangkan latihan pliometrik/lari cepat hingga nyeri mereda.`;
  }

  return {
    score: finalScore,
    isProvisional,
    statusLabel,
    tendonAlert,
  };
}

// =============================================================================
// 7. 1RM (ONE REP MAX) ESTIMATIONS & MUSCLE VOLUME SUMMARY
// =============================================================================

/**
 * 1RM Estimation via Epley (1985) and Brzycki (1993) formulas
 * Epley: weight * (1 + reps / 30)
 * Brzycki: weight * (36 / (37 - reps))
 */
export function estimate1RM(weightKg: number, reps: number): OneRepMaxEstimate {
  if (weightKg <= 0 || reps <= 0) {
    return { epley: 0, brzycki: 0, average: 0 };
  }

  if (reps === 1) {
    return { epley: weightKg, brzycki: weightKg, average: weightKg };
  }

  const epley = Math.round(weightKg * (1 + reps / 30) * 10) / 10;
  const brzycki = reps < 37
    ? Math.round(weightKg * (36 / (37 - reps)) * 10) / 10
    : epley;

  const average = Math.round(((epley + brzycki) / 2) * 10) / 10;

  return { epley, brzycki, average };
}

/**
 * Detect Personal Record (PR) for an exercise compared against historical logs
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
 * Summarize weekly productive volume per muscle category
 * Counts hard sets (RPE >= HARD_SET_MIN_RPE), volume load, and sRPE.
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
      const cat = ex.category || (
        /bench|press|dip|push/i.test(ex.namaGerakan) ? 'push' :
        /pull|row|chin|deadlift/i.test(ex.namaGerakan) ? 'pull' :
        /squat|lunge|leg|calf|quad/i.test(ex.namaGerakan) ? 'legs' :
        /curl|tricep|bicep/i.test(ex.namaGerakan) ? 'arms' : 'core'
      );

      if (!result[cat]) {
        result[cat] = { category: cat as WorkoutCategory, hardSets: 0, totalVolumeKg: 0, sRpeTotal: 0 };
      }

      for (const set of ex.sets) {
        if (set.rpe >= HARD_SET_MIN_RPE) {
          result[cat].hardSets++;
        }
        result[cat].totalVolumeKg += Math.round(set.bebanKg * set.reps);
        result[cat].sRpeTotal += calculateSessionRpe(SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET, set.rpe);
      }
    }
  }

  return result;
}

// =============================================================================
// 8. ADAPTIVE WORKLOAD RECOMMENDATION ENGINE
// =============================================================================

/**
 * Adaptive Sports Science Workout Advisor
 * Combines ACWR status (single 1.4 guardrail with dynamic deload
 * attenuation -20% to -40%), soft interference guardrail, and tendon alerts.
 *
 * Zones: < 0.8 undertraining (safe progressive overload step),
 * 0.8 - 1.4 sweet spot, > 1.4 danger (deload).
 */
export function getWorkoutRecommendation(
  acwrRatio: number,
  readiness: ReadinessCheckIn,
  lastLegDayHoursAgo: number,
  lastFastRunHoursAgo: number = 999,
  plannedRun?: { type: RunningType; durationMinutes: number }
): RecommendationResult {
  const readinessResult = calculateReadinessScore(readiness);
  // Default preserves the legacy probe (hard interval session) so the
  // Recovery Exemption branch is reachable whenever callers pass the
  // actually planned run (type + duration) instead.
  const probeRun = plannedRun ?? { type: 'norwegian_4x4' as RunningType, durationMinutes: 44 };
  const guardrail = evaluateSoftGuardrail({
    lastLegDayHoursAgo,
    lastFastRunHoursAgo,
    intendedActivity: 'running',
    runningType: probeRun.type,
    runningDurationMinutes: probeRun.durationMinutes,
    muscleSoreness: readiness.muscleSoreness,
    legFatigue: readiness.legFatigue,
    readinessScore: readinessResult.score,
  });

  // 1. Danger Zone: ACWR > 1.4 (acute spike -> overtraining warning + deload)
  if (acwrRatio > ACWR_THRESHOLDS.DANGER_THRESHOLD) {
    const deloadPercent = readinessResult.score < 50
      ? DELOAD_ATTENUATION.AGGRESSIVE
      : DELOAD_ATTENUATION.MODERATE;

    return {
      targetCategory: 'mobility_recovery',
      warningMessage: `Indikator Risiko Lonjakan Beban: Rasio ACWR (${acwrRatio}) berada di Zona Bahaya (> 1.4). Terdeteksi kenaikan beban latihan akut yang signifikan.`,
      volumeAdjustmentPercent: deloadPercent,
      guardrail,
      workoutDetail: {
        title: 'Protokol Deload & Mobilitas Aktif',
        rationale: `Rasio ACWR (${acwrRatio}) mengindikasikan lonjakan beban akut. Volume latihan disesuaikan ${deloadPercent}% untuk menjaga homeostasis jaringan lunak.`,
        speedRunLocked: true,
        suggestedAction: 'Fokus pada mobilitas panggul dan toraks, foam rolling, serta hidrasi. Batasi kardio hanya pada Zone 1 lari pemulihan (< 30 menit).',
        allowedRunningTypes: ['recovery'],
      },
      tendonWarning: readinessResult.tendonAlert,
    };
  }

  // 2. Interference Guardrail Active (< 48 hours post-legs)
  if (guardrail.level !== 'none') {
    return {
      targetCategory: 'push',
      warningMessage: guardrail.warningMessage,
      volumeAdjustmentPercent: readiness.energyLevel === 'low' ? -15 : 0,
      guardrail,
      workoutDetail: {
        title: 'Hipertrofi Otot Bagian Atas (Push & Core)',
        rationale: guardrail.warningMessage,
        speedRunLocked: true,
        suggestedAction: guardrail.suggestedAction,
        allowedRunningTypes: guardrail.allowedRunningTypes,
      },
      tendonWarning: readinessResult.tendonAlert,
    };
  }

  // 3. Low Energy / Readiness Depleted
  if (readiness.energyLevel === 'low' || readinessResult.score < 50) {
    return {
      targetCategory: 'run_easy',
      warningMessage: 'Skor kesiapan tubuh rendah. Volume latihan dikurangi 15-20% untuk memulihkan sistem saraf pusat (CNS).',
      volumeAdjustmentPercent: -20,
      guardrail,
      workoutDetail: {
        title: 'Pemulihan Aktif Zone 2 & Mobilitas',
        rationale: 'Kesiapan tubuh rendah membutuhkan stimulasi kardiovaskular rendah stres tanpa menambah kelelahan neuromuskular.',
        speedRunLocked: true,
        suggestedAction: '30-40 menit lari santai Zone 2 atau latihan pemulihan peregangan dinamis.',
        allowedRunningTypes: ['recovery', 'easy'],
      },
      tendonWarning: readinessResult.tendonAlert,
    };
  }

  // 4. Underload: ACWR < 0.8 (safe progressive overload step, AGENTS.md)
  if (acwrRatio < ACWR_THRESHOLDS.UNDERTRAINING_MAX) {
    return {
      targetCategory: 'push',
      volumeAdjustmentPercent: 5,
      guardrail,
      workoutDetail: {
        title: 'Progressive Overload Aman',
        rationale: `ACWR (${acwrRatio}) berada di bawah 0.8: stimulus latihan saat ini ringan dan kapasitas adaptasi masih longgar.`,
        speedRunLocked: false,
        suggestedAction: 'Tambah 1 set ekstra atau +2.5-5 kg pada main lift (upper +2.5 kg, lower/compound +5 kg) dengan RPE target 7-8.',
        allowedRunningTypes: ['recovery', 'easy', 'tempo', 'norwegian_4x4', 'intervals', 'long_run'],
      },
      tendonWarning: readinessResult.tendonAlert,
    };
  }

  // 5. Sweet Spot (ACWR 0.8 - 1.4 & Legs Fresh > 48h)
  return {
    targetCategory: 'norwegian_4x4',
    volumeAdjustmentPercent: 0,
    guardrail,
    workoutDetail: {
      title: 'Protokol Interval Norwegian 4x4 (Peningkatan VO2 Max)',
      rationale: `ACWR berada di Sweet Spot optimal (${acwrRatio}) dan otot kaki telah pulih (${lastLegDayHoursAgo} jam). Kondisi prima untuk stimulus adaptasi kardiorespirasi.`,
      speedRunLocked: false,
      suggestedAction: 'Eksekusi Norwegian 4x4: 10m pemanasan Z2, 4x(4m Z4 @ 85-95% HRmax + 3m pemulihan aktif Z2), 6m pendinginan Z1. Total durasi 44 menit.',
      allowedRunningTypes: ['norwegian_4x4', 'intervals', 'tempo', 'easy', 'long_run'],
    },
    tendonWarning: readinessResult.tendonAlert,
  };
}
