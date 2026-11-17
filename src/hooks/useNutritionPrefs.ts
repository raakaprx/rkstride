import { useState, useEffect, useCallback } from 'react';
import type { NutritionPrefs } from '@/contracts/profile.schema';
import { loadNutritionPrefs, saveNutritionPrefs } from '@/lib/db/profileRepo';

function isMissingIndexedDbError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'MissingAPIError' || err.message.includes('IndexedDB API missing'))
  );
}

/**
 * Hook for loading and persisting athlete nutrition preferences via profileRepo.
 */
export function useNutritionPrefs() {
  const [prefs, setPrefs] = useState<NutritionPrefs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await loadNutritionPrefs();
      setPrefs(loaded);
      setError(null);
    } catch (err) {
      if (isMissingIndexedDbError(err)) {
        setError(null);
      } else {
        console.error('Failed to load nutrition preferences:', err);
        setError('Gagal memuat preferensi nutrisi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const savePrefs = useCallback(async (nextPrefs: NutritionPrefs) => {
    setPrefs(nextPrefs);
    try {
      await saveNutritionPrefs(nextPrefs);
      setError(null);
    } catch (err) {
      if (isMissingIndexedDbError(err)) return;
      console.error('Failed to save nutrition preferences:', err);
      setError('Gagal menyimpan preferensi nutrisi.');
      throw err;
    }
  }, []);

  return {
    prefs,
    isLoading,
    error,
    reload,
    savePrefs,
  };
}
