import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { UserProfile } from '@/types/workout';
import { RaceCategory, RaceTargetConfig } from '@/types/productFeatures';
import { useAthleteProfile } from '@/hooks/useAthleteProfile';
import { estimateMaxHeartRate } from '@/lib/engine/workload';
import { getLocalDateKey } from '@/lib/engine/dateKey';
import { Modal } from './ui/Modal';
import { ProfileBiometricsSection } from './onboarding/ProfileBiometricsSection';
import { ProfileHeartRateSection } from './onboarding/ProfileHeartRateSection';
import { ProfileRaceTargetSection } from './onboarding/ProfileRaceTargetSection';

interface OnboardingProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile, race?: RaceTargetConfig) => void;
}

type ProfileFormState = UserProfile & {
  targetRaceCategory: RaceCategory;
  targetRaceDate: string;
  targetRaceName: string;
};

export const OnboardingProfileModal: React.FC<OnboardingProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { profile: storedProfile, raceConfig: storedRaceConfig, reload, saveProfileAndRace } = useAthleteProfile();

  const [profile, setProfile] = useState<ProfileFormState>({
    age: 28,
    weightKg: 72,
    heightCm: 175,
    restingHrBaseline: 52,
    maxHr: 190,
    hrMaxFormula: 'tanaka',
    gender: 'male',
    targetRaceCategory: 'none',
    targetRaceDate: getLocalDateKey(new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)),
    targetRaceName: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      reload();
    }
  }, [isOpen, reload]);

  useEffect(() => {
    if (!isOpen) return;
    setProfile((prev) => ({
      ...prev,
      ...(storedProfile ?? {}),
      gender: storedProfile?.gender ?? prev.gender ?? 'male',
      targetRaceCategory: storedRaceConfig?.category ?? prev.targetRaceCategory,
      targetRaceDate: storedRaceConfig?.raceDate ?? prev.targetRaceDate,
      targetRaceName: storedRaceConfig?.eventName ?? prev.targetRaceName,
    }));
  }, [isOpen, storedProfile, storedRaceConfig]);

  if (!isOpen) return null;

  const calculatedMaxHr =
    profile.hrMaxFormula === 'custom'
      ? (profile.maxHr ?? 190)
      : profile.hrMaxFormula === 'gellish'
        ? estimateMaxHeartRate(profile.age, 'gellish')
        : estimateMaxHeartRate(profile.age, 'tanaka');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const profilePayload: UserProfile = {
        age: profile.age,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        restingHrBaseline: profile.restingHrBaseline,
        maxHr: profile.hrMaxFormula === 'custom' ? profile.maxHr : calculatedMaxHr,
        hrMaxFormula: profile.hrMaxFormula,
        gender: profile.gender,
        experienceLevel: profile.experienceLevel,
        athleteName: profile.athleteName,
      };

      const racePayload: RaceTargetConfig | undefined =
        profile.targetRaceDate && profile.targetRaceCategory
          ? {
              eventName: profile.targetRaceName || 'Target Race',
              category: profile.targetRaceCategory,
              raceDate: profile.targetRaceDate,
            }
          : undefined;

      const saved = await saveProfileAndRace({
        profile: profilePayload,
        raceConfig: racePayload,
      });

      if (onProfileUpdated) {
        onProfileUpdated(saved.profile, saved.raceConfig);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save profile to IndexedDB:', err);
      setSaveError('Gagal menyimpan profil ke database lokal. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="560px" ariaLabel="Profil fisiologi atlet">
      <div
        className="modal-panel"
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
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
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
          <ProfileBiometricsSection
            age={profile.age}
            weightKg={profile.weightKg}
            heightCm={profile.heightCm}
            gender={profile.gender || 'male'}
            onChange={(fields) => setProfile((prev) => ({ ...prev, ...fields }))}
          />

          <ProfileHeartRateSection
            age={profile.age}
            restingHrBaseline={profile.restingHrBaseline ?? 52}
            maxHr={profile.maxHr ?? 190}
            hrMaxFormula={(profile.hrMaxFormula as 'tanaka' | 'gellish' | 'custom') || 'tanaka'}
            calculatedMaxHr={calculatedMaxHr}
            onChange={(fields) => setProfile((prev) => ({ ...prev, ...fields }))}
          />

          <ProfileRaceTargetSection
            targetRaceName={profile.targetRaceName || ''}
            targetRaceCategory={profile.targetRaceCategory || 'half_marathon'}
            targetRaceDate={profile.targetRaceDate || ''}
            onChange={(fields) => setProfile((prev) => ({ ...prev, ...fields }))}
          />

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
                color: 'var(--text-inverse)',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
          {saveError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger)',
                fontSize: '0.8rem',
                color: 'var(--color-danger)',
              }}
            >
              {saveError}
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};
