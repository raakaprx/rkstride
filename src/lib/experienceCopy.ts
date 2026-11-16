import { ExperienceLevel } from '@/types/workout';

export interface ExperienceTierCopy {
  levelLabel: string;
  levelBadgeDesc: string;
  advisorEyebrow: string;
  acwrRatioLabel: string;
  acwrModelNote: string;
  acuteLabel: string;
  chronicLabel: string;
  legWindowTitle: string;
  rpeColumnHeader: string;
  beginnerTipBanner?: string;
  loggerSubtitle: string;
}

export const EXPERIENCE_COPY: Record<ExperienceLevel, ExperienceTierCopy> = {
  beginner: {
    levelLabel: 'Pemula',
    levelBadgeDesc: 'Bahasa sehari-hari & panduan terarah',
    advisorEyebrow: 'Panduan Keseimbangan Latihan Harian (Athletic Workload Science)',
    acwrRatioLabel: 'Skor Keseimbangan Beban (ACWR)',
    acwrModelNote: 'Target Aman: 0.8 - 1.4',
    acuteLabel: 'Rata-rata 7 Hari (Kelelahan)',
    chronicLabel: 'Rata-rata 28 Hari (Kebugaran)',
    legWindowTitle: 'Aturan Istirahat Kaki 2 Hari (48 Jam)',
    rpeColumnHeader: 'Tingkat Capek / RPE (1-10)',
    beginnerTipBanner:
      'Panduan Pemula: Cukup pilih gerakan angkat beban atau lari di bawah ini, isi beban dan jumlah angkatan, lalu lihat kotak evaluasi di bagian bawah. Selama skor berada di rentang 0.8 sampai 1.4 (Hijau), porsi latihan Anda aman.',
    loggerSubtitle:
      'Pilih gerakan angkat beban (Dada, Punggung, Kaki, Lengan, Perut) dan sesi lari untuk melihat apakah porsi latihan hari ini aman bagi tubuh Anda.',
  },
  intermediate: {
    levelLabel: 'Menengah',
    levelBadgeDesc: 'Metrik hibrida terpandu (ACWR & RPE)',
    advisorEyebrow: 'Evaluasi Beban Kerja & Kesiapan (Athletic Workload Science)',
    acwrRatioLabel: 'Rasio Beban Kerja (ACWR)',
    acwrModelNote: 'Model Adaptasi 7:28 Hari',
    acuteLabel: 'Beban Akut (7 Hari)',
    chronicLabel: 'Beban Kronis (28 Hari)',
    legWindowTitle: 'Jendela Pemulihan Otot Kaki (48 Jam)',
    rpeColumnHeader: 'Skala Usaha RPE (1-10)',
    loggerSubtitle:
      'Atur kombinasi latihan kekuatan (Push, Pull, Legs, Arms, Core) dan spektrum lari untuk menyimulasikan dampak rasio ACWR secara instan.',
  },
  expert: {
    levelLabel: 'Expert',
    levelBadgeDesc: 'Terminologi sports science & kontrol metode penuh',
    advisorEyebrow: 'Athletic Workload Science (ACWR Engine)',
    acwrRatioLabel: 'ACWR Workload Ratio',
    acwrModelNote: 'Gabbett / EWMA Model',
    acuteLabel: 'Acute Load (7d)',
    chronicLabel: 'Chronic Load (28d)',
    legWindowTitle: '48h AMPK/mTORC1 Leg Recovery Window',
    rpeColumnHeader: 'RPE / RIR (1-10)',
    loggerSubtitle:
      'Konfigurasi volume mekanis (Push, Pull, Legs, Arms, Core) dan beban kardiometabolik (Foster sRPE & Edwards TRIMP) untuk simulasi ACWR presisi.',
  },
};
