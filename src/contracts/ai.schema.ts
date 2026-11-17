/**
 * RKStride - AI Coach & Smartwatch Contracts
 */
import { z } from 'zod';
import { ACWRStatusSchema, ReadinessCheckInSchema } from './workout.schema';

export const AiCoachModeSchema = z.enum(['byok', 'proxy']);
export type AiCoachMode = z.infer<typeof AiCoachModeSchema>;

export const AiCoachConfigSchema = z.object({
  mode: AiCoachModeSchema,
  byokApiKey: z.string(),
  proxyUrl: z.string(),
  sendTelemetry: z.boolean(),
});
export type AiCoachConfig = z.infer<typeof AiCoachConfigSchema>;

export const AiCoachPublicConfigSchema = AiCoachConfigSchema.omit({ byokApiKey: true });
export type AiCoachPublicConfig = z.infer<typeof AiCoachPublicConfigSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'model']),
  text: z.string(),
  timestamp: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const AthleteContextSchema = z.object({
  acwrRatio: z.number(),
  acwrStatus: ACWRStatusSchema,
  acuteLoad: z.number(),
  chronicLoad: z.number(),
  readiness: ReadinessCheckInSchema,
  readinessScore: z.number(),
  lastLegsHoursAgo: z.number(),
  recentWorkoutSummary: z
    .object({
      strengthExercisesCount: z.number().int().nonnegative(),
      runningMinutes: z.number().nonnegative(),
      runningKm: z.number().nonnegative(),
      totalLoadScore: z.number().nonnegative(),
    })
    .optional(),
});
export type AthleteContext = z.infer<typeof AthleteContextSchema>;

export const ProxyCoachRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(ChatMessageSchema).max(6),
  athleteContext: AthleteContextSchema.optional(),
});
export type ProxyCoachRequest = z.infer<typeof ProxyCoachRequestSchema>;

export const ProxyCoachResponseSchema = z.object({
  reply: z.string().min(1),
});
export type ProxyCoachResponse = z.infer<typeof ProxyCoachResponseSchema>;

export const SmartwatchBrandSchema = z.enum([
  'garmin',
  'apple',
  'xiaomi',
  'samsung',
  'coros',
  'polar',
  'generic',
]);
export type SmartwatchBrand = z.infer<typeof SmartwatchBrandSchema>;

export const SmartwatchSourceSchema = z.enum([
  'disconnected',
  'bluetooth',
  'file_export',
  'manual_sync',
  'preset',
]);
export type SmartwatchSource = z.infer<typeof SmartwatchSourceSchema>;
