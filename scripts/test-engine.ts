/**
 * RKStride - Hybrid Performance & Workload Engine
 * Standalone Terminal Test Suite (Fase 1 Engine Verification)
 * Validating:
 * 1. Universal sRPE Workload & Secondary Volume Load (Foster et al., 2001)
 * 2. Karvonen Heart Rate Reserve & Edwards TRIMP (1993)
 * 3. Norwegian 4x4 Exact Protocol (Helgerud et al., 2007)
 * 4. ACWR Multi-method (Rolling Coupled, Rolling Uncoupled, EWMA) without gaps
 * 5. Cold-Start Safety (< 21 days) & Weekly Load Spike (> 15%)
 * 6. Bidirectional Graded Soft Guardrail (Legs <-> Fast Run) with Safe Recovery Exemption
 * 7. Personal Baseline Z-Score Readiness & Tendon Pain Alert
 * 8. 1RM Estimations (Epley & Brzycki) & Weekly Productive Muscle Volume
 */

import {
  calculateStrengthLoad,
  calculateStrengthVolumeLoad,
  calculateRunningLoad,
  calculateEdwardsTrimp,
  calculateSessionRpe,
  calculateKarvonenHeartRateZones,
  estimateMaxHeartRate,
  calculateACWR,
  calculateEWMALoad,
  detectWeeklyLoadSpike,
  evaluateSoftGuardrail,
  calculateReadinessScore,
  estimate1RM,
  detectPersonalRecord,
  calculateWeeklyMuscleVolume,
  getWorkoutRecommendation,
  RUNNING_PRESETS,
} from '../src/lib/engine/workload';

import {
  ACWR_THRESHOLDS,
  ACWR_COLD_START_MIN_DAYS,
  EWMA_LAMBDA,
  EDWARDS_ZONE_WEIGHTS,
} from '../src/lib/engine/constants';

import {
  StrengthExercise,
  RunSession,
  DailyLog,
  ReadinessCheckIn,
  UserProfile,
} from '../src/types/workout';

import { RKStrideExportPayloadSchema } from '../src/lib/db/exportImport';
import { checkMedicalRedFlags, isQueryInSportsDomain } from '../src/lib/ai/geminiCoach';
import {
  calculateBMR,
  calculateTDEE,
  calculateAthleteNutritionPlan,
  calculateDailyHydrationTarget,
} from '../src/lib/engine/nutrition';
import {
  calculatePeriodizationPlan,
} from '../src/lib/engine/periodization';
import {
  evaluateDoubleProgression,
} from '../src/lib/engine/doubleProgression';

console.log('================================================================');
console.log('⚡ RKStride Sports Science Engine - Comprehensive Test Suite ⚡');
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
// 1. UNIVERSAL sRPE & VOLUME LOAD
// -------------------------------------------------------------------------
console.log('--- 🏋️ 1. Universal sRPE & Secondary Volume Load (Foster et al., 2001) ---');

const strengthExercises: StrengthExercise[] = [
  {
    namaGerakan: 'Barbell Back Squat',
    sets: [
      { bebanKg: 120, reps: 5, rpe: 8.5 },
      { bebanKg: 120, reps: 5, rpe: 8.5 },
      { bebanKg: 120, reps: 5, rpe: 9.0 },
    ],
  },
  {
    namaGerakan: 'Romanian Deadlift',
    sets: [
      { bebanKg: 100, reps: 8, rpe: 8.0 },
      { bebanKg: 100, reps: 8, rpe: 8.0 },
    ],
  },
];

// Secondary metric: Volume Load (kg x reps) = 3x(120*5) + 2x(100*8) = 1800 + 1600 = 3400 kg
const volumeLoad = calculateStrengthVolumeLoad(strengthExercises);
runTest(
  'Secondary Metric: Total Volume Load (kg x reps)',
  () => volumeLoad === 3400,
  `Volume Load: ${volumeLoad} kg (Expected: 3400 kg)`
);

