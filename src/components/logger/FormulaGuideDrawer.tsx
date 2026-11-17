import React from 'react';

interface FormulaGuideDrawerProps {
  isOpen: boolean;
}

export const FormulaGuideDrawer: React.FC<FormulaGuideDrawerProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1.75rem',
      }}
    >
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        Sports Science Foundation &amp; Mathematical Engines in RKStride
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1rem',
        }}
      >
        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ color: 'var(--accent-neon)', fontSize: '0.85rem' }}>
            1. Strength Load (Foster Session-RPE) &amp; Tonnage
          </strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Derived from <em>Foster Session-RPE</em> (with secondary Tonnage tracking):
            <div
              style={{
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                margin: '0.35rem 0',
              }}
            >
              sRPE Load = Duration_min × Session_RPE (Tonnage = sum(Weight_kg × Reps))
            </div>
            Duration defaults to working sets × 3 min when omitted; warmup sets are excluded from volume tonnage.
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ color: 'var(--color-info)', fontSize: '0.85rem' }}>
            2. Running Spectrum &amp; Heart Rate TRIMP
          </strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Edwards Zone-weighted accumulation across Karvonen HR Zones:
            <div
              style={{
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                margin: '0.35rem 0',
              }}
            >
              TRIMP = sum(Duration_min × Zone_Weight)
            </div>
            Zone 1 (1.0x), Zone 2 (1.2x), Zone 3 (1.5x), Zone 4 (2.2x), Zone 5 (3.5x). Sensorless fallback: Durasi (menit) × RPE × 0.2.
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <strong style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>
            3. ACWR Guardrail (Dr. Tim Gabbett)
          </strong>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Ratio of Acute Load (7-day) to Chronic Load (28-day, 21-day cold-start guard):
            <div
              style={{
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                margin: '0.35rem 0',
              }}
            >
              ACWR = Acute_Load (7d) / Chronic_Load (28d)
            </div>
            0.8–1.4 is the adaptation sweet spot. ACWR &gt; 1.4 signifies acute overload and triggers deload.
          </div>
        </div>
      </div>
    </div>
  );
};
