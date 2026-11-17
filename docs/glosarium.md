# Glosarium & Kamus Domain Resmi: RKStride

Dokumen ini adalah sumber kebenaran tunggal untuk istilah bisnis, singkatan fisiologi olahraga, konvensi nama entitas, format ID/penomoran, dan penyeragaman rumus di seluruh codebase **RKStride**.

---

## 1. Identitas Produk & Istilah Sistem

| Istilah Resmi | Konteks Penggunaan | Catatan & Status |
|---|---|---|
| **RKStride** | Nama merek resmi di UI, dokumentasi, judul HTML, manifest PWA, dan `RKStrideDB`. | Nama kanonikal produk. |
| **pulse-hybrid-athletics** | Nama teknis package di `package.json` (`name`). | Dipertahankan untuk kompatibilitas repo/CI; jangan gunakan "PULSE" di teks UI baru. |
| **rkbot** | Persona resmi AI Athletic Coach di `GeminiCoachWidget` dan `geminiCoach.ts`. | Tidak boleh menyebut nama model/vendor LLM ke pengguna akhir. |
| **Atlet Hibrida** | Pengguna yang menggabungkan latihan beban (*Push-Pull-Legs*) dan lari ketahanan (*Endurance Running*) dalam siklus mingguan yang sama. | Aktor utama (`ACT-01`). |

---

## 2. Glosarium Sports Science & Logika Bisnis

| Istilah / Singkatan | Definisi Resmi | Rumus / Aturan Baku |
|---|---|---|
| **sRPE (Session RPE)** | Metrik beban internal universal (Foster et al., 2001) untuk menyatukan sesi kekuatan dan kardio dalam satuan poin beban (*Arbitrary Units* / `pts`). | `Durasi (menit) × RPE (1..10)`. Untuk strength tanpa durasi eksplisit, estimasi baku adalah `2.5 menit/set`. |
| **Volume Load (Strength)** | Metrik beban eksternal sekunder khusus latihan kekuatan. | `sum(bebanKg × reps)` untuk seluruh set kerja non-warmup. Satuan: `kg` (bukan `pts`). |
| **Edwards TRIMP** | Metrik beban kardio sekunder berbasis waktu di 5 zona detak jantung (Edwards, 1993). | `sum(durasiMenit_z × bobot_z)` dengan bobot baku **Z1=1.0, Z2=2.0, Z3=3.0, Z4=4.0, Z5=5.0**. |
| **Karvonen HRR** | Metode penentuan zona detak jantung personal berdasarkan *Heart Rate Reserve* (`HRmax - RHR`). | `Target HR = RHR + (%Intensitas × (HRmax - RHR))`. `HRmax` default memakai Tanaka (`208 - 0.7 × usia`) atau Gellish (`207 - 0.7 × usia`). |
| **ACWR** | *Acute:Chronic Workload Ratio*, rasio beban jangka pendek (7 hari, *fatigue*) terhadap kapasitas jangka panjang (28 hari atau 21 hari sebelumnya, *fitness*). | Mendukung 3 model: `rolling_coupled` (default UI saat ini), `rolling_uncoupled`, dan `ewma`. |
| **Cold-Start Guard** | Perlindungan rasio semu saat data historis belum matang. | `daysCollected < 21` wajib berstatus `insufficient_data`. |
| **Weekly Load Spike** | Kenaikan tajam total beban 7 hari berjalan dibanding 7 hari sebelumnya. | Peringatan aktif jika `((W_0 - W_1) / W_1) × 100 > 15%`. |
| **Bidirectional Soft Guardrail** | Pengaman lunak dua arah terhadap *Concurrent Training Interference* (AMPK vs mTORC1) antara latihan kaki berat dan lari cepat. Bersifat *advisory* (dapat di-override secara sadar). | **Arah 1**: Heavy Legs -> Lari Cepat (`norwegian_4x4`, `intervals`, `tempo`) dalam `< 48 jam`. **Arah 2**: Lari Cepat -> Heavy Legs dalam `< 24 jam`. |
| **Recovery Exemption** | Pengecualian mutlak pada Soft Guardrail untuk lari aerobik ringan pemulihan. | Lari `recovery` (Z1) atau `easy` (Z2) dengan `durasi <= 45 menit` selalu berstatus `level: 'none'`. |
| **Override Guardrail** | Keputusan sadar atlet untuk tetap mencatat sesi meskipun peringatan konflik pemulihan kaki aktif. | Wajib menandai sesi dengan `isOverridden = true`. |
| **Norwegian 4x4** | Protokol interval VO2 Max (Helgerud et al., 2007). | Total baku **44 menit** (10m Z2 warmup + 4×[4m Z4 + 3m Z2] + 6m Z1 cooldown), Edwards TRIMP = **114 pts**. |
| **Bio-Readiness Score** | Skor kesiapan biologis harian rentang `10..100`. | `< 7` hari memakai heuristik populasi (`provisional`); `>= 7` hari memakai Z-Score baseline personal (`calibrated`). |
| **Tendon Joint Pain** | Skala keluhan nyeri sendi/tendon pada check-in kesiapan. | Skala baku **0..3** (`0` = Tidak ada, `1` = Ringan, `2` = Terasa/Signifikan -> memicu *Tendon Alert*, `3` = Berat). |
| **Double Progression** | Model progresi beban bertahap (Helms, 2016): penuhi batas atas repetisi di semua set kerja pada rata-rata `RPE <= 8.0` sebelum menaikkan beban. | Kenaikan baku: **+2.5 kg** (Upper Body), **+5.0 kg** (Lower Body). |
| **Hard Set** | Set kerja latihan beban yang memberi stimulus hipertrofi produktif. | Set dengan `RPE >= 7.0`. |
| **Tapering** | Pengurangan volume latihan secara terencana menjelang hari lomba tanpa menurunkan intensitas (Mujika & Padilla, 2003). | Pemotongan volume fase taper/race week sebesar **30%–50%** (fase pasca-lomba `recovery` memotong 60%). |

