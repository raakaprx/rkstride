import { describe, it, expect } from 'vitest';
import { calculatePeriodizationPlan } from '../periodization';
import { RaceTargetConfig } from '@/types/productFeatures';

describe('Periodization & Taper Engine - Unit Tests (Mujika & Padilla, 2003)', () => {
  it('returns post-race recovery phase if race is today or in the past', () => {
    const pastRace: RaceTargetConfig = {
      eventName: 'Jakarta Half Marathon',
      category: 'half_marathon',
      raceDate: '2026-09-01',
    };

    const plan = calculatePeriodizationPlan(pastRace, '2026-09-02');
    expect(plan.currentPhase).toBe('recovery');
    expect(plan.daysToRace).toBe(0);
    expect(plan.isTaperActive).toBe(false);
  });

  it('triggers race_week phase when race is less than 7 days away', () => {
    const raceWeekTarget: RaceTargetConfig = {
      eventName: 'Bali Marathon',
      category: 'marathon',
      raceDate: '2026-10-06',
    };

    const plan = calculatePeriodizationPlan(raceWeekTarget, '2026-10-02');
    expect(plan.currentPhase).toBe('race_week');
    expect(plan.isTaperActive).toBe(true);
    expect(plan.volumeAdjustmentPercent).toBe(-50); // -50% peak volume cut
  });

  it('triggers taper phase and cuts volume by 30-50% during taper window', () => {
    const taperTarget: RaceTargetConfig = {
      eventName: 'Bandung 10K',
      category: '10k',
      raceDate: '2026-10-12',
    };

    const plan = calculatePeriodizationPlan(taperTarget, '2026-10-02');
    expect(plan.currentPhase).toBe('taper');
    expect(plan.isTaperActive).toBe(true);
    expect(plan.volumeAdjustmentPercent).toBeLessThan(0);
    expect(plan.volumeAdjustmentPercent).toBeGreaterThanOrEqual(-50);
  });

  it('identifies base phase when race is far in future (> 8 weeks)', () => {
    const baseTarget: RaceTargetConfig = {
      eventName: 'Tokyo Marathon',
      category: 'marathon',
      raceDate: '2027-03-01',
    };

    const plan = calculatePeriodizationPlan(baseTarget, '2026-10-02');
    expect(plan.currentPhase).toBe('base');
    expect(plan.isTaperActive).toBe(false);
    expect(plan.volumeAdjustmentPercent).toBe(0);
  });

  it('handles race category "none" safely', () => {
    const noRace: RaceTargetConfig = {
      eventName: 'No Race Scheduled',
      category: 'none',
      raceDate: '2026-12-31',
    };

    const plan = calculatePeriodizationPlan(noRace, '2026-10-02');
    expect(plan.isTaperActive).toBe(false);
  });
});
