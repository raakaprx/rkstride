/**
 * RKStride - Athlete Profile, Race Target & App Settings Repository
 * Single gateway for userProfile, weeklySchedule, and appSettings persistence.
 */
import { db, seedInitialDataIfEmpty } from './database';

export { seedInitialDataIfEmpty };
import {
  NutritionPrefsSchema,
  RaceTargetConfigSchema,
  UserProfileSchema,
  type NutritionPrefs,
  type RaceTargetConfig,
  type UserProfile,
} from '@/contracts/profile.schema';
import { ACWRMethodSchema, type ACWRMethod } from '@/contracts/workout.schema';
import type { ScheduledDay } from '@/contracts/schedule.schema';

const DISCLAIMER_LOCAL_KEY = 'rkstride_disclaimer_accepted';

export interface SaveProfileAndRaceInput {
  profile: UserProfile;
  raceConfig?: RaceTargetConfig;
}

export async function loadProfileAndRace(): Promise<{
  profile: UserProfile | null;
  raceConfig: RaceTargetConfig | null;
}> {
  const rawProfile = await db.userProfile.get('current_user');
  const rawRaceSetting = await db.appSettings.get('targetRaceConfig');

  const parsedProfile = rawProfile ? UserProfileSchema.safeParse(rawProfile) : null;
  const parsedRace = rawRaceSetting?.value
    ? RaceTargetConfigSchema.safeParse(rawRaceSetting.value)
    : null;

  return {
    profile: parsedProfile?.success ? parsedProfile.data : null,
    raceConfig: parsedRace?.success ? parsedRace.data : null,
  };
}

/**
 * Atomically persist athlete profile and optional race configuration.
 */
export async function saveProfileAndRaceAtomic(
  input: SaveProfileAndRaceInput
): Promise<{ profile: UserProfile; raceConfig?: RaceTargetConfig }> {
  const validProfile = UserProfileSchema.parse(input.profile);
  const validRace = input.raceConfig
    ? RaceTargetConfigSchema.parse(input.raceConfig)
    : undefined;

  await db.transaction('rw', [db.userProfile, db.appSettings], async () => {
    await db.userProfile.put({
      ...validProfile,
      id: 'current_user',
      gender: validProfile.gender ?? 'male',
    });

    if (validRace) {
      await db.appSettings.put({
        key: 'targetRaceConfig',
        value: validRace,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  return { profile: validProfile, raceConfig: validRace };
}

export async function isDisclaimerAccepted(): Promise<boolean> {
  const localFlag =
    typeof window !== 'undefined' ? localStorage.getItem(DISCLAIMER_LOCAL_KEY) === 'true' : false;
  if (localFlag) return true;
  const setting = await db.appSettings.get('disclaimerAccepted');
  return Boolean(setting?.value);
}

export async function markDisclaimerAccepted(): Promise<void> {
  await db.appSettings.put({
    key: 'disclaimerAccepted',
    value: true,
    updatedAt: new Date().toISOString(),
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(DISCLAIMER_LOCAL_KEY, 'true');
  }
}

export async function loadNutritionPrefs(): Promise<NutritionPrefs | null> {
  const setting = await db.appSettings.get('nutritionPrefs');
  if (!setting?.value) return null;
  const parsed = NutritionPrefsSchema.safeParse(setting.value);
  return parsed.success ? parsed.data : null;
}

export async function saveNutritionPrefs(prefs: NutritionPrefs): Promise<void> {
  const valid = NutritionPrefsSchema.parse(prefs);
  await db.appSettings.put({
    key: 'nutritionPrefs',
    value: valid,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadAcwrMethod(): Promise<ACWRMethod> {
  const setting = await db.appSettings.get('acwrMethod');
  const parsed = ACWRMethodSchema.safeParse(setting?.value);
  return parsed.success ? parsed.data : 'rolling_coupled';
}

export async function saveAcwrMethod(method: ACWRMethod): Promise<void> {
  const valid = ACWRMethodSchema.parse(method);
  await db.appSettings.put({
    key: 'acwrMethod',
    value: valid,
    updatedAt: new Date().toISOString(),
  });
}

export async function loadWeeklySchedule(): Promise<ScheduledDay[]> {
  const rows = await db.weeklySchedule.toArray();
  return rows.sort((a, b) => a.dayIndex - b.dayIndex);
}

export async function saveScheduledDay(day: ScheduledDay): Promise<void> {
  await db.weeklySchedule.put(day);
}

export async function saveWeeklyScheduleBulk(days: ScheduledDay[]): Promise<void> {
  await db.weeklySchedule.bulkPut(days);
}

const AUTH_SESSION_KEY = 'rkstride_auth_session';

export function loadAuthSession<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession<T = unknown>(session: T): void {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
}
