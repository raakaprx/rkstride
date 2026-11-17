import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { ACWRResult, RecommendationResult, ReadinessCheckIn, ExperienceLevel } from '@/types/workout';
import { Badge } from './ui/Badge';
import { EXPERIENCE_COPY } from '@/lib/experienceCopy';
import { AdvisorAcwrGauge } from './advisor/AdvisorAcwrGauge';
import { AdvisorBiometricsPanel } from './advisor/AdvisorBiometricsPanel';
import { AdvisorLegRecoveryCard } from './advisor/AdvisorLegRecoveryCard';

interface WorkloadAdvisorCardProps {
  acwr: ACWRResult;
  recommendation: RecommendationResult;
  readiness: ReadinessCheckIn;
  readinessScore: number;
  lastLegsHoursAgo: number;
  experienceLevel?: ExperienceLevel;
}

export const WorkloadAdvisorCard: React.FC<WorkloadAdvisorCardProps> = ({
  acwr,
  recommendation,
  readiness,
  readinessScore,
  lastLegsHoursAgo,
  experienceLevel = 'expert',
}) => {
  const tierCopy = EXPERIENCE_COPY[experienceLevel];
  const isColdStart = acwr.status === 'insufficient_data';
  // Single 1.4 guardrail (AGENTS.md)
  const isDanger = acwr.status === 'danger' || acwr.ratio > 1.4;
  const isSweetSpot = acwr.status === 'sweet_spot' || (acwr.ratio >= 0.8 && acwr.ratio <= 1.4 && !isDanger);

  // Status warna
  const statusColor = isColdStart
    ? 'var(--text-muted)'
    : isDanger
    ? 'var(--color-danger)'
    : isSweetSpot
    ? 'var(--color-success)'
    : 'var(--accent-neon)';

  // Persentase posisi meter ACWR (skala 0.5 hingga 2.0)
  const clampedRatio = Math.max(0.5, Math.min(2.0, acwr.ratio));
  const meterPercent = Math.round(((clampedRatio - 0.5) / 1.5) * 100);

  return (
    <div
      className="card-mobile"
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: isDanger
          ? '1px solid rgba(239, 68, 68, 0.35)'
          : '1px solid var(--border-default)',
        borderLeft: isDanger
          ? '3px solid var(--color-danger)'
          : isSweetSpot
          ? '3px solid var(--color-success)'
          : isColdStart
          ? '3px solid var(--text-muted)'
          : '3px solid var(--accent-neon)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-elevation-2)',
        position: 'relative',
      }}
    >
      {/* Header Workload Evaluation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: 'var(--text-muted)',
              }}
            >
              {tierCopy.advisorEyebrow}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                background: isDanger
                  ? 'var(--color-danger-bg)'
                  : isSweetSpot
                  ? 'var(--color-success-bg)'
                  : 'var(--accent-neon-subtle)',
                color: statusColor,
                border: `1px solid ${statusColor}40`,
                letterSpacing: '0.04em',
              }}
            >
              {isColdStart
                ? `DATA BELUM CUKUP (${acwr.daysCollected}/21 HARI)`
                : isDanger
                ? 'ZONA BAHAYA: LONJAKAN AKUT'
                : isSweetSpot
                ? 'SWEET SPOT (ADAPTASI OPTIMAL)'
                : 'UNDERTRAINING / DETRAINING'}
            </span>
          </div>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            {isColdStart ? (
              <>
                <Activity size={22} style={{ color: 'var(--text-muted)' }} />
                Pengumpulan Data Baseline ({acwr.coldStartProgressPercent}% Selesai)
              </>
            ) : isDanger ? (
              <>
                <AlertTriangle size={22} style={{ color: 'var(--color-danger)' }} />
                Indikator Risiko Lonjakan Beban Latihan Akut
              </>
            ) : isSweetSpot ? (
              <>
                <CheckCircle2 size={22} style={{ color: 'var(--color-success)' }} />
                Beban Latihan Optimal &amp; Berimbang
              </>
            ) : (
              <>
                <TrendingUp size={22} style={{ color: 'var(--accent-neon)' }} />
                Kapasitas Siap untuk Progressive Overload Bertahap
              </>
            )}
          </h2>
        </div>

        {/* Bio-Readiness Score from Smartwatch */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Smartwatch Bio-Readiness
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {readinessScore}
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div
            style={{
              padding: '0.3rem 0.7rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: readinessScore >= 75 ? 'var(--color-success-bg)' : readinessScore >= 50 ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
              color: readinessScore >= 75 ? 'var(--color-success)' : readinessScore >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
              border: `1px solid ${readinessScore >= 75 ? 'rgba(16, 185, 129, 0.3)' : readinessScore >= 50 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
            }}
          >
            {readinessScore >= 75 ? 'PRIME' : readinessScore >= 50 ? 'MODERATE' : 'FATIGUED'}
          </div>
        </div>
      </div>

      {/* Status Grid: ACWR Ratio + Visual Meter + Biometrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <AdvisorAcwrGauge
          acwr={acwr}
          tierCopy={tierCopy}
          statusColor={statusColor}
          meterPercent={meterPercent}
        />

        <AdvisorBiometricsPanel readiness={readiness} />

        <AdvisorLegRecoveryCard
          lastLegsHoursAgo={lastLegsHoursAgo}
          tierCopy={tierCopy}
        />
      </div>

      {/* Empty-history guidance: fresh user has no logged sessions yet */}
      {acwr.daysCollected === 0 && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-neon-subtle)',
            border: '1px solid rgba(204, 255, 0, 0.25)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--accent-neon)' }}>Belum ada data latihan.</strong>{' '}
          Catat sesi pertama Anda pada modul Workout Logger di bawah untuk mulai membangun baseline beban kerja (minimal 21 hari untuk rasio ACWR yang bermakna).
        </div>
      )}

      {/* Daily Smart Recommendation Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.05) 0%, rgba(24, 24, 27, 0.9) 100%)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Smart Daily Prescription (Workload &amp; Biometrics)
          </div>
          {recommendation.volumeAdjustmentPercent !== 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              Volume Adjustment: {recommendation.volumeAdjustmentPercent}%
            </span>
          )}
        </div>

        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          {recommendation.workoutDetail?.title || 'Evaluasi Beban Harian'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          {recommendation.workoutDetail?.rationale || 'Rekomendasi disesuaikan dengan adaptasi kronis dan kebugaran harian.'}
        </div>

        {recommendation.workoutDetail?.suggestedAction && (
          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--accent-neon)' }}>Actionable Plan:</strong> {recommendation.workoutDetail.suggestedAction}
          </div>
        )}

        {/* Interference guardrail state: warning, speed-run lock, allowed types */}
        {recommendation.guardrail.level !== 'none' && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.8rem',
              lineHeight: 1.4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
              <strong style={{ color: 'var(--color-warning)' }}>{recommendation.guardrail.warningTitle}</strong>
              {recommendation.workoutDetail.speedRunLocked && (
                <Badge tone="danger">Lari tempo/interval terkunci</Badge>
              )}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>{recommendation.guardrail.warningMessage}</div>
            {recommendation.guardrail.allowedRunningTypes.length > 0 && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Lari yang diizinkan: <strong style={{ color: 'var(--text-primary)' }}>{recommendation.guardrail.allowedRunningTypes.join(', ')}</strong>
              </div>
            )}
          </div>
        )}

        {/* Tendon / Joint Load Warning if Active */}
        {recommendation.tendonWarning && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.8rem',
              color: 'var(--color-danger)',
              lineHeight: 1.4,
            }}
          >
            <strong>Peringatan Jaringan Lunak:</strong> {recommendation.tendonWarning}
          </div>
        )}

        {/* Weekly Workload Spike Alert (> 15% Increase) */}
        {acwr.weeklySpikeAlert && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.8rem',
              color: 'var(--color-warning)',
              lineHeight: 1.4,
            }}
          >
            <strong>Peringatan Lonjakan Mingguan:</strong> Beban latihan minggu ini naik +{acwr.weeklySpikePercent}% dibanding minggu sebelumnya (melebihi ambang batas aman 15%). Monitor respon pemulihan sistem saraf.
          </div>
        )}
      </div>

      {/* Non-Medical Decision Support Disclaimer */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>Disclaimer Non-Medis:</strong> Metrik beban kerja (ACWR) dan skor kesiapan adalah indikator risiko beban mekanis serta alat bantu keputusan latihan atletik, bukan diagnosis medis atau penjamin pencegahan cedera. Konsultasikan dengan fisioterapis atau tenaga medis jika mengalami nyeri sendi tajam atau gejala tidak wajar.
      </div>
    </div>
  );
};



