import { useState, useEffect, useCallback } from 'react';
import type { RaceTargetConfig, UserProfile } from '@/contracts/profile.schema';
import {
  isDisclaimerAccepted,
  loadProfileAndRace,
  markDisclaimerAccepted,
  saveProfileAndRaceAtomic,
  type SaveProfileAndRaceInput,
} from '@/lib/db/profileRepo';

function isMissingIndexedDbError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'MissingAPIError' || err.message.includes('IndexedDB API missing'))
  );
}

/**
 * Hook for loading and atomically persisting athlete profile, race target,
 * and medical disclaimer state via profileRepo.
 */
export function useAthleteProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [raceConfig, setRaceConfig] = useState<RaceTargetConfig | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loaded, accepted] = await Promise.all([
        loadProfileAndRace(),
        isDisclaimerAccepted(),
      ]);
      setProfile(loaded.profile);
      setRaceConfig(loaded.raceConfig);
      setDisclaimerAccepted(accepted);
      setError(null);
    } catch (err) {
      if (isMissingIndexedDbError(err)) {
        setError(null);
      } else {
        console.error('Failed to load athlete profile:', err);
        setError('Gagal memuat profil atlet.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveProfileAndRace = useCallback(async (input: SaveProfileAndRaceInput) => {
    setProfile(input.profile);
    if (input.raceConfig !== undefined) {
      setRaceConfig(input.raceConfig);
    }
    try {
      const saved = await saveProfileAndRaceAtomic(input);
      setProfile(saved.profile);
      if (saved.raceConfig !== undefined) {
        setRaceConfig(saved.raceConfig);
      }
      setError(null);
      return saved;
    } catch (err) {
      if (isMissingIndexedDbError(err)) {
        return { profile: input.profile, raceConfig: input.raceConfig };
      }
      console.error('Failed to save profile and race config:', err);
      setError('Gagal menyimpan profil atlet.');
      throw err;
    }
  }, []);

  const acceptDisclaimer = useCallback(async () => {
    setDisclaimerAccepted(true);
    try {
      await markDisclaimerAccepted();
    } catch (err) {
      if (!isMissingIndexedDbError(err)) {
        console.error('Failed to persist disclaimer acceptance:', err);
      }
    }
  }, []);

  return {
    profile,
    raceConfig,
    disclaimerAccepted,
    isLoading,
    error,
    reload,
    saveProfileAndRace,
    acceptDisclaimer,
  };
}
