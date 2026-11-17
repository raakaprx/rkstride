import type { WorkoutCategory } from './workout';

export type {
  DayOfWeek,
  ScheduledDay,
  ScheduleConflict,
} from '@/contracts/schedule.schema';

import type { DayOfWeek } from '@/contracts/schedule.schema';

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  schedule: Array<{
    dayName: DayOfWeek;
    category: WorkoutCategory;
    title: string;
    targetDurationMinutes: number;
    isRestDay: boolean;
  }>;
}
