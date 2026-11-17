/**
 * RKStride - Data Export, Import, and Zod Validation Engine
 * Uses centralized Zod schemas from @/contracts/backup.schema.
 * Supports:
 * 1. Full JSON backup with strict Zod schema validation & v1/v2 -> v3 normalization
 * 2. Training history CSV export for external spreadsheet analysis
 */

import { CURRENT_DB_VERSION, db, type StoredReadinessLog } from './database';
import {
  RKStrideExportPayloadSchema,
  type RKStrideExportPayload,
} from '@/contracts/backup.schema';
import type {
  DailyLog,
  StoredDebrief,
  WorkoutSessionEntry,
} from '@/contracts/workout.schema';
import type { UserProfile } from '@/contracts/profile.schema';
import type { ScheduledDay } from '@/contracts/schedule.schema';
import {
  getAiCoachConfig,
  saveAiCoachConfig,
  type AiCoachConfig,
} from '@/lib/ai/geminiCoach';
import {
  calculateEdwardsTrimp,
  calculateStrengthVolumeLoad,
} from '@/lib/engine/workload';
import { SRPE_CONFIG } from '@/lib/engine/constants';

export { RKStrideExportPayloadSchema };
export type { RKStrideExportPayload };

function normalizeLegacyDailyLog(log: DailyLog): DailyLog {
  const strengthWorkouts = log.strengthWorkouts ?? [];
  const runningWorkouts = log.runningWorkouts ?? [];
  let sessions: WorkoutSessionEntry[] | undefined = log.sessions;

  if (!sessions || sessions.length === 0) {
    if (strengthWorkouts.length > 0 || runningWorkouts.length > 0) {
      const strengthDur = strengthWorkouts.reduce(
        (sum, ex) =>
          sum + (ex.durationMinutes ?? ex.sets.length * SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET),
        0
      );
      const runDur = runningWorkouts.reduce((sum, r) => sum + r.durasiMenit, 0);
      const isOverridden = runningWorkouts.some((r) => r.isOverridden);
      sessions = [
        {
          sessionId: `legacy-${log.tanggal}`,
          loggedAt: `${log.tanggal}T12:00:00`,
          strengthWorkouts,
          runningWorkouts,
          sessionLoadScore: log.totalLoadScore,
          durationMinutes: Math.round(strengthDur + runDur),
          ...(isOverridden ? { isOverridden: true } : {}),
        },
      ];
    } else {
      sessions = [];
    }
  }

  return {
    ...log,
    sessions,
    volumeLoadSecondary:
      log.volumeLoadSecondary ?? calculateStrengthVolumeLoad(strengthWorkouts),
    runningTrimpSecondary:
      log.runningTrimpSecondary ??
      Math.round(
        runningWorkouts.reduce((sum, r) => sum + calculateEdwardsTrimp(r), 0) * 10
      ) / 10,
  };
}

// =============================================================================
// 1. EXPORT FUNCTIONS (JSON & CSV)
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
  const postWorkoutDebrief = (await db.postWorkoutDebrief.get('latest')) ?? null;

  const appSettings: Record<string, unknown> = {};
  for (const s of settingsList) {
    appSettings[s.key] = s.value;
  }

  const payload: RKStrideExportPayload = {
    format: 'RKStride_Backup',
    version: CURRENT_DB_VERSION,
    exportedAt: new Date().toISOString(),
    userProfile: userProfile || undefined,
    workoutLogs,
    dailyReadiness,
    weeklySchedule,
    appSettings,
    postWorkoutDebrief,
    aiCoachConfig: getAiCoachConfig(),
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
    for (const ex of log.strengthWorkouts) {
      const totalVolume = ex.sets.reduce((sum, s) => sum + s.bebanKg * s.reps, 0);
      const avgRpe =
        ex.sets.length > 0
          ? (ex.sets.reduce((sum, s) => sum + s.rpe, 0) / ex.sets.length).toFixed(1)
          : '0';
      const setsDetail = ex.sets.map((s) => `${s.bebanKg}kgx${s.reps}`).join('; ');

      rows.push(
        [
          `"${log.tanggal}"`,
          '"Strength"',
          `"${ex.namaGerakan.replace(/"/g, '""')}"`,
          `"${setsDetail}"`,
          `"${totalVolume} kg"`,
          `"${ex.durationMinutes || ex.sets.length * 2.5}"`,
          `"${avgRpe}"`,
          `"${log.totalLoadScore}"`,
        ].join(',')
      );
    }

    for (const r of log.runningWorkouts) {
      rows.push(
        [
          `"${log.tanggal}"`,
          '"Running"',
          `"${(r.runningType || 'Running').replace(/"/g, '""')}"`,
          `"Pace ${r.avgPace} min/km, HR ${r.avgHeartRate} bpm"`,
          `"${r.jarakKm} km"`,
          `"${r.durasiMenit}"`,
          `"${r.rpe || 'HR Zone'}"`,
          `"${log.totalLoadScore}"`,
        ].join(',')
      );
    }

    if (log.strengthWorkouts.length === 0 && log.runningWorkouts.length === 0) {
      rows.push(
        [
          `"${log.tanggal}"`,
          '"Rest / Inactive"',
          '"Rest"',
          '""',
          '"0"',
          '"0"',
          '"0"',
          `"${log.totalLoadScore}"`,
        ].join(',')
      );
    }
  }

  return rows.join('\n');
}

