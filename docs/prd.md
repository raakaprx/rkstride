# Product Requirements Document (PRD): RKStride

**Versi Dokumen:** 1.0 (Baseline Resmi Pengganti Konsep Awal)  
**Nama Produk:** RKStride (nama paket teknis: `pulse-hybrid-athletics`)  
**Arsitektur Saat Ini:** Offline-First Client-Side SPA (Vite 6 + React 19 + TypeScript Strict + Dexie IndexedDB)  
**Referensi Terkait:** [docs/glosarium.md](glosarium.md), [docs/steering/tech.md](steering/tech.md), [docs/science.md](science.md), [DESIGN.md](../DESIGN.md)

---

## 1. Visi, Lingkup, dan Batasan Non-Medis

**RKStride** adalah platform manajemen beban latihan atletik hibrida (*hybrid athletics*) yang mengintegrasikan latihan kekuatan berbasis **Push-Pull-Legs (PPL)** dengan lari ketahanan (**Endurance Running**).

### Batasan Resmi (Non-Medical Boundary)
- RKStride adalah **alat bantu pengambilan keputusan latihan (*decision-support tool*)**, bukan perangkat medis, bukan layanan telemedis, dan bukan pengganti diagnosis dokter atau fisioterapis.
- Seluruh metrik (ACWR, sRPE, Edwards TRIMP, Bio-Readiness, dan estimasi kalori/nutrisi) adalah **indikator beban mekanis dan fisiologis**, bukan jaminan pencegahan cedera.
- Tidak ada angka fabrikasi atau data dummy yang boleh ditampilkan sebagai data nyata pengguna.

---

## 2. Definisi Resmi Aktor (Peran Pengguna & Sistem)

Saat ini RKStride beroperasi sebagai aplikasi *single-tenant local-first* di peramban perangkat pengguna. Empat aktor resmi yang diakui sistem adalah:

| ID Aktor | Nama Peran | Deskripsi & Tanggung Jawab | Hak Akses & Batasan |
|---|---|---|---|
| **ACT-01** | **Atlet Hibrida (Primary User)** | Pengguna utama yang mengisi profil fisiologi, target lomba, check-in kesiapan pagi, jadwal mingguan, dan log latihan kekuatan/lari. | Akses penuh baca/tulis/ekspor/hapus terhadap seluruh data lokal di perangkatnya sendiri (`RKStrideDB` dan `localStorage`). |
| **ACT-02** | **Sensor / Perangkat Biometrik (External Telemetry)** | Smartwatch atau *heart rate strap* yang terhubung via Web Bluetooth GATT (`0x180D`) atau file ekspor aktivitas. | Hanya dapat memasok telemetri HR langsung dan file impor; tidak boleh menulis langsung ke log latihan tanpa konfirmasi/parsing valid. |
| **ACT-03** | **AI Athletic Coach (`rkbot`)** | Asisten konsultasi latihan berbasis aturan sains olahraga (lokal offline) atau LLM eksternal (BYOK Gemini API / Thin Proxy opsional). | Hanya menerima konteks telemetri teragregasi jika `sendTelemetry = true`. Wajib tunduk pada *Medical Red-Flag Interception* dan *Domain Scope Guard*. Tidak memiliki akses tulis langsung ke database. |
| **ACT-04** | **Maintainer / Developer** | Tim pengembang yang menjaga skema kontrak, mesin komputasi, UI, dan pipeline verifikasi CI. | Tidak memiliki akses jarak jauh ke data atlet (privasi 100% lokal). Perubahan kode wajib melewati gerbang kontrak dan test CI. |

> **Catatan Ruang Lingkup:** Peran *Coach Manusia (Multi-User Portal)* dan *Admin Backend* **belum termasuk** dalam arsitektur rilis saat ini karena sistem belum memiliki server backend dan sistem autentikasi multi-pengguna.

---

## 3. Alur Bisnis End-to-End yang Benar

