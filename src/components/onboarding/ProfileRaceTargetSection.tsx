import React from 'react';
import type { RaceCategory } from '@/types/productFeatures';

interface ProfileRaceTargetSectionProps {
  targetRaceName: string;
  targetRaceCategory: RaceCategory;
  targetRaceDate: string;
  onChange: (fields: Partial<{
    targetRaceName: string;
    targetRaceCategory: RaceCategory;
    targetRaceDate: string;
  }>) => void;
}

export const ProfileRaceTargetSection: React.FC<ProfileRaceTargetSectionProps> = ({
  targetRaceName,
  targetRaceCategory,
  targetRaceDate,
  onChange,
}) => {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        3. Target Kompetisi &amp; Periodisasi Tapering
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Nama Event Lomba
          </label>
          <input
            type="text"
            placeholder="Contoh: Bali Marathon"
            value={targetRaceName || ''}
            onChange={(e) => onChange({ targetRaceName: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Kategori Jarak
          </label>
          <select
            value={targetRaceCategory || 'half_marathon'}
            onChange={(e) => onChange({ targetRaceCategory: e.target.value as RaceCategory })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          >
            <option value="5k">5K Run (5.0 km)</option>
            <option value="10k">10K Run (10.0 km)</option>
            <option value="half_marathon">Half Marathon (21.1 km)</option>
            <option value="marathon">Full Marathon (42.2 km)</option>
            <option value="hyrox">HYROX Event (8 km + Functional)</option>
            <option value="none">Tidak Ada Target Lomba (General Fitness)</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Tanggal Hari Lomba
          </label>
          <input
            type="date"
            value={targetRaceDate || ''}
            onChange={(e) => onChange({ targetRaceDate: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Aplikasi akan otomatis mengaktifkan modul tapering 2-3 pekan sebelum hari-H.
          </span>
        </div>
      </div>
    </div>
  );
};
