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
  targetBpmRange?: { min: number; max: number };
}

export interface StrengthSet {
  bebanKg: number;
  reps: number;
  rpe: number; // RPE scale 1–10
  isWarmup?: boolean;
}

export interface StrengthExercise {
  namaGerakan: string;
  category?: WorkoutCategory;
  sets: StrengthSet[];
  durationMinutes?: number; // Optional session time for sRPE
  isLegExercise?: boolean;
}

export interface RunSession {
  jarakKm: number;
  durasiMenit: number;
  avgPace: number; // in min/km (e.g. 5.0 for 5:00 min/km)
  avgHeartRate: number; // bpm
  runningType?: RunningType;
  blocks?: RunningIntervalBlock[];
  rpe?: number; // scale 1-10
  sRpe?: number; // Universal sRPE metric (durasiMenit * rpe)
  trimp?: number; // Edwards TRIMP score
  thresholdPace?: number; // default min/km
  isOverridden?: boolean; // Logged if user overrides an interference warning
}

export interface DailyLog {
  tanggal: string; // YYYY-MM-DD
  strengthWorkouts: StrengthExercise[];
  runningWorkouts: RunSession[];
  totalLoadScore: number; // Primary sRPE load
  volumeLoadSecondary?: number; // Sum of weight * reps
  runningTrimpSecondary?: number; // Sum of Edwards TRIMP
}

export interface ReadinessCheckIn {
  sleepHours: number;
  muscleSoreness: 1 | 2 | 3 | 4 | 5;
  legFatigue: boolean;
  energyLevel: 'low' | 'moderate' | 'high';
  restingHeartRate?: number;
  hrvRmssd?: number; // Optional Heart Rate Variability (ms)
  tendonJointPain?: 0 | 1 | 2 | 3; // 0 = None, 1 = Mild, 2 = Noticeable, 3 = Severe
  tendonPainArea?: string; // e.g. "Patellar", "Achilles", "Hamstring"
}

export interface UserProfile {
  age: number;
  weightKg: number;
  heightCm: number;
  maxHr?: number;
  restingHrBaseline: number;
  hrMaxFormula?: 'tanaka' | 'gellish' | 'custom';
}

export type ACWRStatus =
  | 'insufficient_data'
  | 'undertraining'
  | 'sweet_spot'
  | 'warning'
  | 'danger';

export type ACWRMethod = 'rolling_coupled' | 'rolling_uncoupled' | 'ewma';

export interface ACWRResult {
  acuteLoad: number;
  chronicLoad: number;
  ratio: number;
  status: ACWRStatus;
  method: ACWRMethod;
  daysCollected: number;
  coldStartProgressPercent: number;
  weeklySpikeAlert: boolean;
  weeklySpikePercent: number;
}

export interface SoftGuardrailResult {
  level: 'none' | 'caution' | 'high_risk';
  canOverride: boolean;
  warningTitle: string;
  warningMessage: string;
  suggestedAction: string;
  conflictDirection: 'legs_to_run' | 'run_to_legs' | 'none';
  allowedRunningTypes: RunningType[];
}

export interface RecommendationResult {
  targetCategory: WorkoutCategory;
  warningMessage?: string;
  volumeAdjustmentPercent: number; // e.g. -20, -30, -40, 0
  guardrail: SoftGuardrailResult;
  workoutDetail: {
    title: string;
    rationale: string;
    speedRunLocked: boolean; // Retained for compatibility: true if caution/high_risk and not overridden
    suggestedAction: string;
    allowedRunningTypes?: RunningType[];
  };
  tendonWarning?: string;
}

export interface OneRepMaxEstimate {
  epley: number;
  brzycki: number;
  average: number;
}

export interface WeeklyMuscleVolume {
  category: WorkoutCategory;
  hardSets: number; // Sets with RPE >= 7.0
  totalVolumeKg: number;
  sRpeTotal: number;
}
