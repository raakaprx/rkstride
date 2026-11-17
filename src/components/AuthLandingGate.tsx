import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { AthleteAuthSession, ExperienceLevel, UserProfile } from '@/types/workout';
import {
  type StoredLocalAccount,
  getRegisteredAccounts,
  saveRegisteredAccount,
} from '@/lib/db/profileRepo';
import { AuthLandingGateHeader } from './auth/AuthLandingGateHeader';
import { AuthValueProposition } from './auth/AuthValueProposition';
import { AuthLoginForm, type LevelDescriptionInfo } from './auth/AuthLoginForm';
import { AuthRegisterForm } from './auth/AuthRegisterForm';

export type { StoredLocalAccount };

interface AuthLandingGateProps {
  onAuthenticated: (session: AthleteAuthSession, profileUpdates?: Partial<UserProfile>) => void;
  onOpenOdooModal: () => void;
  onOpenAboutModal: () => void;
}

const LEVEL_DESCRIPTIONS: Record<ExperienceLevel, LevelDescriptionInfo> = {
  beginner: {
    label: 'Pemula',
    subtitle: 'Bahasa sehari-hari yang sederhana dan panduan langkah demi langkah.',
    sampleTerms: 'Istilah: Status Keamanan Latihan, Tingkat Capek (1-10), Istirahat Kaki 2 Hari.',
  },
  intermediate: {
    label: 'Menengah',
    subtitle: 'Seimbang antara instruksi praktis dan metrik utama latihan hibrida.',
    sampleTerms: 'Istilah: Rasio Beban ACWR (0.8-1.4), Skala Usaha RPE, Zona Detak Jantung.',
  },
  expert: {
    label: 'Expert',
    subtitle: 'Terminologi sports science penuh dan kontrol formula lanjutan.',
    sampleTerms: 'Istilah: ACWR (Coupled/Uncoupled/EWMA), Foster sRPE, Edwards TRIMP, Karvonen HRR.',
  },
};

