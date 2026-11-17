/**
 * RKStride - Atomic Workout & Debrief Repository
 * Single gateway for workoutLogs and postWorkoutDebrief persistence.
 */
import { db, type StoredDebrief } from './database';
import type {
  ACWRMethod,
  DailyLog,
  RunSession,
  StrengthExercise,
  WorkoutSessionEntry,
} from '@/contracts/workout.schema';
import {
  calculateACWR,
  calculateEdwardsTrimp,
  calculateRunningLoad,
  calculateStrengthLoad,
  calculateStrengthVolumeLoad,
} from '@/lib/engine/workload';
import { SRPE_CONFIG } from '@/lib/engine/constants';

export interface SaveWorkoutSessionInput {
  targetDate: string; // Local YYYY-MM-DD
  mode: 'append' | 'replace_session' | 'replace_day';
  sessionId?: string;
  strengthExercises: StrengthExercise[];
  runningSessions: RunSession[];
  isOverridden?: boolean;
}

export interface SaveWorkoutSessionResult {
  dailyLog: DailyLog;
  debrief: StoredDebrief;
}

function isLegExercise(ex: StrengthExercise): boolean {
  if (ex.isLegExercise) return true;
  if (ex.category === 'legs') return true;
  return /squat|deadlift|leg|calf|quad|hamstring|lunge|hip thrust/i.test(ex.namaGerakan);
}

function enrichRunningSession(run: RunSession, isOverridden?: boolean): RunSession {
  const sRpe = calculateRunningLoad(run);
  const trimp = calculateEdwardsTrimp(run);
  return {
    ...run,
    sRpe,
    trimp,
    ...(isOverridden ? { isOverridden: true } : {}),
  };
}

function computeSessionDurationMinutes(
  strength: StrengthExercise[],
  running: RunSession[]
): number {
  const strengthMins = strength.reduce(
    (sum, ex) =>
      sum + (ex.durationMinutes ?? ex.sets.length * SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET),
    0
  );
  const runMins = running.reduce((sum, r) => sum + r.durasiMenit, 0);
  return Math.round(strengthMins + runMins);
}

function aggregateDailyLog(dateKey: string, sessions: WorkoutSessionEntry[]): DailyLog {
  const strengthWorkouts = sessions.flatMap((s) => s.strengthWorkouts);
  const runningWorkouts = sessions.flatMap((s) => s.runningWorkouts);
  const totalLoadScore = Math.round(
    sessions.reduce((sum, s) => sum + s.sessionLoadScore, 0)
  );
  const volumeLoadSecondary = calculateStrengthVolumeLoad(strengthWorkouts);
  const runningTrimpSecondary =
    Math.round(runningWorkouts.reduce((sum, r) => sum + (r.trimp ?? calculateEdwardsTrimp(r)), 0) * 10) /
    10;

  return {
    tanggal: dateKey,
    strengthWorkouts,
    runningWorkouts,
    totalLoadScore,
    volumeLoadSecondary,
    runningTrimpSecondary,
    sessions,
  };
}

function generateSessionId(): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `sess_${Date.now()}_${rand}`;
}