Bagian ini menetapkan alur resmi dari ujung ke ujung, termasuk perbaikan terhadap celah alur yang ditemukan pada audit codebase:

### Alur 1: Onboarding & Kalibrasi Awal
1. Pengguna baru membuka aplikasi -> sistem menjalankan inisialisasi schema Dexie (`RKStrideDB`) tanpa menanam data workout/readiness palsu.
2. Jika persetujuan non-medis (`disclaimerAccepted`) belum aktif -> tampilkan **OnboardingDisclaimerModal** (wajib centang persetujuan eksplisit).
3. Pengguna mengisi/mengubah **Profil Fisiologi** (`age`, `weightKg`, `heightCm`, `gender`, `restingHrBaseline`, `hrMaxFormula`, dan input `maxHr` manual jika memilih `custom`) serta **Target Kompetisi** (`RaceTargetConfig`) dalam satu aksi simpan atomik.
4. Sistem memastikan `weeklySchedule` (7 hari, Senin sampai Minggu) tersedia dan langsung menyinkronkan profil + target lomba ke seluruh modul (HR Karvonen, Nutrisi, Periodisasi).

### Alur 2: Daily Check-In & Sinkronisasi Biometrik
1. Pada tab **Coach / Perangkat** (atau modul biometrik pagi), atlet mengisi atau menyinkronkan kesiapan harian: `sleepHours`, `restingHeartRate`, `muscleSoreness` (1-5), `legFatigue`, `energyLevel`, `hrvRmssd` (opsional), serta `tendonJointPain` (0-3) dan `tendonPainArea` (opsional).
2. Jika menggunakan **Web Bluetooth BLE**, status device aktif mencatat detak jantung langsung ke state sesi.
3. Jika mengimpor **file aktivitas/kesehatan**, parser memvalidasi format secara ketat:
   - Format yang didukung penuh (`.json`, `.csv`) diparsing dan mengisi kesiapan + opsi mengimpor sesi latihan terdeteksi.
   - Format biner/XML yang belum memiliki parser nyata (`.fit`, `.gpx`, `.tcx` sebelum parser tersedia) **wajib ditolak dengan pesan error eksplisit**, dilarang jatuh diam-diam ke nilai default hardcoded.
4. Preset simulasi smartwatch hanya boleh dipakai dengan label eksplisit status simulasi (`simulated_preset`) agar tidak tersamar sebagai pengukuran perangkat asli.
5. Engine `calculateReadinessScore()` wajib menerima riwayat 14-28 hari dari `dailyReadiness` agar transisi dari `provisional` (< 7 hari) ke `calibrated` (Z-Score personal) benar-benar berjalan.

### Alur 3: Perencanaan Jadwal -> Eksekusi & Pencatatan Latihan (Plan-to-Log)
1. Di tab **Program**, atlet memilih template atau menyunting jadwal per hari (`ScheduledDay` berdasarkan `dayIndex` `0..6` untuk seluruh 12 `WorkoutCategory`).
2. `auditWeeklySchedule()` mengevaluasi seluruh jadwal 7 hari terhadap aturan bidirectional guardrail dan kepadatan kardio (3 hari lari berturut-turut).
3. Di tab **Hari Ini**, sistem menampilkan:
   - **PeriodizationTaperCard** (jika `raceConfig.category !== 'none'`),
   - **WorkloadAdvisorCard** (ACWR saat ini, status *cold-start* jika `< 21` hari, bio-readiness, jendela pemulihan kaki 48 jam, dan *Smart Daily Prescription* yang mempertimbangkan sesi lari terencana besok),
   - **WorkoutLogger** yang dapat menginisialisasi draf dari jadwal hari ini (atau manual) serta mendukung pemilihan tanggal sesi (zona waktu lokal `YYYY-MM-DD`).