// Primary universal metric: sRPE (Duration * RPE)
// 5 sets * 2.5 min = 12.5 min -> 13 min @ avg RPE 8.4 -> round(13 * 8.4) = 109 pts
const strengthSrpe = calculateStrengthLoad(strengthExercises);
runTest(
  'Primary Metric: Universal sRPE for Strength Session (Foster Model)',
  () => strengthSrpe > 0 && typeof strengthSrpe === 'number',
  `Calculated sRPE Workload: ${strengthSrpe} pts (Foster sRPE standard)`
);

// Explicit duration sRPE: 45 min @ RPE 8 -> 45 * 8 = 360 pts
const explicitSrpe = calculateSessionRpe(45, 8);
runTest(
  'Explicit Session RPE Calculation (45 min @ RPE 8 -> 360 pts)',
  () => explicitSrpe === 360,
  `sRPE = 45 * 8 = ${explicitSrpe} pts`
);
console.log('');

// -------------------------------------------------------------------------
// 2. RUNNING METRICS: KARVONEN, EDWARDS TRIMP, & NORWEGIAN 4x4
// -------------------------------------------------------------------------
console.log('--- 🏃 2. Karvonen HRR, Edwards TRIMP, & Norwegian 4x4 Protocol ---');

const userProfile: UserProfile = {
  age: 28,
  weightKg: 72,
  heightCm: 175,
  maxHr: 190,
  restingHrBaseline: 50,
};

// Karvonen Zones for HRmax 190, RHR 50 -> HRR = 140
// Zone 1 (50-60%): 50 + 0.5*140 = 120 to 50 + 0.6*140 = 134 bpm
// Zone 2 (60-70%): 134 to 148 bpm
// Zone 4 (80-90%): 162 to 176 bpm
const karvonenZones = calculateKarvonenHeartRateZones(userProfile);
runTest(
  'Karvonen Heart Rate Reserve Zones (HRR = 140 bpm)',
  () => karvonenZones[1].min === 120 && karvonenZones[2].min === 134 && karvonenZones[4].min === 162,
  `Zone 1 Min: ${karvonenZones[1].min} bpm, Zone 2 Min: ${karvonenZones[2].min} bpm, Zone 4 Min: ${karvonenZones[4].min} bpm`
);

// Edwards Zone Multipliers
runTest(
  'Edwards TRIMP Multipliers (Z1=1, Z2=2, Z3=3, Z4=4, Z5=5)',
  () =>
    EDWARDS_ZONE_WEIGHTS[1] === 1.0 &&
    EDWARDS_ZONE_WEIGHTS[2] === 2.0 &&
    EDWARDS_ZONE_WEIGHTS[3] === 3.0 &&
    EDWARDS_ZONE_WEIGHTS[4] === 4.0 &&
    EDWARDS_ZONE_WEIGHTS[5] === 5.0,
  'All 5 Edwards zone weights strictly verified'
);

// Norwegian 4x4 Protocol Verification
// 10m Z2 (10*2=20) + 4x[4m Z4 (4*4=16) + 3m Z2 (3*2=6) = 22] (=88) + 6m Z1 (6*1=6) = 114 pts
const norwegianRun: RunSession = {
  jarakKm: RUNNING_PRESETS.norwegian_4x4.estimatedDistanceKm,
  durasiMenit: RUNNING_PRESETS.norwegian_4x4.durationMinutes,
  avgPace: 4.8,
  avgHeartRate: 172,
  runningType: 'norwegian_4x4',
  blocks: RUNNING_PRESETS.norwegian_4x4.blocks,
};

const norwegianTrimp = calculateEdwardsTrimp(norwegianRun);
runTest(
  'Norwegian 4x4 Edwards TRIMP Precision (Expected: 114 pts)',
  () => norwegianTrimp === 114,
  `Norwegian 4x4 Edwards TRIMP: ${norwegianTrimp} pts (10*2 + 4*(16+6) + 6*1 = 114)`
);

