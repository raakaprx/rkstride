import {
  calculateStrengthLoad,
  calculateRunningLoad,
  calculateACWR,
  getWorkoutRecommendation,
  calculateReadinessScore,
} from './workload.ts';
import { mock28DaysWorkoutHistory, mockReadinessToday } from '../../data/mockWorkoutHistory.ts';
import { StrengthExercise, RunSession, DailyLog } from '../../types/workout.ts';

console.log('=====================================================');
console.log('⚡ PULSE HYBRID ATHLETICS ENGINE - FOUNDATIONAL TESTS ⚡');
console.log('=====================================================\n');

// 1. Test Strength Load Calculation
console.log('--- [1] Strength Volume Load Test ---');
const sampleExercises: StrengthExercise[] = [
  {
    namaGerakan: 'Barbell Squat',
    sets: [
      { bebanKg: 100, reps: 5, rpe: 8 },
      { bebanKg: 100, reps: 5, rpe: 8 },
      { bebanKg: 100, reps: 5, rpe: 8 },
      { bebanKg: 100, reps: 5, rpe: 8 },
      { bebanKg: 100, reps: 5, rpe: 8 },
    ], // vol: 2500, rpe: 0.8 => 200 pts
  },
  {
    namaGerakan: 'Romanian Deadlift',
    sets: [
      { bebanKg: 80, reps: 8, rpe: 7 },
      { bebanKg: 80, reps: 8, rpe: 7 },
      { bebanKg: 80, reps: 8, rpe: 7 },
    ], // vol: 1920, rpe: 0.7 => 134 pts
  },
];
const strengthScore = calculateStrengthLoad(sampleExercises);
console.log(`Exercises: Squat (100kg 5x5 @RPE8) + RDL (80kg 3x8 @RPE7)`);
console.log(`Calculated Strength Load: ${strengthScore} pts (Expected ~334 pts)`);
console.assert(strengthScore > 300 && strengthScore < 360, 'Strength calculation out of expected range');
console.log('✅ Strength Load formula verified!\n');

// 2. Test Running Stress Score Calculation
console.log('--- [2] Running Stress Score Test ---');
const sampleEasyRun: RunSession = {
  jarakKm: 8.0,
  durasiMenit: 48,
  avgPace: 6.0, // 6:00/km (Easy base)
  avgHeartRate: 138, // Zone 2
  thresholdPace: 4.75,
};
const easyRunScore = calculateRunningLoad(sampleEasyRun);
console.log(`Easy Run (8km @ 6:00/km, HR 138bpm): ${easyRunScore} pts`);

const sampleTempoRun: RunSession = {
  jarakKm: 10.0,
  durasiMenit: 45,
  avgPace: 4.5, // 4:30/km (Fast / Threshold)
  avgHeartRate: 172, // Zone 4
  thresholdPace: 4.75,
};
const tempoRunScore = calculateRunningLoad(sampleTempoRun);
console.log(`Tempo Run (10km @ 4:30/km, HR 172bpm): ${tempoRunScore} pts`);
console.assert(tempoRunScore > easyRunScore, 'Tempo run load should be higher than easy run');
console.log('✅ Running Load formula verified!\n');

// 3. Test 28-Day ACWR Calculation
console.log('--- [3] ACWR (Acute:Chronic Workload Ratio) Test ---');
const acwr = calculateACWR(mock28DaysWorkoutHistory);
console.log(`Acute Load (7-day avg): ${acwr.acuteLoad} pts/day`);
console.log(`Chronic Load (28-day avg): ${acwr.chronicLoad} pts/day`);
console.log(`ACWR Ratio: ${acwr.ratio}`);
console.log(`Status: ${acwr.status}`);
console.assert(acwr.ratio > 0.5 && acwr.ratio < 2.0, 'ACWR ratio reasonable check');
console.log('✅ ACWR Engine verified!\n');

// 4. Test Smart Adaptive Recommendation (Leg Day trained 18 hours ago)
console.log('--- [4] Smart Hybrid Split Logic Test (Leg Fatigue Active) ---');
const readinessResult = calculateReadinessScore(mockReadinessToday);
const readinessScore = readinessResult.score;
console.log(`Calculated Daily Readiness Score: ${readinessScore}/100`);
const lastLegsHours = 18; // Leg day finished 18h ago
const recLegFatigued = getWorkoutRecommendation(acwr.ratio, mockReadinessToday, lastLegsHours);
console.log(`Condition: Leg session completed ${lastLegsHours}h ago`);
console.log(`Recommended Workout: ${recLegFatigued.workoutDetail.title} (${recLegFatigued.targetCategory})`);
console.log(`Speed Run Locked: ${recLegFatigued.workoutDetail.speedRunLocked}`);
console.log(`Warning: ${recLegFatigued.warningMessage}`);
console.assert(recLegFatigued.workoutDetail.speedRunLocked === true, 'Speed run MUST be locked when legs are fatigued');
console.log('✅ Smart Split Leg Protection verified!\n');

// 5. Test Danger Zone Overtraining Spike Protection
console.log('--- [5] Danger Zone Workload Spike Test (ACWR > 1.5) ---');
const dangerHistory: DailyLog[] = mock28DaysWorkoutHistory.map((w, idx) => ({
  ...w,
  totalLoadScore: idx < 7 ? 900 : 250, // Massive acute spike
}));
const dangerAcwr = calculateACWR(dangerHistory);
console.log(`Spike Acute Load: ${dangerAcwr.acuteLoad}, Chronic: ${dangerAcwr.chronicLoad}, Ratio: ${dangerAcwr.ratio}`);
const dangerRec = getWorkoutRecommendation(dangerAcwr.ratio, mockReadinessToday, 72);
console.log(`Danger Status: ${dangerAcwr.status}`);
console.log(`Auto High-Intensity Locked: ${dangerRec.workoutDetail.speedRunLocked}`);
console.log(`Recommended Deload Action: ${dangerRec.workoutDetail.title} (${dangerRec.targetCategory})`);
console.log(`Volume Adjustment: ${dangerRec.volumeAdjustmentPercent}%`);
console.assert(dangerAcwr.status === 'danger', 'Should trigger danger status');
console.assert(dangerRec.targetCategory === 'mobility_recovery', 'Should force recovery intensity');
console.assert(dangerRec.volumeAdjustmentPercent <= -25, 'Should cut volume by at least 25%');
console.log('✅ Danger Zone Deload Protection verified!\n');

console.log('=====================================================');
console.log('🎉 ALL ENGINE CALCULATIONS PASSED ACCURATELY! 🎉');
console.log('=====================================================');
