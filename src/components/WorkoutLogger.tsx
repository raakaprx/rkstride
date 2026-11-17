import React, { useState, useMemo, useEffect } from 'react';
import { Save, CheckCircle, BookOpen, ChevronDown, ChevronUp, Calendar, Layers } from 'lucide-react';
import { StrengthExercise, RunSession, RunningType, ACWRStatus, ExperienceLevel } from '@/types/workout';
import { ScheduledDay } from '@/types/schedule';
import { GuardrailOverrideModal } from './GuardrailOverrideModal';
import { EXPERIENCE_COPY } from '@/lib/experienceCopy';
import { RUNNING_PRESETS } from '@/lib/engine/workload';
import { getLocalDateKey, getLocalDayIndex } from '@/lib/engine/dateKey';
import { isLegStrainMovement } from '@/hooks/useWorkoutEngine';
import { EXERCISE_CATALOG } from '@/data/exerciseCatalog';
import { FormulaGuideDrawer } from './logger/FormulaGuideDrawer';
import { StrengthSetBuilder } from './logger/StrengthSetBuilder';
import { RunningSessionPanel } from './logger/RunningSessionPanel';
import { WorkoutImpactSummary } from './logger/WorkoutImpactSummary';
import { RestTimerBar, playTimerChime } from './logger/RestTimerBar';

interface WorkoutLoggerProps {
  onSaveWorkout: (params: {
    strengthExercises?: StrengthExercise[];
    runningSessions?: RunSession[];
    isOverridden?: boolean;
    targetDate?: string;
    mode?: 'append' | 'replace_session' | 'replace_day';
  }) => void;
  calculateProjectedImpact: (
    draftStrength: StrengthExercise[],
    draftRunning: RunSession[]
  ) => {
    draftLoad: number;
    projectedACWR: number;
    projectedStatus: ACWRStatus;
    isOverloaded: boolean;
    legConflict: boolean;
    advice: string;
  };
  liveSmartwatchHeartRate?: number;
  lastLegsHoursAgo: number;
  experienceLevel?: ExperienceLevel;
  weeklySchedule?: ScheduledDay[];
  onWorkoutCompletedDebrief?: (data: {
    sessionLoad: number;
    projectedACWR: number;
    acwrStatus: ACWRStatus;
    hasLegWorkout: boolean;
    hasRunWorkout: boolean;
    hasUpperWorkout: boolean;
    totalDurationMin: number;
  }) => void;
}