// Sensorless RPE Fallback (sRPE: 40 min @ RPE 7 -> 280 pts)
const sensorlessRun: RunSession = {
  jarakKm: 7.0,
  durasiMenit: 40,
  avgPace: 5.7,
  avgHeartRate: 0,
  rpe: 7.0,
};
const sensorlessLoad = calculateRunningLoad(sensorlessRun);
runTest(
  'Sensorless Running Workload (Foster sRPE: 40 min * RPE 7 = 280 pts)',
  () => sensorlessLoad === 280,
  `Sensorless Load: ${sensorlessLoad} pts`
);
console.log('');

// -------------------------------------------------------------------------
// 3. ACWR ENGINE: METHODS, COLD-START, & WEEKLY SPIKE
// -------------------------------------------------------------------------
console.log('--- 📊 3. ACWR Engine: Methods, Gapless Zones, Cold-Start, & Weekly Spike ---');

// Mock 28 days history
const fullHistory28Days: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
  tanggal: `2026-09-${28 - index}`,
  strengthWorkouts: [],
  runningWorkouts: [],
  totalLoadScore: 350,
}));

// 3.1 Rolling Coupled Method
const acwrCoupled = calculateACWR(fullHistory28Days, 'rolling_coupled');
runTest(
  'ACWR Rolling Coupled (28 days mature baseline -> Sweet Spot)',
  () => acwrCoupled.status === 'sweet_spot' && acwrCoupled.ratio === 1.0,
  `Coupled Ratio: ${acwrCoupled.ratio}, Status: ${acwrCoupled.status}`
);

// 3.2 Rolling Uncoupled Method (Acute 7 vs Chronic 21 prior)
const acwrUncoupled = calculateACWR(fullHistory28Days, 'rolling_uncoupled');
runTest(
  'ACWR Rolling Uncoupled (Acute 7 vs Prior 21 Days)',
  () => acwrUncoupled.status === 'sweet_spot' && acwrUncoupled.ratio === 1.0,
  `Uncoupled Ratio: ${acwrUncoupled.ratio}, Status: ${acwrUncoupled.status}`
);

// 3.3 EWMA Method
const ewmaLoads = [300, 300, 300, 300, 300];
const ewmaAcute = calculateEWMALoad(ewmaLoads, EWMA_LAMBDA.ACUTE);
runTest(
  'EWMA Exponential Smoothing Decay Calculation',
  () => ewmaAcute === 300,
  `EWMA Constant Series = ${ewmaAcute}`
);

const acwrEwma = calculateACWR(fullHistory28Days, 'ewma');
runTest(
  'ACWR EWMA Method Execution',
  () => acwrEwma.status === 'sweet_spot' && acwrEwma.ratio === 1.0,
  `EWMA Ratio: ${acwrEwma.ratio}, Method: ${acwrEwma.method}`
);

// 3.4 Cold-Start Safety (< 21 days)
const shortHistory10Days: DailyLog[] = Array.from({ length: 10 }, (_, index) => ({
  tanggal: `2026-09-${10 - index}`,
  strengthWorkouts: [],
  runningWorkouts: [],
  totalLoadScore: 400,
}));
const acwrColdStart = calculateACWR(shortHistory10Days, 'rolling_coupled');
runTest(
  'Cold-Start Protection (< 21 days -> status "insufficient_data")',
  () => acwrColdStart.status === 'insufficient_data' && acwrColdStart.coldStartProgressPercent < 100,
  `Days: ${acwrColdStart.daysCollected}/${ACWR_COLD_START_MIN_DAYS}, Progress: ${acwrColdStart.coldStartProgressPercent}%`
);

// 3.5 Gapless ACWR Zone Thresholds
runTest(
  'ACWR Gapless Thresholds (<0.8, 0.8-1.3, 1.3-1.5, >1.5)',
  () =>
    ACWR_THRESHOLDS.UNDERTRAINING_MAX === 0.8 &&
    ACWR_THRESHOLDS.SWEET_SPOT_MAX === 1.3 &&
    ACWR_THRESHOLDS.WARNING_MAX === 1.5 &&
    ACWR_THRESHOLDS.DANGER_THRESHOLD === 1.5,
  'Zone boundaries strictly cover all numeric ranges without gaps'
);

