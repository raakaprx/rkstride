/**
 * RKStride - Hybrid Performance & Workload Engine
 * Data Model Contracts (re-exported from @/contracts as Single Source of Truth)
 */

export type {
  WorkoutCategory,
  HeartRateZone,
  RunningType,
  RunningIntervalBlock,
  StrengthSet,
  StrengthExercise,
  RunSession,
  WorkoutSessionEntry,
  DailyLog,
  ReadinessCheckIn,
  StoredReadinessLog,
  CanonicalACWRStatus,
  ACWRStatus,
  ACWRMethod,
  StoredDebrief,
} from '@/contracts/workout.schema';

export type {
  Gender,
  HrMaxFormula,
  ExperienceLevel,
  AthleteAuthSession,
  UserProfile,
} from '@/contracts/profile.schema';

import type {
  ACWRMethod,
  ACWRStatus,
  RunningType,
  WorkoutCategory,
} from '@/contracts/workout.schema';

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
