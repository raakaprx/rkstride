# Jadwal Eksekusi Step-by-Step 3 Hari: Penyelesaian Backlog RKStride

**Target Utama:** Menyelesaikan seluruh temuan audit & spec (`T1.1` s.d. `T5.5` di [project-plan-odoo.md](project-plan-odoo.md)) dalam **3 hari kerja fokus** sehingga `npm run verify:strict` (zero-tolerance), `npm test`, `npm run test:engine`, dan `npm run build` lulus 100% tanpa regresi.

---

## Persiapan Sebelum Mulai (15 Menit)
1. Aktifkan git hook otomatis di mesin masing-masing:
   ```bash
   npm run hooks:install
   ```
2. Verifikasi kondisi baseline awal:
   ```bash
   npm run verify
   ```
3. Pastikan setiap developer bekerja di branch sesuai owner (`feat/<owner>/<slug>`) dan **tidak menyentuh file di luar scope sprint-nya**.

---

## HARI 1: Fondasi Kontrak, DB Atomik, & Security/Kebersihan (Sprint 1 + Sprint 2)

**Target Demo Akhir Hari 1:** Skema Zod tunggal aktif, Dexie v3 migrasi aman, transaksi atomik tersedia, BYOK API key aman saat ekspor JSON, `rkbot` memblokir prompt non-olahraga di semua mode, parser smartwatch menolak `.fit/.gpx/.tcx` secara jujur, dan `dist/`/`node_modules/` bersih dari Git.

### Pagi (09.00 - 12.30): Kontrak, Tanggal Lokal, & Git Hygiene (Paralel)
- **Step 1.1 (`T1.1` - Owner 2 - 3j):** Buat `src/lib/engine/dateKey.ts` (`getLocalDateKey`, `diffDaysBetweenDateKeys`) + unit test `dateKey.test.ts`.
- **Step 1.2 (`T1.2` - Owner 1 - 4-6j):** Buat `src/contracts/*.schema.ts` (Zod single source of truth dengan enum ketat, `gender`, `thresholdPace`, `targetBpmRange`, hapus `'warning'`), lalu re-export dari `src/types/*`.
- **Step 1.3 (`T2.5` - Tech Lead - 2j):** Jalankan `git rm -r --cached dist node_modules` (tanpa menghapus file lokal), pastikan `.gitignore` mengabaikan keduanya.
- **Step 1.4 (`T2.2` & `T2.3` - Owner 4 - 4j mulai):** Pindahkan `isQueryInSportsDomain()` ke gerbang atas `askGeminiCoach()`, tambah `isSafeProxyUrl()`, timeout `AbortController`, `ProxyCoachResponseSchema`, buat `buildAthleteContext.ts` & `formatCoachMessage.ts`.

**Checkpoint Siang:** Jalankan `npm run verify` (memastikan tidak ada error TS dan tidak ada pelanggaran diff baru).

### Siang - Sore (13.30 - 17.30): Dexie v3, Repositories, Export Aman, & Parser Jujur
- **Step 1.5 (`T1.3` - Owner 2 - 4-6j):** Migrasi `database.ts` ke `version(3)` (`sessions[]` multi-sesi + normalisasi `userProfile.gender`).
- **Step 1.6 (`T1.4` - Owner 2 - lanjut):** Buat `workoutRepo.ts`, `readinessRepo.ts`, `profileRepo.ts` dengan `db.transaction('rw', ...)`.
- **Step 1.7 (`T1.5` + `T2.1` - Owner 2 - 4j):** Perbarui `exportImport.ts` (sertakan `postWorkoutDebrief`, selaraskan `version: 3`, normalizer v1/v2, `ExportOptions` tanpa `byokApiKey` default).
- **Step 1.8 (`T2.4` - Owner 2/Owner 1 - 3-4j):** Ubah `smartwatch.ts` agar mengembalikan `SmartwatchImportResult` (tolak `.fit/.gpx/.tcx` tanpa fallback dummy) + perbaiki BLE `0x2A37`. *(Jika dikerjakan paralel oleh Owner 1 setelah T1.2 selesai, tidak ada bentrokan file dengan Owner 2).*

**Gerbang Akhir Hari 1:**
```bash
npm run verify && npm run build
node scripts/verify.mjs --update-baseline
```
*(Target: `git_tracked_build_artifacts`, `weak_zod_enum`, `dexie_backup_version_drift`, `unconditional_byok_key_export` turun ke `0`).*

---

## HARI 2: Alur Inti Engine, Hooks, & Refactor UI Utama (Sprint 3 + Bagian Awal Sprint 4)

**Target Demo Akhir Hari 2:** Multi-sesi AM/PM berjalan end-to-end, proyeksi ACWR patuh Cold-Start 21 hari, Z-Score 14 hari aktif, `WorkoutLogger` terpecah dengan rumus benar + Plan-to-Log, `ScheduleCustomizer` dan `OnboardingProfileModal` terhubung ke repository atomik.

### Pagi (09.00 - 12.30): Engine & Hooks (Sprint 3)
- **Step 2.1 (`T3.1` + `T3.2` - Owner 1 - 5-6j):** Pecah `workload.ts` menjadi sub-modul (`hrZones`, `loadMetrics`, `acwr`, `guardrail`, `readiness`, `strength1rm`), tambah `projectACWRImpact()` (Cold-Start Guard 21 hari) & `isLegStrengthExercise()`, serta selaraskan teks `1.4` di `periodization.ts`.
- **Step 2.2 (`T3.4` - Tech Lead - 4j):** Buat `useAthleteProfile.ts` dan `useNutritionPrefs.ts` berbasis `profileRepo` & `appSettings`.
- **Step 2.3 (`T3.3` - Owner 2 - 5-6j, mulai setelah T3.1):** Refactor `useWorkoutEngine.ts` memakai `workoutRepo` & `readinessRepo` atomik, muat `readinessHistory` untuk Z-Score 14 hari, perbaiki `lastLegsTrainedHoursAgo` berbasis `dateKey`, hapus `batteryLevel` fabrikasi, dan reset state kosong di `reloadFromDb()`.