4. Saat atlet menyusun set strength dan/atau sesi lari:
   - Sistem menghitung **Double Progression** per latihan secara real-time dan menyediakan **Rest Timer** dengan audio cue.
   - `calculateProjectedImpact()` memproyeksikan beban sesi + proyeksi ACWR **dengan menghormati Cold-Start Guard (< 21 hari)**.
5. Saat atlet menekan **Simpan Sesi**:
   - Jika terjadi konflik jendela pemulihan kaki (`legConflict`) dan override belum dikonfirmasi -> tampilkan **GuardrailOverrideModal** (advisory, tidak memblokir keras, wajib centang kesadaran risiko).
   - Simpan sesi secara **non-destruktif** (menambah/menggabungkan sesi pada tanggal target lokal `YYYY-MM-DD`, mendukung multi-sesi AM/PM dalam satu hari, dan menghitung `sRpe`, `trimp`, `volumeLoadSecondary`, `runningTrimpSecondary`).
   - Dalam **satu transaksi atomik**, simpan `workoutLogs` dan `postWorkoutDebrief`, lalu tampilkan **PostWorkoutDebriefModal**.

### Alur 4: Evaluasi Tren, Nutrisi, & Periodisasi Terintegrasi
1. Di tab **Beban**, `TrendsDashboardCard` menampilkan grafik longitudinal 28 hari dan pilihan metode ACWR (`rolling_coupled`, `rolling_uncoupled`, `ewma`).
2. Di tab **Nutrisi**, `NutritionBodyCompCard` menghitung BMR, TDEE, protein, karbohidrat, lemak, dan hidrasi menggunakan **agregat durasi & beban latihan tanggal hari ini** dari `workoutLogs` (bukan sisa debrief hari sebelumnya), serta mempersist pilihan `goal` dan `activityLevel` di `appSettings`.

### Alur 5: Konsultasi AI Coach (`rkbot`) dengan Keamanan Berlapis
1. Atlet membuka widget **rkbot** atau memicu prompt dari *Post-Workout Debrief*.
2. **Gerbang 1 (Medical Red-Flag Interception)**: Deteksi keluhan darurat (nyeri dada, sesak napas, pingsan, dugaan fraktur/robek ligamen). Jika positif, hentikan konsultasi AI dan tampilkan rujukan medis darurat.
3. **Gerbang 2 (Domain Scope Guard)**: Validasi ruang lingkup olahraga/latihan/nutrisi **berlaku di semua mode** (BYOK, Proxy, maupun Offline) sebelum mengirim request jaringan.
4. **Gerbang 3 (Telemetry Privacy Gate)**: Konteks atlet yang dikirim adalah ringkasan teragregasi aktual (bukan angka tebakan/hardcoded), dan dikosongkan total jika `sendTelemetry === false`.
5. **Gerbang 4 (Dispatch & Fallback)**: Jika Proxy atau BYOK gagal/timeout/tanpa kunci, sistem fallback ke mesin offline lokal deterministik.

### Alur 6: Portabilitas Data (Backup & Restore)
1. Di modal **Manajemen Data**, atlet dapat mengekspor riwayat ke **CSV** atau cadangan penuh ke **JSON**.
2. Ekspor JSON **tidak menyertakan `byokApiKey` secara default** kecuali pengguna memilih opsi eksplisit dengan peringatan keamanan.
3. Impor JSON divalidasi penuh oleh skema **Zod** tunggal (`RKStrideExportPayloadSchema`), lalu dieksekusi dalam **satu transaksi atomik** mencakup seluruh tabel (termasuk `postWorkoutDebrief`) dalam mode *merge* atau *replace*, diikuti reload seluruh state aplikasi (`history`, `readiness`, `schedule`, `profile`, `raceConfig`, `debrief`).

---

## 4. Status Kanonikal Resmi Sistem

Seluruh layer (TypeScript, Zod, Dexie DB, Engine, dan UI) **wajib** memakai status kanonikal berikut tanpa menciptakan varian status liar:

