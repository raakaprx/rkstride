/**
 * RKStride - Hybrid Performance & Workload Engine
 * Standalone Terminal Test Suite
 * Validating PPL Workload, Heart Rate Zone TRIMP Accumulation,
 * Norwegian 4x4 Exact Calculations, RPE Fallback, and 48-Hour Hybrid Guardrails.
 */

import {
  calculateStrengthLoad,
  calculateRunningLoad,
  calculateACWR,
  calculateReadinessScore,
  getWorkoutRecommendation,
  RUNNING_PRESETS,
  ZONE_WEIGHTS,
} from '../src/lib/engine/workload';
import {
  StrengthExercise,
  RunSession,
  DailyLog,
  ReadinessCheckIn,
} from '../src/types/workout';

console.log('================================================================');
console.log('⚡ RKStride Performance Engine - Comprehensive Test Suite ⚡');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, assertion: () => boolean, detail?: string) {
  totalTests++;
  try {
    const isSuccess = assertion();
    if (isSuccess) {
      passedTests++;
      console.log(`✅ [PASS] ${name}`);
      if (detail) console.log(`   └─ ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${name}`);
      if (detail) console.error(`   └─ ${detail}`);
    }
  } catch (err) {
    console.error(`❌ [ERROR] ${name}:`, err);
  }
}

// -------------------------------------------------------------------------
// [A] STRENGTH VOLUME LOAD TEST
// -------------------------------------------------------------------------
console.log('--- 🏋️ 1. Strength Volume Load Calculation ---');

const strengthExercises: StrengthExercise[] = [
  {
    namaGerakan: 'Barbell Back Squat',
    sets: [
      { bebanKg: 120, reps: 5, rpe: 8.5 }, // 600 * 0.85 = 510
      { bebanKg: 120, reps: 5, rpe: 8.5 }, // 510
      { bebanKg: 120, reps: 5, rpe: 9.0 }, // 600 * 0.90 = 540
    ],
  },
  {
    namaGerakan: 'Romanian Deadlift',
    sets: [
      { bebanKg: 100, reps: 8, rpe: 8.0 }, // 800 * 0.8 = 640
      { bebanKg: 100, reps: 8, rpe: 8.0 }, // 640
    ],
  },
];

// Raw total = 510 + 510 + 540 + 640 + 640 = 2840 -> * 0.1 = 284 pts
const calculatedStrength = calculateStrengthLoad(strengthExercises);

runTest(
  'Strength Volume & Normalized RPE Score',
  () => calculatedStrength === 284,
  `Calculated Score: ${calculatedStrength} pts (Expected: 284 pts)`
);
console.log('');

// -------------------------------------------------------------------------
// [B] RUNNING SPECTRUM & HEART RATE ZONE TRIMP LOAD
// -------------------------------------------------------------------------
console.log('--- 🏃 2. Running Spectrum & Heart Rate Zone TRIMP Load ---');

// Test Zone Weights
runTest(
  'HR Zone Multipliers Verification (Z1=1.0, Z2=1.2, Z3=1.5, Z4=2.2, Z5=3.5)',
  () =>
    ZONE_WEIGHTS[1] === 1.0 &&
    ZONE_WEIGHTS[2] === 1.2 &&
    ZONE_WEIGHTS[3] === 1.5 &&
    ZONE_WEIGHTS[4] === 2.2 &&
    ZONE_WEIGHTS[5] === 3.5,
  'All 5 Heart Rate Zone weights strictly verified'
);

// 2.1 Norwegian 4x4 Precision Test
// 10m Z2 (12 pts) + 4x[4m Z4 (8.8) + 3m Z2 (3.6) = 12.4] (= 49.6 pts) + 10m Z1 (10 pts) = 71.6 pts
const norwegianRun: RunSession = {
  jarakKm: RUNNING_PRESETS.norwegian_4x4.estimatedDistanceKm,
  durasiMenit: RUNNING_PRESETS.norwegian_4x4.durationMinutes,
  avgPace: 4.8,
  avgHeartRate: 172,
  runningType: 'norwegian_4x4',
  blocks: RUNNING_PRESETS.norwegian_4x4.blocks,
};

const norwegianScore = calculateRunningLoad(norwegianRun);

runTest(
  'Norwegian 4x4 Block-Accumulated Workload Precision (Expected: 71.6 pts ~ 72 pts)',
  () => norwegianScore === 71.6 || Math.round(norwegianScore) === 72,
  `Norwegian 4x4 Score: ${norwegianScore} pts (Formula: 12 + 49.6 + 10 = 71.6 pts)`
);