export async function getAllWorkoutLogs(): Promise<DailyLog[]> {
  const logs = await db.workoutLogs.toArray();
  return logs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export async function getLatestDebrief(): Promise<StoredDebrief | undefined> {
  return db.postWorkoutDebrief.get('latest');
}

/**
 * Atomically persist a workout session (append / replace_session / replace_day)
 * and update postWorkoutDebrief in a single Dexie rw transaction.
 */
export async function saveWorkoutSessionAtomic(
  input: SaveWorkoutSessionInput,
  historySnapshot: DailyLog[],
  acwrMethod: ACWRMethod = 'rolling_coupled'
): Promise<SaveWorkoutSessionResult> {
  const enrichedRuns = input.runningSessions.map((r) =>
    enrichRunningSession(r, input.isOverridden)
  );
  const strengthLoad =
    input.strengthExercises.length > 0 ? calculateStrengthLoad(input.strengthExercises) : 0;
  const runLoad = enrichedRuns.reduce((sum, r) => sum + (r.sRpe ?? calculateRunningLoad(r)), 0);
  const sessionLoad = Math.round(strengthLoad + runLoad);
  const durationMinutes = computeSessionDurationMinutes(input.strengthExercises, enrichedRuns);

  const newSession: WorkoutSessionEntry = {
    sessionId: input.sessionId || generateSessionId(),
    loggedAt: new Date().toISOString(),
    strengthWorkouts: input.strengthExercises,
    runningWorkouts: enrichedRuns,
    sessionLoadScore: sessionLoad,
    durationMinutes,
    ...(input.isOverridden ? { isOverridden: true } : {}),
  };

  return db.transaction('rw', [db.workoutLogs, db.postWorkoutDebrief], async () => {
    const existing = await db.workoutLogs.get(input.targetDate);
    const existingSessions: WorkoutSessionEntry[] = existing?.sessions
      ? [...existing.sessions]
      : existing && (existing.strengthWorkouts.length > 0 || existing.runningWorkouts.length > 0)
      ? [
          {
            sessionId: `legacy-${existing.tanggal}`,
            loggedAt: `${existing.tanggal}T12:00:00`,
            strengthWorkouts: existing.strengthWorkouts,
            runningWorkouts: existing.runningWorkouts,
            sessionLoadScore: existing.totalLoadScore,
            durationMinutes: computeSessionDurationMinutes(
              existing.strengthWorkouts,
              existing.runningWorkouts
            ),
          },
        ]
      : [];

    let nextSessions: WorkoutSessionEntry[];
    if (input.mode === 'replace_day') {
      nextSessions = [newSession];
    } else if (input.mode === 'replace_session' && input.sessionId) {
      const idx = existingSessions.findIndex((s) => s.sessionId === input.sessionId);
      if (idx >= 0) {
        existingSessions[idx] = newSession;
        nextSessions = existingSessions;
      } else {
        nextSessions = [...existingSessions, newSession];
      }
    } else {
      nextSessions = [...existingSessions, newSession];
    }

    const dailyLog = aggregateDailyLog(input.targetDate, nextSessions);
    await db.workoutLogs.put(dailyLog);

    const updatedHistory = [...historySnapshot];
    const histIdx = updatedHistory.findIndex((h) => h.tanggal === input.targetDate);
    if (histIdx >= 0) {
      updatedHistory[histIdx] = dailyLog;
    } else {
      updatedHistory.unshift(dailyLog);
      updatedHistory.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    }

    const acwrAfter = calculateACWR(updatedHistory, acwrMethod);
    const hasLegWorkout = input.strengthExercises.some(isLegExercise);
    const hasUpperWorkout = input.strengthExercises.some((ex) => !isLegExercise(ex));

    const debrief: StoredDebrief = {
      id: 'latest',
      sessionLoad,
      projectedACWR: acwrAfter.ratio,
      acwrStatus: acwrAfter.status,
      hasLegWorkout,
      hasRunWorkout: enrichedRuns.length > 0,
      hasUpperWorkout,
      totalDurationMin: durationMinutes,
    };

    await db.postWorkoutDebrief.put(debrief);
    return { dailyLog, debrief };
  });
}

/**
 * Atomically remove a single workout session from a date's log.
 * Deletes the DailyLog row if no sessions remain on that date.
 */
export async function deleteWorkoutSessionAtomic(
  targetDate: string,
  sessionId: string
): Promise<DailyLog | null> {
  return db.transaction('rw', [db.workoutLogs], async () => {
    const existing = await db.workoutLogs.get(targetDate);
    if (!existing || !existing.sessions) return null;

    const remaining = existing.sessions.filter((s) => s.sessionId !== sessionId);
    if (remaining.length === 0) {
      await db.workoutLogs.delete(targetDate);
      return null;
    }

    const updated = aggregateDailyLog(targetDate, remaining);
    await db.workoutLogs.put(updated);
    return updated;
  });
}