### 4.1 Status ACWR (`ACWRStatus`)
| Nilai Kanonikal | Kondisi Matematis | Makna Bisnis | Perlakuan UI |
|---|---|---|---|
| `insufficient_data` | `daysCollected < 21` | Masa pengumpulan baseline (*Cold-Start*) | Tampilkan progres `N/21 hari`; larang peringatan danger semu |
| `undertraining` | `daysCollected >= 21` & `ratio < 0.8` | Stimulus ringan / risiko detraining | Aksen volt/info; sarankan progressive overload aman (+5%) |
| `sweet_spot` | `daysCollected >= 21` & `0.8 <= ratio <= 1.4` | Zona adaptasi optimal | Aksen hijau (`--color-success`); pertahankan progresi |
| `danger` | `daysCollected >= 21` & `ratio > 1.4` | Lonjakan beban akut berisiko overload | Aksen merah (`--color-danger`); banner warning + deload (-20% s.d. -40%) |

> **Aturan Pembersihan:** Status `'warning'` dinyatakan **DEPRECATED** dan dilarang dipakai untuk logika baru karena ambang batas guardrail resmi adalah batas tunggal `1.4`.

### 4.2 Status Guardrail Interferensi (`GuardrailLevel`)
| Nilai Kanonikal | Kondisi | Sifat |
|---|---|---|
| `none` | Bebas konflik, atau lari aerobik Zone 1-2 `<= 45` menit (*Recovery Exemption*) | Diizinkan langsung |
| `caution` | Dalam jendela pemulihan (`< 48h` legs -> fast run atau `< 24h` fast run -> legs), kelelahan rendah-sedang | Peringatan lunak; bisa override |
| `high_risk` | Dalam jendela pemulihan + indikator kelelahan tinggi (`legFatigue`, `muscleSoreness >= 4`, atau `readinessScore < 50/55`) | Peringatan risiko tinggi; tetap advisory dengan konfirmasi override eksplisit |

### 4.3 Status Periodisasi Lomba (`PeriodizationPhase`)
`base` -> `build` -> `peak` -> `taper` -> `race_week` -> `recovery` (berdasarkan `daysToRace` dan kategori lomba).

### 4.4 Status Kalibrasi Kesiapan (`ReadinessCalibrationStatus`)
- `provisional`: Riwayat `dailyReadiness < 7` hari (memakai heuristik populasi).
- `calibrated`: Riwayat `dailyReadiness >= 7` hari (menggunakan Z-Score baseline personal; kematangan penuh pada `>= 14` hari).

### 4.5 Status Koneksi Perangkat (`SmartwatchSource`)
- `disconnected`: Belum terhubung dan belum ada impor/preset.
- `bluetooth`: Terhubung ke GATT HR `0x180D` aktif.
- `file_export`: Data berasal dari impor file tervalidasi.
- `manual_sync`: Input manual *Quick Morning Check-In*.
- `preset`: Data simulasi demo (wajib berlabel `[SIMULASI]` di UI).

---

## 5. Kriteria Penerimaan & Non-Fungsional Wajib

1. **Kejujuran Data**: Tidak boleh ada angka kesehatan, HR, kalori, atau jarak yang dikarang saat tidak ada pengukuran.
2. **Offline-First**: Seluruh fungsi inti (logging, ACWR, jadwal, nutrisi, backup/restore, offline coach) wajib berfungsi tanpa koneksi internet.
3. **Aksesibilitas & Mobile**: WCAG AA (kontras minimum 4.5:1 teks normal), navigasi keyboard penuh (focus trap modal + Escape), target sentuh minimum `44px`, dan bebas *horizontal overflow* dari `375px` hingga `1440px`.
4. **Kualitas Kode & Verifikasi**: Setiap fitur dinyatakan selesai hanya jika `tsc --noEmit`, `npm test`, `npm run test:engine`, dan `npm run build` lulus tanpa error.