**Checkpoint Siang:** Jalankan `npm run verify` dan `npm run test:engine` -> pastikan seluruh 39 test engine tetap 100% hijau.

### Siang - Sore (13.30 - 17.30): UI Logger, Jadwal, & Profil (Sprint 4 Bagian 1)
- **Step 2.4 (`T4.1` - Owner 3 - 6j):** Pecah `WorkoutLogger.tsx` ke `src/components/logger/*`, hapus rumus menyimpang di Formula Guide & set score, muat jadwal hari ini sebagai draft awal, tambah pemilih tanggal lokal & append multi-sesi, bersihkan `blocks` saat edit manual.
- **Step 2.5 (`T4.2` - Owner 3 - 2j):** Perbaiki `ScheduleCustomizer.tsx` (`dayIndex` lookup + 12 `WorkoutCategory`).
- **Step 2.6 (`T4.3` - Owner 4 - 3j):** Refactor `OnboardingProfileModal.tsx` memakai `useAthleteProfile`, tambah input `maxHr` custom, muat `targetRaceConfig`.

**Gerbang Akhir Hari 2:**
```bash
npm run verify && npm test && npm run build
node scripts/verify.mjs --update-baseline
```
*(Target: `stale_acwr_threshold_text`, `legacy_wrong_formula_ui`, `no_as_any`, `utc_date_split` mendekati/mencapai `0`).*

---

## HARI 3: Sisa UI/UX, Integrasi Shell, Automated Test & Strict Gate (Sprint 4 Bagian 2 + Sprint 5)

**Target Demo Akhir Hari 3:** Seluruh layar siap rilis produksi, test unit/integrasi/a11y lengkap, dan **`npm run verify:strict` lulus 100% (`0` temuan pada seluruh aturan)**.

### Pagi (09.00 - 12.30): Sisa UI & Integrasi `App.tsx` (Sprint 4 Bagian 2)
- **Step 3.1 (`T4.4` - Owner 4 - 4-5j):** Perbarui `SmartwatchSyncCard.tsx` (`useEffect` sync slider, input `hrvRmssd` & `tendonJointPain` 0-3, error banner upload, badge `[SIMULASI]` preset, tombol impor `workoutDetected`, selaraskan `accept`).
- **Step 3.2 (`T4.5` - Owner 4 - 5j):** Perbarui `NutritionBodyCompCard.tsx` (agregat sesi hari ini + persist prefs), `TrendsDashboardCard.tsx` & `WorkloadAdvisorCard.tsx` (pemilih metode ACWR, hapus `'warning'`, hilangkan em dash placeholder jika tersisa, tampilkan `Provisional` & `tendonAlert`).
- **Step 3.3 (`T4.6` - Tech Lead - 4j, setelah 3.1 & 3.2):** Perbarui `GeminiCoachWidget.tsx` (persist chat + `formatCoachMessage`), `AICoachSettingsModal.tsx` (pesan & validasi proxy), `BottomNav.tsx` & `App.tsx` (pakai `useAthleteProfile`, `buildAthleteContext`, `reloadFromDb` penuh, selaraskan tab & badge).

**Checkpoint Siang:** Jalankan `npm run verify:strict` untuk melihat sisa pelanggaran statis (target: **0 temuan**), lalu jalankan `npm run dev` untuk *smoke click-through* 5 tab.

### Siang - Sore (13.30 - 17.30): Automated Test Suite & Final Release Gate (Sprint 5)
- **Step 3.4 (`T5.1` - Owner 1 - 4j):** Tambah test `contracts.test.ts`, `projectACWRImpact()` cold-start, `isLegStrengthExercise()`, update `scripts/test-engine.ts`.
- **Step 3.5 (`T5.2` - Owner 2 - 4-5j):** Tambah `dbPersistence.test.ts` (Dexie v3 upgrade, transaksi atomik, multi-sesi, backup key tidak bocor, wipe `postWorkoutDebrief`) & `smartwatch.test.ts`.
- **Step 3.6 (`T5.3` - Owner 4 - 3j):** Perluas `geminiCoach.test.ts` (domain guard di semua mode, proxy Zod/timeout, `buildAthleteContext`).
- **Step 3.7 (`T5.4` - Owner 3 - 4j):** Perbarui `useWorkoutEngine.test.ts`, `WorkoutLogger.test.tsx`, `Dashboard.test.tsx`, dan `a11y.test.tsx` (WCAG AA axe-core).
- **Step 3.8 (`T5.5` - Tech Lead - 2-3j):** Uji click-through responsif `375px / 768px / 1440px` + keyboard navigation, perbarui `.github/workflows/ci.yml` ke `npm run verify:strict` dan finalisasi `DELIVERY_GATE_REPORT.md`.

### Gerbang Kelulusan Final (Akhir Hari 3)
```bash
npm run verify:strict
```
Perintah di atas menjalankan secara berurutan:
1. `npx tsc --noEmit` (0 error)
2. `npm run test:engine` (39+ CLI tests lulus)
3. Static Audit Mode `strict` (0 temuan di seluruh 20 aturan kontrak, arsitektur, paritas bahasa, keamanan, & hygiene)
4. `npm test` (seluruh Vitest + axe-core a11y lulus)
5. `npm run build` (production bundle bersih tanpa `dist/` di-commit)
