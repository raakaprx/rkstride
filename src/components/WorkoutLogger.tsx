import React, { useState, useMemo, useEffect } from 'react';
import {
  Dumbbell,
  Timer,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Watch,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { StrengthExercise, RunSession, RunningType, ACWRStatus } from '@/types/workout';
import { GuardrailOverrideModal } from './GuardrailOverrideModal';
import {
  calculateStrengthLoad,
  calculateRunningLoad,
  RUNNING_PRESETS,
  ZONE_WEIGHTS,
} from '@/lib/engine/workload';
import { evaluateDoubleProgression } from '@/lib/engine/doubleProgression';
import {
  EXERCISE_CATALOG,
  ExerciseCategory,
  ExerciseType,
} from '@/data/exerciseCatalog';

interface WorkoutLoggerProps {
  onSaveWorkout: (params: {
    strengthExercises?: StrengthExercise[];
    runningSessions?: RunSession[];
    isOverridden?: boolean;
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

export const WorkoutLogger: React.FC<WorkoutLoggerProps> = ({
  onSaveWorkout,
  calculateProjectedImpact,
  liveSmartwatchHeartRate,
  lastLegsHoursAgo,
  onWorkoutCompletedDebrief,
}) => {
  const [successSaved, setSuccessSaved] = useState(false);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);

  // Advisory guardrail override: armed only after explicit athlete confirmation.
  const [overrideArmed, setOverrideArmed] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Category and Type Filters for Movement Selection
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ExerciseType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // Selected Strength Exercises List
  const [strengthList, setStrengthList] = useState<StrengthExercise[]>([
    {
      namaGerakan: 'Flat Barbell / Dumbbell Bench Press',
      sets: [
        { bebanKg: 80, reps: 8, rpe: 8 },
        { bebanKg: 80, reps: 8, rpe: 8 },
        { bebanKg: 80, reps: 7, rpe: 8.5 },
      ],
    },
    {
      namaGerakan: 'Incline Dumbbell Press',
      sets: [
        { bebanKg: 28, reps: 10, rpe: 7.5 },
        { bebanKg: 28, reps: 10, rpe: 8 },
      ],
    },
  ]);

  // Selected Running Session State
  const [selectedRunningPreset, setSelectedRunningPreset] = useState<string>('norwegian_4x4');
  const [runningSession, setRunningSession] = useState<RunSession>({
    jarakKm: RUNNING_PRESETS.norwegian_4x4.estimatedDistanceKm,
    durasiMenit: RUNNING_PRESETS.norwegian_4x4.durationMinutes,
    avgPace: 4.8,
    avgHeartRate: liveSmartwatchHeartRate || 168,
    runningType: 'norwegian_4x4',
    blocks: RUNNING_PRESETS.norwegian_4x4.blocks,
  });

  const [useSensorlessRpe, setUseSensorlessRpe] = useState(false);
  const [sensorlessRpe, setSensorlessRpe] = useState(7);

  const [includeRunning, setIncludeRunning] = useState(true);
  const [includeStrength, setIncludeStrength] = useState(true);

  // Interactive Rest Timer State
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);

  // Audio notification when rest timer completes (Web Audio API - offline & asset-free)
  const playTimerChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {
      // AudioContext unavailable
    }
  };

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

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return EXERCISE_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchType = selectedType === 'all' || item.type === selectedType;
      const matchSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.targetMuscles.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchType && matchSearch;
    });
  }, [selectedCategory, selectedType, searchQuery]);

  // Current Running Session to evaluate
  const activeRunToEvaluate = useMemo<RunSession>(() => {
    if (useSensorlessRpe) {
      return {
        ...runningSession,
        avgHeartRate: 0,
        blocks: undefined,
        rpe: sensorlessRpe,
      };
    }
    return runningSession;
  }, [runningSession, useSensorlessRpe, sensorlessRpe]);

  // Real-Time Workload Impact Evaluation
  const projectedImpact = useMemo(() => {
    const s = includeStrength ? strengthList : [];
    const r = includeRunning && activeRunToEvaluate.durasiMenit > 0 ? [activeRunToEvaluate] : [];
    return calculateProjectedImpact(s, r);
  }, [includeStrength, strengthList, includeRunning, activeRunToEvaluate, calculateProjectedImpact]);

  // Add exercise from catalog
  const handleAddFromCatalog = () => {
    const found = EXERCISE_CATALOG.find((e) => e.id === selectedExerciseId);
    if (!found) return;

    const isBw = found.type === 'bodyweight';
    setStrengthList((prev) => [
      ...prev,
      {
        namaGerakan: found.name,
        sets: [
          { bebanKg: isBw ? 0 : 40, reps: isBw ? 12 : 10, rpe: 8 },
          { bebanKg: isBw ? 0 : 40, reps: isBw ? 12 : 10, rpe: 8 },
          { bebanKg: isBw ? 0 : 40, reps: isBw ? 10 : 8, rpe: 8.5 },
        ],
      },
    ]);
    setSelectedExerciseId('');
  };

  // Modify strength set
  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: 'bebanKg' | 'reps' | 'rpe',
    value: number
  ) => {
    setStrengthList((prev) => {
      const copy = [...prev];
      const ex = { ...copy[exIndex] };
      const sets = [...ex.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      ex.sets = sets;
      copy[exIndex] = ex;
      return copy;
    });
  };

  // Add set
  const handleAddSet = (exIndex: number) => {
    setStrengthList((prev) => {
      const copy = [...prev];
      const ex = { ...copy[exIndex] };
      const lastSet = ex.sets[ex.sets.length - 1] || { bebanKg: 40, reps: 10, rpe: 8 };
      ex.sets = [...ex.sets, { ...lastSet }];
      copy[exIndex] = ex;
      return copy;
    });
  };

  // Remove set
  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    setStrengthList((prev) => {
      const copy = [...prev];
      const ex = { ...copy[exIndex] };
      if (ex.sets.length <= 1) return prev;
      ex.sets = ex.sets.filter((_, i) => i !== setIndex);
      copy[exIndex] = ex;
      return copy;
    });
  };

  // Remove exercise
  const handleRemoveExercise = (index: number) => {
    setStrengthList((prev) => prev.filter((_, i) => i !== index));
  };

  // Apply running preset
  const handleSelectRunningPreset = (presetKey: keyof typeof RUNNING_PRESETS) => {
    const preset = RUNNING_PRESETS[presetKey];
    setSelectedRunningPreset(presetKey);
    setUseSensorlessRpe(false);
    setRunningSession({
      jarakKm: preset.estimatedDistanceKm,
      durasiMenit: preset.durationMinutes,
      avgPace: Math.round((preset.durationMinutes / preset.estimatedDistanceKm) * 10) / 10,
      avgHeartRate: liveSmartwatchHeartRate || (presetKey === 'norwegian_4x4' ? 168 : presetKey === 'easy_run' ? 138 : 155),
      runningType: preset.type as RunningType,
      blocks: preset.blocks,
    });
  };

  // Save workout. Advisory gate: a leg-recovery conflict opens the explicit
  // override modal instead of saving; saving is never hard-blocked.
  const persistDraft = (withOverride: boolean) => {
    const s = includeStrength ? strengthList : [];
    const r = includeRunning && activeRunToEvaluate.durasiMenit > 0 ? [activeRunToEvaluate] : [];
    onSaveWorkout({
      strengthExercises: s,
      runningSessions: r,
      isOverridden: withOverride || undefined,
    });
    setOverrideArmed(false);
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 3500);

    if (onWorkoutCompletedDebrief) {
      const hasLegWorkout = s.some((ex) => /squat|leg|calf|quad|hamstring|lunge/i.test(ex.namaGerakan));
      const hasUpperWorkout = s.some((ex) => !/squat|leg|calf|quad|hamstring|lunge/i.test(ex.namaGerakan));
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

  // Advisory gate entry point for the Save button.
  const handleSave = () => {
    if (projectedImpact.legConflict && !overrideArmed) {
      setShowOverrideModal(true);
      return;
    }
    persistDraft(overrideArmed);
  };

  // Update running inputs
  const handleRunningChange = (field: keyof RunSession, value: number) => {
    setRunningSession((prev) => {
      const updated = { ...prev, [field]: value };
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

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-elevation-2)',
      }}
    >
      {/* Main Header & Component Toggles */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--accent-neon)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Interactive Workout Studio
            </span>
            <button
              onClick={() => setShowFormulaGuide(!showFormulaGuide)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'var(--transition-fast)',
              }}
            >
              <BookOpen size={13} />
              <span>Scientific Formulas &amp; Logic</span>
              {showFormulaGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.25rem' }}>
            Workout Logging &amp; Real-Time Workload Test
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Configure strength movements (Push, Pull, Legs, Arms, Core) and cardio running spectrum to simulate instantaneous ACWR impact.
          </p>
        </div>

        {/* Mode Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setIncludeStrength(!includeStrength)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: includeStrength ? '1px solid var(--accent-neon)' : '1px solid var(--border-subtle)',
              background: includeStrength ? 'rgba(204, 255, 0, 0.15)' : 'var(--bg-secondary)',
              color: includeStrength ? 'var(--accent-neon)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Dumbbell size={15} /> Strength Training {includeStrength ? '✓' : ''}
          </button>

          <button
            onClick={() => setIncludeRunning(!includeRunning)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: includeRunning ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
              background: includeRunning ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-secondary)',
              color: includeRunning ? '#38bdf8' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Timer size={15} /> Running Session {includeRunning ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Scientific Formula Guide (Collapsible) */}
      {showFormulaGuide && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem' }}>
            🔬 Sports Science Foundation &amp; Mathematical Engines in RKStride
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: '1rem',
            }}
          >
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--accent-neon)', fontSize: '0.85rem' }}>
                1. Strength Volume Load (Foster Session-RPE)
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Derived from <em>Session-RPE &amp; Tonnage by Dr. Carl Foster</em>:
                <div style={{ fontFamily: 'monospace', color: '#FFF', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '4px', margin: '0.35rem 0' }}>
                  Load = (Weight_kg × Reps) × (RPE / 10) × 0.1
                </div>
                RPE measures proximity to failure (RIR). RPE 10 provides 100% stimulus, whereas RPE 7 provides 70%.
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
                2. Running Spectrum &amp; Heart Rate TRIMP
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Block-based accumulation across Heart Rate Zones:
                <div style={{ fontFamily: 'monospace', color: '#FFF', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '4px', margin: '0.35rem 0' }}>
                  Total Load = sum(Duration_min × Zone_Weight)
                </div>
                Z1=1.0, Z2=1.2, Z3=1.5, Z4=2.2, Z5=3.5. Fallback without HR monitor: Duration × (RPE / 2).
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>
                3. ACWR Guardrail (Dr. Tim Gabbett)
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
                Ratio of Acute Load (7-day average) to Chronic Load (28-day average):
                <div style={{ fontFamily: 'monospace', color: '#FFF', background: 'var(--bg-secondary)', padding: '0.3rem 0.5rem', borderRadius: '4px', margin: '0.35rem 0' }}>
                  ACWR = Acute_Load (7d) / Chronic_Load (28d)
                </div>
                0.8–1.3 is the adaptation sweet spot. ACWR &gt; 1.4 signifies acute overload and triggers emergency deload.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: STRENGTH EXERCISE SELECTOR & SET BUILDER */}
      {includeStrength && (
        <div style={{ marginBottom: '2.5rem' }}>
          {/* Sub-section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Dumbbell size={20} style={{ color: 'var(--accent-neon)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                1. Movement Catalog &amp; Sets (Push, Pull, Legs, Arms, Core)
              </h3>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Total Strength Load: <strong style={{ color: 'var(--accent-neon)' }}>{calculateStrengthLoad(strengthList)} pts</strong>
            </div>
          </div>

          {/* Catalog Selector Card */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
            }}
          >
            {/* Category Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Target Muscle:
              </span>
              {(
                [
                  { id: 'all', label: 'All Categories' },
                  { id: 'push', label: 'PUSH (Chest, Shoulders, Triceps)' },
                  { id: 'pull', label: 'PULL (Back, Biceps)' },
                  { id: 'legs', label: 'LEGS (Quads, Glutes, Hamstrings)' },
                  { id: 'arms', label: 'ARMS (Isolation)' },
                  { id: 'core', label: 'CORE & STABILIZERS' },
                ] as const
              ).map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedExerciseId('');
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'rgba(204, 255, 0, 0.08)' : 'var(--bg-surface)',
                      color: isActive ? 'var(--accent-neon)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.78rem',
                      border: isActive ? '1px solid rgba(204, 255, 0, 0.35)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Search Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-surface)',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                marginBottom: '1rem',
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search exercise name or target muscle (e.g., bench, squat, pull-up, hamstring, tibialis)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                                  }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Type Selector & Dropdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
                gap: '1rem',
                alignItems: 'flex-end',
              }}
            >
              {/* Type Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Exercise Modality
                </label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {(
                    [
                      { id: 'all', label: 'All Modalities' },
                      { id: 'bodyweight', label: 'Calisthenics / Bodyweight' },
                      { id: 'gym', label: 'Gym Free Weights & Machines' },
                    ] as const
                  ).map((t) => {
                    const isActive = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedType(t.id);
                          setSelectedExerciseId('');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-surface)',
                          color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.75rem',
                          border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-default)',
                          cursor: 'pointer',
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Exercise Dropdown */}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Select Specific Exercise ({filteredCatalog.length} Available)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                                            cursor: 'pointer',
                    }}
                  >
                    <option value="">-- Choose Exercise from Catalog --</option>
                    {filteredCatalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.category.toUpperCase()}] {item.name} ({item.type === 'bodyweight' ? 'Bodyweight' : 'Gym'})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddFromCatalog}
                    disabled={!selectedExerciseId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.55rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedExerciseId ? 'var(--accent-neon)' : 'var(--bg-surface-elevated)',
                      color: selectedExerciseId ? '#09090b' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      border: 'none',
                      cursor: selectedExerciseId ? 'pointer' : 'not-allowed',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <Plus size={16} /> Add Exercise
                  </button>
                </div>
              </div>
            </div>

            {/* Exercise Details Card */}
            {selectedExerciseId && (
              <div style={{ marginTop: '0.85rem', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', fontSize: '0.78rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                {(() => {
                  const ex = EXERCISE_CATALOG.find((e) => e.id === selectedExerciseId);
                  if (!ex) return null;
                  return (
                    <div>
                      <strong style={{ color: '#FFFFFF' }}>Target Muscles:</strong> {ex.targetMuscles} &bull;{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{ex.description}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Active Logged Exercises List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {strengthList.map((exercise, exIdx) => {
              const exLoad = exercise.sets.reduce((sum, s) => {
                const rpe = Math.min(Math.max(s.rpe, 1), 10);
                return sum + s.bebanKg * s.reps * (rpe / 10);
              }, 0);
              const isLegExercise = /squat|leg|calf|quad|hamstring|lunge/i.test(exercise.namaGerakan);

              return (
                <div
                  key={exIdx}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    border: isLegExercise && lastLegsHoursAgo < 48 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-default)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {exIdx + 1}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {exercise.namaGerakan}
                      </h4>
                      {isLegExercise && lastLegsHoursAgo < 48 && (
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', fontWeight: 600 }}>
                          Leg Day &lt; 48h Caution
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Volume Load: <strong style={{ color: '#FFFFFF' }}>{Math.round(exLoad * 0.1)} pts</strong>
                      </span>
                      <button
                        onClick={() => handleRemoveExercise(exIdx)}
                        title="Remove Exercise"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                          <th style={{ padding: '0.4rem 0.5rem', width: '60px' }}>Set #</th>
                          <th style={{ padding: '0.4rem 0.5rem' }}>Weight (kg)</th>
                          <th style={{ padding: '0.4rem 0.5rem' }}>Reps</th>
                          <th style={{ padding: '0.4rem 0.5rem' }}>RPE (1-10)</th>
                          <th style={{ padding: '0.4rem 0.5rem' }}>Set Score</th>
                          <th style={{ padding: '0.4rem 0.5rem', width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, sIdx) => {
                          const setScore = Math.round(set.bebanKg * set.reps * (Math.min(Math.max(set.rpe, 1), 10) / 10) * 0.1);
                          return (
                            <tr key={sIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                #{sIdx + 1}
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <input
                                  type="number"
                                  min={0}
                                  step={2.5}
                                  value={set.bebanKg}
                                  onChange={(e) => handleUpdateSet(exIdx, sIdx, 'bebanKg', parseFloat(e.target.value) || 0)}
                                  style={{
                                    width: '80px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#FFFFFF',
                                    padding: '0.35rem 0.5rem',
                                    fontSize: '0.85rem',
                                                                      }}
                                />
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <input
                                  type="number"
                                  min={1}
                                  value={set.reps}
                                  onChange={(e) => handleUpdateSet(exIdx, sIdx, 'reps', parseInt(e.target.value, 10) || 1)}
                                  style={{
                                    width: '70px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#FFFFFF',
                                    padding: '0.35rem 0.5rem',
                                    fontSize: '0.85rem',
                                                                      }}
                                />
                              </td>
                              <td style={{ padding: '0.5rem' }}>
                                <select
                                  value={set.rpe}
                                  onChange={(e) => handleUpdateSet(exIdx, sIdx, 'rpe', parseFloat(e.target.value) || 8)}
                                  style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#FFFFFF',
                                    padding: '0.35rem 0.5rem',
                                    fontSize: '0.85rem',
                                                                        cursor: 'pointer',
                                  }}
                                >
                                  <option value={6}>6 (Warm-up / 4 RIR)</option>
                                  <option value={7}>7 (Moderate / 3 RIR)</option>
                                  <option value={7.5}>7.5 (2-3 RIR)</option>
                                  <option value={8}>8 (Solid effort / 2 RIR)</option>
                                  <option value={8.5}>8.5 (1-2 RIR)</option>
                                  <option value={9}>9 (Heavy / 1 RIR)</option>
                                  <option value={9.5}>9.5 (Near Failure / 0-1 RIR)</option>
                                  <option value={10}>10 (Absolute Max / 0 RIR)</option>
                                </select>
                              </td>
                              <td style={{ padding: '0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                                {setScore} pts
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                {exercise.sets.length > 1 && (
                                  <button
                                    onClick={() => handleRemoveSet(exIdx, sIdx)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Exercise Actions & Rest Timer */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleAddSet(exIdx)}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                      >
                        <Plus size={14} /> Add Set
                      </button>

                      <button
                        onClick={() => {
                          setRestSecondsRemaining(90);
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                      >
                        <Timer size={13} style={{ color: 'var(--accent-neon)' }} />
                        <span>Rest 90s</span>
                      </button>
                    </div>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Double Progression (8-10 reps @ RPE &le; 8)
                    </span>
                  </div>

                  {/* Double Progression Suggestion Badge */}
                  {(() => {
                    const prog = evaluateDoubleProgression(exercise.namaGerakan, exercise.sets, 8, 10);
                    return (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: prog.shouldIncreaseWeight ? 'rgba(204, 255, 0, 0.08)' : 'var(--bg-surface)',
                          border: prog.shouldIncreaseWeight ? '1px solid rgba(204, 255, 0, 0.3)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <TrendingUp size={14} style={{ color: prog.shouldIncreaseWeight ? 'var(--accent-neon)' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.75rem', color: '#FFFFFF', fontWeight: 600 }}>
                            {prog.message}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: prog.shouldIncreaseWeight ? 'var(--accent-neon)' : 'var(--text-muted)', fontWeight: 700 }}>
                          {prog.nextSessionGoal}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: RUNNING & CARDIO SPECTRUM */}
      {includeRunning && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Timer size={20} style={{ color: '#38bdf8' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                2. Running Spectrum &amp; TRIMP Workload
              </h3>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Running Workload Score: <strong style={{ color: '#38bdf8' }}>{calculateRunningLoad(activeRunToEvaluate)} pts</strong>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Quick Running Presets Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Select Running Protocol Preset:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {Object.entries(RUNNING_PRESETS).map(([key, p]) => {
                  const isSelected = selectedRunningPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectRunningPreset(key as keyof typeof RUNNING_PRESETS)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-surface)',
                        color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.78rem',
                        border: isSelected ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid var(--border-default)',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interval Breakdown Timeline & Rounded Chips */}
            {runningSession.blocks && runningSession.blocks.length > 0 && !useSensorlessRpe && (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Zap size={14} style={{ color: '#38bdf8' }} /> Interval Structure ({runningSession.blocks.length} segments &bull; {runningSession.durasiMenit} min total):
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#FFFFFF', fontWeight: 700 }}>
                    Accumulated: <span style={{ color: '#38bdf8' }}>{calculateRunningLoad(runningSession)} pts</span>
                  </div>
                </div>

                {/* Segmented Timeline Progress Bar */}
                <div
                  style={{
                    display: 'flex',
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                    gap: '2px',
                    marginBottom: '0.75rem',
                  }}
                >
                  {(() => {
                    const totalMins = runningSession.blocks.reduce((acc, b) => acc + b.durationMinutes, 0) || 1;
                    return runningSession.blocks.map((b, idx) => {
                      const pct = (b.durationMinutes / totalMins) * 100;
                      const barColor =
                        b.zone === 5
                          ? '#ef4444'
                          : b.zone === 4
                          ? '#a855f7'
                          : b.zone === 3
                          ? '#f59e0b'
                          : b.zone === 2
                          ? '#38bdf8'
                          : '#64748b';
                      return (
                        <div
                          key={idx}
                          title={`${b.durationMinutes}m Zone ${b.zone}`}
                          style={{
                            width: `${pct}%`,
                            background: barColor,
                            transition: 'var(--transition-fast)',
                          }}
                        />
                      );
                    });
                  })()}
                </div>

                {/* Clean Rounded Badges (No Floating Point Bug) */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {runningSession.blocks.map((b, bIdx) => {
                    // Precision Rounding: fixes 3.5999999999999996 -> 3.6
                    const roundedLoad = Math.round(b.durationMinutes * ZONE_WEIGHTS[b.zone] * 10) / 10;
                    const zoneDotColor =
                      b.zone === 5
                        ? '#ef4444'
                        : b.zone === 4
                        ? '#a855f7'
                        : b.zone === 3
                        ? '#f59e0b'
                        : b.zone === 2
                        ? '#38bdf8'
                        : '#64748b';

                    return (
                      <div
                        key={bIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: '#E2E8F0',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: zoneDotColor,
                          }}
                        />
                        <span style={{ fontWeight: 700 }}>{b.durationMinutes}m</span>
                        <span style={{ color: 'var(--text-muted)' }}>Z{b.zone}</span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>({roundedLoad} pts)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Running Parameters Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              {/* Distance */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Distance (km)
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  value={runningSession.jarakKm}
                  onChange={(e) => handleRunningChange('jarakKm', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                                      }}
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={runningSession.durasiMenit}
                  onChange={(e) => handleRunningChange('durasiMenit', parseInt(e.target.value, 10) || 1)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                                      }}
                />
              </div>

              {/* Pace */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Calculated Pace (min/km)
                </label>
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                >
                  {runningSession.avgPace} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min/km</span>
                </div>
              </div>

              {/* Heart Rate / Fallback Toggle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Avg Heart Rate (bpm)
                  </label>
                  {liveSmartwatchHeartRate && (
                    <button
                      onClick={() => handleRunningChange('avgHeartRate', liveSmartwatchHeartRate)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-neon)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Watch size={11} /> Sync Watch ({liveSmartwatchHeartRate})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min={80}
                  max={220}
                  disabled={useSensorlessRpe}
                  value={runningSession.avgHeartRate}
                  onChange={(e) => handleRunningChange('avgHeartRate', parseInt(e.target.value, 10) || 120)}
                  style={{
                    width: '100%',
                    background: useSensorlessRpe ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: useSensorlessRpe ? 'var(--text-muted)' : '#FFFFFF',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                                      }}
                />
              </div>
            </div>

            {/* Sensorless RPE Fallback Option */}
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="rpeFallbackCheck"
                  checked={useSensorlessRpe}
                  onChange={(e) => setUseSensorlessRpe(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="rpeFallbackCheck" style={{ fontSize: '0.8rem', color: '#FFFFFF', cursor: 'pointer' }}>
                  Running without Heart Rate Sensor (Use RPE Fallback: Duration × (RPE / 2))
                </label>
              </div>

              {useSensorlessRpe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>RPE Intensity:</span>
                  <select
                    value={sensorlessRpe}
                    onChange={(e) => setSensorlessRpe(parseInt(e.target.value, 10) || 7)}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--accent-neon)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-neon)',
                      padding: '0.25rem 0.5rem',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {[4, 5, 6, 7, 8, 9, 10].map((r) => (
                      <option key={r} value={r}>
                        RPE {r} ({Math.round(runningSession.durasiMenit * (r / 2) * 10) / 10} pts)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: REAL-TIME WORKLOAD IMPACT & SAFETY CHECK */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-default)',
          borderLeft: projectedImpact.isOverloaded
            ? '3px solid var(--color-danger)'
            : projectedImpact.legConflict
            ? '3px solid var(--color-warning)'
            : '3px solid var(--accent-neon)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={17} style={{ color: projectedImpact.isOverloaded ? 'var(--color-danger)' : 'var(--accent-neon)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
              Planned Workout Evaluation (Live Safety &amp; ACWR Check)
            </h4>
          </div>

          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: projectedImpact.isOverloaded
                ? 'var(--color-danger-bg)'
                : projectedImpact.legConflict
                ? 'var(--color-warning-bg)'
                : 'var(--accent-neon-subtle)',
              color: projectedImpact.isOverloaded
                ? 'var(--color-danger)'
                : projectedImpact.legConflict
                ? 'var(--color-warning)'
                : 'var(--accent-neon)',
              border: projectedImpact.isOverloaded
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : projectedImpact.legConflict
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid rgba(204, 255, 0, 0.25)',
              letterSpacing: '0.04em',
            }}
          >
            {projectedImpact.isOverloaded
              ? 'WORKLOAD OVERLOAD'
              : projectedImpact.legConflict
              ? 'LEG RECOVERY CAUTION'
              : 'OPTIMAL (BALANCED)'}
          </span>
        </div>

        {/* Load Score & Projected ACWR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planned Session Load</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
              {projectedImpact.draftLoad} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>pts</span>
            </div>
          </div>

          <div style={{ width: '1px', height: '35px', background: 'var(--border-subtle)' }} />

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected ACWR Post-Workout</div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: projectedImpact.isOverloaded ? 'var(--color-danger)' : 'var(--accent-neon)',
              }}
            >
              {projectedImpact.projectedACWR}
            </div>
          </div>

          <div style={{ width: '1px', height: '35px', background: 'var(--border-subtle)' }} />

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engine Diagnostic</div>
            <div style={{ fontSize: '0.82rem', color: '#FFFFFF', lineHeight: 1.4 }}>
              {projectedImpact.advice}
            </div>
          </div>
        </div>

        {/* Leg Day 48h Conflict Notice (advisory: confirm override or adjust plan) */}
        {projectedImpact.legConflict && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-surface)',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--color-warning)',
              fontSize: '0.78rem',
              color: 'var(--color-warning)',
              flexWrap: 'wrap',
            }}
          >
            <AlertTriangle size={16} />
            <span style={{ flex: 1, minWidth: '220px' }}>
              Caution: Previous leg day completed only {lastLegsHoursAgo}h ago. Avoid heavy quadriceps loading or high-speed intervals today to safeguard knee tendons and hamstrings.
            </span>
            <button
              onClick={() => setShowOverrideModal(true)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--color-warning)',
                color: 'var(--color-warning)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Lanjutkan tetap
            </button>
          </div>
        )}
      </div>

      {/* Save & Confirm Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        {successSaved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
            <CheckCircle size={16} /> Workout Successfully Logged &amp; ACWR Updated!
          </span>
        )}

        <button
          onClick={handleSave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-neon)',
            color: '#09090b',
            fontSize: '0.88rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(204, 255, 0, 0.18)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Save size={17} />
          Save &amp; Log Today&apos;s Workout
        </button>
      </div>

      {/* Advisory guardrail override modal (never hard-blocks saving) */}
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

      {/* Floating Interactive Rest Timer Bar */}
      {restSecondsRemaining !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent-neon)',
            borderRadius: 'var(--radius-full)',
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(204,255,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Timer size={18} style={{ color: 'var(--accent-neon)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>
              Istirahat Antar Set: {Math.floor(restSecondsRemaining / 60)}:{(restSecondsRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setRestSecondsRemaining((prev) => (prev || 0) + 30)}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              +30s
            </button>
            <button
              onClick={() => setRestSecondsRemaining(null)}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



