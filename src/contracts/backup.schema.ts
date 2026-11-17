/**
 * RKStride - Backup & Restore Payload Zod Contracts
 */
import { z } from 'zod';
import {
  DailyLogSchema,
  StoredDebriefSchema,
  StoredReadinessLogSchema,
} from './workout.schema';
import { ScheduledDaySchema } from './schedule.schema';
import { UserProfileSchema } from './profile.schema';
import { AiCoachConfigSchema, AiCoachPublicConfigSchema } from './ai.schema';

export const CURRENT_SCHEMA_VERSION = 3 as const;

export const BackupAiConfigSchema = z.union([AiCoachConfigSchema, AiCoachPublicConfigSchema]);

export const RKStrideExportPayloadSchema = z.object({
  format: z.literal('RKStride_Backup'),
  version: z.number().int().min(1).max(CURRENT_SCHEMA_VERSION),
  exportedAt: z.string(),
  userProfile: UserProfileSchema.optional(),
  workoutLogs: z.array(DailyLogSchema),
  dailyReadiness: z.array(StoredReadinessLogSchema).optional(),
  weeklySchedule: z.array(ScheduledDaySchema).optional(),
  appSettings: z.record(z.string(), z.unknown()).optional(),
  postWorkoutDebrief: StoredDebriefSchema.nullable().optional(),
  aiCoachConfig: BackupAiConfigSchema.optional(),
});

export type RKStrideExportPayload = z.infer<typeof RKStrideExportPayloadSchema>;