// 3.6 Weekly Workload Spike (> 15% increase)
const spikeHistory: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
  tanggal: `2026-09-${28 - index}`,
  strengthWorkouts: [],
  runningWorkouts: [],
  totalLoadScore: index < 7 ? 600 : 300, // 100% increase
}));
const weeklySpike = detectWeeklyLoadSpike(spikeHistory);
runTest(
  'Weekly Workload Spike Detection (> 15% Increase)',
  () => weeklySpike.spikeAlert === true && weeklySpike.spikePercent === 100,
  `Spike Alert: ${weeklySpike.spikeAlert}, Increase: +${weeklySpike.spikePercent}%`
);
console.log('');

// -------------------------------------------------------------------------
// 4. BIDIRECTIONAL GRADED SOFT GUARDRAIL
// -------------------------------------------------------------------------
console.log('--- 🦵 4. Bidirectional Graded Soft Guardrail & Recovery Exemption ---');

// 4.1 Zone 1-2 <= 45 min is ALWAYS allowed
const safeRecoveryCheck = evaluateSoftGuardrail({
  lastLegDayHoursAgo: 12, // 12 hours ago (fresh leg day)
  intendedActivity: 'running',
  runningType: 'easy',
  runningDurationMinutes: 40, // <= 45 min
  muscleSoreness: 4,
  legFatigue: true,
  readinessScore: 40,
});
runTest(
  'Safe Recovery Exemption: Zone 1-2 Running <= 45 min is ALWAYS Allowed (level: "none")',
  () => safeRecoveryCheck.level === 'none',
  `Guardrail Level: ${safeRecoveryCheck.level} | Title: "${safeRecoveryCheck.warningTitle}"`
);

// 4.2 Legs -> Fast Run within 48h (Graded Soft Warning with Override)
const legsToFastRun = evaluateSoftGuardrail({
  lastLegDayHoursAgo: 20,
  intendedActivity: 'running',
  runningType: 'norwegian_4x4',
  runningDurationMinutes: 44,
  muscleSoreness: 4,
  legFatigue: true,
  readinessScore: 45,
});
runTest(
  'Legs -> Fast Run within 48h Triggers Graded Risk & Provides Override Option',
  () => (legsToFastRun.level === 'caution' || legsToFastRun.level === 'high_risk') && legsToFastRun.canOverride === true,
  `Level: ${legsToFastRun.level}, canOverride: ${legsToFastRun.canOverride}, Direction: ${legsToFastRun.conflictDirection}`
);

// 4.3 Direction 2: High-Intensity Run -> Heavy Legs within 24h
const runToLegs = evaluateSoftGuardrail({
  lastLegDayHoursAgo: 999,
  lastFastRunHoursAgo: 14, // 14 hours ago
  intendedActivity: 'legs',
  muscleSoreness: 3,
  legFatigue: true,
  readinessScore: 50,
});
runTest(
  'Direction 2: High-Intensity Run -> Heavy Legs within 24h Triggers Soft Guardrail',
  () => runToLegs.conflictDirection === 'run_to_legs' && runToLegs.level !== 'none',
  `Direction: ${runToLegs.conflictDirection}, Level: ${runToLegs.level}`
);
console.log('');

// -------------------------------------------------------------------------
// 5. PERSONAL BASELINE BIO-READINESS & TENDON ALERTS
// -------------------------------------------------------------------------
console.log('--- 🔋 5. Personal Baseline Bio-Readiness Z-Scores & Tendon Alert ---');

const readinessTodayGood: ReadinessCheckIn = {
  sleepHours: 8.0,
  muscleSoreness: 1,
  legFatigue: false,
  energyLevel: 'high',
  restingHeartRate: 48,
  hrvRmssd: 65,
  tendonJointPain: 0,
};