export const AuthLandingGate: React.FC<AuthLandingGateProps> = ({
  onAuthenticated,
  onOpenOdooModal,
  onOpenAboutModal,
}) => {
  const [accounts, setAccounts] = useState<StoredLocalAccount[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [quickLevel, setQuickLevel] = useState<ExperienceLevel>('beginner');

  // Register form state
  const [athleteName, setAthleteName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('beginner');
  const [age, setAge] = useState<string>('28');
  const [weightKg, setWeightKg] = useState<string>('70');
  const [heightCm, setHeightCm] = useState<string>('170');
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = getRegisteredAccounts();
    setAccounts(stored);
    if (stored.length > 0) {
      setAuthMode('login');
      setLoginEmail(stored[0].email);
      setQuickLevel(stored[0].experienceLevel);
    }
  }, []);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = athleteName.trim();
    const trimmedEmail = email.trim();
    const trimmedPin = pin.trim();

    if (!trimmedName) {
      setErrorMsg('Harap isi nama panggilan atlet Anda.');
      return;
    }
    if (!trimmedEmail) {
      setErrorMsg('Harap isi alamat email atau ID lokal Anda.');
      return;
    }
    if (trimmedPin.length < 4) {
      setErrorMsg('PIN akses lokal harus terdiri dari minimal 4 karakter.');
      return;
    }
    if (!agreedDisclaimer) {
      setErrorMsg('Harap centang persetujuan batas sistem pendukung keputusan non-medis.');
      return;
    }

    const parsedAge = Math.max(12, Math.min(99, parseInt(age, 10) || 28));
    const parsedWeight = Math.max(30, Math.min(250, parseFloat(weightKg) || 70));
    const parsedHeight = Math.max(100, Math.min(250, parseInt(heightCm, 10) || 170));

    const newAccount: StoredLocalAccount = {
      athleteName: trimmedName,
      email: trimmedEmail,
      pin: trimmedPin,
      experienceLevel,
      age: parsedAge,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      createdAt: new Date().toISOString(),
    };

    saveRegisteredAccount(newAccount);

    onAuthenticated(
      {
        athleteName: trimmedName,
        email: trimmedEmail,
        experienceLevel,
        loggedInAt: new Date().toISOString(),
      },
      {
        athleteName: trimmedName,
        email: trimmedEmail,
        experienceLevel,
        age: parsedAge,
        weightKg: parsedWeight,
        heightCm: parsedHeight,
      }
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = loginEmail.trim().toLowerCase();
    const trimmedPin = loginPin.trim();

    if (!trimmedEmail || !trimmedPin) {
      setErrorMsg('Masukkan Email/ID Lokal dan PIN Anda untuk masuk.');
      return;
    }

    const found = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
    if (!found) {
      setErrorMsg('Akun tidak ditemukan di perangkat ini. Silakan daftar di tab Daftar Atlet Baru.');
      return;
    }

    if (found.pin !== trimmedPin) {
      setErrorMsg('PIN yang Anda masukkan tidak sesuai.');
      return;
    }

    onAuthenticated(
      {
        athleteName: found.athleteName,
        email: found.email,
        experienceLevel: found.experienceLevel,
        loggedInAt: new Date().toISOString(),
      },
      {
        athleteName: found.athleteName,
        email: found.email,
        experienceLevel: found.experienceLevel,
        age: found.age,
        weightKg: found.weightKg,
        heightCm: found.heightCm,
      }
    );
  };

  const handleQuickStart = () => {
    setErrorMsg(null);
    onAuthenticated(
      {
        athleteName: `Atlet ${LEVEL_DESCRIPTIONS[quickLevel].label}`,
        email: `${quickLevel}@rkstride.local`,
        experienceLevel: quickLevel,
        loggedInAt: new Date().toISOString(),
      },
      {
        athleteName: `Atlet ${LEVEL_DESCRIPTIONS[quickLevel].label}`,
        email: `${quickLevel}@rkstride.local`,
        experienceLevel: quickLevel,
      }
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AuthLandingGateHeader
        onOpenOdooModal={onOpenOdooModal}
        onOpenAboutModal={onOpenAboutModal}
      />

      <main
        style={{
          flex: 1,
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        <AuthValueProposition />

        <section
          aria-label="Formulir masuk dan pendaftaran atlet"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--accent-neon)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-elevation-2)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              background: 'var(--bg-secondary)',
              padding: '0.3rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.35rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              aria-pressed={authMode === 'login'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: authMode === 'login' ? 'var(--accent-neon)' : 'transparent',
                color: authMode === 'login' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <LogIn size={16} />
              <span>Masuk Akun</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              aria-pressed={authMode === 'register'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: authMode === 'register' ? 'var(--accent-neon)' : 'transparent',
                color: authMode === 'register' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={16} />
              <span>Daftar Atlet Baru</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '1.15rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'login' && (
            <AuthLoginForm
              accounts={accounts}
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              loginPin={loginPin}
              setLoginPin={setLoginPin}
              quickLevel={quickLevel}
              setQuickLevel={setQuickLevel}
              onSubmit={handleLoginSubmit}
              onQuickStart={handleQuickStart}
              setErrorMsg={setErrorMsg}
              levelDescriptions={LEVEL_DESCRIPTIONS}
            />
          )}

          {authMode === 'register' && (
            <AuthRegisterForm
              athleteName={athleteName}
              setAthleteName={setAthleteName}
              email={email}
              setEmail={setEmail}
              pin={pin}
              setPin={setPin}
              experienceLevel={experienceLevel}
              setExperienceLevel={setExperienceLevel}
              age={age}
              setAge={setAge}
              weightKg={weightKg}
              setWeightKg={setWeightKg}
              heightCm={heightCm}
              setHeightCm={setHeightCm}
              agreedDisclaimer={agreedDisclaimer}
              setAgreedDisclaimer={setAgreedDisclaimer}
              onSubmit={handleRegisterSubmit}
              levelDescriptions={LEVEL_DESCRIPTIONS}
            />
          )}
        </section>
      </main>
    </div>
  );
};
