/**
 * RKStride - Competition Periodization & Dynamic Tapering Engine
 * Pure, deterministic sports science calculations for race readiness.
 *
 * Literature Citations:
 * 1. Mujika, I., & Padilla, S. (2003). Scientific bases for precompetition tapering in endurance athletes.
 *    Medicine & Science in Sports & Exercise, 35(7), 1182-1187.
 * 2. Bosquet, L., et al. (2007). Effects of tapering on performance: a meta-analysis.
 *    Medicine & Science in Sports & Exercise, 39(8), 1358-1365.
 * 3. Haugen, T., et al. (2022). The training characteristics of world-class distance runners.
 *    Sports Medicine, 52(4), 817-843.
 */

import { TAPERING_CONSTANTS } from './constants';
import { RaceTargetConfig, PeriodizationPlan, PeriodizationPhase } from '@/types/productFeatures';

/**
 * Calculate dynamic periodization plan and taper volume adjustment
 */
export function calculatePeriodizationPlan(
  raceConfig: RaceTargetConfig,
  currentDateStr?: string
): PeriodizationPlan {
  const now = currentDateStr ? new Date(currentDateStr) : new Date();
  const raceDate = new Date(raceConfig.raceDate);

  // Difference in milliseconds
  const diffTime = raceDate.getTime() - now.getTime();
  const daysToRace = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const weeksToRace = Math.round((daysToRace / 7) * 10) / 10;

  const taperWeeks =
    raceConfig.category !== 'none' && raceConfig.category in TAPERING_CONSTANTS.TAPER_WEEKS
      ? (TAPERING_CONSTANTS.TAPER_WEEKS as Record<string, number>)[raceConfig.category] || 2
      : 2;
  const taperDays = taperWeeks * 7;

  let currentPhase: PeriodizationPhase = 'base';
  let phaseName = 'Fase Fondasi Aerobik (Base Building)';
  let isTaperActive = false;
  let volumeAdjustmentPercent = 0;
  let intensityGuideline = 'Zona 2 Aerobic Base (75-80% volume) + 1 Sesi Tempo / Ambang Laktat mingguan.';
  let strengthGuideline = 'Push-Pull-Legs reguler 3-4x seminggu. Fokus hipertrofi dan kekuatan struktural.';
  let advice = 'Bangun fondasi ketahanan kardiorespirasi dan volume latihan secara progresif tanpa lonjakan ACWR > 1.3.';

  if (daysToRace <= 0) {
    currentPhase = 'recovery';
    phaseName = 'Fase Pemulihan Pasca Lomba (Post-Race Recovery)';
    volumeAdjustmentPercent = -60;
    intensityGuideline = 'Active recovery jalan santai atau lari sangat ringan (Zona 1) maksimal 20-30 menit.';
    strengthGuideline = 'Hindari latihan beban kaki berat selama 5-7 hari pertama. Fokus mobilitas dan tidur.';
    advice = 'Prioritaskan regenerasi miofibril dan cadangan glikogen. Jangan langsung kembali ke latihan berat.';
  } else if (daysToRace <= 7) {
    currentPhase = 'race_week';
    phaseName = 'Pekan Lomba (Race Week)';
    isTaperActive = true;
    volumeAdjustmentPercent = -50;
    intensityGuideline = 'Volume lari sangat dipangkas (50%). Sertakan 3-4 akselerasi pendek (strides 80-100m) 2 hari sebelum lomba untuk aktivasi neuromuscular.';
    strengthGuideline = 'Deload total beban bawah tubuh. Hentikan squat/deadlift berat 5 hari sebelum hari lomba.';
    advice = 'Fokus pada karbohidrat, hidrasi optimal, dan tidur berkualitas. Tubuh dalam kondisi superkompensasi puncak.';
  } else if (daysToRace <= taperDays) {
    currentPhase = 'taper';
    phaseName = 'Fase Tapering Pra-Lomba (Peak Supercompensation)';
    isTaperActive = true;

    // Gradual taper reduction (Mujika & Padilla 2003: 30% - 50% volume drop)
    const weeksRemaining = daysToRace / 7;
    if (weeksRemaining > 1.5) {
      volumeAdjustmentPercent = -30;
    } else {
      volumeAdjustmentPercent = -40;
    }

    intensityGuideline = 'Kurangi volume total (durasi & jarak) hingga 30-40%, tetapi PERTAHANKAN intensitas spesifik lomba pada interval.';
    strengthGuideline = 'Turunkan jumlah set latihan kaki sebesar 40%. Hindari kegagalan otot (RIR >= 3) untuk mencegah DOMS residual.';
    advice = 'Penurunan volume secara terukur akan melenyapkan kelelahan fisiologis akumulatif tanpa menurunkan VO2 Max atau kapasitas enzim aerobik.';
  } else if (daysToRace <= taperDays + 28) {
    currentPhase = 'peak';
    phaseName = 'Fase Beban Puncak (Peak Specific Load)';
    volumeAdjustmentPercent = 5;
    intensityGuideline = 'Simulasi spesifik kecepatan target lomba (Race Pace Intervals & Norwegian 4x4 VO2 Max).';
    strengthGuideline = 'PPL terpelihara. Jaga jeda 48 jam antara sesi leg day dan lari cepat spesifik.';
    advice = 'Adaptasi neuromuscular pada kecepatan target lomba berada di tingkat tertinggi. Pantau ACWR agar tidak menembus zona bahaya (>1.5).';
  } else if (daysToRace <= taperDays + 70) {
    currentPhase = 'build';
    phaseName = 'Fase Peningkatan Kapasitas (Build Phase)';
    volumeAdjustmentPercent = 0;
    intensityGuideline = 'Progresif overload: Tingkatkan jarak long run mingguan dan tambahkan porsi lari tempo.';
    strengthGuideline = 'Beban progresif PPL (Push, Pull, Legs) dengan penambahan beban terukur (Double Progression).';
    advice = 'Jaga rasio ACWR dalam rentang Sweet Spot (0.8 - 1.3) untuk mengoptimalkan adaptasi kardiometabolik.';
  }

  return {
    currentPhase,
    phaseName,
    daysToRace,
    weeksToRace,
    isTaperActive,
    volumeAdjustmentPercent,
    intensityGuideline,
    strengthGuideline,
    advice,
  };
}
