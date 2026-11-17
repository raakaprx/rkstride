import React from 'react';

interface ProfileBiometricsSectionProps {
  age: number;
  weightKg: number;
  heightCm: number;
  gender: 'male' | 'female';
  onChange: (fields: Partial<{ age: number; weightKg: number; heightCm: number; gender: 'male' | 'female' }>) => void;
}

export const ProfileBiometricsSection: React.FC<ProfileBiometricsSectionProps> = ({
  age,
  weightKg,
  heightCm,
  gender,
  onChange,
}) => {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        1. Biometrik Fisik
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Usia (Tahun)
          </label>
          <input
            type="number"
            min="12"
            max="99"
            required
            value={age}
            onChange={(e) => onChange({ age: Number(e.target.value) })}
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
            Berat Badan (kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="30"
            max="250"
            required
            value={weightKg}
            onChange={(e) => onChange({ weightKg: Number(e.target.value) })}
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
            Tinggi Badan (cm)
          </label>
          <input
            type="number"
            min="100"
            max="250"
            required
            value={heightCm}
            onChange={(e) => onChange({ heightCm: Number(e.target.value) })}
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
            Fisiologi / Gender
          </label>
          <select
            value={gender || 'male'}
            onChange={(e) => onChange({ gender: e.target.value as 'male' | 'female' })}
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
            <option value="male">Pria</option>
            <option value="female">Wanita</option>
          </select>
        </div>
      </div>
    </div>
  );
};