// 5.1 Provisional Readiness (< 7 days history)
const provisionalReadiness = calculateReadinessScore(readinessTodayGood, []);
runTest(
  'Provisional Readiness (< 7 days history flagged as provisional)',
  () => provisionalReadiness.isProvisional === true && provisionalReadiness.score >= 80,
  `Score: ${provisionalReadiness.score}, isProvisional: ${provisionalReadiness.isProvisional}`
);

// 5.2 Personal Baseline Z-Score (14 days history)
const history14Readiness: ReadinessCheckIn[] = Array.from({ length: 14 }, () => ({
  sleepHours: 7.2,
  muscleSoreness: 2,
  legFatigue: false,
  energyLevel: 'moderate',
  restingHeartRate: 52,
  hrvRmssd: 50,
}));
const zScoreReadiness = calculateReadinessScore(readinessTodayGood, history14Readiness);
runTest(
  'Personal Baseline Z-Score Readiness (Matured >= 14 days baseline)',
  () => zScoreReadiness.isProvisional === false && zScoreReadiness.score >= 50,
  `Personalized Score: ${zScoreReadiness.score}/100, isProvisional: ${zScoreReadiness.isProvisional}`
);

// 5.3 Tendon Pain Alert (scale >= 2)
const readinessWithTendonPain: ReadinessCheckIn = {
  sleepHours: 7.0,
  muscleSoreness: 2,
  legFatigue: false,
  energyLevel: 'moderate',
  restingHeartRate: 54,
  tendonJointPain: 2,
  tendonPainArea: 'Tendon Patela Kanan',
};
const tendonAlertResult = calculateReadinessScore(readinessWithTendonPain, history14Readiness);
runTest(
  'Tendon Pain >= 2 Triggers Specific Load Reduction Guidance',
  () => !!tendonAlertResult.tendonAlert && tendonAlertResult.tendonAlert.includes('Tendon Patela Kanan'),
  `Tendon Alert: "${tendonAlertResult.tendonAlert?.substring(0, 75)}..."`
);
console.log('');

// -------------------------------------------------------------------------
// 6. 1RM ESTIMATIONS & WEEKLY PRODUCTIVE MUSCLE VOLUME
// -------------------------------------------------------------------------
console.log('--- 🎯 6. 1RM Estimations (Epley & Brzycki) & Weekly Muscle Volume ---');

// 6.1 1RM Epley & Brzycki
// 100 kg x 5 reps -> Epley = 100 * (1 + 5/30) = 116.7 kg, Brzycki = 100 * (36 / 32) = 112.5 kg
const rmEstimate = estimate1RM(100, 5);
runTest(
  '1RM Epley & Brzycki Estimation (100 kg x 5 reps)',
  () => rmEstimate.epley === 116.7 && rmEstimate.brzycki === 112.5 && rmEstimate.average === 114.6,
  `Epley: ${rmEstimate.epley} kg, Brzycki: ${rmEstimate.brzycki} kg, Average: ${rmEstimate.average} kg`
);

// 6.2 Weekly Productive Muscle Volume (Hard sets with RPE >= 7.0)
const sampleWeeklyHistory: DailyLog[] = [
  {
    tanggal: '2026-09-28',
    strengthWorkouts: [
      {
        namaGerakan: 'Flat Barbell Bench Press',
        category: 'push',
        sets: [
          { bebanKg: 90, reps: 6, rpe: 8.0 }, // Hard set 1
          { bebanKg: 90, reps: 6, rpe: 8.5 }, // Hard set 2
          { bebanKg: 60, reps: 12, rpe: 6.0 }, // Warmup/light set (< 7.0)
        ],
      },
      {
        namaGerakan: 'Barbell Back Squat',
        category: 'legs',
        sets: [
          { bebanKg: 130, reps: 5, rpe: 9.0 }, // Hard set 1
          { bebanKg: 130, reps: 5, rpe: 9.0 }, // Hard set 2
        ],
      },
    ],
    runningWorkouts: [],
    totalLoadScore: 250,
  },
];

