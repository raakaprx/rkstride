# Changelog

Semua perubahan besar pada proyek **RKStride (Pulse Hybrid Athletics)** didokumentasikan di berkas ini.
Format changelog ini mengacu pada panduan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan mengikuti versi semantik [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - Fase 0-6 (2026-10-07)

Program perbaikan bertahap berdasarkan audit: kejujuran data, guardrail PPL-lari
end-to-end, aksesibilitas WCAG AA, sistem desain, persistensi, dan kebersihan rilis.

### Fixed
- Stabilisasi rilis: galat TypeScript pada test, filter domain AI coach yang bocor
  (substring generik + ambang panjang), token desain hilang (`--border-strong`,
  `@keyframes spin`), konfigurasi Vitest untuk Windows.
- Ambang ACWR tunggal 1.4 (AGENTS.md) di seluruh engine, UI, dan dokumentasi
  (`docs/science.md`); zona warning 1.3-1.5 dihapus dari engine.
- Guardrail PPL-lari kini bekerja end-to-end: audit jadwal mingguan delegasi ke
  `evaluateSoftGuardrail` (dua arah + Recovery Exemption), rekomendasi harian
  menerima lari besok yang direncanakan, override eksplisit via modal
  (advisory, tidak pernah hard-block, flag `isOverridden` tersimpan di sesi).
- Cabang rekomendasi baru ACWR < 0.8 (progressive overload aman +5%).
- Data jujur: seed 28 hari palsu dihapus (pengguna baru mulai kosong,
  cold-start guard aktif); status perangkat palsu, fallback RHR, dan kalori
  fabrikasi dihilangkan atau diberi label estimasi; klaim tak didukung dihapus.
- Aksesibilitas: primitif `ui/Modal` (dialog, Escape, focus trap, kembalikan fokus)
  untuk 6 modal; indikator fokus global; target sentuh 44px; font minimal 12px;
  kontras `--text-muted` lolos AA (cek axe diaktifkan kembali); kartu hari jadwal
  menjadi button; input file keyboard-accessible; hierarki h1/h2.
- Race config tersimpan langsung tanpa reload; debrief persisten di Dexie (skema v2);
  modal pengaturan AI Coach (BYOK, proxy, toggle telemetri); coach config masuk
  backup JSON; impor mendukung mode ganti-semua; seluruh error tampil inline
  (tanpa `alert()`).

### Added
- `DESIGN.md` (arah visual tertulis, dial ENERGY 2/RHYTHM 2/MOTION 1).
- Primitif `ui/Button`, `ui/Card`, `ui/Badge`; token chart kategorikal; skala z-index terpusat.
- Ikon PWA asli (`scripts/generate-pwa-icons.mjs`, tanpa dependensi) dan service
  worker app-shell (`public/sw.js`, produksi saja).
- Workflow CI (`.github/workflows/ci.yml`): build + 80 test Vitest + 39 test CLI.
- `DELIVERY_GATE_REPORT.md` (bukti verifikasi R-35).

### Removed
- Kode mati: `MiBandSyncCard.tsx`, `lib/engine/mi-band.ts`, `lib/engine/test-engine.ts`
  (duplikat yatim), prop `onQuickLogPreset`, seed pengaturan Dexie yang tak dibaca,
  konstanta `READINESS_MIN_BASELINE_DAYS` yang tak dipakai.

### Changed
- Suite Vitest tumbuh 64 -> 80 test (ambang 1.4, audit jadwal, override hook);
  CLI 39/39; `agents.md` diselaraskan ke stack aktual (Vite + React, bukan Next.js).

---

## [2.0.0] - 2026-10-02

Perombakan arsitektur besar-besaran berbasis *sports science*, penambahan penyimpanan lokal persisten (*IndexedDB*), sistem audit data Zod, kecerdasan buatan Gemini AI Coach yang aman dari red-flag medis, fitur nutrisi dan periodisasi, serta perluasan suite pengujian otomatis.

### Added

#### FASE 1: Fondasi Sports Science Deterministik
- Sentralisasi seluruh konstanta dan batas empiris fisiologis pada `src/lib/engine/constants.ts` lengkap dengan sitasi literatur ilmiah (Gabbett 2016, Impellizzeri 2020, Foster 2001, Edwards 1993, Helgerud 2007, Tanaka 2001, Gellish 2007, Epley 1985, Brzycki 1993, Hickson 1980, Baar 2014).
- Mesin kalkulasi ACWR tiga model:
  - *Coupled Rolling Average* (Gabbett 2016)
  - *Uncoupled Rolling Average* (Windt & Gabbett 2019)
  - *Exponentially Weighted Moving Average* / EWMA (Williams 2017)
- Proteksi *Cold-Start* cerdas yang menandai status `insufficient_data` jika riwayat kurang dari 21 hari.
- Deteksi lonjakan beban mingguan (*weekly workload spike* $> 15\%$).
- Universal Session RPE (Foster 2001) untuk menyatukan beban latihan kekuatan dan kardio.
- Edwards Heart Rate TRIMP (1993) dengan protokol Norwegian 4x4 dan Karvonen HRR.
- *Soft Guardrail* dua arah (*bidirectional*) dengan pengecualian pemulihan (*Recovery Exemption*) untuk lari Zona 1-2 $\le 45$ menit.
- Normalisasi Z-Score untuk skor kesiapan biologis (*Bio-Readiness*) berbasis riwayat personal 14 hari dan *Tendon Pain Alert*.
- Estimasi komposit 1RM (Epley & Brzycki) dan pelacakan *hard sets* per kelompok otot per minggu.

#### FASE 2: Persistensi Data, Validasi Skema & Keamanan AI Coach
- Implementasi penyimpanan data lokal persisten luring menggunakan **Dexie.js (IndexedDB)** (`src/lib/db/database.ts`).
- Skema validasi impor/ekspor cadangan JSON yang ketat menggunakan **Zod** (`src/lib/db/exportImport.ts`), menangkal korupsi data dan manipulasi skema.
- Lapisan keamanan medis untuk **Gemini AI Athletic Coach** (`src/lib/ai/geminiCoach.ts`):
  - *Emergency Medical Red-Flag Interception*: Mengintersepsi keluhan nyeri dada, fraktur, sesak napas akut, pusing mendadak, atau cedera kepala, dan langsung mengarahkan ke tenaga medis darurat.
  - *Domain Scope Guard*: Menolak pertanyaan di luar ruang lingkup kebugaran dan beban latihan.
  - Dukungan Bring Your Own Key (BYOK) dan proksi lokal.
  - Sanitasi telemetri atlet sebelum pengiriman prompt untuk menjamin privasi.
- Modal antarmuka data management (`DataManagementModal.tsx`) dan disclaimer non-medis saat onboarding (`OnboardingDisclaimerModal.tsx`).

#### FASE 3: Fitur Produk Atlet Hibrida
- Mesin nutrisi & metabolisme energi (`src/lib/engine/nutrition.ts`):
  - BMR Mifflin-St Jeor (1990) dan TDEE terintegrasi pengeluaran kalori sesi latihan.
  - Rekomendasi makronutrien terukur (protein 1.6-2.2 g/kg BB, karbohidrat, lemak).
  - Target hidrasi ACSM (Sawka 2007) dengan kompensasi durasi latihan.
  - Komponen UI `NutritionBodyCompCard.tsx`.
- Mesin periodisasi target lomba & tapering (`src/lib/engine/periodization.ts`):
  - Penentuan fase otomatis (*Base*, *Peak/Build*, *Taper*, *Race Week*).
  - Pengurangan volume 40%-50% tanpa menurunkan intensitas (Mujika & Padilla 2003).
  - Komponen UI `PeriodizationTaperCard.tsx`.
- Mesin progresi beban ganda / *Double Progression* (`src/lib/engine/doubleProgression.ts`):
  - Rekomendasi kenaikan beban upper (+2.5 kg) dan lower/compound (+5.0 kg) jika target repetisi tercapai pada RPE $\le 8$ (Helms 2016).
  - Timer istirahat interaktif di dalam `WorkoutLogger.tsx` dengan nada bip Web Audio API.
- Dashboard tren beban jangka panjang (`TrendsDashboardCard.tsx`) dengan visualisasi riwayat 7 hari dan 28 hari.
- Profil atlet dan modal onboarding awal (`OnboardingProfileModal.tsx`).
- Konfigurasi Web App Manifest PWA (`public/manifest.json`).

#### FASE 4: Suite Pengujian Otomatis Komprehensif
- Konfigurasi Vitest + JSDOM (`vitest.config.ts`, `src/test/setup.ts`).
- 45 Unit Test logika matematis (`workload.test.ts`, `nutrition.test.ts`, `periodization.test.ts`, `doubleProgression.test.ts`).
- 5 Property-Based Test invariant matematis dengan `fast-check` (`workload.property.test.ts`).
- 10 Pengujian Komponen Integrasi React Testing Library (`WorkoutLogger.test.tsx`, `Dashboard.test.tsx`).
- 4 Audit Aksesibilitas Otomatis WCAG AA dengan `axe-core` (`a11y.test.tsx`).
- Total 64 tes otomatis dalam `npm test` yang berjalan 100% lulus.

#### FASE 5: Dokumentasi Lengkap & Standar Rilis
- Pembuatan `docs/science.md` mendokumentasikan seluruh formula matematika (LaTeX), batas empiris, asumsi fisiologis, dan 26 sitasi jurnal ilmiah.
- Pembaruan `README.md` dengan arsitektur sistem baru, panduan instalasi, panduan pengujian, dan disclaimer non-medis.
- Pembuatan `CHANGELOG.md`.

### Changed
- Menggantikan hardcoded state mock dengan orkestrasi reaktif berbasis Dexie IndexedDB di `useWorkoutEngine.ts`.
- Menghilangkan semua klaim deterministik "mencegah cedera" dari antarmuka pengguna; beralih ke terminologi "indikator risiko lonjakan beban kerja" dan "alat bantu keputusan".
- Menstandarkan token desain ke Dark Mode pekat (`#09090b` kanvas, `#18181c` kartu) dan aksen Volt (`#CCFF00`), membersihkan seluruh emoji dari antarmuka produksi.
- Memperbaiki komponen `WorkoutAdvisorCard.tsx` untuk menampilkan indikator kematangan data saat fase *cold-start*.

### Fixed
- Menghilangkan celah ketidakpastian rasio ACWR dengan menetapkan batas aman numerik (*division-by-zero protection*).
- Memperbaiki aksesibilitas kontrol select pada formulir nutrisi (`aria-label` penamaan eksplisit untuk lolos aturan axe-core `select-name`).
- Mengoptimalkan eksekusi worker Vitest di lingkungan Windows menggunakan pool threads stabil.

### Security
- Menjamin privasi data atlet dengan penyimpanan 100% lokal di browser pengguna (*offline-first IndexedDB*).
- Menolak pemrosesan prompt asisten AI yang mengandung kondisi kegawatdaruratan medis (*client-side medical red-flag filter*).
- Sanitasi payload telemetri sebelum dikirimkan ke endpoint Gemini API.
- Validasi data cadangan JSON via Zod schema sebelum penulisan ke database IndexedDB.
