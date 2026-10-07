import { describe, it, expect } from 'vitest';
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
  calculateWeeklyMuscleVolume,
  getWorkoutRecommendation,
  auditWeeklySchedule,
  RUNNING_PRESETS,
} from '../workload';
import {
  ACWR_THRESHOLDS,
  EDWARDS_ZONE_WEIGHTS,
} from '../constants';
import {
  StrengthExercise,
  RunSession,
  DailyLog,
  ReadinessCheckIn,
  UserProfile,
  WorkoutCategory,
} from '@/types/workout';

describe('Workload & Sports Science Engine - Unit Tests', () => {
  describe('Universal sRPE & Volume Load (Foster et al., 2001)', () => {
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

    it('calculates secondary volume load accurately (sum of kg * reps)', () => {
      // 3 * (120 * 5) + 2 * (100 * 8) = 1800 + 1600 = 3400 kg
      const totalVolume = calculateStrengthVolumeLoad(strengthExercises);
      expect(totalVolume).toBe(3400);
    });

    it('calculates primary metric sRPE using Foster model', () => {
      const sRpeLoad = calculateStrengthLoad(strengthExercises);
      expect(sRpeLoad).toBeGreaterThan(0);
      expect(typeof sRpeLoad).toBe('number');
      expect(Number.isFinite(sRpeLoad)).toBe(true);
    });

    it('calculates explicit session RPE (duration * RPE, clamped to [1, 10])', () => {
      expect(calculateSessionRpe(45, 8)).toBe(360);
      expect(calculateSessionRpe(60, 6)).toBe(360);
      expect(calculateSessionRpe(30, 1)).toBe(30);
      expect(calculateSessionRpe(0, 8)).toBe(0);
    });

    it('handles empty exercise list safely', () => {
      expect(calculateStrengthVolumeLoad([])).toBe(0);
      expect(calculateStrengthLoad([])).toBe(0);
    });
  });

  describe('Karvonen HRR & Edwards TRIMP (1993)', () => {
    const userProfile: UserProfile = {
      age: 28,
      weightKg: 72,
      heightCm: 175,
      maxHr: 190,
      restingHrBaseline: 50,
    };

    it('calculates Tanaka formula max heart rate: 208 - 0.7 * age', () => {
      expect(estimateMaxHeartRate(28, 'tanaka')).toBe(188); // 208 - 19.6 = 188.4 -> 188
      expect(estimateMaxHeartRate(30, 'tanaka')).toBe(187); // 208 - 21 = 187
    });

    it('calculates Gellish formula max heart rate: 207 - 0.7 * age', () => {
      expect(estimateMaxHeartRate(30, 'gellish')).toBe(186); // 207 - 21 = 186
    });

    it('calculates Karvonen zones strictly using Heart Rate Reserve (HRmax - HRrest)', () => {
      const zones = calculateKarvonenHeartRateZones(userProfile);
      // HRR = 190 - 50 = 140 bpm
      // Zone 1 (50-60%): 50 + 140*0.50 = 120 bpm
      // Zone 2 (60-70%): 50 + 140*0.60 = 134 bpm
      // Zone 4 (80-90%): 50 + 140*0.80 = 162 bpm
      expect(zones[1].min).toBe(120);
      expect(zones[2].min).toBe(134);
      expect(zones[4].min).toBe(162);
    });

    it('strictly applies Edwards TRIMP multipliers (Z1=1, Z2=2, Z3=3, Z4=4, Z5=5)', () => {
      expect(EDWARDS_ZONE_WEIGHTS[1]).toBe(1.0);
      expect(EDWARDS_ZONE_WEIGHTS[2]).toBe(2.0);
      expect(EDWARDS_ZONE_WEIGHTS[3]).toBe(3.0);
      expect(EDWARDS_ZONE_WEIGHTS[4]).toBe(4.0);
      expect(EDWARDS_ZONE_WEIGHTS[5]).toBe(5.0);
    });

    it('computes exact Edwards TRIMP for Norwegian 4x4 preset (114 points)', () => {
      const norwegianRun: RunSession = {
        jarakKm: RUNNING_PRESETS.norwegian_4x4.estimatedDistanceKm,
        durasiMenit: RUNNING_PRESETS.norwegian_4x4.durationMinutes,
        avgPace: 4.8,
        avgHeartRate: 172,
        runningType: 'norwegian_4x4',
        blocks: RUNNING_PRESETS.norwegian_4x4.blocks,
      };

      const trimp = calculateEdwardsTrimp(norwegianRun);
      expect(trimp).toBe(114);
    });

    it('calculates sensorless running workload via Foster sRPE fallback', () => {
      const sensorlessRun: RunSession = {
        jarakKm: 7.0,
        durasiMenit: 40,
        avgPace: 5.7,
        avgHeartRate: 0,
        rpe: 7.0,
      };
      const load = calculateRunningLoad(sensorlessRun);
      expect(load).toBe(40 * 7); // 280
    });
  });

  describe('ACWR Engine (Multi-Method, Cold-Start, Gapless, Spike)', () => {
    it('handles cold-start protection when history is less than 21 days', () => {
      const shortLogs: DailyLog[] = Array.from({ length: 10 }, (_, index) => ({
        tanggal: `2026-09-${10 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 400,
      }));

      const res = calculateACWR(shortLogs, 'rolling_coupled');
      expect(res.status).toBe('insufficient_data');
      expect(res.daysCollected).toBe(10);
      expect(res.coldStartProgressPercent).toBeLessThan(100);
    });

    it('calculates mature 28-day rolling coupled ACWR', () => {
      const matureLogs: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
        tanggal: `2026-09-${28 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 350,
      }));

      const res = calculateACWR(matureLogs, 'rolling_coupled');
      expect(res.daysCollected).toBe(28);
      expect(res.status).toBe('sweet_spot');
      expect(res.ratio).toBeCloseTo(1.0, 2);
    });

    it('calculates rolling uncoupled ACWR (acute 7 vs prior 21 days)', () => {
      const matureLogs: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
        tanggal: `2026-09-${28 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 350,
      }));

      const res = calculateACWR(matureLogs, 'rolling_uncoupled');
      expect(res.method).toBe('rolling_uncoupled');
      expect(res.ratio).toBeCloseTo(1.0, 2);
    });

    it('calculates EWMA method with exponential smoothing', () => {
      const constantSeries = [300, 300, 300, 300, 300];
      const ewmaVal = calculateEWMALoad(constantSeries, 7);
      expect(ewmaVal).toBe(300);

      const matureLogs: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
        tanggal: `2026-09-${28 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 350,
      }));

      const res = calculateACWR(matureLogs, 'ewma');
      expect(res.method).toBe('ewma');
      expect(res.ratio).toBeCloseTo(1.0, 2);
    });

    it('detects weekly load spikes (> 15% increase)', () => {
      const spikeHistory: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
        tanggal: `2026-09-${28 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: index < 7 ? 600 : 300, // 100% increase
      }));

      const spike = detectWeeklyLoadSpike(spikeHistory);
      expect(spike.spikeAlert).toBe(true);
      expect(spike.spikePercent).toBe(100);
    });

    it('covers all ACWR status zones with the single 1.4 guardrail (AGENTS.md)', () => {
      expect(ACWR_THRESHOLDS.UNDERTRAINING_MAX).toBe(0.8);
      expect(ACWR_THRESHOLDS.SWEET_SPOT_MAX).toBe(1.4);
      expect(ACWR_THRESHOLDS.DANGER_THRESHOLD).toBe(1.4);
      expect('WARNING_MAX' in ACWR_THRESHOLDS).toBe(false);
    });

    it('classifies ratio exactly 1.4 as sweet_spot and above 1.4 as danger', () => {
      const atBoundary: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
        tanggal: `2026-09-${28 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        // Acute avg 560, chronic avg (7*560 + 21*346.67)/28 = 400 -> ratio 1.4
        totalLoadScore: index < 7 ? 560 : 346.67,
      }));
      const boundaryRes = calculateACWR(atBoundary, 'rolling_coupled');
      expect(boundaryRes.ratio).toBeCloseTo(1.4, 1);
      expect(boundaryRes.status).toBe('sweet_spot');

      const aboveBoundary: DailyLog[] = Array.from({ length: 28 }, (_, index) => ({
        tanggal: `2026-09-${28 - index}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: index < 7 ? 700 : 350, // ratio 1.6
      }));
      const aboveRes = calculateACWR(aboveBoundary, 'rolling_coupled');
      expect(aboveRes.ratio).toBeGreaterThan(1.4);
      expect(aboveRes.status).toBe('danger');
    });
  });

  describe('Bidirectional Soft Guardrail & Recovery Exemption', () => {
    it('always exempts Zone 1-2 aerobic recovery runs <= 45 min', () => {
      const guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 12,
        intendedActivity: 'running',
        runningType: 'easy',
        runningDurationMinutes: 40,
        muscleSoreness: 4,
        legFatigue: true,
        readinessScore: 40,
      });

      expect(guardrail.level).toBe('none');
      expect(guardrail.canOverride).toBe(true);
      expect(guardrail.warningTitle).toContain('Aman');
    });

    it('triggers caution / high_risk soft guardrail when high intensity run follows heavy legs within 48h', () => {
      const guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 20,
        intendedActivity: 'running',
        runningType: 'norwegian_4x4',
        runningDurationMinutes: 44,
        muscleSoreness: 4,
        legFatigue: true,
        readinessScore: 45,
      });

      expect(['caution', 'high_risk']).toContain(guardrail.level);
      expect(guardrail.canOverride).toBe(true);
      expect(guardrail.conflictDirection).toBe('legs_to_run');
    });

    it('triggers soft guardrail for high intensity run followed by heavy legs within 24h', () => {
      const guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 999,
        lastFastRunHoursAgo: 14,
        intendedActivity: 'legs',
        muscleSoreness: 3,
        legFatigue: true,
        readinessScore: 50,
      });

      expect(guardrail.conflictDirection).toBe('run_to_legs');
      expect(guardrail.level).not.toBe('none');
    });
  });

  describe('Personal Baseline Readiness & Tendon Pain', () => {
    const readinessTodayGood: ReadinessCheckIn = {
      sleepHours: 8.0,
      muscleSoreness: 1,
      legFatigue: false,
      energyLevel: 'high',
      restingHeartRate: 48,
      hrvRmssd: 65,
      tendonJointPain: 0,
    };

    it('flags readiness as provisional if baseline has fewer than 7 days', () => {
      const res = calculateReadinessScore(readinessTodayGood, []);
      expect(res.isProvisional).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(0);
      expect(res.score).toBeLessThanOrEqual(100);
    });

    it('calculates Z-score readiness when >= 14 days baseline is available', () => {
      const history14Readiness: ReadinessCheckIn[] = Array.from({ length: 14 }, () => ({
        sleepHours: 7.2,
        muscleSoreness: 2,
        legFatigue: false,
        energyLevel: 'moderate',
        restingHeartRate: 52,
        hrvRmssd: 50,
      }));

      const res = calculateReadinessScore(readinessTodayGood, history14Readiness);
      expect(res.isProvisional).toBe(false);
      expect(res.score).toBeGreaterThanOrEqual(50);
      expect(res.score).toBeLessThanOrEqual(100);
    });

    it('triggers tendon alert when tendon pain >= 2 is reported', () => {
      const readinessWithTendon: ReadinessCheckIn = {
        sleepHours: 7.0,
        muscleSoreness: 2,
        legFatigue: false,
        energyLevel: 'moderate',
        restingHeartRate: 54,
        tendonJointPain: 2,
        tendonPainArea: 'Tendon Patela Kanan',
      };

      const res = calculateReadinessScore(readinessWithTendon, []);
      expect(res.tendonAlert).toBeDefined();
      expect(res.tendonAlert).toContain('Tendon Patela Kanan');
    });
  });

  describe('1RM Estimation & Muscle Group Volume', () => {
    it('estimates 1RM using Epley, Brzycki, and Average models', () => {
      const est = estimate1RM(100, 5);
      expect(est.epley).toBe(116.7);
      expect(est.brzycki).toBe(112.5);
      expect(est.average).toBe(114.6);
    });

    it('returns exact weight for 1 rep', () => {
      const est = estimate1RM(100, 1);
      expect(est.epley).toBe(100);
      expect(est.brzycki).toBe(100);
      expect(est.average).toBe(100);
    });

    it('calculates weekly hard sets per muscle group (RPE >= 7)', () => {
      const sampleWeeklyHistory: DailyLog[] = [
        {
          tanggal: '2026-09-28',
          strengthWorkouts: [
            {
              namaGerakan: 'Flat Barbell Bench Press',
              category: 'push',
              sets: [
                { bebanKg: 90, reps: 6, rpe: 8.0 },
                { bebanKg: 90, reps: 6, rpe: 8.5 },
                { bebanKg: 60, reps: 12, rpe: 6.0 }, // Light
              ],
            },
            {
              namaGerakan: 'Barbell Back Squat',
              category: 'legs',
              sets: [
                { bebanKg: 130, reps: 5, rpe: 9.0 },
                { bebanKg: 130, reps: 5, rpe: 9.0 },
              ],
            },
          ],
          runningWorkouts: [],
          totalLoadScore: 250,
        },
      ];

      const volume = calculateWeeklyMuscleVolume(sampleWeeklyHistory);
      expect(volume.push.hardSets).toBe(2);
      expect(volume.legs.hardSets).toBe(2);
    });
  });

  describe('Workout Recommendation Engine', () => {
    it('recommends deload attenuation (-20% to -40%) when in ACWR danger zone (> 1.4)', () => {
      const readiness: ReadinessCheckIn = {
        sleepHours: 6.0,
        muscleSoreness: 3,
        legFatigue: true,
        energyLevel: 'low',
        restingHeartRate: 60,
      };

      const rec = getWorkoutRecommendation(1.65, readiness, 24);
      expect(rec.volumeAdjustmentPercent).toBeLessThanOrEqual(-20);
      expect(rec.volumeAdjustmentPercent).toBeGreaterThanOrEqual(-40);
    });

    it('recommends a safe progressive overload step when ACWR < 0.8', () => {
      const readiness: ReadinessCheckIn = {
        sleepHours: 8.0,
        muscleSoreness: 1,
        legFatigue: false,
        energyLevel: 'high',
        restingHeartRate: 50,
      };

      const rec = getWorkoutRecommendation(0.75, readiness, 999);
      expect(rec.workoutDetail.title).toContain('Progressive Overload Aman');
      expect(rec.volumeAdjustmentPercent).toBe(5);
      expect(rec.workoutDetail.suggestedAction).toContain('+2.5');
    });

    it('reaches the Recovery Exemption branch when the planned run is easy Zone 2 <= 45 min', () => {
      const readiness: ReadinessCheckIn = {
        sleepHours: 7.5,
        muscleSoreness: 2,
        legFatigue: true,
        energyLevel: 'moderate',
        restingHeartRate: 52,
      };

      const rec = getWorkoutRecommendation(1.0, readiness, 24, 999, {
        type: 'easy',
        durationMinutes: 40,
      });
      expect(rec.guardrail.level).toBe('none');
      expect(rec.guardrail.warningTitle).toContain('Aman');
    });

    it('locks fast running when the planned run is Norwegian 4x4 within 48h of legs', () => {
      const readiness: ReadinessCheckIn = {
        sleepHours: 7.0,
        muscleSoreness: 3,
        legFatigue: true,
        energyLevel: 'moderate',
        restingHeartRate: 54,
      };

      const rec = getWorkoutRecommendation(1.0, readiness, 24, 999, {
        type: 'norwegian_4x4',
        durationMinutes: 44,
      });
      expect(rec.guardrail.level).not.toBe('none');
      expect(rec.guardrail.conflictDirection).toBe('legs_to_run');
      expect(rec.workoutDetail.speedRunLocked).toBe(true);
    });
  });

  describe('Weekly Schedule Audit (engine delegation)', () => {
    const baseReadiness: ReadinessCheckIn = {
      sleepHours: 7.5,
      muscleSoreness: 2,
      legFatigue: false,
      energyLevel: 'moderate',
      restingHeartRate: 52,
    };

    const makeDay = (dayIndex: number, category: WorkoutCategory, title: string, minutes = 60) => ({
      id: `sch-${dayIndex}`,
      dayName: (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const)[dayIndex],
      dayIndex,
      category,
      title,
      targetDurationMinutes: minutes,
      isRestDay: false,
    });

    it('flags legs followed by a fast run the next day (legs_to_run)', () => {
      const schedule = [
        makeDay(0, 'legs', 'Heavy Squats', 70),
        makeDay(1, 'norwegian_4x4', 'Norwegian 4x4', 44),
        makeDay(2, 'push', 'Upper Push', 60),
        makeDay(3, 'mobility_recovery', 'Rest', 30),
        makeDay(4, 'pull', 'Pull Day', 60),
        makeDay(5, 'push', 'Upper Pump', 50),
        makeDay(6, 'run_easy', 'Easy Run', 40),
      ];
      const conflicts = auditWeeklySchedule(schedule, baseReadiness, 85);
      const legsToRun = conflicts.filter((c) => c.dayIndex === 1);
      expect(legsToRun.length).toBeGreaterThanOrEqual(1);
    });

    it('flags legs the day after a fast run (run_to_legs)', () => {
      const schedule = [
        makeDay(0, 'run_tempo', 'Threshold Run', 50),
        makeDay(1, 'legs', 'Heavy Squats', 70),
        makeDay(2, 'push', 'Upper Push', 60),
        makeDay(3, 'mobility_recovery', 'Rest', 30),
        makeDay(4, 'pull', 'Pull Day', 60),
        makeDay(5, 'push', 'Upper Pump', 50),
        makeDay(6, 'run_easy', 'Easy Run', 40),
      ];
      const conflicts = auditWeeklySchedule(schedule, baseReadiness, 85);
      const runToLegs = conflicts.filter((c) => c.dayIndex === 1);
      expect(runToLegs.length).toBeGreaterThanOrEqual(1);
    });

    it('exempts an easy Zone 2 run <= 45 min after legs (Recovery Exemption)', () => {
      const schedule = [
        makeDay(0, 'legs', 'Heavy Squats', 70),
        makeDay(1, 'run_easy', 'Zone 2 Flush', 40),
        makeDay(2, 'push', 'Upper Push', 60),
        makeDay(3, 'mobility_recovery', 'Rest', 30),
        makeDay(4, 'pull', 'Pull Day', 60),
        makeDay(5, 'push', 'Upper Pump', 50),
        makeDay(6, 'run_easy', 'Easy Run', 40),
      ];
      const conflicts = auditWeeklySchedule(schedule, baseReadiness, 85);
      expect(conflicts.filter((c) => c.dayIndex === 1)).toHaveLength(0);
    });
  });
});
