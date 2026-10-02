import { describe, it, expect } from 'vitest';
import { evaluateDoubleProgression } from '../doubleProgression';
import { StrengthSet } from '@/types/workout';

describe('Double Progression Engine - Unit Tests (Helms et al., 2016)', () => {
  it('triggers +2.5 kg weight increase for Upper Body when rep cap hit across all sets @ RPE <= 8', () => {
    const benchSets: StrengthSet[] = [
      { bebanKg: 80, reps: 10, rpe: 7.5 },
      { bebanKg: 80, reps: 10, rpe: 8 },
      { bebanKg: 80, reps: 10, rpe: 8 },
    ];

    const result = evaluateDoubleProgression('Barbell Bench Press', benchSets, 8, 10);
    expect(result.shouldIncreaseWeight).toBe(true);
    expect(result.suggestedWeightKg).toBe(82.5);
    expect(result.message).toContain('TARGET TERCAPAI');
    expect(result.nextSessionGoal).toContain('+2.5 kg');
  });

  it('triggers +5.0 kg weight increase for Lower Body compound when rep cap hit', () => {
    const squatSets: StrengthSet[] = [
      { bebanKg: 100, reps: 8, rpe: 7 },
      { bebanKg: 100, reps: 8, rpe: 7.5 },
      { bebanKg: 100, reps: 8, rpe: 8 },
    ];

    const result = evaluateDoubleProgression('Barbell Back Squat', squatSets, 6, 8);
    expect(result.shouldIncreaseWeight).toBe(true);
    expect(result.suggestedWeightKg).toBe(105);
    expect(result.nextSessionGoal).toContain('+5 kg');
  });

  it('maintains weight when some sets fail to reach the rep cap', () => {
    const incompleteSets: StrengthSet[] = [
      { bebanKg: 80, reps: 10, rpe: 8 },
      { bebanKg: 80, reps: 9, rpe: 8.5 }, // Missed 1 rep
      { bebanKg: 80, reps: 8, rpe: 9 }, // Missed 2 reps
    ];

    const result = evaluateDoubleProgression('Overhead Press', incompleteSets, 8, 10);
    expect(result.shouldIncreaseWeight).toBe(false);
    expect(result.suggestedWeightKg).toBe(80);
    expect(result.message).toContain('Pertahankan beban');
  });

  it('maintains weight if rep cap reached but RPE exceeded 8 (insufficient RIR reserve)', () => {
    const grindSets: StrengthSet[] = [
      { bebanKg: 80, reps: 10, rpe: 8 },
      { bebanKg: 80, reps: 10, rpe: 8.5 },
      { bebanKg: 80, reps: 10, rpe: 9.5 }, // Near failure / RPE > 8
    ];

    const result = evaluateDoubleProgression('Barbell Bench Press', grindSets, 8, 10);
    expect(result.shouldIncreaseWeight).toBe(false);
    expect(result.suggestedWeightKg).toBe(80);
  });

  it('handles empty set list safely', () => {
    const result = evaluateDoubleProgression('Pull-up', [], 8, 12);
    expect(result.shouldIncreaseWeight).toBe(false);
    expect(result.suggestedWeightKg).toBe(0);
  });
});
