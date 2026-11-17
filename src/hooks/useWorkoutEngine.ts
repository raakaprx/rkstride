import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  DailyLog,
  ReadinessCheckIn,
  ACWRResult,
  ACWRMethod,
  RecommendationResult,
  StrengthExercise,
  RunSession,
  WorkoutCategory,
  WorkoutSessionEntry,
} from '@/types/workout';
import { ScheduledDay, ScheduleConflict } from '@/types/schedule';
import {
  calculateStrengthLoad,
  calculateRunningLoad,
  calculateACWR,
  projectACWRImpact,
  isLegStrengthExercise,
  getWorkoutRecommendation,
  calculateReadinessScore,
  auditWeeklySchedule,
} from '@/lib/engine/workload';
import {
  getLocalDateKey,
  diffHoursBetweenDateKeys,
  getLocalDayIndex,
} from '@/lib/engine/dateKey';
import {
  SmartwatchDeviceState,
  ParsedSmartwatchData,
  connectUniversalSmartwatch,
  parseUniversalSmartwatchFile,
  SMARTWATCH_SAMPLE_PRESETS,
} from '@/lib/engine/smartwatch';
import { defaultWeeklySchedule, scheduleTemplates } from '@/data/defaultSchedule';
import {
  getAllWorkoutLogs,
  saveWorkoutSessionAtomic,
  deleteWorkoutSessionAtomic,
} from '@/lib/db/workoutRepo';
import {
  getReadinessByDate,
  getRecentReadinessHistory,
  saveDailyReadiness,
} from '@/lib/db/readinessRepo';
import {
  loadAcwrMethod,
  saveAcwrMethod,
  loadWeeklySchedule,
  saveScheduledDay,
  saveWeeklyScheduleBulk,
} from '@/lib/db/profileRepo';

function isMissingIndexedDbError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'MissingAPIError' || err.message.includes('IndexedDB API missing'))
  );
}

export function isLegStrainMovement(namaGerakan: string, category?: WorkoutCategory): boolean {
  return isLegStrengthExercise({ namaGerakan, category });
}

/**
 * Neutral readiness for a fresh user (no measurements yet).
 * restingHeartRate is intentionally omitted so the UI renders
 * "Belum diukur" instead of a fabricated fallback number.
 */
export const neutralReadiness: ReadinessCheckIn = {
  sleepHours: 7,
  muscleSoreness: 2,
  legFatigue: false,
  energyLevel: 'moderate',
};