const weeklyVolume = calculateWeeklyMuscleVolume(sampleWeeklyHistory);
runTest(
  'Weekly Hard Sets per Muscle Group (Push: 2 hard sets, Legs: 2 hard sets)',
  () => weeklyVolume.push.hardSets === 2 && weeklyVolume.legs.hardSets === 2,
  `Push Hard Sets: ${weeklyVolume.push.hardSets}, Legs Hard Sets: ${weeklyVolume.legs.hardSets}`
);

// 6.3 Dynamic Deload Attenuation Range in Recommendation (-20% to -40%)
const dangerAcwrResult = calculateACWR(
  Array.from({ length: 28 }, (_, i) => ({
    tanggal: `2026-09-${28 - i}`,
    strengthWorkouts: [],
    runningWorkouts: [],
    totalLoadScore: i < 7 ? 800 : 250,
  })),
  'rolling_coupled'
);
const dangerRec = getWorkoutRecommendation(dangerAcwrResult.ratio, readinessWithTendonPain, 72);
runTest(
  'Deload Attenuation Range in ACWR Danger Zone (-20% to -40%)',
  () => dangerRec.volumeAdjustmentPercent <= -20 && dangerRec.volumeAdjustmentPercent >= -40,
  `Deload Volume Adjustment: ${dangerRec.volumeAdjustmentPercent}%`
);
// -------------------------------------------------------------------------
// SECTION 7: FASE 2 PERSISTENCE, BACKUP VALIDATION & AI COACH SAFETY
// -------------------------------------------------------------------------
console.log('--- [7] Fase 2 Persistence, Backup Validation & AI Safety ---');

// 7.1 Zod Schema Validation: Valid payload
const validBackupPayload = {
  format: 'RKStride_Backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  userProfile: {
    id: 'current_user',
    age: 28,
    weightKg: 72,
    heightCm: 175,
    restingHrBaseline: 52,
    maxHr: 190,
  },
  workoutLogs: [
    {
      tanggal: '2026-10-01',
      strengthWorkouts: [
        {
          namaGerakan: 'Back Squat',
          category: 'legs',
          sets: [{ bebanKg: 100, reps: 5, rpe: 8 }],
        },
      ],
      runningWorkouts: [
        {
          jarakKm: 5,
          durasiMenit: 28,
          avgPace: 5.6,
          avgHeartRate: 145,
          rpe: 6,
        },
      ],
      totalLoadScore: 240,
    },
  ],
};

const validParseResult = RKStrideExportPayloadSchema.safeParse(validBackupPayload);
runTest(
  'Zod Schema Validation: Clean Backup Payload is Accepted',
  () => validParseResult.success,
  `Valid parse success: ${validParseResult.success}`
);

// 7.2 Zod Schema Validation: Corrupted / Tampered payload rejection
const corruptBackupPayload = {
  format: 'Unknown_Format_Corrupt',
  version: -1, // invalid negative version
  exportedAt: 'not-a-date',
  workoutLogs: [
    {
      tanggal: 'invalid-date',
      strengthWorkouts: 'not-an-array', // corrupted type
      totalLoadScore: -99, // invalid negative load
    },
  ],
};

const corruptParseResult = RKStrideExportPayloadSchema.safeParse(corruptBackupPayload);
runTest(
  'Zod Schema Validation: Corrupted Payload Safely Rejected',
  () => !corruptParseResult.success && corruptParseResult.error.issues.length > 0,
  `Corrupted payload successfully blocked with ${!corruptParseResult.success ? corruptParseResult.error.issues.length : 0} error issues`
);

// 7.3 AI Coach Medical Red Flag Interception
const chestPainEmergency = checkMedicalRedFlags('Saya merasakan nyeri dada hebat saat interval 4x4');
const fractureEmergency = checkMedicalRedFlags('Kaki terkilir parah dan dicurigai patah tulang');
const normalFatigue = checkMedicalRedFlags('Kaki agak pegal dan lelah setelah long run kemarin');

