/**
 * RKStride - Data Export, Import, and Zod Validation Engine
 * Supports:
 * 1. Full JSON backup with strict Zod schema validation (rejecting corrupt data safely)
 * 2. Training history CSV export for external spreadsheet analysis
 */

import { z } from 'zod';
import { db, StoredReadinessLog } from './database';
import { DailyLog, UserProfile } from '@/types/workout';
import { ScheduledDay } from '@/types/schedule';

// =============================================================================
// 1. ZOD DATA CONTRACT SCHEMAS
// =============================================================================

export const StrengthSetSchema = z.object({
  bebanKg: z.number().nonnegative({ message: 'Beban kg harus berupa angka non-negatif' }),
  reps: z.number().int().nonnegative({ message: 'Reps harus berupa bilangan bulat non-negatif' }),
  rpe: z.number().min(1).max(10, { message: 'RPE harus dalam rentang 1 - 10' }),
  isWarmup: z.boolean().optional(),
});

export const StrengthExerciseSchema = z.object({
  namaGerakan: z.string().min(1, { message: 'Nama gerakan tidak boleh kosong' }),
  category: z.string().optional(),
  sets: z.array(StrengthSetSchema),
  durationMinutes: z.number().optional(),
  isLegExercise: z.boolean().optional(),
});

export const RunningIntervalBlockSchema = z.object({
  zone: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  durationMinutes: z.number().nonnegative(),
  description: z.string().optional(),
});

export const RunSessionSchema = z.object({
  jarakKm: z.number().nonnegative(),
  durasiMenit: z.number().nonnegative(),
  avgPace: z.number().nonnegative(),
  avgHeartRate: z.number().nonnegative(),
  runningType: z.string().optional(),
  blocks: z.array(RunningIntervalBlockSchema).optional(),
  rpe: z.number().min(1).max(10).optional(),
  sRpe: z.number().optional(),
  trimp: z.number().optional(),
  isOverridden: z.boolean().optional(),
});

export const DailyLogSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' }),
  strengthWorkouts: z.array(StrengthExerciseSchema),
  runningWorkouts: z.array(RunSessionSchema),
  totalLoadScore: z.number().nonnegative({ message: 'Total load score harus non-negatif' }),
  volumeLoadSecondary: z.number().optional(),
  runningTrimpSecondary: z.number().optional(),
});

export const ReadinessLogSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleepHours: z.number().min(0).max(24),
  muscleSoreness: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  legFatigue: z.boolean(),
  energyLevel: z.enum(['low', 'moderate', 'high']),
  restingHeartRate: z.number().min(30).max(220).optional(),
  hrvRmssd: z.number().optional(),
  tendonJointPain: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  tendonPainArea: z.string().optional(),
});

export const UserProfileSchema = z.object({
  id: z.string().optional(),
  age: z.number().int().min(10).max(110),
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  restingHrBaseline: z.number().positive(),
  maxHr: z.number().positive().optional(),
  hrMaxFormula: z.enum(['tanaka', 'gellish', 'custom']).optional(),
});

export const ScheduledDaySchema = z.object({
  id: z.string(),
  dayName: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
  dayIndex: z.number().int().min(0).max(6),
  category: z.string(),
  title: z.string(),
  targetDurationMinutes: z.number().nonnegative(),
  isRestDay: z.boolean(),
  notes: z.string().optional(),
});

export const RKStrideExportPayloadSchema = z.object({
  format: z.literal('RKStride_Backup'),
  version: z.number().int().positive(),
  exportedAt: z.string(),
  userProfile: UserProfileSchema.optional(),
  workoutLogs: z.array(DailyLogSchema),
  dailyReadiness: z.array(ReadinessLogSchema).optional(),
  weeklySchedule: z.array(ScheduledDaySchema).optional(),
  appSettings: z.record(z.string(), z.any()).optional(),
});

export type RKStrideExportPayload = z.infer<typeof RKStrideExportPayloadSchema>;

// =============================================================================
// 2. EXPORT FUNCTIONS (JSON & CSV)
// =============================================================================

/**
 * Export entire IndexedDB database to a formatted JSON string
 */
