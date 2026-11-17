import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ExperienceLevel } from '@/types/workout';
import type { LevelDescriptionInfo } from './AuthLoginForm';

interface AuthRegisterFormProps {
  athleteName: string;
  setAthleteName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  pin: string;
  setPin: (val: string) => void;
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (val: ExperienceLevel) => void;
  age: string;
  setAge: (val: string) => void;
  weightKg: string;
  setWeightKg: (val: string) => void;
  heightCm: string;
  setHeightCm: (val: string) => void;
  agreedDisclaimer: boolean;
  setAgreedDisclaimer: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  levelDescriptions: Record<ExperienceLevel, LevelDescriptionInfo>;
}

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  athleteName,
  setAthleteName,
  email,
  setEmail,
  pin,
  setPin,
  experienceLevel,
  setExperienceLevel,
  age,
  setAge,
  weightKg,
  setWeightKg,
  heightCm,
  setHeightCm,
  agreedDisclaimer,
  setAgreedDisclaimer,
  onSubmit,
  levelDescriptions,
}) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          Buat Profil Atlet Hibrida Baru
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Data disimpan secara privat di peramban perangkat Anda dan menyesuaikan bahasa aplikasi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '0.75rem' }}>
        <div>
          <label
            htmlFor="reg-name-input"
            style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
          >
            Nama Panggilan Atlet
          </label>
          <input
            id="reg-name-input"
            type="text"
            value={athleteName}
            onChange={(e) => setAthleteName(e.target.value)}
            placeholder="Nama panggilan Anda"
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="reg-email-input"
            style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
          >
            Email / ID Lokal
          </label>
          <input
            id="reg-email-input"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="reg-pin-input"
          style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}
        >
          PIN Akses Lokal (Minimal 4 Karakter)
        </label>
        <input
          id="reg-pin-input"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Minimal 4 karakter"
          style={{
            width: '100%',
            padding: '0.55rem 0.75rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
          }}
        />
      </div>

      {/* Experience Level Selector */}
      <div>
        <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          Pilih Tingkat Pengalaman &amp; Bahasa Antarmuka:
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginBottom: '0.5rem' }}>
          {(['beginner', 'intermediate', 'expert'] as const).map((lvl) => {
            const isSelected = experienceLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setExperienceLevel(lvl)}
                aria-pressed={isSelected}
                style={{
                  padding: '0.55rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--accent-neon-subtle)' : 'var(--bg-secondary)',
                  border: isSelected ? '1.5px solid var(--border-focus)' : '1px solid var(--border-default)',
                  color: isSelected ? 'var(--accent-neon)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {levelDescriptions[lvl].label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '0.65rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>
            Mode {levelDescriptions[experienceLevel].label}:
          </strong>{' '}
          {levelDescriptions[experienceLevel].subtitle}
          <div style={{ color: 'var(--accent-neon)', marginTop: '0.2rem', fontWeight: 600 }}>
            {levelDescriptions[experienceLevel].sampleTerms}
          </div>
        </div>
      </div>

      {/* Basic Biometrics */}
      <div>
        <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          Biometrik Dasar (Kalibrasi Energi &amp; Detak Jantung):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          <div>
            <label htmlFor="reg-age" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              Usia (thn)
            </label>
            <input
              id="reg-age"
              type="number"
              min={12}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div>
            <label htmlFor="reg-weight" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              Berat (kg)
            </label>
            <input
              id="reg-weight"
              type="number"
              min={30}
              max={250}
              step="0.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div>
            <label htmlFor="reg-height" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              Tinggi (cm)
            </label>
            <input
              id="reg-height"
              type="number"
              min={100}
              max={250}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Non-Medical Disclaimer Checkbox */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          background: agreedDisclaimer ? 'var(--accent-neon-subtle)' : 'var(--bg-secondary)',
          border: agreedDisclaimer ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
          fontSize: '0.78rem',
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={agreedDisclaimer}
          onChange={(e) => setAgreedDisclaimer(e.target.checked)}
          style={{ marginTop: '2px', flexShrink: 0, cursor: 'pointer' }}
        />
        <span>
          Saya memahami bahwa RKStride adalah sistem pendukung keputusan latihan atletik non-medis dan seluruh data disimpan lokal di perangkat saya.
        </span>
      </label>

      <button
        type="submit"
        style={{
          width: '100%',
          minHeight: '48px',
          padding: '0.85rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-neon)',
          color: 'var(--text-inverse)',
          fontWeight: 800,
          fontSize: '0.9rem',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <CheckCircle2 size={18} />
        <span>Buat Akun &amp; Masuk ke Dasbor</span>
      </button>
    </form>
  );
};
