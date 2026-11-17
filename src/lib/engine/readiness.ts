/**
 * RKStride - Personal Baseline Bio-Readiness (Z-Score) Engine
 */
import type { ReadinessCheckIn } from '@/types/workout';
import { READINESS_PROVISIONAL_DAYS, READINESS_Z_WEIGHTS } from './constants';

export interface ReadinessScoreResult {
  score: number;
  isProvisional: boolean;
  statusLabel: string;
  tendonAlert?: string;
}

/**
 * Calculate personalized readiness score (10-100) using individual baseline Z-Scores.
 * If data history < 7 days, returns a provisional estimation.
 */
export function calculateReadinessScore(
  today: ReadinessCheckIn,
  history14to28Days?: ReadinessCheckIn[]
): ReadinessScoreResult {
  const history = (history14to28Days || []).filter((h) => h !== undefined);
  const isProvisional = history.length < READINESS_PROVISIONAL_DAYS;

  let baseScore = 100;

  if (isProvisional) {
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
    const zRhr = -((today.restingHeartRate || 55) - rhrStats.mean) / rhrStats.std;
    const zHrv = today.hrvRmssd ? (today.hrvRmssd - hrvStats.mean) / hrvStats.std : 0;

    const subjectivePenalty =
      (today.muscleSoreness - 1) * 0.4 +
      (today.legFatigue ? 0.6 : 0) +
      (today.energyLevel === 'low' ? 0.8 : today.energyLevel === 'moderate' ? 0.2 : -0.3);

    const compositeZ =
      zSleep * READINESS_Z_WEIGHTS.SLEEP_DURATION +
      zRhr * READINESS_Z_WEIGHTS.RESTING_HR +
      zHrv * READINESS_Z_WEIGHTS.HRV_RMSSD -
      subjectivePenalty * READINESS_Z_WEIGHTS.SUBJECTIVE_DOMS_FATIGUE;

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
