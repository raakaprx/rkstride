import { WorkoutCategory } from './workout';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export interface ScheduledDay {
  id: string;
  dayName: DayOfWeek;
  dayIndex: number; // 0 for Senin, 6 for Minggu
  category: WorkoutCategory;
  title: string;
  targetDurationMinutes: number;
  isRestDay: boolean;
  notes?: string;
}

export interface ScheduleConflict {
  dayIndex: number;
  dayName: DayOfWeek;
  severity: 'warning' | 'danger';
  message: string;
  suggestion: string;
}

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
