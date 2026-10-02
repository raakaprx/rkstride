import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateACWR,
  calculateReadinessScore,
  evaluateSoftGuardrail,
  estimate1RM,
  calculateStrengthLoad,
  calculateStrengthVolumeLoad,
} from '../workload';
import { DailyLog, ReadinessCheckIn, StrengthExercise } from '@/types/workout';

describe('Workload Engine - Property-Based Testing (fast-check)', () => {
  it('Property 1 (ACWR Stability): ACWR ratio is never NaN or Infinity for ANY numeric load sequence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            totalLoadScore: fc.oneof(
              fc.nat(5000), // Normal realistic loads 0 - 5000
              fc.constant(0), // Rest days
              fc.float({ min: 0, max: 10000, noNaN: true }) // Floats
            ),
          }),
          { minLength: 0, maxLength: 60 }
        ),
        fc.constantFrom('rolling_coupled', 'rolling_uncoupled', 'ewma' as const),
        (logsData, method) => {
          const logs: DailyLog[] = logsData.map((d, idx) => ({
            tanggal: `2026-09-${(idx + 1).toString().padStart(2, '0')}`,
            totalLoadScore: d.totalLoadScore,
            strengthWorkouts: [],
            runningWorkouts: [],
          }));

          const result = calculateACWR(logs, method);

          // Invariant 1: ratio must always be a valid, finite number
          expect(Number.isNaN(result.ratio)).toBe(false);
          expect(Number.isFinite(result.ratio)).toBe(true);
          expect(result.ratio).toBeGreaterThanOrEqual(0);

          // Invariant 2: Acute and Chronic loads must also be valid numbers
          expect(Number.isNaN(result.acuteLoad)).toBe(false);
          expect(Number.isFinite(result.acuteLoad)).toBe(true);
          expect(Number.isNaN(result.chronicLoad)).toBe(false);

          // Invariant 3: Status must be one of the defined ACWR statuses
          expect([
            'insufficient_data',
            'underload',
            'sweet_spot',
            'elevated_risk',
            'danger_zone',
          ]).toContain(result.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2 (Readiness Range): Readiness score is strictly bounded in [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.record({
          sleepHours: fc.float({ min: 0, max: 16, noNaN: true }),
          muscleSoreness: fc.constantFrom(1, 2, 3, 4, 5 as const),
          legFatigue: fc.boolean(),
          energyLevel: fc.constantFrom('low', 'moderate', 'high' as const),
          restingHeartRate: fc.integer({ min: 35, max: 120 }),
          hrvRmssd: fc.integer({ min: 10, max: 150 }),
        }),
        fc.array(
          fc.record({
            sleepHours: fc.float({ min: 4, max: 12, noNaN: true }),
            muscleSoreness: fc.constantFrom(1, 2, 3, 4, 5 as const),
            legFatigue: fc.boolean(),
            energyLevel: fc.constantFrom('low', 'moderate', 'high' as const),
            restingHeartRate: fc.integer({ min: 40, max: 100 }),
            hrvRmssd: fc.integer({ min: 20, max: 120 }),
          }),
          { minLength: 0, maxLength: 28 }
        ),
        (current, baselineHistory) => {
          const checkIn: ReadinessCheckIn = {
            sleepHours: current.sleepHours,
            muscleSoreness: current.muscleSoreness,
            legFatigue: current.legFatigue,
            energyLevel: current.energyLevel,
            restingHeartRate: current.restingHeartRate,
            hrvRmssd: current.hrvRmssd,
          };

          const result = calculateReadinessScore(checkIn, baselineHistory);

          // Invariant: Readiness score must always be bounded strictly between 0 and 100
          expect(Number.isNaN(result.score)).toBe(false);
          expect(Number.isFinite(result.score)).toBe(true);
          expect(result.score).toBeGreaterThanOrEqual(0);
          expect(result.score).toBeLessThanOrEqual(100);
          expect(typeof result.isProvisional).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3 (Guardrail Validity): Soft guardrail always produces a deterministic, valid result', () => {
    fc.assert(
      fc.property(
        fc.record({
          lastLegDayHoursAgo: fc.float({ min: 0, max: 200, noNaN: true }),
          lastFastRunHoursAgo: fc.float({ min: 0, max: 200, noNaN: true }),
          intendedActivity: fc.constantFrom('running', 'legs' as const),
          runningType: fc.constantFrom('easy', 'tempo', 'norwegian_4x4', 'long_run'),
          runningDurationMinutes: fc.integer({ min: 10, max: 180 }),
          muscleSoreness: fc.constantFrom(1, 2, 3, 4, 5 as const),
          legFatigue: fc.boolean(),
          readinessScore: fc.integer({ min: 0, max: 100 }),
        }),
        (params) => {
          const guardrail = evaluateSoftGuardrail(params);

          // Invariant: Guardrail must return defined valid structure
          expect(['none', 'caution', 'high_risk', 'critical']).toContain(guardrail.level);
          expect(typeof guardrail.canOverride).toBe('boolean');
          expect(typeof guardrail.warningTitle).toBe('string');
          expect(guardrail.warningTitle.length).toBeGreaterThan(0);
          expect(typeof guardrail.conflictDirection).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4 (1RM Monotonicity): 1RM estimate is always >= the lifted weight for reps >= 1', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 500, noNaN: true }), // Weight in kg
        fc.integer({ min: 1, max: 15 }), // Reps (1-15 standard range for 1RM formulas)
        (weight, reps) => {
          const est = estimate1RM(weight, reps);

          expect(Number.isFinite(est.epley)).toBe(true);
          expect(Number.isFinite(est.brzycki)).toBe(true);
          expect(Number.isFinite(est.average)).toBe(true);

          // Invariant: estimated 1RM can never be less than the actual lifted weight
          expect(est.epley).toBeGreaterThanOrEqual(weight - 0.01);
          expect(est.brzycki).toBeGreaterThanOrEqual(weight - 0.01);
          expect(est.average).toBeGreaterThanOrEqual(weight - 0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5 (Strength Volume Load Non-Negativity): Volume load is always non-negative for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            namaGerakan: fc.string(),
            targetOtot: fc.string(),
            sets: fc.array(
              fc.record({
                setNumber: fc.integer({ min: 1, max: 10 }),
                bebanKg: fc.float({ min: 0, max: 400, noNaN: true }),
                reps: fc.integer({ min: 0, max: 50 }),
                rpe: fc.float({ min: 1, max: 10, noNaN: true }),
              }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (exercises: StrengthExercise[]) => {
          const vol = calculateStrengthVolumeLoad(exercises);
          const sRpe = calculateStrengthLoad(exercises);

          expect(Number.isFinite(vol)).toBe(true);
          expect(vol).toBeGreaterThanOrEqual(0);

          expect(Number.isFinite(sRpe)).toBe(true);
          expect(sRpe).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
