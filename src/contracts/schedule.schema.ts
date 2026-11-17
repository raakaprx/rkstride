/**
 * RKStride - Weekly Schedule Zod Contracts
 */
import { z } from 'zod';
import { WorkoutCategorySchema } from './workout.schema';

export const DayOfWeekSchema = z.enum([
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
]);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

export const ScheduledDaySchema = z.object({
  id: z.string().min(1),
  dayName: DayOfWeekSchema,
  dayIndex: z.number().int().min(0).max(6),
  category: WorkoutCategorySchema,
  title: z.string(),
  targetDurationMinutes: z.number().nonnegative(),
  isRestDay: z.boolean(),
  notes: z.string().optional(),
});
export type ScheduledDay = z.infer<typeof ScheduledDaySchema>;

export const ScheduleConflictSchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  dayName: DayOfWeekSchema,
  severity: z.enum(['warning', 'danger']),
  message: z.string(),
  suggestion: z.string(),
});
export type ScheduleConflict = z.infer<typeof ScheduleConflictSchema>;
