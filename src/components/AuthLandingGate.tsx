import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  Dumbbell,
  Timer,
  Lock,
  UserPlus,
  LogIn,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AthleteAuthSession, ExperienceLevel, UserProfile } from '@/types/workout';

export interface StoredLocalAccount {
  athleteName: string;
  email: string;
  pin: string;
  experienceLevel: ExperienceLevel;
  age: number;
  weightKg: number;
  heightCm: number;
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = 'rkstride_registered_accounts';

export function getRegisteredAccounts(): StoredLocalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRegisteredAccount(account: StoredLocalAccount): void {
  const existing = getRegisteredAccounts().filter(
    (a) => a.email.toLowerCase() !== account.email.toLowerCase()
  );
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([account, ...existing]));
}

interface AuthLandingGateProps {
  onAuthenticated: (session: AthleteAuthSession, profileUpdates?: Partial<UserProfile>) => void;
  onOpenOdooModal: () => void;
  onOpenAboutModal: () => void;
}

const LEVEL_DESCRIPTIONS: Record<
  ExperienceLevel,
  { label: string; subtitle: string; sampleTerms: string }
> = {
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
      {/* Top Bar */}
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

      {/* Main Content Split: Value Proposition (Left) + Login/Register Gate (Right) */}
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
        {/* LEFT COLUMN: VALUE PROPOSITION & WHY RKSTRIDE */}
        <section aria-label="Pengenalan nilai RKStride" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.65rem, 3.2vw, 2.35rem)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                marginBottom: '0.75rem',
              }}
            >
              SATU MESIN BEBAN UNTUK{' '}
              <span style={{ color: 'var(--accent-neon)' }}>ANGKAT BEBAN &amp; LARI</span>
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Mengapa atlet hibrida membutuhkan RKStride? Aplikasi gym biasa tidak tahu Anda baru saja berlari interval kemarin. Sebaliknya, aplikasi lari tidak tahu otot paha Anda masih mengalami kelelahan pasca latihan beban kaki (<em>Leg Day</em>). Benturan ini memicu kelelahan berlebih pada tendon lutut dan menghambat perkembangan otot.
            </p>
          </div>

          {/* Identity Motif: Live ACWR Zone Explanation Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderLeft: '3px solid var(--color-success)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Cara Kerja Penjaga Beban RKStride (ACWR)
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                }}
              >
                TARGET SWEET SPOT: 0.8 - 1.4
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.9rem' }}>
              RKStride membandingkan beban latihan <strong>7 hari terakhir (Akut)</strong> dengan rata-rata <strong>28 hari terakhir (Kronis)</strong> agar peningkatan porsi latihan Anda selalu berada di zona adaptasi aman:
            </p>

            {/* Segmented Gauge Visual */}
            <div style={{ position: 'relative', height: '14px', display: 'flex', alignItems: 'center', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', width: '100%', height: '7px', gap: '3px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ flex: 20, background: 'var(--border-strong)' }} title="Underload (< 0.8)" />
                <div style={{ flex: 40, background: 'var(--color-success)' }} title="Sweet Spot (0.8 - 1.4)" />
                <div style={{ flex: 40, background: 'var(--color-danger)' }} title="Zona Bahaya (> 1.4)" />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: '40%',
                  top: '-2px',
                  width: '4px',
                  height: '18px',
                  background: 'var(--accent-neon)',
                  borderRadius: '2px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <span>&lt; 0.8 Kurang Latihan</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>0.8 - 1.4 Zona Adaptasi Aman</span>
              <span style={{ color: 'var(--color-danger)' }}>&gt; 1.4 Lonjakan Berisiko</span>
            </div>
          </div>

          {/* 3 Core Value Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.15rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
              }}
            >
              <Dumbbell size={20} style={{ color: 'var(--accent-neon)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  1. Penyatuan Skor Angkat Beban (PPL) &amp; Lari
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  Tidak perlu lagi menebak apakah total latihan minggu ini terlalu berat. Beban repetisi gym dan durasi lari (Zona 2 hingga <em>Norwegian 4x4</em>) dihitung dalam satu indikator terpadu.
                </p>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.15rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
              }}
            >
              <Timer size={20} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  2. Proteksi Jeda Pemulihan Kaki 48 Jam
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  Sistem memperingatkan Anda jika menjadwalkan lari kecepatan tinggi kurang dari 48 jam setelah latihan kaki berat, namun tetap mengizinkan lari santai pemulihan (Zona 1-2 &le; 45 menit).
                </p>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.15rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
              }}
            >
              <ShieldCheck size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  3. Menyesuaikan Level Anda (Pemula, Menengah, Expert) &amp; Privat
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  Pilih mode bahasa yang sesuai dengan pemahaman Anda. Seluruh data tersimpan 100% lokal di perangkat Anda (IndexedDB) dan dapat dicadangkan kapan saja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: LOGIN & REGISTRATION CARD */}
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
          {/* Mode Switcher: Masuk Akun vs Daftar Atlet Baru */}
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

          {/* TAB 1: LOGIN FORM */}
          {authMode === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          {acc.athleteName} ({LEVEL_DESCRIPTIONS[acc.experienceLevel].label})
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
                        {LEVEL_DESCRIPTIONS[lvl].label}
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
                  <strong style={{ color: 'var(--accent-neon)' }}>Mode {LEVEL_DESCRIPTIONS[quickLevel].label}:</strong>{' '}
                  {LEVEL_DESCRIPTIONS[quickLevel].subtitle}
                </div>

                <button
                  type="button"
                  onClick={handleQuickStart}
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
                  <span>Masuk Cepat sebagai Atlet {LEVEL_DESCRIPTIONS[quickLevel].label}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        {LEVEL_DESCRIPTIONS[lvl].label}
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
                    Mode {LEVEL_DESCRIPTIONS[experienceLevel].label}:
                  </strong>{' '}
                  {LEVEL_DESCRIPTIONS[experienceLevel].subtitle}
                  <div style={{ color: 'var(--accent-neon)', marginTop: '0.2rem', fontWeight: 600 }}>
                    {LEVEL_DESCRIPTIONS[experienceLevel].sampleTerms}
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
          )}
        </section>
      </main>
    </div>
  );
};