export function useWorkoutEngine() {
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [todayReadiness, setTodayReadinessState] = useState<ReadinessCheckIn>(neutralReadiness);
  const [readinessHistory, setReadinessHistory] = useState<ReadinessCheckIn[]>([]);
  const [acwrMethod, setAcwrMethodState] = useState<ACWRMethod>('rolling_coupled');
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduledDay[]>(defaultWeeklySchedule);
  const [dbError, setDbError] = useState<string | null>(null);

  const historyRef = useRef<DailyLog[]>(history);
  historyRef.current = history;

  // Reload all states from Dexie IndexedDB via repositories
  const reloadFromDb = useCallback(async () => {
    try {
      const todayStr = getLocalDateKey();
      const [logs, readiness, allReadiness, schedule, storedMethod] = await Promise.all([
        getAllWorkoutLogs(),
        getReadinessByDate(todayStr),
        getRecentReadinessHistory(28),
        loadWeeklySchedule(),
        loadAcwrMethod(),
      ]);

      setHistory(logs);
      setTodayReadinessState(readiness ?? neutralReadiness);
      setReadinessHistory(allReadiness);
      setWeeklySchedule(schedule.length > 0 ? schedule : defaultWeeklySchedule);
      setAcwrMethodState(storedMethod);
      setDbError(null);
    } catch (err) {
      if (isMissingIndexedDbError(err)) {
        return;
      }
      console.error('Error reloading from Dexie DB:', err);
      setDbError('Database lokal tidak dapat dibaca. Data Anda aman; coba muat ulang halaman.');
    }
  }, []);

  useEffect(() => {
    reloadFromDb();
  }, [reloadFromDb]);

  const setAcwrMethod = useCallback((method: ACWRMethod) => {
    setAcwrMethodState(method);
    saveAcwrMethod(method).catch((err) => {
      if (!isMissingIndexedDbError(err)) {
        console.error('Failed to persist ACWR method:', err);
      }
    });
  }, []);

  // Persist readiness updates to Dexie IndexedDB via readinessRepo
  const setTodayReadiness = useCallback(
    (newReadiness: ReadinessCheckIn | ((prev: ReadinessCheckIn) => ReadinessCheckIn)) => {
      setTodayReadinessState((prev) => {
        const updated = typeof newReadiness === 'function' ? newReadiness(prev) : newReadiness;
        const todayStr = getLocalDateKey();
        saveDailyReadiness(todayStr, updated).catch((err) => {
          if (!isMissingIndexedDbError(err)) {
            console.error('Failed to save daily readiness:', err);
          }
        });
        return updated;
      });
    },
    []
  );

  // Smartwatch connection state. Default to NOT connected (no fabricated metrics).
  const [smartwatchState, setSmartwatchState] = useState<SmartwatchDeviceState>({
    connected: false,
    deviceName: 'Belum terhubung',
    brand: 'generic',
    batteryLevel: undefined,
    liveHeartRate: undefined,
    lastSyncTime: 'Belum ada sinkronisasi',
    source: 'manual_sync',
  });

  // Hours since last leg day session using actual local date keys
  const lastLegsTrainedHoursAgo = useMemo(() => {
    const todayStr = getLocalDateKey();
    const legLog = history.find((w) =>
      w.strengthWorkouts.some((ex) => isLegStrengthExercise(ex))
    );
    if (!legLog) return 999;
    return Math.max(0, diffHoursBetweenDateKeys(legLog.tanggal, todayStr));
  }, [history]);

  // Hours since last high-intensity running session using actual local date keys
  const lastFastRunHoursAgo = useMemo(() => {
    const todayStr = getLocalDateKey();
    const fastRunLog = history.find((w) =>
      w.runningWorkouts.some(
        (r) =>
          r.runningType === 'norwegian_4x4' ||
          r.runningType === 'intervals' ||
          r.runningType === 'tempo' ||
          r.avgPace < 5.0 ||
          r.avgHeartRate > 165
      )
    );
    if (!fastRunLog) return 999;
    return Math.max(0, diffHoursBetweenDateKeys(fastRunLog.tanggal, todayStr));
  }, [history]);

  // Current ACWR calculation
  const acwrResult: ACWRResult = useMemo(() => {
    return calculateACWR(history, acwrMethod);
  }, [history, acwrMethod]);

  // Dynamic recommendation for today
  const recommendation: RecommendationResult = useMemo(() => {
    const todayIdx = getLocalDayIndex();
    const tomorrow = weeklySchedule.find((d) => d.dayIndex === (todayIdx + 1) % 7);
    const runTypeMap: Record<
      string,
      'recovery' | 'easy' | 'tempo' | 'intervals' | 'norwegian_4x4' | 'long_run'
    > = {
      run_recovery: 'recovery',
      run_easy: 'easy',
      run_tempo: 'tempo',
      run_intervals: 'intervals',
      norwegian_4x4: 'norwegian_4x4',
      run_long: 'long_run',
    };
    const plannedRun =
      tomorrow && runTypeMap[tomorrow.category]
        ? { type: runTypeMap[tomorrow.category], durationMinutes: tomorrow.targetDurationMinutes }
        : undefined;
    return getWorkoutRecommendation(
      acwrResult.ratio,
      todayReadiness,
      lastLegsTrainedHoursAgo,
      lastFastRunHoursAgo,
      plannedRun
    );
  }, [acwrResult.ratio, lastLegsTrainedHoursAgo, lastFastRunHoursAgo, todayReadiness, weeklySchedule]);

  // Composite readiness score (0 - 100) using 14-28 day personal Z-Score baseline when available
  const readinessResult = useMemo(() => {
    return calculateReadinessScore(todayReadiness, readinessHistory);
  }, [todayReadiness, readinessHistory]);
  const readinessScore = readinessResult.score;

  // Weekly schedule conflict detector
  const scheduleConflicts = useMemo<ScheduleConflict[]>(() => {
    const conflicts: ScheduleConflict[] = auditWeeklySchedule(
      weeklySchedule,
      todayReadiness,
      readinessScore
    );

    for (let i = 0; i < weeklySchedule.length; i++) {
      const current = weeklySchedule[i];
      const nextIndex = (i + 1) % weeklySchedule.length;
      const next = weeklySchedule[nextIndex];
      const prevIndex = (i - 1 + weeklySchedule.length) % weeklySchedule.length;
      const prev = weeklySchedule[prevIndex];
      const isRun = (cat: WorkoutCategory) => cat.startsWith('run_') || cat === 'norwegian_4x4';
      if (isRun(prev.category) && isRun(current.category) && isRun(next.category)) {
        conflicts.push({
          dayIndex: current.dayIndex,
          dayName: current.dayName,
          severity: 'warning',
          message: `Cardio Load Density: 3 consecutive running sessions (${prev.dayName}, ${current.dayName}, ${next.dayName}).`,
          suggestion:
            'Insert an upper body resistance session (Push/Pull) or Active Recovery day between running sessions.',
        });
      }
    }

    return conflicts;
  }, [weeklySchedule, todayReadiness, readinessScore]);

  // Update a single day's schedule
  const updateDaySchedule = useCallback((dayIndex: number, updates: Partial<ScheduledDay>) => {
    setWeeklySchedule((prev) => {
      const next = prev.map((day) => (day.dayIndex === dayIndex ? { ...day, ...updates } : day));
      const target = next.find((d) => d.dayIndex === dayIndex);
      if (target) {
        saveScheduledDay(target).catch((err) => {
          if (!isMissingIndexedDbError(err)) {
            console.error('Failed to save scheduled day:', err);
          }
        });
      }
      return next;
    });
  }, []);

  // Apply a schedule template
  const applyScheduleTemplate = useCallback(async (templateId: string) => {
    const tpl = scheduleTemplates.find((t) => t.id === templateId);
    if (!tpl) return;

    setWeeklySchedule((prev) => {
      const next = prev.map((existingDay, idx) => {
        const tplDay = tpl.schedule[idx];
        if (!tplDay) return existingDay;
        return {
          ...existingDay,
          category: tplDay.category,
          title: tplDay.title,
          targetDurationMinutes: tplDay.targetDurationMinutes,
          isRestDay: tplDay.isRestDay,
        };
      });
      saveWeeklyScheduleBulk(next).catch((err) => {
        if (!isMissingIndexedDbError(err)) {
          console.error('Failed to save weekly schedule template:', err);
        }
      });
      return next;
    });
  }, []);

  // Connect Smartwatch via Web Bluetooth
  const connectBluetooth = useCallback(async () => {
    const res = await connectUniversalSmartwatch((liveHr) => {
      setSmartwatchState((prev) => ({
        ...prev,
        liveHeartRate: liveHr,
        connected: true,
      }));
    });

    if (res.success) {
      setSmartwatchState((prev) => ({
        ...prev,
        connected: true,
        deviceName: res.deviceName,
        brand: res.brand,
        lastSyncTime: 'Just Now via Web Bluetooth',
        source: 'bluetooth',
      }));
    }
    return res;
  }, []);

  // Real-time workload impact projection (enforces 21-day Cold-Start Guard & acwrMethod)
  const calculateProjectedImpact = useCallback(
    (draftStrength: StrengthExercise[], draftRunning: RunSession[]) => {
      return projectACWRImpact({
        history,
        targetDate: getLocalDateKey(),
        draftStrength,
        draftRunning,
        lastLegsHoursAgo: lastLegsTrainedHoursAgo,
        legFatigue: todayReadiness.legFatigue,
        method: acwrMethod,
        appendToExistingDay: false,
      });
    },
    [history, lastLegsTrainedHoursAgo, todayReadiness.legFatigue, acwrMethod]
  );

  // Save workout session (supports append / replace_session / replace_day)
  const logTodayWorkout = useCallback(
    (params: {
      strengthExercises?: StrengthExercise[];
      runningSessions?: RunSession[];
      isOverridden?: boolean;
      targetDate?: string;
      mode?: 'append' | 'replace_session' | 'replace_day';
      sessionId?: string;
    }) => {
      const targetDate = params.targetDate || getLocalDateKey();
      const mode = params.mode || 'replace_day';
      const strengthExercises = params.strengthExercises || [];
      const runningSessions = (params.runningSessions || []).map((r) =>
        params.isOverridden ? { ...r, isOverridden: true } : r
      );

      const sRpeLoad = strengthExercises.length > 0 ? calculateStrengthLoad(strengthExercises) : 0;
      const trimpLoad = runningSessions.reduce((acc, curr) => acc + calculateRunningLoad(curr), 0);
      const sessionLoad = Math.round((sRpeLoad + trimpLoad) * 10) / 10;
      const strengthDuration = strengthExercises.reduce(
        (sum, ex) => sum + (ex.durationMinutes ?? ex.sets.length * 3),
        0
      );
      const runningDuration = runningSessions.reduce((sum, r) => sum + r.durasiMenit, 0);

      const newSession: WorkoutSessionEntry = {
        sessionId: params.sessionId || `${targetDate}-${Date.now()}`,
        loggedAt: new Date().toISOString(),
        strengthWorkouts: strengthExercises,
        runningWorkouts: runningSessions,
        sessionLoadScore: sessionLoad,
        durationMinutes: Math.round((strengthDuration + runningDuration) * 10) / 10,
        isOverridden: params.isOverridden,
      };

      const prevSnapshot = historyRef.current;

      setHistory((prev) => {
        const updated = [...prev];
        const existingIdx = updated.findIndex((u) => u.tanggal === targetDate);
        const existing = existingIdx >= 0 ? updated[existingIdx] : undefined;

        let nextSessions: WorkoutSessionEntry[];
        if (mode === 'append' && existing) {
          const base: WorkoutSessionEntry[] = existing.sessions ?? [
            {
              sessionId: `${targetDate}-legacy`,
              loggedAt: `${targetDate}T12:00:00.000Z`,
              strengthWorkouts: existing.strengthWorkouts,
              runningWorkouts: existing.runningWorkouts,
              sessionLoadScore: existing.totalLoadScore,
              durationMinutes: 0,
            },
          ];
          nextSessions = [...base, newSession];
        } else if (mode === 'replace_session' && existing && params.sessionId) {
          const base = existing.sessions ?? [];
          nextSessions = base.map((s) => (s.sessionId === params.sessionId ? newSession : s));
        } else {
          nextSessions = [newSession];
        }

        const mergedStrength = nextSessions.flatMap((s) => s.strengthWorkouts);
        const mergedRunning = nextSessions.flatMap((s) => s.runningWorkouts);
        const totalLoad = Math.round(
          nextSessions.reduce((sum, s) => sum + s.sessionLoadScore, 0) * 10
        ) / 10;
        const totalSrpe = Math.round(
          (mergedStrength.length > 0 ? calculateStrengthLoad(mergedStrength) : 0) * 10
        ) / 10;
        const totalTrimp = Math.round(
          mergedRunning.reduce((sum, r) => sum + calculateRunningLoad(r), 0) * 10
        ) / 10;

        const newEntry: DailyLog = {
          tanggal: targetDate,
          sessions: nextSessions,
          strengthWorkouts: mergedStrength,
          runningWorkouts: mergedRunning,
          totalLoadScore: totalLoad,
          volumeLoadSecondary: totalSrpe,
          runningTrimpSecondary: totalTrimp,
        };

        if (existingIdx >= 0) {
          updated[existingIdx] = newEntry;
        } else {
          updated.unshift(newEntry);
          updated.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
        }
        return updated;
      });

      saveWorkoutSessionAtomic(
        {
          targetDate,
          mode,
          sessionId: params.sessionId,
          strengthExercises,
          runningSessions,
          isOverridden: params.isOverridden,
        },
        prevSnapshot,
        acwrMethod
      ).catch((err) => {
        if (isMissingIndexedDbError(err)) return;
        console.error('Failed to save workout log atomically:', err);
        setDbError('Gagal menyimpan log latihan ke database lokal.');
      });
    },
    [acwrMethod]
  );

  // Delete a specific workout session atomically
  const deleteWorkoutSession = useCallback(async (targetDate: string, sessionId: string) => {
    try {
      const updatedLog = await deleteWorkoutSessionAtomic(targetDate, sessionId);
      setHistory((prev) => {
        if (!updatedLog) {
          return prev.filter((d) => d.tanggal !== targetDate);
        }
        return prev.map((d) => (d.tanggal === targetDate ? updatedLog : d));
      });
      setDbError(null);
    } catch (err) {
      if (isMissingIndexedDbError(err)) return;
      console.error('Failed to delete workout session:', err);
      setDbError('Gagal menghapus sesi latihan.');
    }
  }, []);

  // Import smartwatch activity file
  const importSmartwatchFile = useCallback(
    (fileContent: string, filename: string) => {
      const parsed: ParsedSmartwatchData = parseUniversalSmartwatchFile(fileContent, filename);
      if (parsed.parseError) {
        return parsed;
      }

      setTodayReadiness((prev) => ({
        ...prev,
        sleepHours: parsed.sleepHours,
        restingHeartRate: parsed.restingHeartRate,
      }));

      if (parsed.workoutDetected && parsed.workoutDetected.durationMinutes > 0) {
        const detectedRun: RunSession = {
          jarakKm:
            parsed.workoutDetected.distanceKm ||
            Math.round(parsed.workoutDetected.durationMinutes * 0.16 * 10) / 10,
          durasiMenit: parsed.workoutDetected.durationMinutes,
          avgPace: parsed.workoutDetected.avgPace || 5.4,
          avgHeartRate: parsed.workoutDetected.avgHeartRate || 148,
          runningType: (parsed.workoutDetected.avgHeartRate || 148) > 165 ? 'intervals' : 'easy',
        };
        const entryDate = parsed.date || getLocalDateKey();
        logTodayWorkout({
          targetDate: entryDate,
          mode: 'append',
          runningSessions: [detectedRun],
        });
      }

      setSmartwatchState({
        connected: true,
        deviceName: `${parsed.brandDetected.toUpperCase()} File (${filename})`,
        brand: parsed.brandDetected,
        batteryLevel: undefined,
        liveHeartRate: parsed.restingHeartRate,
        lastSyncTime: `File Disinkronkan: ${parsed.date}`,
        source: 'file_export',
      });

      return parsed;
    },
    [logTodayWorkout, setTodayReadiness]
  );

  // Apply smartwatch simulation preset (explicitly marked [SIMULASI], no fabricated battery)
  const applyPreset = useCallback(
    (presetKey: 'normal' | 'fatigued' | 'peak') => {
      const preset = SMARTWATCH_SAMPLE_PRESETS[presetKey];
      setTodayReadiness((prev) => ({
        ...prev,
        sleepHours: preset.sleepHours,
        restingHeartRate: preset.restingHeartRate,
        muscleSoreness: presetKey === 'fatigued' ? 4 : presetKey === 'normal' ? 2 : 1,
        legFatigue: presetKey === 'fatigued',
        energyLevel: presetKey === 'fatigued' ? 'low' : presetKey === 'normal' ? 'moderate' : 'high',
      }));

      setSmartwatchState({
        connected: true,
        deviceName: `[SIMULASI] ${preset.brandDetected.toUpperCase()} Smartwatch [${presetKey.toUpperCase()}]`,
        brand: preset.brandDetected,
        batteryLevel: undefined,
        liveHeartRate: preset.restingHeartRate,
        lastSyncTime: 'Preset Simulasi Aktif',
        source: 'preset',
      });
    },
    [setTodayReadiness]
  );

  return {
    history,
    todayReadiness,
    setTodayReadiness,
    acwrMethod,
    setAcwrMethod,
    acwrResult,
    recommendation,
    readinessScore,
    readinessResult,
    lastLegsTrainedHoursAgo,
    lastFastRunHoursAgo,
    weeklySchedule,
    scheduleConflicts,
    updateDaySchedule,
    applyScheduleTemplate,
    smartwatchState,
    connectBluetooth,
    importSmartwatchFile,
    applyPreset,
    calculateProjectedImpact,
    logTodayWorkout,
    deleteWorkoutSession,
    reloadFromDb,
    dbError,
  };
}
