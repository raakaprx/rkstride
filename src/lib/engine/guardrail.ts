/**
 * RKStride - Bidirectional Soft Interference Guardrail & Weekly Schedule Audit
 */
import type {
  ReadinessCheckIn,
  RunningType,
  SoftGuardrailResult,
  StrengthExercise,
  WorkoutCategory,
} from '@/types/workout';
import type { ScheduleConflict, ScheduledDay } from '@/types/schedule';
import { INTERFERENCE_GUARDRAIL } from './constants';

export interface EvaluateGuardrailParams {
  lastLegDayHoursAgo: number;
  lastFastRunHoursAgo?: number;
  intendedActivity: 'running' | 'legs' | 'upper_push_pull' | 'rest';
  runningType?: RunningType;
  runningDurationMinutes?: number;
  muscleSoreness: 1 | 2 | 3 | 4 | 5;
  legFatigue: boolean;
  readinessScore: number;
  isOverridden?: boolean;
}

/**
 * Determine whether a strength exercise imposes significant lower-body / posterior-chain strain.
 */
export function isLegStrengthExercise(
  ex: Pick<StrengthExercise, 'namaGerakan' | 'category' | 'isLegExercise'>
): boolean {
  if (ex.isLegExercise) return true;
  if (ex.category === 'legs') return true;
  return /squat|deadlift|rdl|hip thrust|leg|calf|quad|hamstring|lunge|nordic/i.test(
    ex.namaGerakan
  );
}

/**
 * Graded, Bidirectional Soft Guardrail
 * Direction 1: Heavy Legs -> High-Intensity Running (48h window)
 * Direction 2: High-Intensity Running -> Heavy Lower Body Lifting (24h window)
 * Safe rule: Zone 1 or Zone 2 aerobic running <= 45 minutes is ALWAYS allowed.
 */
export function evaluateSoftGuardrail(params: EvaluateGuardrailParams): SoftGuardrailResult {
  const {
    lastLegDayHoursAgo,
    lastFastRunHoursAgo = 999,
    intendedActivity,
    runningType,
    runningDurationMinutes = 30,
    muscleSoreness,
    legFatigue,
    readinessScore,
    isOverridden = false,
  } = params;

  const isAerobicFlush =
    (runningType === 'recovery' || runningType === 'easy') &&
    runningDurationMinutes <= INTERFERENCE_GUARDRAIL.SAFE_AEROBIC_RECOVERY_MAX_MINUTES;

  if (isAerobicFlush) {
    return {
      level: 'none',
      canOverride: true,
      warningTitle: 'Sesi Pemulihan Aerobik Aman',
      warningMessage:
        'Lari Zone 1-2 berdurasi <= 45 menit aman dilakukan untuk mempercepat klirens laktat dan regenerasi miofibril.',
      suggestedAction:
        'Jaga detak jantung tetap berada di bawah ambang Zone 2 (kecepatan berbicara santai).',
      conflictDirection: 'none',
      allowedRunningTypes: ['recovery', 'easy'],
    };
  }

  if (
    intendedActivity === 'running' &&
    lastLegDayHoursAgo < INTERFERENCE_GUARDRAIL.LEGS_TO_FAST_RUN_HOURS &&
    (runningType === 'norwegian_4x4' || runningType === 'intervals' || runningType === 'tempo')
  ) {
    const isHighRisk = legFatigue || muscleSoreness >= 4 || readinessScore < 50;

    return {
      level: isHighRisk ? 'high_risk' : 'caution',
      canOverride: true,
      warningTitle: isHighRisk
        ? 'Indikator Risiko Tinggi: Pemulihan Tendon & Otot Kaki'
        : 'Waspada: Jendela Pemulihan Kaki Sedang Berjalan',
      warningMessage: `Latihan kaki terakhir dilakukan ${lastLegDayHoursAgo} jam lalu (DOMS ${muscleSoreness}/5, Kesiapan ${readinessScore}/100). Menjalankan sesi lari berkecepatan tinggi dapat meningkatkan stres mekanis pada tendon patela dan menghambat adaptasi hipertrofi via persinyalan AMPK/mTORC1.`,
      suggestedAction: isOverridden
        ? 'Anda memilih tetap lanjut: Lakukan pemanasan dinamis 15 menit dan segera hentikan jika timbul nyeri sendi tajam.'
        : 'Disarankan mengalihkan sesi ke lari santai Zone 1/2 (< 45 menit) atau latihan kekuatan tubuh bagian atas (Upper Body Push/Pull).',
      conflictDirection: 'legs_to_run',
      allowedRunningTypes: isOverridden
        ? ['recovery', 'easy', 'tempo', 'norwegian_4x4', 'intervals']
        : ['recovery', 'easy'],
    };
  }

  if (
    intendedActivity === 'legs' &&
    lastFastRunHoursAgo < INTERFERENCE_GUARDRAIL.FAST_RUN_TO_LEGS_HOURS
  ) {
    const isHighRisk = legFatigue || readinessScore < 55;

    return {
      level: isHighRisk ? 'high_risk' : 'caution',
      canOverride: true,
      warningTitle: isHighRisk
        ? 'Indikator Risiko: Kelelahan Neuromuskular Pasca Lari Cepat'
        : 'Waspada: Pemulihan Pasca Sesi Lari Cepat',
      warningMessage: `Sesi lari intensitas tinggi (Interval/Tempo) selesai ${lastFastRunHoursAgo} jam lalu. Beban angkatan squat/deadlift berat saat glikogen otot kaki dan kekakuan tendon belum pulih dapat menurunkan kapasitas stabilisasi sendi.`,
      suggestedAction: isOverridden
        ? 'Anda memilih tetap lanjut: Turunkan beban kerja (RPE target <= 7) dan prioritaskan teknik gerakan.'
        : 'Pertimbangkan mengganti menu hari ini ke Upper Body atau deload mobility kaki.',
      conflictDirection: 'run_to_legs',
      allowedRunningTypes: ['recovery', 'easy'],
    };
  }

  return {
    level: 'none',
    canOverride: true,
    warningTitle: 'Jalur Latihan Terbuka',
    warningMessage: 'Tidak ada benturan fisiologis antara riwayat sesi kaki dan lari yang terdeteksi.',
    suggestedAction: 'Aman untuk mengeksekusi menu latihan sesuai rencana jadwal.',
    conflictDirection: 'none',
    allowedRunningTypes: ['recovery', 'easy', 'tempo', 'norwegian_4x4', 'intervals', 'long_run'],
  };
}

