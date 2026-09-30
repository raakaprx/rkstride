import {
  StrengthExercise,
  RunSession,
  DailyLog,
  ReadinessCheckIn,
  ACWRResult,
  RecommendationResult,
  HeartRateZone,
  RunningType,
  RunningIntervalBlock,
} from '@/types/workout';

/**
 * Heart Rate Zone Weights (Workload Stress Factor per Minute)
 * Zone 1: Active Recovery (50-60% HRmax) -> 1.0 pts/min
 * Zone 2: Aerobic Base (60-70% HRmax) -> 1.2 pts/min
 * Zone 3: Aerobic Tempo (70-80% HRmax) -> 1.5 pts/min
 * Zone 4: Lactate Threshold / Norwegian 4x4 (85-95% HRmax) -> 2.2 pts/min
 * Zone 5: Anaerobic / VO2 Max Intervals (>90% HRmax) -> 3.5 pts/min
 */
export const ZONE_WEIGHTS: Record<HeartRateZone, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 2.2,
  5: 3.5,
};

/**
 * Standard Running Spectrum Presets
 */
export const RUNNING_PRESETS = {
  norwegian_4x4: {
    id: 'norwegian_4x4',
    name: 'Norwegian 4x4 (VO2 Max Protocol)',
    type: 'norwegian_4x4' as RunningType,
    description: '10m Z2 warmup + 4x(4m Z4 @ 85-95% + 3m Z2 recovery) + 10m Z1 cooldown',
    durationMinutes: 48,
    estimatedDistanceKm: 7.2,
    blocks: [
      { zone: 2 as HeartRateZone, durationMinutes: 10, description: 'Warm-up (Zone 2)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 1 (Zone 4)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 1 (Zone 2)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 2 (Zone 4)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 2 (Zone 2)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 3 (Zone 4)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 3 (Zone 2)' },
      { zone: 4 as HeartRateZone, durationMinutes: 4, description: 'Interval 4 (Zone 4)' },
      { zone: 2 as HeartRateZone, durationMinutes: 3, description: 'Active Recovery 4 (Zone 2)' },
      { zone: 1 as HeartRateZone, durationMinutes: 10, description: 'Cool-down (Zone 1)' },
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
      { zone: 2 as HeartRateZone, durationMinutes: 45, description: 'Zone 2 Steady Aerobic' },
    ] as RunningIntervalBlock[],
  },
  recovery_run: {
    id: 'recovery_run',
    name: 'Active Recovery Flush (Zone 1)',
    type: 'recovery' as RunningType,
    description: '30 min light flush (max 35 min) for tissue regeneration',
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

/**
 * Determine Heart Rate Zone from Average Heart Rate (bpm)
 */
export function getHeartRateZoneFromBpm(bpm: number): HeartRateZone {
  if (bpm < 130) return 1;
  if (bpm <= 150) return 2;
  if (bpm <= 165) return 3;
  if (bpm <= 178) return 4;
  return 5;
}

/**
 * 1. Calculate Strength Volume Load:
 *    Formula: sum(bebanKg * reps) * (RPE / 10) per set.
 *    Normalized by 0.1 factor to align with daily cardiovascular scale.
 */
export function calculateStrengthLoad(exercises: StrengthExercise[]): number {
  if (!exercises || exercises.length === 0) return 0;

  let totalRawScore = 0;

  for (const exercise of exercises) {
    if (!exercise.sets || exercise.sets.length === 0) continue;

    for (const set of exercise.sets) {
      const clampedRpe = Math.min(Math.max(set.rpe, 1), 10);
      const volume = set.bebanKg * set.reps;
      const setLoad = volume * (clampedRpe / 10);
      totalRawScore += setLoad;
    }
  }

  return Math.round(totalRawScore * 0.1);
}

/**
 * 2. Calculate Running Workload Score:
 *    A. Block-based Accumulation (Primary):
 *       Total Load = sum(blockDurationMinutes * zoneWeight)
 *       Zone Weights: Z1=1.0, Z2=1.2, Z3=1.5, Z4=2.2, Z5=3.5
 *    B. Sensorless Fallback (RPE-based):
 *       DurationMinutes * (RPE / 2)
 *    C. Continuous Heart Rate Fallback:
 *       DurationMinutes * ZONE_WEIGHTS[getHeartRateZoneFromBpm(avgHR)]
 */
export function calculateRunningLoad(run: RunSession): number {
  if (!run || run.durasiMenit <= 0) return 0;

  // A. Block-based Accumulation
  if (run.blocks && run.blocks.length > 0) {
    const rawTotal = run.blocks.reduce((sum, block) => {
      const weight = ZONE_WEIGHTS[block.zone] || 1.2;
      return sum + block.durationMinutes * weight;
    }, 0);
    return Math.round(rawTotal * 10) / 10;
  }

  // B. Fallback without Heart Rate Sensor (RPE Scale 1–10)
  if (run.rpe && run.rpe > 0 && (!run.avgHeartRate || run.avgHeartRate <= 0)) {
    const clampedRpe = Math.min(Math.max(run.rpe, 1), 10);
    return Math.round(run.durasiMenit * (clampedRpe / 2) * 10) / 10;
  }

  // C. Continuous Heart Rate Session
  if (run.avgHeartRate && run.avgHeartRate > 0) {
    const zone = getHeartRateZoneFromBpm(run.avgHeartRate);
    const weight = ZONE_WEIGHTS[zone];
    return Math.round(run.durasiMenit * weight * 10) / 10;
  }

  // Default fallback (Zone 2 pace)
  return Math.round(run.durasiMenit * 1.2 * 10) / 10;
}

/**
 * 3. Calculate Acute to Chronic Workload Ratio (ACWR):
 *    - acuteLoad: 7-day average load
 *    - chronicLoad: 28-day average load
 *    - ratio: acuteLoad / chronicLoad
 *    Classifications:
 *    - ratio < 0.8: 'safe' (Under-training / Safe to ramp up)
 *    - 0.8 <= ratio <= 1.3: 'optimal' (Optimal sweet spot)
 *    - ratio > 1.4: 'danger_overtraining' (High injury risk)
 */
export function calculateACWR(history28Days: DailyLog[]): ACWRResult {
  const loads: number[] = history28Days.map((log) => log.totalLoadScore);

  while (loads.length < 28) {
    loads.push(0);
  }

  const acuteSlice = loads.slice(0, 7);
  const acuteSum = acuteSlice.reduce((sum, val) => sum + val, 0);
  const acuteLoad = Math.round((acuteSum / 7) * 10) / 10;

  const chronicSlice = loads.slice(0, 28);
  const chronicSum = chronicSlice.reduce((sum, val) => sum + val, 0);
  const chronicLoad = Math.round((chronicSum / 28) * 10) / 10;

  let ratio = 1.0;
  if (chronicLoad > 0) {
    ratio = Math.round((acuteLoad / chronicLoad) * 100) / 100;
  }

  let status: ACWRResult['status'] = 'optimal';
  if (ratio < 0.8) {
    status = 'safe';
  } else if (ratio >= 0.8 && ratio <= 1.3) {
    status = 'optimal';
  } else if (ratio > 1.4) {
    status = 'danger_overtraining';
  } else {
    status = 'optimal';
  }

  return {
    acuteLoad,
    chronicLoad,
    ratio,
    status,
  };
}

/**
 * 4. Calculate Bio-Readiness Score (0 - 100)
 */
export function calculateReadinessScore(readiness: ReadinessCheckIn): number {
  let score = 100;

  if (readiness.sleepHours < 5) score -= 30;
  else if (readiness.sleepHours < 6.5) score -= 18;
  else if (readiness.sleepHours < 7.5) score -= 8;

  score -= (readiness.muscleSoreness - 1) * 10;

  if (readiness.legFatigue) score -= 10;

  if (readiness.energyLevel === 'low') score -= 20;
  else if (readiness.energyLevel === 'moderate') score -= 8;

  if (readiness.restingHeartRate && readiness.restingHeartRate > 60) {
    score -= Math.min(15, (readiness.restingHeartRate - 60) * 1.5);
  }

  return Math.max(10, Math.min(100, Math.round(score)));
}

/**
 * 5. Adaptive Hybrid Workout Recommendation Engine:
 *    - Rule 1 (ACWR Overload Guardrail): ACWR > 1.4 triggers emergency deload (-30% volume, high intensity locked)
 *    - Rule 2 (PPL & Running Coexistence / 48h Window): Legs trained < 48h locks intervals, Norwegian 4x4, and tempo.
 *    - Rule 3 (Energy Depletion): Low energy cuts volume by 15-20%
 *    - Rule 4 (Optimal Sweet Spot): ACWR 0.8-1.3 & legs fresh (>48h) unlocks Norwegian 4x4, VO2 max intervals, or tempo.
 */
export function getWorkoutRecommendation(
  acwrRatio: number,
  readiness: ReadinessCheckIn,
  lastLegDayHoursAgo: number
): RecommendationResult {
  // Guardrail 1: ACWR Danger Zone (Priority 1 - Injury Prevention)
  if (acwrRatio > 1.4) {
    return {
      targetCategory: 'mobility_recovery',
      warningMessage: `🚨 ACWR OVERTRAINING WARNING: Acute:Chronic Workload Ratio (${acwrRatio}) exceeds safe threshold (> 1.4). Acute workload spike detected with severe injury and soft-tissue breakdown risk.`,
      volumeAdjustmentPercent: -30,
      workoutDetail: {
        title: 'Active Mobility & Deload Recovery Protocol',
        rationale: `ACWR spike (${acwrRatio} > 1.4) triggered an emergency deload. Strength volume cut by 30% and all high-intensity speed sessions are locked.`,
        speedRunLocked: true,
        suggestedAction: 'Perform 30-min thoracic/hip mobility, foam rolling, dynamic stretching, and ensure optimal hydration. Restrict any cardio to Zone 1 light active flush (< 30 min).',
        allowedRunningTypes: ['recovery'],
      },
    };
  }

  // Guardrail 2: 48-Hour Leg Recovery Window (PPL & Running Coexistence)
  if (lastLegDayHoursAgo < 48) {
    const isSevereFatigue = readiness.legFatigue || readiness.muscleSoreness >= 3;
    const isLowEnergy = readiness.energyLevel === 'low';
    const volumeCut = isLowEnergy ? -15 : 0;

    return {
      targetCategory: 'push',
      warningMessage: `⚠️ 48-HOUR LEG RECOVERY WINDOW: Leg day completed ${lastLegDayHoursAgo} hours ago (DOMS level ${readiness.muscleSoreness}/5). High-intensity running (Norwegian 4x4, Track Intervals, Tempo) and heavy leg lifting are locked to protect patellar tendons and hamstrings.`,
      volumeAdjustmentPercent: volumeCut,
      workoutDetail: {
        title: 'Hypertrophy Upper Body Push & Torso Strength',
        rationale: `Lower extremity motor units are undergoing myofibrillar repair (${lastLegDayHoursAgo}h post-leg session). Workload is redirected entirely to Upper Body Push.`,
        speedRunLocked: true,
        suggestedAction: isSevereFatigue
          ? 'Focus on Flat Dumbbell Bench Press (3x8 @RPE 8), Overhead Press (3x10), and Dips. No running or only light Zone 1 flush (< 25 min).'
          : 'Focus on Upper Body Push exercises. Light Zone 2 Easy Run (conversational, < 35 min) permitted if desired.',
        allowedRunningTypes: ['recovery', 'easy'],
      },
    };
  }

  // Guardrail 3: Energy Depletion
  if (readiness.energyLevel === 'low') {
    return {
      targetCategory: 'run_easy',
      warningMessage: 'Low energy level reported. Training volume reduced by 15% to prevent Central Nervous System (CNS) burnout.',
      volumeAdjustmentPercent: -15,
      workoutDetail: {
        title: 'Zone 2 Conversational Aerobic Base Flush',
        rationale: 'Low readiness requires low-stress cardiovascular stimulation without accumulating neuromuscular fatigue.',
        speedRunLocked: true,
        suggestedAction: '35–45 min steady Zone 2 run (Heart Rate < 140 bpm) at constant conversational pace, or light upper body pull work (RPE 6).',
        allowedRunningTypes: ['recovery', 'easy'],
      },
    };
  }

  // Optimal Scenario (Sweet Spot: ACWR 0.8 - 1.3 & Legs Fresh > 48h)
  return {
    targetCategory: 'norwegian_4x4',
    volumeAdjustmentPercent: 0,
    workoutDetail: {
      title: 'Norwegian 4x4 Interval Protocol & VO2 Max Booster',
      rationale: `Optimal ACWR sweet spot (${acwrRatio}) and lower body fully recovered (${lastLegDayHoursAgo}h post-leg session). Prime window for VO2 max cardiorespiratory adaptation.`,
      speedRunLocked: false,
      suggestedAction: 'Execute Norwegian 4x4: 10m Z2 warmup (12 pts), 4x(4m @ 85-95% HRmax Z4 + 3m active recovery Z2 = 49.6 pts), 10m Z1 cooldown (10 pts). Total running load: ~72 pts.',
      allowedRunningTypes: ['norwegian_4x4', 'intervals', 'tempo', 'easy', 'long_run'],
    },
  };
}