export async function exportDatabaseToJson(): Promise<string> {
  const workoutLogs = await db.workoutLogs.toArray();
  const dailyReadiness = await db.dailyReadiness.toArray();
  const userProfile = await db.userProfile.get('current_user');
  const weeklySchedule = await db.weeklySchedule.toArray();
  const settingsList = await db.appSettings.toArray();

  const appSettings: Record<string, any> = {};
  for (const s of settingsList) {
    appSettings[s.key] = s.value;
  }

  const payload: RKStrideExportPayload = {
    format: 'RKStride_Backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    userProfile: userProfile || undefined,
    workoutLogs,
    dailyReadiness,
    weeklySchedule,
    appSettings,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Export workout history to CSV format for Excel/Spreadsheet inspection
 */
export async function exportWorkoutLogsToCsv(): Promise<string> {
  const logs = await db.workoutLogs.toArray();
  const sortedLogs = [...logs].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const headers = [
    'Tanggal',
    'Tipe Sesi',
    'Nama Latihan / Protokol',
    'Rincian Beban / Pace',
    'Volume (kg) / Jarak (km)',
    'Durasi (menit)',
    'RPE / Zona',
    'Total sRPE Load',
  ];

  const rows: string[] = [headers.join(',')];

  for (const log of sortedLogs) {
    // Strength Rows
    for (const ex of log.strengthWorkouts) {
      const totalVolume = ex.sets.reduce((sum, s) => sum + s.bebanKg * s.reps, 0);
      const avgRpe = ex.sets.length > 0 ? (ex.sets.reduce((sum, s) => sum + s.rpe, 0) / ex.sets.length).toFixed(1) : '0';
      const setsDetail = ex.sets.map((s) => `${s.bebanKg}kgx${s.reps}`).join('; ');

      rows.push([
        `"${log.tanggal}"`,
        '"Strength"',
        `"${ex.namaGerakan.replace(/"/g, '""')}"`,
        `"${setsDetail}"`,
        `"${totalVolume} kg"`,
        `"${ex.durationMinutes || ex.sets.length * 2.5}"`,
        `"${avgRpe}"`,
        `"${log.totalLoadScore}"`,
      ].join(','));
    }

    // Running Rows
    for (const r of log.runningWorkouts) {
      rows.push([
        `"${log.tanggal}"`,
        '"Running"',
        `"${(r.runningType || 'Running').replace(/"/g, '""')}"`,
        `"Pace ${r.avgPace} min/km, HR ${r.avgHeartRate} bpm"`,
        `"${r.jarakKm} km"`,
        `"${r.durasiMenit}"`,
        `"${r.rpe || 'HR Zone'}"`,
        `"${log.totalLoadScore}"`,
      ].join(','));
    }

    // If rest day or empty session
    if (log.strengthWorkouts.length === 0 && log.runningWorkouts.length === 0) {
      rows.push([
        `"${log.tanggal}"`,
        '"Rest / Inactive"',
        '"Rest"',
        '""',
        '"0"',
        '"0"',
        '"0"',
        `"${log.totalLoadScore}"`,
      ].join(','));
    }
  }

  return rows.join('\n');
}

// =============================================================================
// 3. IMPORT FUNCTION WITH ZOD SCHEMA VALIDATION
// =============================================================================

export interface ImportResult {
  success: boolean;
  message: string;
  importedLogsCount: number;
  errorDetails?: string[];
}

/**
 * Import and validate JSON backup.
 * Rejects corrupt data and guarantees transaction safety.
 */
export async function importDatabaseFromJson(jsonContent: string): Promise<ImportResult> {
  let parsedRaw: unknown;

  try {
    parsedRaw = JSON.parse(jsonContent);
  } catch (err: any) {
    return {
      success: false,
      message: 'Format file tidak valid. File harus berupa JSON yang valid.',
      importedLogsCount: 0,
      errorDetails: [err.message || 'JSON Parse Error'],
    };
  }

  // Validate with Zod Schema
  const validationResult = RKStrideExportPayloadSchema.safeParse(parsedRaw);

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues.map(
      (issue) => `[${issue.path.join('.') || 'root'}]: ${issue.message}`
    );

    return {
      success: false,
      message: 'Data backup ditolak karena format tidak sesuai spesifikasi atau data korup.',
      importedLogsCount: 0,
      errorDetails,
    };
  }

  const payload = validationResult.data;

  try {
    // Atomic Transaction to replace/upsert data safely
    await db.transaction('rw', [db.workoutLogs, db.dailyReadiness, db.userProfile, db.weeklySchedule, db.appSettings], async () => {
      if (payload.workoutLogs && payload.workoutLogs.length > 0) {
        await db.workoutLogs.bulkPut(payload.workoutLogs as DailyLog[]);
      }

      if (payload.dailyReadiness && payload.dailyReadiness.length > 0) {
        await db.dailyReadiness.bulkPut(payload.dailyReadiness as StoredReadinessLog[]);
      }

      if (payload.userProfile) {
        await db.userProfile.put({
          id: 'current_user',
          ...payload.userProfile,
        } as UserProfile & { id: string });
      }

      if (payload.weeklySchedule && payload.weeklySchedule.length > 0) {
        await db.weeklySchedule.bulkPut(payload.weeklySchedule as ScheduledDay[]);
      }

      if (payload.appSettings) {
        for (const [key, value] of Object.entries(payload.appSettings)) {
          await db.appSettings.put({
            key,
            value,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });

    return {
      success: true,
      message: `Berhasil mengimpor ${payload.workoutLogs.length} data riwayat latihan dan konfigurasi atlet.`,
      importedLogsCount: payload.workoutLogs.length,
    };
  } catch (err: any) {
    console.error('IndexedDB transaction error during import:', err);
    return {
      success: false,
      message: 'Terjadi kesalahan internal saat menyimpan data ke IndexedDB lokal.',
      importedLogsCount: 0,
      errorDetails: [err.message || 'IndexedDB Transaction Error'],
    };
  }
}
