import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DailyLog,
  ReadinessCheckIn,
  ACWRResult,
  RecommendationResult,
  StrengthExercise,
  RunSession,
  WorkoutCategory,
} from '@/types/workout';
import { ScheduledDay, ScheduleConflict } from '@/types/schedule';
import {
  calculateStrengthLoad,
  calculateRunningLoad,
  calculateACWR,
  getWorkoutRecommendation,
  calculateReadinessScore,
  auditWeeklySchedule,
} from '@/lib/engine/workload';
import {
  SmartwatchDeviceState,
  ParsedSmartwatchData,
  connectUniversalSmartwatch,
  parseUniversalSmartwatchFile,
  SMARTWATCH_SAMPLE_PRESETS,
} from '@/lib/engine/smartwatch';
import { defaultWeeklySchedule, scheduleTemplates } from '@/data/defaultSchedule';
import { db } from '@/lib/db/database';

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
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduledDay[]>(defaultWeeklySchedule);
  const [dbError, setDbError] = useState<string | null>(null);

  // Reload all states from Dexie IndexedDB
  const reloadFromDb = useCallback(async () => {
    try {
      const logs = await db.workoutLogs.toArray();
      if (logs && logs.length > 0) {
        logs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
        setHistory(logs);
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const readiness = await db.dailyReadiness.get(todayStr);
      if (readiness) {
        setTodayReadinessState(readiness);
      }
      const schedule = await db.weeklySchedule.toArray();
      if (schedule && schedule.length > 0) {
        schedule.sort((a, b) => a.dayIndex - b.dayIndex);
        setWeeklySchedule(schedule);
      }
      setDbError(null);
    } catch (err) {
      console.error('Error reloading from Dexie DB:', err);
      setDbError('Database lokal tidak dapat dibaca. Data Anda aman; coba muat ulang halaman.');
    }
  }, []);

  useEffect(() => {
    reloadFromDb();
  }, [reloadFromDb]);

  // Persist readiness updates to Dexie IndexedDB
  const setTodayReadiness = useCallback((newReadiness: ReadinessCheckIn | ((prev: ReadinessCheckIn) => ReadinessCheckIn)) => {
    setTodayReadinessState((prev) => {
      const updated = typeof newReadiness === 'function' ? newReadiness(prev) : newReadiness;
      const todayStr = new Date().toISOString().split('T')[0];
      db.dailyReadiness.put({ ...updated, tanggal: todayStr }).catch(console.error);
      return updated;
    });
  }, []);

  // Smartwatch connection state. Phase 1: default to NOT connected.
  // No fabricated device name, battery, sync time, or heart rate.
  const [smartwatchState, setSmartwatchState] = useState<SmartwatchDeviceState>({
    connected: false,
    deviceName: 'Belum terhubung',
    brand: 'generic',
    batteryLevel: undefined,
    liveHeartRate: undefined,
    lastSyncTime: 'Belum ada sinkronisasi',
    source: 'manual_sync',
  });

  // Hours since last leg day session
  const lastLegsTrainedHoursAgo = useMemo(() => {
    const legWorkoutIndex = history.findIndex((w) =>
      w.strengthWorkouts.some((ex) =>
        /squat|leg|calf|quad|hamstring|lunge/i.test(ex.namaGerakan)
      )
    );
    if (legWorkoutIndex === -1) return 999;
    return legWorkoutIndex * 24;
  }, [history]);

  // Current ACWR calculation
  const acwrResult: ACWRResult = useMemo(() => {
    return calculateACWR(history);
  }, [history]);

  // Dynamic recommendation for today. Tomorrow's planned run (from the
  // weekly schedule) is passed through so the Recovery Exemption branch
  // (Zone 1-2 <= 45 min) is reachable from the app, not just from tests.
  const recommendation: RecommendationResult = useMemo(() => {
    const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
    const tomorrow = weeklySchedule.find((d) => d.dayIndex === (todayIdx + 1) % 7);
    const runTypeMap: Record<string, 'recovery' | 'easy' | 'tempo' | 'intervals' | 'norwegian_4x4' | 'long_run'> = {
      run_recovery: 'recovery',
      run_easy: 'easy',
      run_tempo: 'tempo',
      run_intervals: 'intervals',
      norwegian_4x4: 'norwegian_4x4',
      run_long: 'long_run',
    };
    const plannedRun = tomorrow && runTypeMap[tomorrow.category]
      ? { type: runTypeMap[tomorrow.category], durationMinutes: tomorrow.targetDurationMinutes }
      : undefined;
    return getWorkoutRecommendation(acwrResult.ratio, todayReadiness, lastLegsTrainedHoursAgo, 999, plannedRun);
  }, [acwrResult.ratio, lastLegsTrainedHoursAgo, todayReadiness, weeklySchedule]);

  // Composite readiness score (0 - 100)
  const readinessResult = useMemo(() => {
    return calculateReadinessScore(todayReadiness);
  }, [todayReadiness]);
  const readinessScore = readinessResult.score;

  // Weekly schedule conflict detector. Engine-based audit (both directions
  // + Recovery Exemption via auditWeeklySchedule) plus a complementary
  // cardio-density heuristic (3 consecutive runs).
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

      // If 3 consecutive days of running without recovery
      const prevIndex = (i - 1 + weeklySchedule.length) % weeklySchedule.length;
      const prev = weeklySchedule[prevIndex];
      const isRun = (cat: WorkoutCategory) => cat.startsWith('run_') || cat === 'norwegian_4x4';
      if (isRun(prev.category) && isRun(current.category) && isRun(next.category)) {
        conflicts.push({
          dayIndex: current.dayIndex,
          dayName: current.dayName,
          severity: 'warning',
          message: `Cardio Load Density: 3 consecutive running sessions (${prev.dayName}, ${current.dayName}, ${next.dayName}).`,
          suggestion: 'Insert an upper body resistance session (Push/Pull) or Active Recovery day between running sessions.',
        });
      }
    }

    return conflicts;
  }, [weeklySchedule, todayReadiness, readinessScore]);

  // Mengubah jadwal satu hari tertentu
  const updateDaySchedule = useCallback((dayIndex: number, updates: Partial<ScheduledDay>) => {
    setWeeklySchedule((prev) => {
      const next = prev.map((day) => (day.dayIndex === dayIndex ? { ...day, ...updates } : day));
      const target = next.find((d) => d.dayIndex === dayIndex);
      if (target) {
        db.weeklySchedule.put(target).catch(console.error);
      }
      return next;
    });
  }, []);

  // Menerapkan template jadwal yang tersedia
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
      db.weeklySchedule.bulkPut(next).catch(console.error);
      return next;
    });
  }, []);

  // Hubungkan Smartwatch via Bluetooth
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

  // Import smartwatch activity file
  const importSmartwatchFile = useCallback((fileContent: string, filename: string) => {
    const parsed: ParsedSmartwatchData = parseUniversalSmartwatchFile(fileContent, filename);

    // Update daily readiness
    setTodayReadiness((prev) => ({
      ...prev,
      sleepHours: parsed.sleepHours,
      restingHeartRate: parsed.restingHeartRate,
    }));

    setSmartwatchState({
      connected: true,
      deviceName: `${parsed.brandDetected.toUpperCase()} File (${filename})`,
      brand: parsed.brandDetected,
      batteryLevel: 88,
      liveHeartRate: parsed.restingHeartRate,
      lastSyncTime: `File Synced: ${parsed.date}`,
      source: 'file_export',
    });

    return parsed;
  }, []);

  // Apply smartwatch simulation preset
  const applyPreset = useCallback((presetKey: 'normal' | 'fatigued' | 'peak') => {
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
      deviceName: `${preset.brandDetected.toUpperCase()} Smartwatch [${presetKey.toUpperCase()}]`,
      brand: preset.brandDetected,
      batteryLevel: presetKey === 'fatigued' ? 24 : 95,
      liveHeartRate: preset.restingHeartRate,
      lastSyncTime: 'Preset Synced',
      source: 'preset',
    });
  }, []);

  // Real-time workload impact calculation
  const calculateProjectedImpact = useCallback(
    (draftStrength: StrengthExercise[], draftRunning: RunSession[]) => {
      let draftLoad = 0;
      if (draftStrength && draftStrength.length > 0) {
        draftLoad += calculateStrengthLoad(draftStrength);
      }
      if (draftRunning && draftRunning.length > 0) {
        draftLoad += draftRunning.reduce((acc, curr) => acc + calculateRunningLoad(curr), 0);
      }

      const projectedLoads = history.map((log, idx) => (idx === 0 ? draftLoad : log.totalLoadScore));
      const projectedAcute = projectedLoads.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
      const projectedChronic = projectedLoads.slice(0, 28).reduce((a, b) => a + b, 0) / 28;
      const projectedRatio = projectedChronic > 0 ? Math.round((projectedAcute / projectedChronic) * 100) / 100 : 1.0;

      let projectedStatus: ACWRResult['status'] = 'sweet_spot';
      let isOverloaded = false;
      let advice = 'Planned workload is in the optimal athletic adaptation zone (Sweet Spot 0.8 - 1.4).';

      if (projectedRatio > 1.4) {
        projectedStatus = 'danger';
        isOverloaded = true;
        advice = `Indikator Risiko Lonjakan Beban: Rasio proyeksi (${projectedRatio}) berada di Zona Bahaya (> 1.4). Kurangi volume atau intensitas kardio.`;
      } else if (projectedRatio < 0.8) {
        projectedStatus = 'undertraining';
        advice = `Stimulus ringan (${projectedRatio} ACWR). Aman untuk progressive overload bertahap.`;
      }

      const hasLegExerciseInDraft = draftStrength.some((ex) =>
        /squat|leg|calf|quad|hamstring|lunge/i.test(ex.namaGerakan)
      );
      const hasFastRunInDraft = draftRunning.some((r) => r.avgPace < 5.0 || r.avgHeartRate > 165 || r.runningType === 'norwegian_4x4' || r.runningType === 'intervals');

      const legConflict =
        lastLegsTrainedHoursAgo < 48 &&
        todayReadiness.legFatigue &&
        (hasLegExerciseInDraft || hasFastRunInDraft);

      const roundedDraftLoad = Math.round(draftLoad * 10) / 10;

      return {
        draftLoad: roundedDraftLoad,
        projectedACWR: projectedRatio,
        projectedStatus,
        isOverloaded,
        legConflict,
        advice,
      };
    },
    [history, lastLegsTrainedHoursAgo, todayReadiness]
  );

  // Simpan log latihan hari ini. isOverridden records an explicit
  // athlete override of an interference warning (advisory guardrail,
  // never hard-blocking) on the logged running sessions.
  const logTodayWorkout = useCallback(
    (params: {
      strengthExercises?: StrengthExercise[];
      runningSessions?: RunSession[];
      isOverridden?: boolean;
    }) => {
      let load = 0;
      if (params.strengthExercises && params.strengthExercises.length > 0) {
        load += calculateStrengthLoad(params.strengthExercises);
      }
      const runningSessions = (params.runningSessions || []).map((r) =>
        params.isOverridden ? { ...r, isOverridden: true } : r
      );
      if (runningSessions.length > 0) {
        load += runningSessions.reduce((acc, curr) => acc + calculateRunningLoad(curr), 0);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const newEntry: DailyLog = {
        tanggal: todayStr,
        strengthWorkouts: params.strengthExercises || [],
        runningWorkouts: runningSessions,
        totalLoadScore: load,
      };

      setHistory((prev) => {
        const updated = [...prev];
        const existingIdx = updated.findIndex((u) => u.tanggal === todayStr);
        if (existingIdx >= 0) {
          updated[existingIdx] = newEntry;
        } else {
          updated.unshift(newEntry);
        }
        return updated;
      });

      // Asynchronously persist to local IndexedDB
      db.workoutLogs.put(newEntry).catch((err) => {
        console.error('Failed to save workout log to IndexedDB:', err);
      });
    },
    []
  );

  return {
    history,
    todayReadiness,
    setTodayReadiness,
    acwrResult,
    recommendation,
    readinessScore,
    lastLegsTrainedHoursAgo,
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
    reloadFromDb,
    dbError,
  };
}
