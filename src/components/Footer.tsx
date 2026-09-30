import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: '3.5rem',
        padding: '2.5rem 1.5rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 900,
                fontSize: '1.1rem',
                color: '#FFFFFF',
              }}
            >
              RK<span style={{ color: 'var(--accent-neon)' }}>STRIDE</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              // Hybrid Performance &amp; Workload Intelligence
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
            Evidence-based athletic workload calculation engine grounded in Dr. Tim Gabbett&apos;s Acute:Chronic Workload Ratio (ACWR) and Norwegian 4x4 cardiorespiratory protocol with universal smartwatch biometric integration.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
            <span>Injury Prevention Guard Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={16} style={{ color: 'var(--accent-neon)' }} />
            <span>Smartwatch Biometric Bridge</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