// 2.2 Sensorless Fallback (RPE-based formula: Duration * (RPE / 2))
const sensorlessRun: RunSession = {
  jarakKm: 7.0,
  durasiMenit: 40,
  avgPace: 5.7,
  avgHeartRate: 0, // No sensor / zero
  rpe: 7.0, // 40 * (7 / 2) = 140 pts
};
const sensorlessScore = calculateRunningLoad(sensorlessRun);

runTest(
  'Sensorless RPE Fallback Calculation (40 min @ RPE 7 -> 140 pts)',
  () => sensorlessScore === 140,
  `Sensorless Score: ${sensorlessScore} pts (Formula: 40 * (7/2) = 140 pts)`
);

// 2.3 Steady Zone 2 Easy Run (Continuous HR)
const easyRun: RunSession = {
  jarakKm: 8.0,
  durasiMenit: 45,
  avgPace: 5.6,
  avgHeartRate: 142, // Zone 2 (weight 1.2) -> 45 * 1.2 = 54 pts
};
const easyScore = calculateRunningLoad(easyRun);

runTest(
  'Steady Zone 2 Easy Run Load (45 min @ Zone 2 -> 54 pts)',
  () => easyScore === 54,
  `Easy Run Score: ${easyScore} pts (Formula: 45 * 1.2 = 54 pts)`
);
console.log('');

// -------------------------------------------------------------------------
// [C] BIO-READINESS COMPOSITE SCORE
// -------------------------------------------------------------------------
console.log('--- 🔋 3. Bio-Readiness Composite Score ---');

const highReadiness: ReadinessCheckIn = {
  sleepHours: 8.5,
  muscleSoreness: 1,
  legFatigue: false,
  energyLevel: 'high',
  restingHeartRate: 50,
};
const highReadinessScore = calculateReadinessScore(highReadiness);

const lowReadiness: ReadinessCheckIn = {
  sleepHours: 5.2,
  muscleSoreness: 4,
  legFatigue: true,
  energyLevel: 'low',
  restingHeartRate: 68,
};
const lowReadinessScore = calculateReadinessScore(lowReadiness);

runTest(
  'Readiness Score Dynamic Range (High vs Low)',
  () => highReadinessScore >= 90 && lowReadinessScore <= 45,
  `High Readiness: ${highReadinessScore}/100 | Low Readiness: ${lowReadinessScore}/100`
);
console.log('');

// -------------------------------------------------------------------------
// [D] SCENARIO 1: 48-HOUR LEG RECOVERY WINDOW GUARDRAIL
// -------------------------------------------------------------------------
console.log('--- 🦵 Scenario 1: 48-Hour Leg Recovery Window Active ---');

const readinessScenario1: ReadinessCheckIn = {
  sleepHours: 7.0,
  muscleSoreness: 4,
  legFatigue: true,
  energyLevel: 'moderate',
};
const lastLegDayHoursAgo1 = 18; // 18 hours ago
const acwrRatio1 = 1.05; // Normal sweet spot

const rec1 = getWorkoutRecommendation(acwrRatio1, readinessScenario1, lastLegDayHoursAgo1);

runTest(
  'Lock High-Intensity Speed Running During Leg Window (speedRunLocked: true)',
  () => rec1.workoutDetail.speedRunLocked === true,
  `speedRunLocked: ${rec1.workoutDetail.speedRunLocked}`
);

runTest(
  'Redirect Workload to Upper Body (Push / Pull)',
  () => rec1.targetCategory === 'push' || rec1.targetCategory === 'pull',
  `Target Category: ${rec1.targetCategory} | Title: "${rec1.workoutDetail.title}"`
);

runTest(
  '48-Hour Recovery Window Warning Displayed',
  () => !!rec1.warningMessage && rec1.warningMessage.includes('48-HOUR LEG RECOVERY WINDOW'),
  `Warning Message: "${rec1.warningMessage?.substring(0, 70)}..."`
);

runTest(
  'High-Intensity Running (Norwegian 4x4, Intervals, Tempo) Excluded from Allowed Running Types',
  () =>
    !rec1.workoutDetail.allowedRunningTypes?.includes('norwegian_4x4') &&
    !rec1.workoutDetail.allowedRunningTypes?.includes('intervals'),
  `Allowed Running Types: [${rec1.workoutDetail.allowedRunningTypes?.join(', ')}]`
);
console.log('');

