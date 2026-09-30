import { useState, useMemo, useCallback } from 'react';
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
} from '@/lib/engine/workload';
import {
  SmartwatchDeviceState,
  ParsedSmartwatchData,
  connectUniversalSmartwatch,
  parseUniversalSmartwatchFile,
  SMARTWATCH_SAMPLE_PRESETS,
} from '@/lib/engine/smartwatch';
import { mock28DaysWorkoutHistory, mockReadinessToday } from '@/data/mockWorkoutHistory';
import { defaultWeeklySchedule, scheduleTemplates } from '@/data/defaultSchedule';

export function useWorkoutEngine() {
  const [history, setHistory] = useState<DailyLog[]>(mock28DaysWorkoutHistory);
  const [todayReadiness, setTodayReadiness] = useState<ReadinessCheckIn>(mockReadinessToday);
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduledDay[]>(defaultWeeklySchedule);

  // Universal Smartwatch Connection State
  const [smartwatchState, setSmartwatchState] = useState<SmartwatchDeviceState>({
    connected: true,
    deviceName: 'Garmin Forerunner 965',
    brand: 'garmin',
    batteryLevel: 82,
    liveHeartRate: 64,
    lastSyncTime: 'Synced 07:15 Today',
    source: 'preset',
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

  // Dynamic recommendation for today
  const recommendation: RecommendationResult = useMemo(() => {
    return getWorkoutRecommendation(acwrResult.ratio, todayReadiness, lastLegsTrainedHoursAgo);
  }, [acwrResult.ratio, lastLegsTrainedHoursAgo, todayReadiness]);

  // Composite readiness score (0 - 100)
  const readinessScore = useMemo(() => {
    return calculateReadinessScore(todayReadiness);
  }, [todayReadiness]);

  // Weekly schedule conflict detector
  const scheduleConflicts = useMemo<ScheduleConflict[]>(() => {
    const conflicts: ScheduleConflict[] = [];

    for (let i = 0; i < weeklySchedule.length; i++) {
      const current = weeklySchedule[i];
      const nextIndex = (i + 1) % weeklySchedule.length;
      const next = weeklySchedule[nextIndex];

      // If today is Legs and tomorrow is high intensity running (Tempo / Long Run / Norwegian 4x4)
      if (
        current.category === 'legs' &&
        (next.category === 'run_tempo' || next.category === 'run_long' || next.category === 'norwegian_4x4' || next.category === 'run_intervals')
      ) {
        conflicts.push({
          dayIndex: next.dayIndex,
          dayName: next.dayName,
          severity: 'danger',
          message: `Schedule Conflict: ${next.dayName} has ${next.title} scheduled immediately following ${current.dayName} (Leg Day).`,
          suggestion: `Reschedule ${next.dayName} to Easy Run / Upper Body / Rest Day to honor the 48-hour patellar and hamstring recovery window.`,
        });
      }

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
  }, [weeklySchedule]);

  // Mengubah jadwal satu hari tertentu
  const updateDaySchedule = useCallback((dayIndex: number, updates: Partial<ScheduledDay>) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => (day.dayIndex === dayIndex ? { ...day, ...updates } : day))
    );
  }, []);

  // Menerapkan template jadwal yang tersedia
  const applyScheduleTemplate = useCallback((templateId: string) => {
    const tpl = scheduleTemplates.find((t) => t.id === templateId);
    if (!tpl) return;

    setWeeklySchedule((prev) =>
      prev.map((existingDay, idx) => {
        const tplDay = tpl.schedule[idx];
        if (!tplDay) return existingDay;
        return {
          ...existingDay,
          category: tplDay.category,
          title: tplDay.title,
          targetDurationMinutes: tplDay.targetDurationMinutes,
          isRestDay: tplDay.isRestDay,
        };
      })
    );
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

      let projectedStatus: ACWRResult['status'] = 'optimal';
      let isOverloaded = false;
      let advice = 'Planned workload is in the optimal athletic adaptation zone (Sweet Spot 0.8 - 1.3).';

      if (projectedRatio > 1.4) {
        projectedStatus = 'danger_overtraining';
        isOverloaded = true;
        advice = `⚠️ ACWR SPIKE ALERT: Projected ratio (${projectedRatio}) exceeds safety threshold (> 1.4). Reduce sets or cardio intensity to prevent soft-tissue overtraining.`;
      } else if (projectedRatio < 0.8) {
        projectedStatus = 'safe';
        advice = `Light stimulus (${projectedRatio} ACWR). Safe for progressive overload or additional volume if energy permits.`;
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

  // Simpan log latihan hari ini
  const logTodayWorkout = useCallback(
    (params: {
      strengthExercises?: StrengthExercise[];
      runningSessions?: RunSession[];
    }) => {
      let load = 0;
      if (params.strengthExercises && params.strengthExercises.length > 0) {
        load += calculateStrengthLoad(params.strengthExercises);
      }
      if (params.runningSessions && params.runningSessions.length > 0) {
        load += params.runningSessions.reduce((acc, curr) => acc + calculateRunningLoad(curr), 0);
      }

      setHistory((prev) => {
        const updated = [...prev];
        updated[0] = {
          tanggal: new Date().toISOString().split('T')[0],
          strengthWorkouts: params.strengthExercises || [],
          runningWorkouts: params.runningSessions || [],
          totalLoadScore: load,
        };
        return updated;
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
  };
}
