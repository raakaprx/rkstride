import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { UserProfile } from '@/types/workout';
import { RaceCategory } from '@/types/productFeatures';
import { db } from '@/lib/db/database';
import { estimateMaxHeartRate } from '@/lib/engine/workload';
import { Modal } from './ui/Modal';

interface OnboardingProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export const OnboardingProfileModal: React.FC<OnboardingProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfile & { gender?: 'male' | 'female'; targetRaceCategory?: RaceCategory; targetRaceDate?: string; targetRaceName?: string }>({
    age: 28,
    weightKg: 72,
    heightCm: 175,
    restingHrBaseline: 52,
    maxHr: 190,
    hrMaxFormula: 'tanaka',
    gender: 'male',
    targetRaceCategory: 'half_marathon',
    targetRaceDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetRaceName: 'Jakarta Half Marathon',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load existing profile from IndexedDB on open
  useEffect(() => {
    if (!isOpen) return;
    const loadProfile = async () => {
      try {
        const stored = await db.userProfile.get('current_user');
        if (stored) {
          setProfile((prev) => ({
            ...prev,
            ...stored,
          }));
        }
      } catch (err) {
        console.error('Failed to load user profile from IndexedDB:', err);
      }
    };
    loadProfile();
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-calculated Max HR
  const calculatedMaxHr = profile.hrMaxFormula === 'gellish'
    ? estimateMaxHeartRate(profile.age, 'gellish')
    : estimateMaxHeartRate(profile.age, 'tanaka');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = {
        id: 'current_user',
        ...profile,
        maxHr: profile.maxHr || calculatedMaxHr,
      };
      await db.userProfile.put(dataToSave as any);

      // Also persist target race config into appSettings
      if (profile.targetRaceDate && profile.targetRaceCategory) {
        await db.appSettings.put({
          key: 'targetRaceConfig',
          value: {
            eventName: profile.targetRaceName || 'Target Race',
            category: profile.targetRaceCategory,
            raceDate: profile.targetRaceDate,
          },
          updatedAt: new Date().toISOString(),
        });
      }

      if (onProfileUpdated) {
        onProfileUpdated(dataToSave);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save profile to IndexedDB:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="560px" ariaLabel="Profil fisiologi atlet">
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-elevation-3)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(204, 255, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-neon)',
              }}
            >
              <User size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Profil Fisiologi Atlet
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Parameter biometrik untuk kalibrasi zona Karvonen, TRIMP &amp; Nutrisi
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal profil"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Biometrik Dasar */}
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
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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
                  value={profile.weightKg}
                  onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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
                  value={profile.heightCm}
                  onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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
                  value={profile.gender || 'male'}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value as 'male' | 'female' })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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

          {/* Section 2: Kalibrasi Denyut Jantung */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Kalibrasi Denyut Jantung (HRR Karvonen)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Resting Heart Rate (RHR Baseline)
                </label>
                <input
                  type="number"
                  min="30"
                  max="120"
                  required
                  value={profile.restingHrBaseline}
                  onChange={(e) => setProfile({ ...profile, restingHrBaseline: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Detak saat bangun pagi saat istirahat tenang
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Formula Max HR
                </label>
                <select
                  value={profile.hrMaxFormula || 'tanaka'}
                  onChange={(e) => {
                    const formula = e.target.value as 'tanaka' | 'gellish' | 'custom';
                    setProfile({
                      ...profile,
                      hrMaxFormula: formula,
                      maxHr: formula !== 'custom' ? estimateMaxHeartRate(profile.age, formula) : profile.maxHr,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="tanaka">Tanaka (208 - 0.7 x usia) [Standar]</option>
                  <option value="gellish">Gellish (207 - 0.7 x usia)</option>
                  <option value="custom">Input Hasil Tes Lab Manual</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Estimasi Max HR: <strong style={{ color: 'var(--accent-neon)' }}>{calculatedMaxHr} bpm</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Target Kompetisi / Lomba */}
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
                  value={profile.targetRaceName || ''}
                  onChange={(e) => setProfile({ ...profile, targetRaceName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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
                  value={profile.targetRaceCategory || 'half_marathon'}
                  onChange={(e) => setProfile({ ...profile, targetRaceCategory: e.target.value as RaceCategory })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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
                  value={profile.targetRaceDate || ''}
                  onChange={(e) => setProfile({ ...profile, targetRaceDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
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

          {/* Footer Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-neon)',
                border: 'none',
                color: '#000000',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};