// =============================================================================
// 2. IMPORT FUNCTION WITH ZOD SCHEMA VALIDATION & ATOMIC TRANSACTION
// =============================================================================

export interface ImportResult {
  success: boolean;
  message: string;
  importedLogsCount: number;
  errorDetails?: string[];
}

/**
 * Import and validate JSON backup.
 * Rejects corrupt data and guarantees transaction safety across all 6 Dexie stores.
 */
export async function importDatabaseFromJson(
  jsonContent: string,
  opts?: { wipeBeforeImport?: boolean }
): Promise<ImportResult> {
  let parsedRaw: unknown;

  try {
    parsedRaw = JSON.parse(jsonContent);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'JSON Parse Error';
    return {
      success: false,
      message: 'Format file tidak valid. File harus berupa JSON yang valid.',
      importedLogsCount: 0,
      errorDetails: [msg],
    };
  }

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
  const wipe = opts?.wipeBeforeImport === true;
  const normalizedLogs: DailyLog[] = payload.workoutLogs.map(normalizeLegacyDailyLog);

  try {
    await db.transaction(
      'rw',
      [
        db.workoutLogs,
        db.dailyReadiness,
        db.userProfile,
        db.weeklySchedule,
        db.appSettings,
        db.postWorkoutDebrief,
      ],
      async () => {
        if (wipe) {
          await db.workoutLogs.clear();
          await db.dailyReadiness.clear();
          await db.weeklySchedule.clear();
          await db.userProfile.clear();
          await db.postWorkoutDebrief.clear();
        }

        if (normalizedLogs.length > 0) {
          await db.workoutLogs.bulkPut(normalizedLogs);
        }

        if (payload.dailyReadiness && payload.dailyReadiness.length > 0) {
          await db.dailyReadiness.bulkPut(payload.dailyReadiness as StoredReadinessLog[]);
        }

        if (payload.userProfile) {
          const normalizedProfile: UserProfile & { id: string } = {
            ...payload.userProfile,
            id: 'current_user',
            gender: payload.userProfile.gender ?? 'male',
          };
          await db.userProfile.put(normalizedProfile);
        }

        if (payload.weeklySchedule && payload.weeklySchedule.length > 0) {
          await db.weeklySchedule.bulkPut(payload.weeklySchedule as ScheduledDay[]);
        }

        if (payload.postWorkoutDebrief) {
          await db.postWorkoutDebrief.put(payload.postWorkoutDebrief as StoredDebrief);
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
      }
    );

    if (payload.aiCoachConfig) {
      try {
        const current = getAiCoachConfig();
        const mergedConfig: AiCoachConfig = {
          mode: payload.aiCoachConfig.mode,
          proxyUrl: payload.aiCoachConfig.proxyUrl,
          sendTelemetry: payload.aiCoachConfig.sendTelemetry,
          byokApiKey:
            'byokApiKey' in payload.aiCoachConfig
              ? payload.aiCoachConfig.byokApiKey
              : current.byokApiKey,
        };
        saveAiCoachConfig(mergedConfig);
      } catch (err) {
        console.error('Failed to restore AI Coach config from backup:', err);
      }
    }

    return {
      success: true,
      message: wipe
        ? `Berhasil menggantikan seluruh data dengan ${normalizedLogs.length} riwayat latihan dari backup.`
        : `Berhasil mengimpor ${normalizedLogs.length} data riwayat latihan dan konfigurasi atlet (digabung dengan data lama).`,
      importedLogsCount: normalizedLogs.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'IndexedDB Transaction Error';
    console.error('IndexedDB transaction error during import:', err);
    return {
      success: false,
      message: 'Terjadi kesalahan internal saat menyimpan data ke IndexedDB lokal.',
      importedLogsCount: 0,
      errorDetails: [msg],
    };
  }
}
