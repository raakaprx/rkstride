/**
 * RKStride - Hybrid Performance & Workload Engine
 * Data Model Contracts
 */

export type WorkoutCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'arms'
  | 'core'
  | 'run_recovery'
  | 'run_easy'
  | 'run_tempo'
  | 'run_long'
  | 'run_intervals'
  | 'norwegian_4x4'
  | 'mobility_recovery';

export type HeartRateZone = 1 | 2 | 3 | 4 | 5;

export type RunningType =
  | 'recovery'
  | 'easy'
  | 'tempo'
  | 'norwegian_4x4'
  | 'intervals'
  | 'long_run'
  | 'strides';

export interface RunningIntervalBlock {
  zone: HeartRateZone;
  durationMinutes: number;
  description?: string;
}

export interface StrengthSet {
  bebanKg: number;
  reps: number;
  rpe: number; // RPE scale 1–10
}

export interface StrengthExercise {
  namaGerakan: string;
  sets: StrengthSet[];
}

export interface RunSession {
  jarakKm: number;
  durasiMenit: number;
  avgPace: number; // in min/km (e.g. 5.0 for 5:00 min/km)
  avgHeartRate: number; // bpm
  runningType?: RunningType;
  blocks?: RunningIntervalBlock[];
  rpe?: number; // scale 1-10 (fallback without HR sensor: duration * (rpe / 2))
  thresholdPace?: number; // default 4.75 min/km if not provided
}

export interface DailyLog {
  tanggal: string; // YYYY-MM-DD
  strengthWorkouts: StrengthExercise[];
  runningWorkouts: RunSession[];
  totalLoadScore: number;
}

export interface ReadinessCheckIn {
  sleepHours: number;
  muscleSoreness: 1 | 2 | 3 | 4 | 5;
  legFatigue: boolean;
  energyLevel: 'low' | 'moderate' | 'high';
  restingHeartRate?: number;
}

export type ACWRStatus = 'safe' | 'optimal' | 'danger_overtraining';

export interface ACWRResult {
  acuteLoad: number;
  chronicLoad: number;
  ratio: number;
  status: ACWRStatus;
}

export interface RecommendationResult {
  targetCategory: WorkoutCategory;
  warningMessage?: string;
  volumeAdjustmentPercent: number; // e.g. -30, -25, -15, 0
  workoutDetail: {
    title: string;
    rationale: string;
    speedRunLocked: boolean;
    suggestedAction: string;
    allowedRunningTypes?: RunningType[];
  };
}
