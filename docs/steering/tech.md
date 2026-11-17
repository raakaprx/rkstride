# Technical Steering & Hard Constraints: RKStride

Dokumen ini menetapkan **aturan keras arsitektur (Hard Constraints)** untuk menghentikan inkonsistensi kontrak, duplikasi logika, kebocoran data, dan konflik kerja tim di codebase **RKStride**. Seluruh kontributor (manusia maupun AI agent) wajib mematuhi aturan ini sebelum membuat atau memodifikasi kode.

---

## 1. Satu Sumber Kontrak Skema Bersama (Single Source of Truth)

1. **Zod-First Schema Ownership**:
   - Seluruh kontrak data domain, database lokal, payload backup/impor, dan payload AI/Proxy **WAJIB** didefinisikan hanya di direktori `src/contracts/` (target migrasi terpusat dari `src/types/` dan `src/lib/db/exportImport.ts`).
   - Tipe TypeScript **WAJIB** diturunkan langsung menggunakan `z.infer<typeof Schema>` dan dilarang menulis ulang `interface` terpisah untuk entitas yang sama.
2. **Dilarang Memperlemah Enum & Field**:
   - Enum seperti `WorkoutCategory` (12 literal), `RunningType` (7 literal), `ACWRStatus`, `NutritionGoal`, `DailyActivityLevel`, dan `RaceCategory` wajib divalidasi dengan `z.enum(...)` di skema kontrak, **dilarang** memakai `z.string()` di skema validasi impor/export.
   - Setiap field yang disimpan ke `RKStrideDB` (mis. `UserProfile.gender`, `RunSession.thresholdPace`, `RunningIntervalBlock.targetBpmRange`) wajib tercantum di skema Zod agar tidak pernah ter-strip saat proses ekspor/impor.
3. **Zero `as any` & Type Cast Bypass**:
   - Dilarang keras memakai `as any` untuk menulis atau membaca data dari Dexie (`db.*.put(data as any)`) maupun membaca properti profil di UI (`(userProfile as any).gender`). Jika compiler menolak sebuah properti, perbaiki skema kontraknya.
4. **Satu Sumber Konstanta Sains**:
   - Seluruh angka empiris dan rumus wajib berasal dari `src/lib/engine/constants.ts` dan fungsi di `src/lib/engine/`. Komponen UI dilarang mendefinisikan ulang rumus matematika atau menulis teks formula yang berbeda dari `constants.ts`.

---

## 2. Arsitektur Berlapis: UI Tipis vs Hooks/Service vs Pure Engine

Untuk mencegah file monolitik seperti `App.tsx` dan `WorkoutLogger.tsx` (1.585 baris), codebase dibagi menjadi 4 lapisan ketat dengan arah dependensi satu arah (`UI -> Hooks/App Services -> Repository & Pure Engine -> Contracts`):

1. **Lapisan Contracts (`src/contracts/` & `src/types/`)**:
   - Hanya berisi skema Zod, tipe inferensi, dan helper parsing/validasi murni. Nol side effect.
2. **Lapisan Pure Engine (`src/lib/engine/`)**:
   - **Thin Service / Pure Functions Only**: Dilarang mengimpor React, `db` (Dexie), `window`, `localStorage`, atau DOM API.
   - Modul engine wajib dipisah per sub-domain (target pemecahan `workload.ts` 999 baris): `hrZones.ts`, `loadMetrics.ts`, `acwr.ts`, `guardrail.ts`, `readiness.ts`, `strength1rm.ts`, `nutrition.ts`, `periodization.ts`, `doubleProgression.ts`, `smartwatch.ts`.
3. **Lapisan Repository / Data Access (`src/lib/db/`)**:
   - **Satu-satunya gerbang ke Dexie (`RKStrideDB`) dan `localStorage`**.
   - **Hard Rule**: Komponen UI (`src/components/**` dan `src/App.tsx`) **DILARANG** mengimpor `db` dari `database.ts` atau memanggil `localStorage` secara langsung. Semua pembacaan/penulisan persisten wajib melalui fungsi repository/service yang tervalidasi.
4. **Lapisan Presentasi / Controller Tipis (`src/components/**` & `src/App.tsx`)**:
   - Komponen UI hanya menangani rendering, state visual sementara (mis. tab aktif, modal terbuka, input form yang belum disubmit), dan memanggil aksi dari hook/service.
   - **Hard Rule**: Dilarang menghitung skor beban, rolling ACWR, rasio proyeksi, atau parsing markdown kompleks langsung di dalam body JSX komponen UI; pindahkan ke helper/engine yang dapat diuji unit test terpisah.
   - Komponen besar wajib dipecah: tidak ada komponen tunggal yang boleh melebihi ~300-400 baris.

---

## 3. Standar Transaksi Database & Integritas Data

1. **Transaksi Atomik Wajib untuk Operasi Lintas-Tabel**:
   - Setiap operasi yang memodifikasi lebih dari satu store Dexie (contoh: simpan workout + debrief; simpan profil + target lomba; impor backup + reset data) **WAJIB** dibungkus dalam `await db.transaction('rw', [tabel1, tabel2, ...], async () => { ... })`.