// -------------------------------------------------------------------------
// [E] SCENARIO 2: ACWR DANGER ZONE (> 1.4) OVERTRAINING DELOAD
// -------------------------------------------------------------------------
console.log('--- 🚨 Scenario 2: ACWR Danger Zone Spike (> 1.4) ---');

const mockHistory28DaysDanger: DailyLog[] = Array.from({ length: 28 }, (_, index) => {
  const isAcute = index < 7;
  const load = isAcute ? 850 : 250;
  return {
    tanggal: `2026-09-${28 - index}`,
    strengthWorkouts: [],
    runningWorkouts: [],
    totalLoadScore: load,
  };
});

const acwrDanger = calculateACWR(mockHistory28DaysDanger);
const recDanger = getWorkoutRecommendation(acwrDanger.ratio, readinessScenario1, 72);

runTest(
  'ACWR Spike Detection (danger_overtraining & ratio > 1.4)',
  () => acwrDanger.status === 'danger_overtraining' && acwrDanger.ratio > 1.4,
  `Acute: ${acwrDanger.acuteLoad}, Chronic: ${acwrDanger.chronicLoad}, Ratio: ${acwrDanger.ratio}`
);

runTest(
  'Mandatory Volume Cut >= 30% (volumeAdjustmentPercent: -30)',
  () => recDanger.volumeAdjustmentPercent <= -30,
  `Volume Cut: ${recDanger.volumeAdjustmentPercent}%`
);

runTest(
  'Target Category Set to Deload Mobility & Recovery',
  () => recDanger.targetCategory === 'mobility_recovery' || recDanger.targetCategory === 'run_recovery',
  `Target Category: ${recDanger.targetCategory} | Title: "${recDanger.workoutDetail.title}"`
);

runTest(
  'Lock High-Intensity Speed Work During ACWR Spike',
  () => recDanger.workoutDetail.speedRunLocked === true,
  `speedRunLocked: ${recDanger.workoutDetail.speedRunLocked}`
);
console.log('');

// -------------------------------------------------------------------------
// [F] SCENARIO 3: SWEET SPOT & FRESH LEGS (UNRESTRICTED HIGH INTENSITY)
// -------------------------------------------------------------------------
console.log('--- ⚡ Scenario 3: Optimal Sweet Spot (ACWR 0.8–1.3 & Legs > 48h) ---');

const mockHistory28DaysOptimal: DailyLog[] = Array.from({ length: 28 }, (_, index) => {
  const load = index < 7 ? 385 : 350;
  return {
    tanggal: `2026-09-${28 - index}`,
    strengthWorkouts: [],
    runningWorkouts: [],
    totalLoadScore: load,
  };
});

const acwrOptimal = calculateACWR(mockHistory28DaysOptimal);
const lastLegDayHoursAgo3 = 72; // 72 hours ago (legs fresh)

const recOptimal = getWorkoutRecommendation(acwrOptimal.ratio, highReadiness, lastLegDayHoursAgo3);

runTest(
  'Optimal ACWR Status Verification (0.8 <= ratio <= 1.3)',
  () => acwrOptimal.status === 'optimal' && acwrOptimal.ratio >= 0.8 && acwrOptimal.ratio <= 1.3,
  `ACWR Ratio: ${acwrOptimal.ratio} (Status: ${acwrOptimal.status})`
);

runTest(
  'Zero Volume Deduction for Prime Athletic State',
  () => recOptimal.volumeAdjustmentPercent === 0,
  `Volume Adjustment: ${recOptimal.volumeAdjustmentPercent}%`
);

runTest(
  'High-Intensity Workload Unlocked (speedRunLocked: false)',
  () => recOptimal.workoutDetail.speedRunLocked === false,
  `speedRunLocked: ${recOptimal.workoutDetail.speedRunLocked}`
);

runTest(
  'Recommend High-Intensity Protocol (Norwegian 4x4 / VO2 Max)',
  () =>
    recOptimal.targetCategory === 'norwegian_4x4' ||
    recOptimal.targetCategory === 'run_tempo' ||
    recOptimal.targetCategory === 'legs',
  `Target Category: ${recOptimal.targetCategory} | Title: "${recOptimal.workoutDetail.title}"`
);
console.log('');

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log('================================================================');
console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL RKSTRIDE MATHEMATICAL FORMULAS & GUARDRAIL RULES VERIFIED 100% PASS!');
} else {
  console.error('⚠️ SOME TESTS FAILED. PLEASE CHECK ASSERTION LOGS ABOVE.');
  process.exit(1);
}
