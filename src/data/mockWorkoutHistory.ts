import { DailyLog, ReadinessCheckIn } from '@/types/workout';

// Helper to generate dates relative to today
const getDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const mockReadinessToday: ReadinessCheckIn = {
  sleepHours: 7.2,
  muscleSoreness: 3,
  legFatigue: true,
  energyLevel: 'moderate',
  restingHeartRate: 54,
};

export const mock28DaysWorkoutHistory: DailyLog[] = [
  // Day 0 (Today) - In progress / Proposed Upper Push
  {
    tanggal: getDateString(0),
    totalLoadScore: 310,
    strengthWorkouts: [
      {
        namaGerakan: 'Barbell Bench Press',
        sets: [
          { bebanKg: 85, reps: 6, rpe: 8 },
          { bebanKg: 85, reps: 6, rpe: 8 },
          { bebanKg: 85, reps: 6, rpe: 8 },
          { bebanKg: 85, reps: 6, rpe: 8.5 },
        ],
      },
      {
        namaGerakan: 'Incline Dumbbell Press',
        sets: [
          { bebanKg: 30, reps: 10, rpe: 7.5 },
          { bebanKg: 30, reps: 10, rpe: 7.5 },
          { bebanKg: 30, reps: 10, rpe: 8 },
        ],
      },
      {
        namaGerakan: 'Overhead Barbell Press',
        sets: [
          { bebanKg: 50, reps: 8, rpe: 8 },
          { bebanKg: 50, reps: 8, rpe: 8 },
          { bebanKg: 50, reps: 8, rpe: 8.5 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 1 (Yesterday - 18 hours ago): Heavy Leg Day
  {
    tanggal: getDateString(1),
    totalLoadScore: 520,
    strengthWorkouts: [
      {
        namaGerakan: 'Barbell Back Squat',
        sets: [
          { bebanKg: 120, reps: 5, rpe: 8.5 },
          { bebanKg: 120, reps: 5, rpe: 8.5 },
          { bebanKg: 120, reps: 5, rpe: 8.5 },
          { bebanKg: 120, reps: 5, rpe: 9 },
          { bebanKg: 120, reps: 5, rpe: 9 },
        ],
      },
      {
        namaGerakan: 'Romanian Deadlift',
        sets: [
          { bebanKg: 110, reps: 8, rpe: 8 },
          { bebanKg: 110, reps: 8, rpe: 8 },
          { bebanKg: 110, reps: 8, rpe: 8 },
          { bebanKg: 110, reps: 8, rpe: 8.5 },
        ],
      },
      {
        namaGerakan: 'Walking Dumbbell Lunges',
        sets: [
          { bebanKg: 24, reps: 12, rpe: 8 },
          { bebanKg: 24, reps: 12, rpe: 8 },
          { bebanKg: 24, reps: 12, rpe: 8 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 2 (2 days ago): Easy Aerobic Base Run
  {
    tanggal: getDateString(2),
    totalLoadScore: 240,
    strengthWorkouts: [],
    runningWorkouts: [
      {
        jarakKm: 8.5,
        durasiMenit: 48,
        avgPace: 5.65, // ~5:39/km
        avgHeartRate: 142,
        thresholdPace: 4.75,
      },
    ],
  },
  // Day 3: Heavy Pull & Posterior Upper
  {
    tanggal: getDateString(3),
    totalLoadScore: 460,
    strengthWorkouts: [
      {
        namaGerakan: 'Conventional Deadlift',
        sets: [
          { bebanKg: 140, reps: 5, rpe: 8.5 },
          { bebanKg: 140, reps: 5, rpe: 8.5 },
          { bebanKg: 140, reps: 5, rpe: 9 },
        ],
      },
      {
        namaGerakan: 'Weighted Pull-Ups',
        sets: [
          { bebanKg: 15, reps: 6, rpe: 8 },
          { bebanKg: 15, reps: 6, rpe: 8 },
          { bebanKg: 15, reps: 6, rpe: 8 },
          { bebanKg: 15, reps: 6, rpe: 8.5 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 4: Tempo Threshold Run
  {
    tanggal: getDateString(4),
    totalLoadScore: 420,
    strengthWorkouts: [],
    runningWorkouts: [
      {
        jarakKm: 10.0,
        durasiMenit: 47,
        avgPace: 4.7, // ~4:42/km
        avgHeartRate: 168,
        thresholdPace: 4.75,
      },
    ],
  },
  // Day 5: Upper Push Hypertrophy
  {
    tanggal: getDateString(5),
    totalLoadScore: 350,
    strengthWorkouts: [
      {
        namaGerakan: 'Dumbbell Bench Press',
        sets: [
          { bebanKg: 34, reps: 10, rpe: 8 },
          { bebanKg: 34, reps: 10, rpe: 8 },
          { bebanKg: 34, reps: 10, rpe: 8 },
          { bebanKg: 34, reps: 10, rpe: 8.5 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 6: Active Recovery & Mobility
  {
    tanggal: getDateString(6),
    totalLoadScore: 60,
    strengthWorkouts: [],
    runningWorkouts: [],
  },
  // Day 7: Sunday Long Run
  {
    tanggal: getDateString(7),
    totalLoadScore: 560,
    strengthWorkouts: [],
    runningWorkouts: [
      {
        jarakKm: 16.5,
        durasiMenit: 94,
        avgPace: 5.7,
        avgHeartRate: 150,
        thresholdPace: 4.75,
      },
    ],
  },
  // Day 8: Legs
  {
    tanggal: getDateString(8),
    totalLoadScore: 480,
    strengthWorkouts: [
      {
        namaGerakan: 'Front Squats',
        sets: [
          { bebanKg: 95, reps: 6, rpe: 8 },
          { bebanKg: 95, reps: 6, rpe: 8 },
          { bebanKg: 95, reps: 6, rpe: 8 },
          { bebanKg: 95, reps: 6, rpe: 8 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 9: Easy Run
  {
    tanggal: getDateString(9),
    totalLoadScore: 200,
    strengthWorkouts: [],
    runningWorkouts: [
      {
        jarakKm: 7.0,
        durasiMenit: 40,
        avgPace: 5.7,
        avgHeartRate: 138,
        thresholdPace: 4.75,
      },
    ],
  },
  // Day 10: Pull Day
  {
    tanggal: getDateString(10),
    totalLoadScore: 380,
    strengthWorkouts: [
      {
        namaGerakan: 'Barbell Pendlay Row',
        sets: [
          { bebanKg: 80, reps: 8, rpe: 8 },
          { bebanKg: 80, reps: 8, rpe: 8 },
          { bebanKg: 80, reps: 8, rpe: 8 },
          { bebanKg: 80, reps: 8, rpe: 8.5 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 11: Push Day
  {
    tanggal: getDateString(11),
    totalLoadScore: 330,
    strengthWorkouts: [
      {
        namaGerakan: 'Overhead Barbell Press',
        sets: [
          { bebanKg: 52, reps: 8, rpe: 8 },
          { bebanKg: 52, reps: 8, rpe: 8 },
          { bebanKg: 52, reps: 8, rpe: 8 },
        ],
      },
    ],
    runningWorkouts: [],
  },
  // Day 12: Tempo Run
  {
    tanggal: getDateString(12),
    totalLoadScore: 410,
    strengthWorkouts: [],
    runningWorkouts: [
      {
        jarakKm: 9.0,
        durasiMenit: 42,
        avgPace: 4.66,
        avgHeartRate: 172,
        thresholdPace: 4.75,
      },
    ],
  },
  // Day 13: Rest & Mobility
  {
    tanggal: getDateString(13),
    totalLoadScore: 50,
    strengthWorkouts: [],
    runningWorkouts: [],
  },
  // Day 14: Long Run
  {
    tanggal: getDateString(14),
    totalLoadScore: 610,
    strengthWorkouts: [],
    runningWorkouts: [
      {
        jarakKm: 18.0,
        durasiMenit: 102,
        avgPace: 5.65,
        avgHeartRate: 152,
        thresholdPace: 4.75,
      },
    ],
  },
  // Days 15 to 27: Historical background foundation
  { tanggal: getDateString(15), totalLoadScore: 470, strengthWorkouts: [{ namaGerakan: 'Legs & Core', sets: [{ bebanKg: 100, reps: 8, rpe: 8 }] }], runningWorkouts: [] },
  { tanggal: getDateString(16), totalLoadScore: 210, strengthWorkouts: [], runningWorkouts: [{ jarakKm: 7.5, durasiMenit: 42, avgPace: 5.6, avgHeartRate: 140 }] },
  { tanggal: getDateString(17), totalLoadScore: 340, strengthWorkouts: [{ namaGerakan: 'Chest & Triceps', sets: [{ bebanKg: 80, reps: 8, rpe: 8 }] }], runningWorkouts: [] },
  { tanggal: getDateString(18), totalLoadScore: 390, strengthWorkouts: [{ namaGerakan: 'Back & Biceps', sets: [{ bebanKg: 75, reps: 8, rpe: 8 }] }], runningWorkouts: [] },
  { tanggal: getDateString(19), totalLoadScore: 380, strengthWorkouts: [], runningWorkouts: [{ jarakKm: 8.0, durasiMenit: 38, avgPace: 4.75, avgHeartRate: 168 }] },
  { tanggal: getDateString(20), totalLoadScore: 60, strengthWorkouts: [], runningWorkouts: [] },
  { tanggal: getDateString(21), totalLoadScore: 520, strengthWorkouts: [], runningWorkouts: [{ jarakKm: 15.0, durasiMenit: 85, avgPace: 5.67, avgHeartRate: 150 }] },
  { tanggal: getDateString(22), totalLoadScore: 500, strengthWorkouts: [{ namaGerakan: 'Heavy Squat Day', sets: [{ bebanKg: 120, reps: 5, rpe: 8.5 }] }], runningWorkouts: [] },
  { tanggal: getDateString(23), totalLoadScore: 180, strengthWorkouts: [], runningWorkouts: [{ jarakKm: 6.0, durasiMenit: 35, avgPace: 5.8, avgHeartRate: 135 }] },
  { tanggal: getDateString(24), totalLoadScore: 320, strengthWorkouts: [{ namaGerakan: 'Incline Bench & Shoulders', sets: [{ bebanKg: 70, reps: 10, rpe: 8 }] }], runningWorkouts: [] },
  { tanggal: getDateString(25), totalLoadScore: 440, strengthWorkouts: [{ namaGerakan: 'Deadlifts & Rows', sets: [{ bebanKg: 130, reps: 5, rpe: 8.5 }] }], runningWorkouts: [] },
  { tanggal: getDateString(26), totalLoadScore: 390, strengthWorkouts: [], runningWorkouts: [{ jarakKm: 8.5, durasiMenit: 40, avgPace: 4.7, avgHeartRate: 170 }] },
  { tanggal: getDateString(27), totalLoadScore: 50, strengthWorkouts: [], runningWorkouts: [] },
];