2. **Sinkronisasi State UI dengan Hasil Persisten**:
   - Dilarang pola *optimistic update* diam-diam dengan `.catch(console.error)` tanpa pemulihan. Mutasi state React (`setHistory`, `setUserProfile`, dll.) harus menunggu konfirmasi tulis IndexedDB atau melakukan rollback serta menampilkan banner error inline (`dbError`) jika transaksi gagal.
   - Fungsi `reloadFromDb()` wajib menyinkronkan **seluruh** state persisten (`history`, `todayReadiness`, `readinessHistory`, `weeklySchedule`, `userProfile`, `raceConfig`, `debriefData`), termasuk mereset state menjadi kosong (`[]` / default bersih) ketika tabel di database kosong setelah *wipe*.
3. **Anti-Overwrite & Multi-Sesi Harian**:
   - Log latihan harian tidak boleh menimpa sesi yang sudah tercatat di hari yang sama secara destruktif. Desain target menyimpan daftar sesi teridentifikasi per tanggal sehingga sesi pagi dan sesi sore dapat hidup berdampingan serta dapat diedit/dihapus per sesi.
4. **Standar Tanggal Lokal (Anti-UTC Drift)**:
   - Dilarang memakai `new Date().toISOString().split('T')[0]` untuk membentuk kunci tanggal hari ini (`YYYY-MM-DD`). Wajib menggunakan satu helper terpusat `getLocalDateKey(date?: Date)` berbasis tahun/bulan/tanggal lokal perangkat.
5. **Sinkronisasi Versi Skema & Migrasi**:
   - Setiap penambahan tabel/index Dexie wajib menaikkan `version(N)` dengan handler `.upgrade()`, memperbarui `exportImport.ts` agar mencakup tabel tersebut (termasuk dalam `wipeBeforeImport`), dan menyamakan nomor `version` payload backup.

---

## 4. Standar Keamanan, Privasi, & Validasi Eksternal

1. **Gerbang AI Berlapis di Semua Mode**:
   - `checkMedicalRedFlags()` dan `isQueryInSportsDomain()` wajib dieksekusi di pintu masuk `askGeminiCoach()` untuk **semua mode** (`byok`, `proxy`, dan `offline`), bukan hanya saat offline.
   - Ringkasan konteks atlet (`AthleteContext`) dilarang keras mengirim angka tebakan/hardcoded (seperti `strengthExercisesCount: 3` atau estimasi `runningKm` dari menit strength).
2. **Proteksi Kredensial & Ekspor Backup**:
   - Kunci API BYOK (`byokApiKey`) dilarang masuk ke file ekspor JSON secara default. Jika fitur ekspor konfigurasi ditambahkan, wajib memakai toggle opt-in eksplisit (default `false`) dengan peringatan keamanan yang jelas.
   - Variabel `VITE_GEMINI_API_KEY` tidak boleh pernah diisi di `.env` produksi atau di-commit ke Git.
3. **Validasi Panggilan Jaringan & File Eksternal**:
   - Panggilan `fetch` ke `proxyUrl` wajib memvalidasi URL (`https:` atau `http://localhost`), menetapkan timeout dengan `AbortController`, dan memvalidasi JSON balasan dengan skema Zod.
   - Parser file smartwatch dilarang keras melakukan *silent fallback* ke angka dummy untuk format file yang belum didukung (`.fit`, `.gpx`, `.tcx` jika belum ada parser nyata wajib melempar error terstruktur ke UI).

---

## 5. Konvensi Penamaan, Styling, & Manajemen Git

### 5.1 Konvensi Penamaan
- **File Komponen & Modal React**: `PascalCase.tsx` (contoh: `WorkoutLogger.tsx`, `GuardrailOverrideModal.tsx`).
- **File Engine, Repository, Hook, & Skema**: `camelCase.ts` dengan suffix jelas (`*.schema.ts`, `*.repo.ts`, `use*.ts`, `*.test.ts`).
- **Identifier TypeScript & Data**: `camelCase` Bahasa Inggris untuk seluruh field baru (`date`, `exerciseName`, `weightKg`). Nama komponen/fungsi menggunakan kata kerja/benda deskriptif domain.
- **Konstanta Global**: `UPPER_SNAKE_CASE` hanya di `src/lib/engine/constants.ts`.

### 5.2 Aturan Styling & UI
- Semua warna, radius, bayangan, spacing, font, dan z-index wajib merujuk token CSS di [src/styles/tokens.css](../../src/styles/tokens.css). Nol literal hex di `src/components/**` dan `src/App.tsx`.
- Fitur baru tidak boleh menambah rule override `!important` di [src/styles/mobile.css](../../src/styles/mobile.css); komponen baru/refactor bertahap harus memakai class CSS modular agar tidak memicu pengeditan massal di 10+ file saat penyesuaian mobile.
- Seluruh modal wajib menggunakan primitif [src/components/ui/Modal.tsx](../../src/components/ui/Modal.tsx).

