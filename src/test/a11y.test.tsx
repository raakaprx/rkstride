import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { WorkloadAdvisorCard } from '../components/WorkloadAdvisorCard';
import { TrendsDashboardCard } from '../components/TrendsDashboardCard';
import { NutritionBodyCompCard } from '../components/NutritionBodyCompCard';
import { PeriodizationTaperCard } from '../components/PeriodizationTaperCard';
import { ACWRResult, RecommendationResult, ReadinessCheckIn, UserProfile } from '@/types/workout';
import { RaceTargetConfig } from '@/types/productFeatures';

describe('Accessibility (a11y) Automated Audits - axe-core', () => {
  const dummyAcwr: ACWRResult = {
    ratio: 1.05,
    acuteLoad: 350,
    chronicLoad: 330,
    status: 'sweet_spot',
    daysCollected: 28,
    coldStartProgressPercent: 100,
    weeklySpikeAlert: false,
    weeklySpikePercent: 0,
    method: 'rolling_coupled',
  };

  const dummyRec: RecommendationResult = {
    targetCategory: 'push',
    volumeAdjustmentPercent: 0,
    guardrail: {
      level: 'none',
      canOverride: true,
      warningTitle: '',
      warningMessage: '',
      suggestedAction: '',
      conflictDirection: 'none',
      allowedRunningTypes: [],
    },
    workoutDetail: {
      title: 'Latihan Optimal',
      rationale: 'Beban kerja seimbang.',
      speedRunLocked: false,
      suggestedAction: 'Lanjutkan program.',
    },
  };

  const dummyReadiness: ReadinessCheckIn = {
    sleepHours: 8,
    muscleSoreness: 1,
    legFatigue: false,
    energyLevel: 'high',
    restingHeartRate: 50,
    hrvRmssd: 60,
  };

  const dummyProfile: UserProfile = {
    age: 28,
    weightKg: 72,
    heightCm: 175,
    maxHr: 190,
    restingHrBaseline: 50,
  };

  const dummyRace: RaceTargetConfig = {
    eventName: 'Jakarta Half Marathon',
    category: 'half_marathon',
    raceDate: '2026-11-15',
  };

  it('verifies WorkloadAdvisorCard has zero critical accessibility violations', async () => {
    const { container } = render(
      <WorkloadAdvisorCard
        acwr={dummyAcwr}
        recommendation={dummyRec}
        readiness={dummyReadiness}
        readinessScore={88}
        lastLegsHoursAgo={48}
      />
    );

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('verifies TrendsDashboardCard has zero critical accessibility violations', async () => {
    const { container } = render(<TrendsDashboardCard history={[]} />);

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('verifies NutritionBodyCompCard has zero critical accessibility violations', async () => {
    const { container } = render(
      <NutritionBodyCompCard
        userProfile={dummyProfile}
        todayWorkoutDurationMinutes={45}
        todayWorkoutCaloriesBurned={350}
      />
    );

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('verifies PeriodizationTaperCard has zero critical accessibility violations', async () => {
    const { container } = render(
      <PeriodizationTaperCard raceConfig={dummyRace} onEditRaceConfig={() => {}} />
    );

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });
});