runTest(
  'AI Coach Medical Red Flag: Intercepts Chest Pain & Recommends Emergency Care',
  () => chestPainEmergency !== null && chestPainEmergency.includes('PERINGATAN KESELAMATAN MEDIS'),
  'Chest pain intercepted and emergency warning generated'
);

runTest(
  'AI Coach Medical Red Flag: Intercepts Suspected Fracture',
  () => fractureEmergency !== null && fractureEmergency.includes('PERINGATAN KESELAMATAN MEDIS'),
  'Fracture intercepted and emergency warning generated'
);

runTest(
  'AI Coach Medical Red Flag: Passes Normal Athletic Soreness / DOMS',
  () => normalFatigue === null,
  'Normal fatigue passes without medical intervention'
);

// 7.4 AI Coach Athletic Domain Scope Guard
const inScopeQuery = isQueryInSportsDomain('Bagaimana cara mengatur deload saat ACWR di atas 1.5?');
const outOfScopeQuery = isQueryInSportsDomain('Bagaimana cara memasak rendang daging sapi empuk dan gurih?');

runTest(
  'AI Coach Scope Guard: Allows Athletic & Workload Training Queries',
  () => inScopeQuery === true,
  'In-scope workload query permitted'
);

runTest(
  'AI Coach Scope Guard: Detects Out-of-Domain Non-Sports Queries',
  () => outOfScopeQuery === false,
  'Out-of-scope non-fitness query detected'
);

// -------------------------------------------------------------------------
// SECTION 8: FASE 3 PRODUCT ENGINES (NUTRITION, PERIODIZATION, DOUBLE PROGRESSION)
// -------------------------------------------------------------------------
console.log('--- [8] Fase 3 Product Engines (Nutrition, Periodization, Double Progression) ---');

// 8.1 BMR & TDEE Calculations (Mifflin-St Jeor 1990)
const bmr = calculateBMR(72, 175, 28, 'male');
// 10 * 72 + 6.25 * 175 - 5 * 28 + 5 = 720 + 1093.75 - 140 + 5 = 1678.75 -> 1679 kcal
runTest(
  'Nutrition: BMR Mifflin-St Jeor Precision (72kg, 175cm, 28y male)',
  () => bmr >= 1670 && bmr <= 1690,
  `Calculated BMR: ${bmr} kcal`
);

const tdee = calculateTDEE(bmr, 'lightly_active', 300);
// 1679 * 1.375 + 300 = 2308.6 + 300 = 2609 kcal
runTest(
  'Nutrition: TDEE Calculation with Workout Expenditure',
  () => tdee >= 2550 && tdee <= 2650,
  `Calculated TDEE: ${tdee} kcal`
);

// 8.2 Macro Targets: Morton et al. (2018) & Burke et al. (2011)
const nutritionPlan = calculateAthleteNutritionPlan(
  { weightKg: 72, heightCm: 175, age: 28, gender: 'male' },
  'maintenance',
  'lightly_active',
  45,
  350
);

runTest(
  'Nutrition: Protein Target in Evidence-Based Range (1.6 - 2.2 g/kg)',
  () => nutritionPlan.proteinPerKg >= 1.6 && nutritionPlan.proteinPerKg <= 2.2 && nutritionPlan.proteinGrams >= 115,
  `Protein: ${nutritionPlan.proteinGrams}g (${nutritionPlan.proteinPerKg} g/kg BB)`
);

// 8.3 Hydration Target: Sawka et al. (2007)
const hydration = calculateDailyHydrationTarget(72, 60);
// 72 * 35 = 2520 ml + 60 * 12 = 720 ml => 3240 ml = 3.2 L
runTest(
  'Nutrition: Hydration Target Honors ACSM Sawka Model (35ml/kg + 12ml/min)',
  () => hydration >= 3.1 && hydration <= 3.4,
  `Calculated Daily Hydration: ${hydration} Liters`
);

