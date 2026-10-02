import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkloadAdvisorCard } from '../WorkloadAdvisorCard';
import { TrendsDashboardCard } from '../TrendsDashboardCard';
import { ACWRResult, RecommendationResult, ReadinessCheckIn, DailyLog } from '@/types/workout';

describe('Dashboard Components - Rendering Across Historical Workload States', () => {
  const dummyReadiness: ReadinessCheckIn = {
    sleepHours: 7.5,
    muscleSoreness: 2,
    legFatigue: false,
    energyLevel: 'moderate',
    restingHeartRate: 52,
    hrvRmssd: 55,
  };

  const dummyRecommendation: RecommendationResult = {
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
      title: 'Optimal Hybrid Training Session',
      rationale: 'Beban kronis dan akut berada di rasio ideal.',
      speedRunLocked: false,
      suggestedAction: 'Lakukan sesi Push-Pull-Legs reguler.',
    },
  };

  describe('WorkloadAdvisorCard', () => {
    it('renders cold-start insufficient data badge when history is empty / < 21 days', () => {
      const coldStartAcwr: ACWRResult = {
        ratio: 1.0,
        acuteLoad: 250,
        chronicLoad: 250,
        status: 'insufficient_data',
        daysCollected: 5,
        coldStartProgressPercent: 24,
        weeklySpikeAlert: false,
        weeklySpikePercent: 0,
        method: 'rolling_coupled',
      };

      render(
        <WorkloadAdvisorCard
          acwr={coldStartAcwr}
          recommendation={dummyRecommendation}
          readiness={dummyReadiness}
          readinessScore={82}
          lastLegsHoursAgo={48}
        />
      );

      expect(screen.getByText(/DATA BELUM CUKUP \(5\/21 HARI\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Athletic Workload Science/i)).toBeInTheDocument();
    });

    it('renders 7 days partial history status', () => {
      const sevenDaysAcwr: ACWRResult = {
        ratio: 1.0,
        acuteLoad: 300,
        chronicLoad: 300,
        status: 'insufficient_data',
        daysCollected: 7,
        coldStartProgressPercent: 33,
        weeklySpikeAlert: false,
        weeklySpikePercent: 0,
        method: 'rolling_coupled',
      };

      render(
        <WorkloadAdvisorCard
          acwr={sevenDaysAcwr}
          recommendation={dummyRecommendation}
          readiness={dummyReadiness}
          readinessScore={80}
          lastLegsHoursAgo={24}
        />
      );

      expect(screen.getByText(/DATA BELUM CUKUP \(7\/21 HARI\)/i)).toBeInTheDocument();
    });

    it('renders mature 28-day sweet spot status', () => {
      const matureAcwr: ACWRResult = {
        ratio: 1.08,
        acuteLoad: 350,
        chronicLoad: 325,
        status: 'sweet_spot',
        daysCollected: 28,
        coldStartProgressPercent: 100,
        weeklySpikeAlert: false,
        weeklySpikePercent: 7,
        method: 'rolling_coupled',
      };

      render(
        <WorkloadAdvisorCard
          acwr={matureAcwr}
          recommendation={dummyRecommendation}
          readiness={dummyReadiness}
          readinessScore={90}
          lastLegsHoursAgo={72}
        />
      );

      expect(screen.getByText(/SWEET SPOT \(ADAPTASI OPTIMAL\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/1.08/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders danger / overtraining spike alert when ACWR exceeds 1.5', () => {
      const overtrainingAcwr: ACWRResult = {
        ratio: 1.65,
        acuteLoad: 660,
        chronicLoad: 400,
        status: 'danger',
        daysCollected: 28,
        coldStartProgressPercent: 100,
        weeklySpikeAlert: true,
        weeklySpikePercent: 65,
        method: 'rolling_coupled',
      };

      const overtrainingRec: RecommendationResult = {
        targetCategory: 'mobility_recovery',
        volumeAdjustmentPercent: -30,
        guardrail: {
          level: 'high_risk',
          canOverride: true,
          warningTitle: 'Peringatan Overload',
          warningMessage: 'ACWR melebihi batas aman',
          suggestedAction: 'Deload',
          conflictDirection: 'none',
          allowedRunningTypes: [],
        },
        workoutDetail: {
          title: 'Sesi Pemulihan Aktif / Deload Diperlukan',
          rationale: 'Rasio ACWR 1.65 menunjukkan kelelahan akut melampaui toleransi kronis.',
          speedRunLocked: true,
          suggestedAction: 'Ganti sesi berat dengan mobilitas atau lari Zone 1 ringan.',
        },
      };

      render(
        <WorkloadAdvisorCard
          acwr={overtrainingAcwr}
          recommendation={overtrainingRec}
          readiness={dummyReadiness}
          readinessScore={55}
          lastLegsHoursAgo={12}
        />
      );

      expect(screen.getByText(/ZONA BAHAYA: LONJAKAN AKUT/i)).toBeInTheDocument();
      expect(screen.getAllByText(/1.65/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Sesi Pemulihan Aktif/i)).toBeInTheDocument();
    });
  });

  describe('TrendsDashboardCard', () => {
    it('renders empty historical state without crashing', () => {
      render(<TrendsDashboardCard history={[]} />);
      expect(screen.getByText(/Tren Beban Kerja & Rasio ACWR/i)).toBeInTheDocument();
    });

    it('renders 28 days of history with SVG chart and load bars', () => {
      const history28: DailyLog[] = Array.from({ length: 28 }, (_, i) => ({
        tanggal: `2026-09-${(28 - i).toString().padStart(2, '0')}`,
        strengthWorkouts: [],
        runningWorkouts: [],
        totalLoadScore: 300,
      }));

      render(<TrendsDashboardCard history={history28} />);
      expect(screen.getByText(/Tren Beban Kerja & Rasio ACWR/i)).toBeInTheDocument();
      expect(screen.getByText(/Beban Akut Terkini/i)).toBeInTheDocument();
      expect(screen.getByText(/Beban Kronis Terkini/i)).toBeInTheDocument();
    });
  });
});