---

## 3. Kamus Entitas Data, Format ID, & Penomoran

| Entitas / Store | Primary Key / ID | Format & Aturan Penomoran | Catatan Migrasi |
|---|---|---|---|
| `DailyLog` (`workoutLogs`) | `tanggal` (transisi ke `date`) | String `YYYY-MM-DD` berdasarkan **zona waktu lokal perangkat** (bukan UTC). | Target Dexie v3: pertahankan PK `tanggal` per hari, namun simpan array `sessions` dengan `sessionId` (`sess_<timestamp>_<rand>`) agar multi-sesi AM/PM tidak saling menimpa. |
| `StoredReadinessLog` (`dailyReadiness`) | `tanggal` | String `YYYY-MM-DD` zona waktu lokal perangkat. | Satu ringkasan check-in per tanggal. |
| `UserProfile` (`userProfile`) | `id` | String literal `'current_user'` (single-profile local). | Wajib menyertakan field `gender` (`'male' \| 'female'`) secara resmi di skema Zod & TypeScript. |
| `ScheduledDay` (`weeklySchedule`) | `dayIndex` (PK Dexie) + `id` (slug) | `dayIndex`: integer `0` (Senin) s.d. `6` (Minggu). `id`: `'sch-1'` s.d. `'sch-7'`. | Seluruh lookup di UI wajib mencari berdasarkan `dayIndex` (`.find()`), bukan indeks array. |
| `AppSettingItem` (`appSettings`) | `key` | Daftar key resmi: `'disclaimerAccepted'`, `'targetRaceConfig'`, `'nutritionPrefs'`, `'acwrMethod'`. | Dilarang menambah key acak di luar daftar resmi tanpa mendaftarkannya di glosarium & skema backup. |
| `StoredDebrief` (`postWorkoutDebrief`) | `id` | String literal `'latest'`. | Wajib masuk ke skema ekspor/impor dan transaksi `wipeBeforeImport`. |
| **Backup Payload (`RKStrideExportPayload`)** | `format` + `version` | `format: 'RKStride_Backup'`, `version`: integer positif yang **harus selalu sama** dengan versi skema Dexie aktif. | Saat ini terjadi ketidakcocokan (Dexie `v2` vs Export `v1`); wajib disinkronkan pada migrasi skema berikutnya. |

---

## 4. Resolusi Inkonsistensi Rumus & Penamaan

Tabel ini mengunci pilihan tunggal yang dianggap **SAH** apabila ditemukan perbedaan antara dokumen, UI, dan engine:

| Topik | Nilai yang SAH (Single Source of Truth) | Nilai Salah / Usang yang Harus Dihapus |
|---|---|---|
| **Batas Bahaya ACWR** | `> 1.4` (`danger`). Tidak ada zona `warning`. | `> 1.3`, `> 1.5`, atau status `'warning'` di [periodization.ts](../src/lib/engine/periodization.ts) dan UI. |
| **Estimasi Durasi Set Strength** | `2.5 menit/set` ([constants.ts](../src/lib/engine/constants.ts)). | `3 menit/set` di `WorkoutLogger.tsx` saat menghitung `debriefData`. |
| **Formula Strength Load** | Foster sRPE (`durasi × avgRPE`) untuk beban sistemik; `beban × reps` untuk Volume Load (`kg`). | Rumus `(Weight × Reps) × (RPE / 10) × 0.1` di `WorkoutLogger.tsx` (Formula Guide & Set Score). |
| **Bobot Zona & Fallback Lari** | Edwards TRIMP `1, 2, 3, 4, 5`; sRPE lari `durasiMenit × rpe`. | Bobot `1.0, 1.2, 1.5, 2.2, 3.5` dan `durasiMenit × (rpe / 2)` di `WorkoutLogger.tsx`. |
| **Skala Nyeri Tendon** | `0 \| 1 \| 2 \| 3` (ambang alert `>= 2`). | Penyebutan "skala 1-5" di `docs/science.md`. |
| **Penamaan Field Baru** | Bahasa Inggris `camelCase` (`date`, `exerciseName`, `weightKg`, `distanceKm`, `durationMinutes`). | Field campur Indonesia-Inggris pada tipe data baru. Field lama (`tanggal`, `namaGerakan`, `bebanKg`, `jarakKm`, `durasiMenit`) hanya bertahan sampai migrasi Dexie v3. |
