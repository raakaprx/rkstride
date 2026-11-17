import React from 'react';
import { Lock, Activity } from 'lucide-react';
import type { ExperienceLevel } from '@/types/workout';
import type { StoredLocalAccount } from '@/lib/db/profileRepo';

export interface LevelDescriptionInfo {
  label: string;
  subtitle: string;
  sampleTerms: string;
}

interface AuthLoginFormProps {
  accounts: StoredLocalAccount[];
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPin: string;
  setLoginPin: (val: string) => void;
  quickLevel: ExperienceLevel;
  setQuickLevel: (val: ExperienceLevel) => void;
  onSubmit: (e: React.FormEvent) => void;
  onQuickStart: () => void;
  setErrorMsg: (val: string | null) => void;
  levelDescriptions: Record<ExperienceLevel, LevelDescriptionInfo>;
}

export const AuthLoginForm: React.FC<AuthLoginFormProps> = ({
  accounts,
  loginEmail,
  setLoginEmail,
  loginPin,
  setLoginPin,
  quickLevel,
  setQuickLevel,
  onSubmit,
  onQuickStart,
  setErrorMsg,
  levelDescriptions,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            Masuk ke Profil Atlet Anda
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Masuk menggunakan akun lokal yang tersimpan di perangkat ini.
          </p>
        </div>

        {accounts.length > 0 && (
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Akun Tersimpan di Perangkat Ini:
            </span>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {accounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setLoginEmail(acc.email);
                    setErrorMsg(null);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: loginEmail === acc.email ? 'var(--accent-neon-subtle)' : 'var(--bg-secondary)',
                    border: loginEmail === acc.email ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
                    color: loginEmail === acc.email ? 'var(--accent-neon)' : 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {acc.athleteName} ({(levelDescriptions[acc.experienceLevel] ?? levelDescriptions.intermediate).label})
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="login-email-input"
            style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}
          >
            Email atau ID Atlet Lokal
          </label>
          <input
            id="login-email-input"
            type="text"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="email@contoh.com"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="login-pin-input"
            style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}
          >
            PIN Akses Lokal
          </label>
          <input
            id="login-pin-input"
            type="password"
            value={loginPin}
            onChange={(e) => setLoginPin(e.target.value)}
            placeholder="Masukkan PIN Anda"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '0.8rem',
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
          <Lock size={17} />
          <span>Masuk ke Dasbor Latihan</span>
        </button>
      </form>

      {/* Quick Evaluation Entry with Experience Level Selection */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div>
          <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Belum Punya Akun atau Ingin Masuk Cepat?
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Pilih tingkat pengalaman Anda di bawah ini untuk langsung mencoba aplikasi dengan bahasa yang sesuai:
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
          {(['beginner', 'intermediate', 'expert'] as const).map((lvl) => {
            const active = quickLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setQuickLevel(lvl)}
                aria-pressed={active}
                style={{
                  padding: '0.5rem 0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--accent-neon-subtle)' : 'var(--bg-secondary)',
                  border: active ? '1.5px solid var(--border-focus)' : '1px solid var(--border-default)',
                  color: active ? 'var(--accent-neon)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
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
          <strong style={{ color: 'var(--accent-neon)' }}>Mode {levelDescriptions[quickLevel].label}:</strong>{' '}
          {levelDescriptions[quickLevel].subtitle}
        </div>

        <button
          type="button"
          onClick={onQuickStart}
          style={{
            width: '100%',
            minHeight: '46px',
            padding: '0.7rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-focus)',
            color: 'var(--accent-neon)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
          }}
        >
          <Activity size={16} />
          <span>Masuk Cepat sebagai Atlet {levelDescriptions[quickLevel].label}</span>
        </button>
      </div>
    </div>
  );
};
