/**
 * RKStride - ACWR Calculation & Live Projection Engine
 * Supports Rolling Coupled, Rolling Uncoupled, and EWMA with 21-day Cold-Start Guard.
 */
import type {
  ACWRMethod,
  ACWRResult,
  ACWRStatus,
  DailyLog,
  RunSession,
  StrengthExercise,
} from '@/types/workout';
import {
  ACWR_COLD_START_MIN_DAYS,
  ACWR_THRESHOLDS,
  EWMA_LAMBDA,
  WEEKLY_LOAD_SPIKE_THRESHOLD_PERCENT,
} from './constants';
import { calculateRunningLoad, calculateStrengthLoad } from './loadMetrics';
import { isLegStrengthExercise } from './guardrail';

/**
 * Detect weekly workload spikes (Weekly Load Increase > 15%).
 */
export function detectWeeklyLoadSpike(history28Days: DailyLog[]): {
  spikeAlert: boolean;
  spikePercent: number;
} {
  if (!history28Days || history28Days.length < 14) {
    return { spikeAlert: false, spikePercent: 0 };
  }

  const currentWeekLoad = history28Days
    .slice(0, 7)
    .reduce((sum, l) => sum + (l.totalLoadScore || 0), 0);
  const previousWeekLoad = history28Days
    .slice(7, 14)
    .reduce((sum, l) => sum + (l.totalLoadScore || 0), 0);

  if (previousWeekLoad <= 0) {
    return { spikeAlert: false, spikePercent: 0 };
  }

  const percentChange = Math.round(((currentWeekLoad - previousWeekLoad) / previousWeekLoad) * 100);
  const spikeAlert = percentChange > WEEKLY_LOAD_SPIKE_THRESHOLD_PERCENT;

  return { spikeAlert, spikePercent: percentChange };
}

/**
 * Calculate Exponentially Weighted Moving Average (EWMA) for a chronological load series.
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
 * Comprehensive ACWR Calculation Engine with 21-day Cold-Start Guard and single 1.4 threshold.
 */
