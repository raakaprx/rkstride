import React from 'react';
import type { ACWRResult } from '@/types/workout';
import type { ExperienceTierCopy } from '@/lib/experienceCopy';

interface AdvisorAcwrGaugeProps {
  acwr: ACWRResult;
  tierCopy: ExperienceTierCopy;
  statusColor: string;
  meterPercent: number;
}

export const AdvisorAcwrGauge: React.FC<AdvisorAcwrGaugeProps> = ({
  acwr,
  tierCopy,
  statusColor,
  meterPercent,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tierCopy.acwrRatioLabel}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tierCopy.acwrModelNote}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.4rem' }}>
        <span
          style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            fontFamily: 'var(--font-family-display)',
            color: statusColor,
          }}
        >
          {acwr.ratio}
        </span>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div>{tierCopy.acuteLabel}: <strong style={{ color: 'var(--text-primary)' }}>{acwr.acuteLoad}</strong> pts/hari</div>
          <div>{tierCopy.chronicLabel}: <strong style={{ color: 'var(--text-primary)' }}>{acwr.chronicLoad}</strong> pts/hari</div>
        </div>
      </div>

      {/* ACWR Segmented Athletic Gauge */}
      <div style={{ marginTop: '1.1rem' }}>
        <div style={{ position: 'relative', height: '14px', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '100%', height: '6px', gap: '3px', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              title="Under-load Zone (< 0.8)"
              style={{
                flex: '20',
                background: 'rgba(100, 116, 139, 0.35)',
                borderRadius: '2px 0 0 2px',
              }}
            />
            <div
              title="Sweet Spot (0.8 - 1.4)"
              style={{
                flex: '40',
                background: 'rgba(16, 185, 129, 0.55)',
              }}
            />
            <div
              title="High Risk (> 1.4)"
              style={{
                flex: '40',
                background: 'rgba(239, 68, 68, 0.5)',
                borderRadius: '0 2px 2px 0',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              left: `${meterPercent}%`,
              top: '-3px',
              width: '4px',
              height: '18px',
              background: 'var(--text-primary)',
              borderRadius: '2px',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 6px rgba(0, 0, 0, 0.7), 0 0 3px var(--text-primary)',
              zIndex: 2,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: '0.5rem',
          }}
        >
          <span>&lt; 0.8 Underload</span>
          <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>0.8 – 1.4 Sweet Spot</span>
          <span style={{ color: 'var(--color-danger)' }}>&gt; 1.4 Spike Risk</span>
        </div>
      </div>
    </div>
  );
};
