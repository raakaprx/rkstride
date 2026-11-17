import React from 'react';
import { Layers, Info } from 'lucide-react';

interface AuthLandingGateHeaderProps {
  onOpenOdooModal: () => void;
  onOpenAboutModal: () => void;
}

export const AuthLandingGateHeader: React.FC<AuthLandingGateHeaderProps> = ({
  onOpenOdooModal,
  onOpenAboutModal,
}) => {
  return (
    <header
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        paddingTop: 'var(--safe-top)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 19L11 4H15L8 19H4Z" style={{ fill: 'var(--accent-neon)' }} />
              <path
                d="M13 11L18 4H21L15 13L20 20H16L12.5 15"
                style={{ stroke: 'var(--accent-neon)' }}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontWeight: 900,
              fontSize: '1.1rem',
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
            }}
          >
            RK<span style={{ color: 'var(--accent-neon)' }}>STRIDE</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenOdooModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-neon-subtle)',
              border: '1px solid var(--border-focus)',
              color: 'var(--accent-neon)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Layers size={15} />
            <span>Sprint Odoo &amp; Dokumentasi</span>
          </button>

          <button
            type="button"
            onClick={onOpenAboutModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Info size={15} style={{ color: 'var(--accent-neon)' }} />
            <span>Basis Sains &amp; Privasi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
