import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import type { ExperienceTierCopy } from '@/lib/experienceCopy';

interface AdvisorLegRecoveryCardProps {
  lastLegsHoursAgo: number;
  tierCopy: ExperienceTierCopy;
}

export const AdvisorLegRecoveryCard: React.FC<AdvisorLegRecoveryCardProps> = ({
  lastLegsHoursAgo,
  tierCopy,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        border: lastLegsHoursAgo < 48 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tierCopy.legWindowTitle}</span>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: lastLegsHoursAgo < 48 ? 'var(--color-warning)' : 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          {lastLegsHoursAgo < 48 ? <Lock size={12} /> : <Unlock size={12} />}
          {lastLegsHoursAgo < 48 ? 'PROTECTION LOCKED' : 'FRESH & READY'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {lastLegsHoursAgo < 900 ? `${lastLegsHoursAgo}h` : '> 72h'}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>since previous leg session</span>
      </div>

      <div
        style={{
          marginTop: '0.85rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          fontSize: '0.78rem',
          lineHeight: 1.4,
          color: lastLegsHoursAgo < 48 ? 'var(--text-secondary)' : 'var(--text-muted)',
        }}
      >
        {lastLegsHoursAgo < 48 ? (
          <span style={{ color: 'var(--color-warning)' }}>
            Perhatian: Sesi lari cepat (Norwegian 4x4, interval, tempo) dan squat berat dibatasi untuk pemulihan tendon patela dan hamstring.
          </span>
        ) : (
          <span style={{ color: 'var(--color-success)' }}>
            Otot kaki telah melewati jendela pemulihan 48 jam. Sesi lari intensitas tinggi dan latihan kaki siap dieksekusi.
          </span>
        )}
      </div>
    </div>
  );
};