const FAST_RUN_CATEGORIES: WorkoutCategory[] = ['run_tempo', 'run_intervals', 'norwegian_4x4'];

function mapScheduleCategoryToRunType(category: WorkoutCategory): RunningType {
  switch (category) {
    case 'run_tempo':
      return 'tempo';
    case 'run_intervals':
      return 'intervals';
    case 'norwegian_4x4':
      return 'norwegian_4x4';
    case 'run_recovery':
      return 'recovery';
    case 'run_long':
      return 'long_run';
    case 'run_easy':
    default:
      return 'easy';
  }
}

/**
 * Audit a 7-day planned schedule with the bidirectional engine guardrail.
 */
export function auditWeeklySchedule(
  weeklySchedule: ScheduledDay[],
  readiness: ReadinessCheckIn,
  readinessScore: number
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  if (!weeklySchedule || weeklySchedule.length === 0) return conflicts;

  for (let i = 0; i < weeklySchedule.length; i++) {
    const current = weeklySchedule[i];
    const prev = weeklySchedule[(i - 1 + weeklySchedule.length) % weeklySchedule.length];

    const prevIsLegs = prev.category === 'legs';
    const prevIsFastRun = FAST_RUN_CATEGORIES.includes(prev.category);
    const currentIsLegs = current.category === 'legs';
    const currentIsFastRun = FAST_RUN_CATEGORIES.includes(current.category);

    let guardrail: SoftGuardrailResult | null = null;

    if (prevIsLegs && currentIsFastRun) {
      guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 24,
        intendedActivity: 'running',
        runningType: mapScheduleCategoryToRunType(current.category),
        runningDurationMinutes: current.targetDurationMinutes,
        muscleSoreness: readiness.muscleSoreness,
        legFatigue: readiness.legFatigue,
        readinessScore,
      });
    } else if (prevIsFastRun && currentIsLegs) {
      guardrail = evaluateSoftGuardrail({
        lastLegDayHoursAgo: 999,
        lastFastRunHoursAgo: 20,
        intendedActivity: 'legs',
        muscleSoreness: readiness.muscleSoreness,
        legFatigue: readiness.legFatigue,
        readinessScore,
      });
    }

    if (guardrail && guardrail.level !== 'none') {
      conflicts.push({
        dayIndex: current.dayIndex,
        dayName: current.dayName,
        severity: guardrail.level === 'high_risk' ? 'danger' : 'warning',
        message: `${current.dayName} (${current.title}) ${
          guardrail.conflictDirection === 'legs_to_run'
            ? `dijadwalkan sehari setelah Leg Day (${prev.dayName})`
            : `berupa Leg Day sehari setelah lari cepat (${prev.dayName})`
        }: ${guardrail.warningTitle}.`,
        suggestion: guardrail.suggestedAction,
      });
    }
  }

  return conflicts;
}