export function calculateACWR(
  history28Days: DailyLog[],
  method: ACWRMethod = 'rolling_coupled'
): ACWRResult {
  const validLogs = history28Days || [];
  const daysCollected = validLogs.filter((l) => l.totalLoadScore !== undefined).length;
  const isColdStart = daysCollected < ACWR_COLD_START_MIN_DAYS;
  const coldStartProgressPercent = Math.min(
    100,
    Math.round((daysCollected / ACWR_COLD_START_MIN_DAYS) * 100)
  );

  const loads: number[] = validLogs.map((log) => log.totalLoadScore || 0);
  while (loads.length < 28) {
    loads.push(0);
  }

  let acuteLoad = 0;
  let chronicLoad = 0;

  if (method === 'ewma') {
    const chronologicalLoads = [...loads.slice(0, 28)].reverse();
    acuteLoad = calculateEWMALoad(chronologicalLoads, EWMA_LAMBDA.ACUTE);
    chronicLoad = calculateEWMALoad(chronologicalLoads, EWMA_LAMBDA.CHRONIC);
  } else if (method === 'rolling_uncoupled') {
    const acuteSum = loads.slice(0, 7).reduce((sum, val) => sum + val, 0);
    acuteLoad = Math.round((acuteSum / 7) * 10) / 10;

    const chronicSlice = loads.slice(7, 28);
    const chronicSum = chronicSlice.reduce((sum, val) => sum + val, 0);
    chronicLoad = Math.round((chronicSum / 21) * 10) / 10;
  } else {
    const acuteSum = loads.slice(0, 7).reduce((sum, val) => sum + val, 0);
    acuteLoad = Math.round((acuteSum / 7) * 10) / 10;

    const chronicSum = loads.slice(0, 28).reduce((sum, val) => sum + val, 0);
    chronicLoad = Math.round((chronicSum / 28) * 10) / 10;
  }

  let ratio = 1.0;
  if (chronicLoad > 0) {
    ratio = Math.round((acuteLoad / chronicLoad) * 100) / 100;
  }

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

export interface ProjectACWRImpactParams {
  history: DailyLog[];
  targetDate: string;
  draftStrength: StrengthExercise[];
  draftRunning: RunSession[];
  lastLegsHoursAgo: number;
  legFatigue: boolean;
  method?: ACWRMethod;
  appendToExistingDay?: boolean;
}

export interface ProjectedImpactResult {
  draftLoad: number;
  projectedACWR: number;
  projectedStatus: ACWRStatus;
  isOverloaded: boolean;
  legConflict: boolean;
  advice: string;
}

/**
 * Live workout ACWR projection that respects the 21-day Cold-Start Guard
 * and merges with targetDate rather than blindly overwriting history[0].
 */
export function projectACWRImpact(params: ProjectACWRImpactParams): ProjectedImpactResult {
  const {
    history,
    targetDate,
    draftStrength,
    draftRunning,
    lastLegsHoursAgo,
    legFatigue,
    method = 'rolling_coupled',
    appendToExistingDay = true,
  } = params;

  let draftLoad = 0;
  if (draftStrength.length > 0) {
    draftLoad += calculateStrengthLoad(draftStrength);
  }
  if (draftRunning.length > 0) {
    draftLoad += draftRunning.reduce((acc, curr) => acc + calculateRunningLoad(curr), 0);
  }

  const simulatedHistory = [...history];
  const existingIdx = simulatedHistory.findIndex((log) => log.tanggal === targetDate);
  if (existingIdx >= 0) {
    const existing = simulatedHistory[existingIdx];
    const combinedLoad = appendToExistingDay ? existing.totalLoadScore + draftLoad : draftLoad;
    simulatedHistory[existingIdx] = {
      ...existing,
      totalLoadScore: combinedLoad,
    };
  } else {
    simulatedHistory.unshift({
      tanggal: targetDate,
      strengthWorkouts: draftStrength,
      runningWorkouts: draftRunning,
      totalLoadScore: draftLoad,
    });
    simulatedHistory.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }

  const projectedAcwr = calculateACWR(simulatedHistory, method);
  const isColdStart = projectedAcwr.status === 'insufficient_data';
  const isOverloaded = !isColdStart && projectedAcwr.status === 'danger';

  let advice = 'Planned workload is in the optimal athletic adaptation zone (Sweet Spot 0.8 - 1.4).';
  if (isColdStart) {
    advice = `Fase pengumpulan baseline (${projectedAcwr.daysCollected}/${ACWR_COLD_START_MIN_DAYS} hari). Catat sesi secara konsisten sebelum ACWR dievaluasi.`;
  } else if (isOverloaded) {
    advice = `Indikator Risiko Lonjakan Beban: Rasio proyeksi (${projectedAcwr.ratio}) berada di Zona Bahaya (> 1.4). Kurangi volume atau intensitas kardio.`;
  } else if (projectedAcwr.status === 'undertraining') {
    advice = `Stimulus ringan (${projectedAcwr.ratio} ACWR). Aman untuk progressive overload bertahap.`;
  }

  const hasLegExerciseInDraft = draftStrength.some((ex) => isLegStrengthExercise(ex));
  const hasFastRunInDraft = draftRunning.some(
    (r) =>
      r.avgPace < 5.0 ||
      r.avgHeartRate > 165 ||
      r.runningType === 'norwegian_4x4' ||
      r.runningType === 'intervals'
  );

  const legConflict =
    lastLegsHoursAgo < 48 && legFatigue && (hasLegExerciseInDraft || hasFastRunInDraft);

  return {
    draftLoad: Math.round(draftLoad * 10) / 10,
    projectedACWR: projectedAcwr.ratio,
    projectedStatus: projectedAcwr.status,
    isOverloaded,
    legConflict,
    advice,
  };
}
