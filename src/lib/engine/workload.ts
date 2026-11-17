import type {
  ReadinessCheckIn,
  RecommendationResult,
  RunningType,
} from '../../types/workout';
import { ACWR_THRESHOLDS, DELOAD_ATTENUATION } from './constants';
import { calculateReadinessScore } from './readiness';
import { evaluateSoftGuardrail } from './guardrail';

export {
  ZONE_WEIGHTS,
  estimateMaxHeartRate,
  calculateKarvonenHeartRateZones,
  getHeartRateZoneFromBpm,
  RUNNING_PRESETS,
} from './hrZones';

export {
  calculateSessionRpe,
  calculateStrengthVolumeLoad,
  calculateStrengthLoad,
  calculateEdwardsTrimp,
  calculateRunningLoad,
} from './loadMetrics';

export {
  detectWeeklyLoadSpike,
  calculateEWMALoad,
  calculateACWR,
  projectACWRImpact,
  type ProjectACWRImpactParams,
  type ProjectedImpactResult,
} from './acwr';

export {
  isLegStrengthExercise,
  evaluateSoftGuardrail,
  auditWeeklySchedule,
  type EvaluateGuardrailParams,
} from './guardrail';

export {
  calculateReadinessScore,
  type ReadinessScoreResult,
} from './readiness';

export {
  estimate1RM,
  detectPersonalRecord,
  calculateWeeklyMuscleVolume,
} from './strength1rm';

/**
 * Generates deterministic daily workout recommendation using single 1.4 ACWR guardrail.
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