const DEFAULT_STRENGTH: StrengthExercise[] = [
  {
    namaGerakan: 'Flat Barbell / Dumbbell Bench Press',
    category: 'push',
    sets: [
      { bebanKg: 80, reps: 8, rpe: 8 },
      { bebanKg: 80, reps: 8, rpe: 8 },
      { bebanKg: 80, reps: 7, rpe: 8.5 },
    ],
  },
  {
    namaGerakan: 'Overhead Barbell Press',
    category: 'push',
    sets: [
      { bebanKg: 50, reps: 10, rpe: 7.5 },
      { bebanKg: 50, reps: 9, rpe: 8 },
    ],
  },
];

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  onSaveWorkout,
  calculateProjectedImpact,
  liveSmartwatchHeartRate,
  lastLegsHoursAgo,
  experienceLevel = 'expert',
  weeklySchedule,
  onWorkoutCompletedDebrief,
}) => {
  const tierCopy = EXPERIENCE_COPY[experienceLevel];
  const [successSaved, setSuccessSaved] = useState(false);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);
  const [overrideArmed, setOverrideArmed] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(() => getLocalDateKey());
  const [saveMode, setSaveMode] = useState<'replace_day' | 'append'>('append');

  const [strengthList, setStrengthList] = useState<StrengthExercise[]>(DEFAULT_STRENGTH);
  const [selectedRunningPreset, setSelectedRunningPreset] = useState('norwegian_4x4');
  const [runningSession, setRunningSession] = useState<RunSession>({
    jarakKm: 6.5,
    durasiMenit: 44,
    avgPace: 6.8,
    avgHeartRate: liveSmartwatchHeartRate || 168,
    runningType: 'norwegian_4x4',
    blocks: RUNNING_PRESETS.norwegian_4x4.blocks,
  });

  const [useSensorlessRpe, setUseSensorlessRpe] = useState(false);
  const [sensorlessRpe, setSensorlessRpe] = useState(7);
  const [includeRunning, setIncludeRunning] = useState(true);
  const [includeStrength, setIncludeStrength] = useState(true);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (restSecondsRemaining === null) return;
    if (restSecondsRemaining <= 0) {
      playTimerChime();
      setRestSecondsRemaining(null);
      return;
    }
    const timer = setInterval(() => {
      setRestSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [restSecondsRemaining]);

  const todayPlan = useMemo(() => {
    if (!weeklySchedule || weeklySchedule.length === 0) return null;
    const idx = getLocalDayIndex();
    return weeklySchedule.find((d) => d.dayIndex === idx) ?? null;
  }, [weeklySchedule]);

  const handleLoadFromTodayPlan = () => {
    if (!todayPlan) return;
    const cat = todayPlan.category;
    if (cat === 'mobility_recovery') {
      setIncludeStrength(false);
      setIncludeRunning(false);
      return;
    }
    if (cat.startsWith('run_') || cat === 'norwegian_4x4') {
      setIncludeStrength(false);
      setIncludeRunning(true);
      const presetKey: keyof typeof RUNNING_PRESETS =
        cat === 'norwegian_4x4'
          ? 'norwegian_4x4'
          : cat === 'run_tempo'
          ? 'tempo_run'
          : cat === 'run_long'
          ? 'long_run'
          : 'easy_run';
      handleSelectRunningPreset(presetKey);
      return;
    }
    const matchingExercises = EXERCISE_CATALOG.filter((item) => item.category === cat).slice(0, 3);
    setIncludeStrength(true);
    setIncludeRunning(false);
    if (matchingExercises.length > 0) {
      setStrengthList(
        matchingExercises.map((item) => ({
          namaGerakan: item.name,
          category: item.category,
          isLegExercise: item.isLegStrain,
          sets: [
            { bebanKg: item.isLegStrain ? 60 : 40, reps: 8, rpe: 8 },
            { bebanKg: item.isLegStrain ? 60 : 40, reps: 8, rpe: 8 },
            { bebanKg: item.isLegStrain ? 60 : 40, reps: 8, rpe: 8 },
          ],
        }))
      );
    }
  };

  const activeRunToEvaluate = useMemo<RunSession>(() => {
    if (useSensorlessRpe) {
      return { ...runningSession, blocks: undefined, rpe: sensorlessRpe };
    }
    return runningSession;
  }, [runningSession, useSensorlessRpe, sensorlessRpe]);

  const projectedImpact = useMemo(() => {
    return calculateProjectedImpact(
      includeStrength ? strengthList : [],
      includeRunning && activeRunToEvaluate.durasiMenit > 0 ? [activeRunToEvaluate] : []
    );
  }, [calculateProjectedImpact, includeStrength, strengthList, includeRunning, activeRunToEvaluate]);

  const handleSelectRunningPreset = (presetKey: keyof typeof RUNNING_PRESETS) => {
    const preset = RUNNING_PRESETS[presetKey];
    setSelectedRunningPreset(presetKey);
    setUseSensorlessRpe(false);
    setRunningSession({
      jarakKm: preset.estimatedDistanceKm,
      durasiMenit: preset.durationMinutes,
      avgPace: Math.round((preset.durationMinutes / preset.estimatedDistanceKm) * 10) / 10,
      avgHeartRate:
        liveSmartwatchHeartRate ||
        (presetKey === 'norwegian_4x4' ? 168 : presetKey === 'easy_run' ? 138 : 155),
      runningType: preset.type as RunningType,
      blocks: preset.blocks,
    });
  };

  const handleRunningChange = (field: 'jarakKm' | 'durasiMenit' | 'avgHeartRate', value: number) => {
    setRunningSession((prev) => {
      const updated: RunSession = {
        ...prev,
        [field]: value,
        // Clear interval blocks on manual duration or HR edits so Edwards TRIMP uses the edited values
        blocks: field === 'durasiMenit' || field === 'avgHeartRate' ? undefined : prev.blocks,
      };
      if (field === 'jarakKm' || field === 'durasiMenit') {
        const dist = field === 'jarakKm' ? value : updated.jarakKm;
        const dur = field === 'durasiMenit' ? value : updated.durasiMenit;
        if (dist > 0 && dur > 0) {
          updated.avgPace = Math.round((dur / dist) * 100) / 100;
        }
      }
      return updated;
    });
  };

  const persistDraft = (withOverride: boolean) => {
    const s = includeStrength ? strengthList : [];
    const r = includeRunning && activeRunToEvaluate.durasiMenit > 0 ? [activeRunToEvaluate] : [];
    onSaveWorkout({
      strengthExercises: s,
      runningSessions: r,
      isOverridden: withOverride || undefined,
      targetDate,
      mode: saveMode,
    });
    setOverrideArmed(false);
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 3500);

    if (onWorkoutCompletedDebrief) {
      const hasLegWorkout = s.some((ex) => isLegStrainMovement(ex.namaGerakan, ex.category));
      const hasUpperWorkout = s.some((ex) => !isLegStrainMovement(ex.namaGerakan, ex.category));
      const hasRunWorkout = r.length > 0;
      const runningDuration = r.reduce((acc, curr) => acc + curr.durasiMenit, 0);
      const strengthDuration = s.reduce((acc, curr) => acc + curr.sets.length * 3, 0);
      onWorkoutCompletedDebrief({
        sessionLoad: projectedImpact.draftLoad,
        projectedACWR: projectedImpact.projectedACWR,
        acwrStatus: projectedImpact.projectedStatus,
        hasLegWorkout,
        hasRunWorkout,
        hasUpperWorkout,
        totalDurationMin: runningDuration + strengthDuration,
      });
    }
  };

  const handleSave = () => {
    if (projectedImpact.legConflict && !overrideArmed) {
      setShowOverrideModal(true);
      return;
    }
    persistDraft(overrideArmed);
  };

  return (
    <div
      className="card-mobile"
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-elevation-2)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {tierCopy.advisorEyebrow}
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            Interactive Workout Studio
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {tierCopy.loggerSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {todayPlan && (
            <button
              type="button"
              onClick={handleLoadFromTodayPlan}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-neon-subtle)',
                border: '1px solid rgba(204, 255, 0, 0.3)',
                color: 'var(--accent-neon)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Muat Menu Hari Ini ({todayPlan.title})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFormulaGuide(!showFormulaGuide)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              padding: '0.45rem 0.75rem',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={13} />
            <span>Scientific Formulas &amp; Logic</span>
            {showFormulaGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Date, Mode & Component Toggles */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <Calendar size={14} />
          <input
            type="date"
            aria-label="Tanggal latihan"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value || getLocalDateKey())}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '0.35rem 0.6rem',
              fontSize: '0.78rem',
            }}
          />
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <Layers size={14} />
          <select
            aria-label="Mode simpan sesi"
            value={saveMode}
            onChange={(e) => setSaveMode(e.target.value as 'append' | 'replace_day')}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              padding: '0.35rem 0.6rem',
              fontSize: '0.78rem',
            }}
          >
            <option value="append">Tambah Sesi (Multi-sesi)</option>
            <option value="replace_day">Timpa Log Hari Ini</option>
          </select>
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeStrength} onChange={(e) => setIncludeStrength(e.target.checked)} /> Strength
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={includeRunning} onChange={(e) => setIncludeRunning(e.target.checked)} /> Running
        </label>
      </div>

      <FormulaGuideDrawer isOpen={showFormulaGuide} />

      {includeStrength && (
        <StrengthSetBuilder
          strengthList={strengthList}
          onAddExercise={(ex) => setStrengthList((prev) => [...prev, ex])}
          onRemoveExercise={(idx) => setStrengthList((prev) => prev.filter((_, i) => i !== idx))}
          onAddSet={(exIdx) =>
            setStrengthList((prev) =>
              prev.map((ex, i) =>
                i === exIdx
                  ? { ...ex, sets: [...ex.sets, { ...(ex.sets[ex.sets.length - 1] ?? { bebanKg: 40, reps: 10, rpe: 8 }) }] }
                  : ex
              )
            )
          }
          onRemoveSet={(exIdx, setIdx) =>
            setStrengthList((prev) =>
              prev.map((ex, i) =>
                i === exIdx && ex.sets.length > 1 ? { ...ex, sets: ex.sets.filter((_, sIdx) => sIdx !== setIdx) } : ex
              )
            )
          }
          onUpdateSet={(exIdx, setIdx, field, value) =>
            setStrengthList((prev) =>
              prev.map((ex, i) =>
                i === exIdx
                  ? {
                      ...ex,
                      sets: ex.sets.map((s, sIdx) => (sIdx === setIdx ? { ...s, [field]: value } : s)),
                    }
                  : ex
              )
            )
          }
          onStartRestTimer={(seconds) => setRestSecondsRemaining(seconds)}
        />
      )}

      {includeRunning && (
        <RunningSessionPanel
          runningSession={runningSession}
          activeRunToEvaluate={activeRunToEvaluate}
          selectedPreset={selectedRunningPreset}
          useSensorlessRpe={useSensorlessRpe}
          sensorlessRpe={sensorlessRpe}
          liveSmartwatchHeartRate={liveSmartwatchHeartRate}
          onSelectPreset={handleSelectRunningPreset}
          onChangeField={handleRunningChange}
          onToggleSensorlessRpe={setUseSensorlessRpe}
          onChangeSensorlessRpe={setSensorlessRpe}
        />
      )}

      <WorkoutImpactSummary
        projectedImpact={projectedImpact}
        lastLegsHoursAgo={lastLegsHoursAgo}
        onOpenOverrideModal={() => setShowOverrideModal(true)}
      />

      <div className="save-workout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        {successSaved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.88rem', fontWeight: 600 }}>
            <CheckCircle size={18} /> Workout Successfully Logged &amp; ACWR Updated!
          </span>
        )}
        <button
          type="button"
          className="btn-save-workout"
          onClick={handleSave}
          aria-label="Save & Log Today's Workout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.5rem',
            minHeight: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-neon)',
            color: 'var(--text-inverse)',
            fontSize: '0.92rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(204, 255, 0, 0.18)',
            touchAction: 'manipulation',
          }}
        >
          <Save size={18} />
          Save &amp; Log Today&apos;s Workout
        </button>
      </div>

      <GuardrailOverrideModal
        isOpen={showOverrideModal}
        conflictSummary={`Sesi kaki terakhir ${lastLegsHoursAgo} jam lalu. Mencatat sesi kaki berat atau lari cepat sekarang melewati jendela pemulihan 48 jam.`}
        onCancel={() => setShowOverrideModal(false)}
        onConfirm={() => {
          setShowOverrideModal(false);
          setOverrideArmed(true);
          persistDraft(true);
        }}
      />

      <RestTimerBar
        restSecondsRemaining={restSecondsRemaining}
        onAdd30Seconds={() => setRestSecondsRemaining((prev) => (prev || 0) + 30)}
        onDismiss={() => setRestSecondsRemaining(null)}
      />
    </div>
  );
};
