import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateAthleteNutritionPlan,
  calculateDailyHydrationTarget,
} from '../nutrition';

describe('Nutrition & TDEE Engine - Unit Tests', () => {
  describe('Basal Metabolic Rate (Mifflin-St Jeor 1990)', () => {
    it('calculates male BMR accurately: 10*W + 6.25*H - 5*A + 5', () => {
      // 10*72 + 6.25*175 - 5*28 + 5 = 720 + 1093.75 - 140 + 5 = 1678.75 -> 1679 kcal
      const bmr = calculateBMR(72, 175, 28, 'male');
      expect(bmr).toBe(1679);
    });

    it('calculates female BMR accurately: 10*W + 6.25*H - 5*A - 161', () => {
      // 10*58 + 6.25*165 - 5*26 - 161 = 580 + 1031.25 - 130 - 161 = 1320.25 -> 1320 kcal
      const bmr = calculateBMR(58, 165, 26, 'female');
      expect(bmr).toBe(1320);
    });
  });

  describe('Total Daily Energy Expenditure (TDEE)', () => {
    it('calculates baseline TDEE with physical activity level (PAL)', () => {
      // BMR 1679 * 1.55 = 2602.45 -> 2602 kcal
      const bmr = 1679;
      const tdee = calculateTDEE(bmr, 'moderately_active', 0);
      expect(tdee).toBe(2602);
    });

    it('adds training session energy expenditure when workouts are provided', () => {
      const bmr = 1679;
      const tdee = calculateTDEE(bmr, 'lightly_active', 300);
      // 1679 * 1.375 + 300 = 2308.6 + 300 = 2609 kcal
      expect(tdee).toBe(2609);
      expect(Number.isFinite(tdee)).toBe(true);
    });
  });

  describe('Athlete Macronutrient Allocation (Morton 2018, Burke 2011)', () => {
    it('allocates protein between 1.6 and 2.2 g/kg for hybrid athlete', () => {
      const plan = calculateAthleteNutritionPlan(
        { weightKg: 72, heightCm: 175, age: 28, gender: 'male' },
        'muscle_gain',
        'moderately_active',
        45,
        350
      );
      // 72 kg * 2.0 g/kg = 144g
      expect(plan.proteinGrams).toBe(144);
      expect(plan.proteinPerKg).toBe(2.0);
      expect(plan.proteinPerKg).toBeGreaterThanOrEqual(1.6);
      expect(plan.proteinPerKg).toBeLessThanOrEqual(2.2);
    });

    it('increases protein during fat loss / cutting to preserve lean mass (2.2 g/kg)', () => {
      const plan = calculateAthleteNutritionPlan(
        { weightKg: 72, heightCm: 175, age: 28, gender: 'male' },
        'fat_loss',
        'moderately_active',
        45,
        350
      );
      // 72 * 2.2 = 158.4 -> 158g
      expect(plan.proteinGrams).toBe(158);
      expect(plan.proteinPerKg).toBe(2.2);
    });

    it('allocates sufficient carbohydrates to fuel glycogen replenishment', () => {
      const plan = calculateAthleteNutritionPlan(
        { weightKg: 72, heightCm: 175, age: 28, gender: 'male' },
        'maintenance',
        'moderately_active',
        45,
        350
      );
      expect(plan.carbsGrams).toBeGreaterThan(150);
      expect(plan.carbsPerKg).toBeGreaterThan(2.0);
    });
  });

  describe('Hydration Target (Sawka et al., 2007)', () => {
    it('calculates baseline hydration (35 ml/kg)', () => {
      // 72 * 35 = 2520 ml -> 2.5 Liters
      const lit = calculateDailyHydrationTarget(72, 0);
      expect(lit).toBe(2.5);
    });

    it('adds exercise sweat loss replacement (+12 ml/min)', () => {
      // 2520 + 60*12 = 2520 + 720 = 3240 ml -> 3.2 Liters
      const lit = calculateDailyHydrationTarget(72, 60);
      expect(lit).toBe(3.2);
    });
  });
});