### 5.3 Kebersihan Git & Artefak Build
- Direktori hasil build (`dist/`) dan dependensi (`node_modules/`) **DILARANG** di-commit ke Git (pastikan tetap terabaikan di `.gitignore`).
- File artefak uji atau data mock lama yang tidak dipakai (seperti `src/data/mockWorkoutHistory.ts`) harus dipindahkan hanya ke `src/test/fixtures/` jika dibutuhkan oleh test, bukan di `src/data/` produksi.

---

## 6. Pembagian Kepemilikan Folder & Strategi Branch per Programmer

Untuk menghilangkan konflik merge pada hotspot (`App.tsx`, `WorkoutLogger.tsx`, `workload.ts`, `useWorkoutEngine.ts`), kepemilikan modul dibagi per tim/programmer sebagai berikut:

| Owner / Squad | Kepemilikan Folder & Modul | Tanggung Jawab Utama | Dilarang Menyentuh Langsung Tanpa Review Owner Lain |
|---|---|---|---|
| **Owner 1: Core Engine & Contracts** | `src/contracts/**`, `src/types/**`, `src/lib/engine/**` (kecuali `smartwatch.ts`), `scripts/test-engine.ts`, `docs/science.md` | Skema Zod tunggal, konstanta sains, algoritma ACWR/sRPE/TRIMP/Guardrail/Readiness/Nutrisi/Periodisasi/1RM, unit & property tests. | `src/components/**`, `src/App.tsx`, `src/styles/**` |
| **Owner 2: Local DB, Persistence & Device Bridge** | `src/lib/db/**`, `src/lib/engine/smartwatch.ts`, `src/lib/platform/**`, `public/sw.js` | Skema Dexie & migrasi, transaksi atomik, `exportImport.ts`, helper tanggal lokal, Web Bluetooth, dan parser file aktivitas valid. | Komponen visual di `src/components/**` (kecuali kontrak props yang disepakati) |
| **Owner 3: Training & Program UI** | `src/components/logger/**` (pecahan `WorkoutLogger`), `src/components/ScheduleCustomizer.tsx`, `src/components/GuardrailOverrideModal.tsx`, `src/components/PostWorkoutDebriefModal.tsx`, `src/data/**` | Alur input kekuatan/lari, timer istirahat, double progression UI, editor jadwal mingguan, dan modal override/debrief. | Logika rumus di `src/lib/engine/**`, DB call langsung |
| **Owner 4: Analytics, Nutrition & AI Coach** | `src/components/WorkloadAdvisorCard.tsx`, `src/components/TrendsDashboardCard.tsx`, `src/components/NutritionBodyCompCard.tsx`, `src/components/PeriodizationTaperCard.tsx`, `src/components/SmartwatchSyncCard.tsx`, `src/components/GeminiCoachWidget.tsx`, `src/lib/ai/**` | Grafik tren, advisor ACWR, kalkulator nutrisi & taper UI, UI sinkronisasi device/check-in, dan chat `rkbot`. | Logika engine inti, skema Dexie langsung |
| **Shared Shell (Review Bersama / Tech Lead)** | `src/App.tsx`, `src/hooks/**`, `src/components/HeaderNavbar.tsx`, `src/components/BottomNav.tsx`, `src/components/ui/**`, `src/styles/**`, `AGENTS.md`, `docs/**` | Shell navigasi, state provider per domain, komponen UI primitif, dan token desain. Perubahan di area ini wajib PR kecil terpisah. | (Koordinasi lintas tim) |

### Aturan Branch & Merge Workflow
1. **Format Nama Branch**:
   - Fitur: `feat/<owner-domain>/<deskripsi-singkat>` (mis. `feat/engine/zod-single-contracts`, `feat/logger/multi-session-day`)
   - Perbaikan Bug: `fix/<owner-domain>/<deskripsi-singkat>` (mis. `fix/db/local-date-timezone`)
   - Refactoring: `refactor/<owner-domain>/<deskripsi-singkat>`
   - Dokumentasi: `docs/<topik>`
2. **Aturan Anti-Konflik**:
   - Satu PR idealnya hanya menyentuh folder milik satu Owner. Jika butuh mengubah kontrak atau shell (`src/contracts/**` atau `src/App.tsx`), pisahkan menjadi PR kontrak/shell kecil terlebih dahulu sebelum PR fitur UI berjalan paralel.
   - Target pemecahan wajib sebelum pengembangan fitur baru paralel: pecah `WorkoutLogger.tsx` ke folder `src/components/logger/`, pecah `workload.ts` ke sub-modul di `src/lib/engine/`, dan pecah `useWorkoutEngine.ts` menjadi hook per domain di `src/hooks/`.
3. **Gerbang Wajib Sebelum Merge (CI Gate)**:
   - `npx tsc --noEmit` (0 error)
   - `npm test` (seluruh Vitest + axe-core a11y lolos)
   - `npm run test:engine` (39+ CLI sports science tests lolos)
   - `npm run build` (produksi sukses tanpa artefak `dist/` di-commit)
