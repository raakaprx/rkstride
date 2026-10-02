# Changelog

Semua perubahan besar pada proyek **RKStride (Pulse Hybrid Athletics)** didokumentasikan di berkas ini.
Format changelog ini mengacu pada panduan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan mengikuti versi semantik [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
