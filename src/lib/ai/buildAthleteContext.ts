/**
 * RKStride - Honest Athlete Telemetry Context Builder
 * Derives AI Coach context strictly from measured DailyLog and Readiness records.
 */
import type { AthleteContext } from './geminiCoach';
import type { ACWRResult, DailyLog, ReadinessCheckIn } from '@/types/workout';

export interface BuildAthleteContextParams {
  acwrResult: ACWRResult;
  todayReadiness: ReadinessCheckIn;
  readinessScore: number;
  lastLegsHoursAgo: number;
  latestDailyLog?: DailyLog;
}

export function buildAthleteContext(params: BuildAthleteContextParams): AthleteContext {
  const { acwrResult, todayReadiness, readinessScore, lastLegsHoursAgo, latestDailyLog } = params;

  let recentWorkoutSummary: AthleteContext['recentWorkoutSummary'];
  if (latestDailyLog) {
    const runningMinutes = latestDailyLog.runningWorkouts.reduce(
      (sum, r) => sum + (r.durasiMenit || 0),
      0
    );
    const runningKm =
      Math.round(
        latestDailyLog.runningWorkouts.reduce((sum, r) => sum + (r.jarakKm || 0), 0) * 10
      ) / 10;

    recentWorkoutSummary = {
      strengthExercisesCount: latestDailyLog.strengthWorkouts.length,
      runningMinutes,
      runningKm,
      totalLoadScore: latestDailyLog.totalLoadScore,
    };
  }

  return {
    acwrRatio: acwrResult.ratio,
    acwrStatus: acwrResult.status,
    acuteLoad: acwrResult.acuteLoad,
    chronicLoad: acwrResult.chronicLoad,
    readiness: todayReadiness,
    readinessScore,
    lastLegsHoursAgo,
    recentWorkoutSummary,
  };
}