// 8.4 Competition Periodization & Dynamic Tapering (Mujika & Padilla 2003)
const targetHalfMarathonDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const taperPlan = calculatePeriodizationPlan({
  eventName: 'Test Half Marathon',
  category: 'half_marathon',
  raceDate: targetHalfMarathonDate,
});

runTest(
  'Periodization: Race 10 Days Out Triggers Taper Phase with -30% to -50% Volume Cut',
  () => taperPlan.currentPhase === 'taper' && taperPlan.isTaperActive && taperPlan.volumeAdjustmentPercent <= -30 && taperPlan.volumeAdjustmentPercent >= -50,
  `Phase: ${taperPlan.currentPhase} | Volume Cut: ${taperPlan.volumeAdjustmentPercent}%`
);

const raceWeekDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const raceWeekPlan = calculatePeriodizationPlan({
  eventName: 'Test Half Marathon',
  category: 'half_marathon',
  raceDate: raceWeekDate,
});

runTest(
  'Periodization: Race Week (< 7 Days) Triggers Peak Deload (-50%) & Neuromuscular Strides',
  () => raceWeekPlan.currentPhase === 'race_week' && raceWeekPlan.volumeAdjustmentPercent === -50,
  `Phase: ${raceWeekPlan.currentPhase} | Volume Cut: ${raceWeekPlan.volumeAdjustmentPercent}%`
);

// 8.5 Double Progression: Upper Body (+2.5 kg)
const upperSetsComplete = [
  { bebanKg: 80, reps: 10, rpe: 8 },
  { bebanKg: 80, reps: 10, rpe: 8 },
  { bebanKg: 80, reps: 10, rpe: 7.5 },
];
const upperProgression = evaluateDoubleProgression('Barbell Bench Press', upperSetsComplete, 8, 10, 'push');

runTest(
  'Double Progression: Upper Body Triggers +2.5 kg when Rep Cap Hit @ RPE <= 8',
  () => upperProgression.shouldIncreaseWeight && upperProgression.suggestedWeightKg === 82.5,
  `Upper Suggested Weight: ${upperProgression.suggestedWeightKg} kg (+2.5 kg)`
);

// 8.6 Double Progression: Lower Body (+5.0 kg)
const lowerSetsComplete = [
  { bebanKg: 100, reps: 10, rpe: 8 },
  { bebanKg: 100, reps: 10, rpe: 8 },
  { bebanKg: 100, reps: 10, rpe: 8 },
];
const lowerProgression = evaluateDoubleProgression('Back Squat', lowerSetsComplete, 8, 10, 'legs');

runTest(
  'Double Progression: Lower Body Triggers +5.0 kg on Compound Squat',
  () => lowerProgression.shouldIncreaseWeight && lowerProgression.suggestedWeightKg === 105.0,
  `Lower Suggested Weight: ${lowerProgression.suggestedWeightKg} kg (+5.0 kg)`
);

// 8.7 Double Progression: Incomplete Reps Holds Weight
const incompleteSets = [
  { bebanKg: 80, reps: 10, rpe: 8 },
  { bebanKg: 80, reps: 9, rpe: 8.5 }, // 1 rep short
  { bebanKg: 80, reps: 8, rpe: 9 },
];
const incompleteProgression = evaluateDoubleProgression('Barbell Bench Press', incompleteSets, 8, 10, 'push');

runTest(
  'Double Progression: Holds Weight when Rep Cap Not Satisfied across All Sets',
  () => !incompleteProgression.shouldIncreaseWeight && incompleteProgression.suggestedWeightKg === 80,
  `Suggested Weight Maintained: ${incompleteProgression.suggestedWeightKg} kg`
);

console.log('');

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log('================================================================');
console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL FASE 1, FASE 2 & FASE 3 SPORTS SCIENCE ENGINES & PRODUCT FEATURES 100% VERIFIED!');
} else {
  console.error('⚠️ SOME TESTS FAILED. PLEASE CHECK ASSERTIONS ABOVE.');
  process.exit(1);
}
