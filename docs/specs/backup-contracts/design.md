# Design Specification: `backup-contracts`

**Modul:** Single Source of Truth Contracts (Zod), Profile Persistence, & Data Backup/Restore  
**Referensi:** [requirements.md](requirements.md), [docs/steering/tech.md](../../steering/tech.md)

---

## 1. Arsitektur Kontrak Terpusat (`src/contracts/`)

Seluruh definisi di `src/types/*` dan `src/lib/db/exportImport.ts` dikonsolidasikan ke `src/contracts/` (dengan `src/types/` dapat sementara melakukan re-export selama transisi agar impor lama tidak langsung putus):

1. `src/contracts/workout.schema.ts`:
   - `WorkoutCategorySchema = z.enum(['push', 'pull', 'legs', 'arms', 'core', 'run_recovery', 'run_easy', 'run_tempo', 'run_long', 'run_intervals', 'norwegian_4x4', 'mobility_recovery'])`
   - `RunningTypeSchema = z.enum(['recovery', 'easy', 'tempo', 'norwegian_4x4', 'intervals', 'long_run', 'strides'])`
   - `ACWRStatusSchema = z.enum(['insufficient_data', 'undertraining', 'sweet_spot', 'danger'])`
   - `RunningIntervalBlockSchema`: sertakan `targetBpmRange: z.object({ min: z.number(), max: z.number() }).optional()`.
   - `RunSessionSchema`: gunakan `RunningTypeSchema.optional()`, sertakan `thresholdPace: z.number().positive().optional()`.
   - `StrengthExerciseSchema`: gunakan `WorkoutCategorySchema.optional()`.
   - `DailyLogSchema`: sertakan `sessions: z.array(WorkoutSessionEntrySchema).optional()` (wajib di v3).
2. `src/contracts/profile.schema.ts`:
   - `UserProfileSchema`: tambahkan `gender: z.enum(['male', 'female']).default('male')`, `maxHr: z.number().int().min(100).max(230).optional()`.
   - `RaceTargetConfigSchema`: eventName, category (`RaceCategorySchema`), raceDate, targetTimeMinutes?, priority?.
   - `NutritionPrefsSchema`: `goal`, `activityLevel`.
3. `src/contracts/backup.schema.ts`:
   - `StoredDebriefSchema`
   - `AiCoachPublicConfigSchema` (mode, proxyUrl, sendTelemetry; **tanpa `byokApiKey` pada default export**).
   - `RKStrideExportPayloadSchema`: `version: z.literal(3)` (atau didukung migrasi v1/v2 -> v3 saat impor!), mencakup `postWorkoutDebrief: StoredDebriefSchema.nullable().optional()`.

---

## 2. Perubahan Skema Database & Repository (`src/lib/db/`)

### 2.1 Dexie `RKStrideDatabase` (`version(3)`)
- **Upgrade v2 -> v3**:
  - Tambahkan field `gender: 'male'` pada row `userProfile` lama jika belum ada; pindahkan `targetRace*` yang sempat terselip di `userProfile` ke `appSettings ('targetRaceConfig')` bila belum ada, lalu bersihkan properti liar dari `userProfile`.
  - Sinkronkan `exportDatabaseToJson()` agar mengembalikan `version: 3` (atau mengikuti konstanta `CURRENT_SCHEMA_VERSION`).
- **Kompatibilitas Impor Backup Lama (v1/v2)**:
  - Saat `importDatabaseFromJson()` menerima backup `version: 1` atau `2`, jalankan fungsi normalizer terpadu sebelum menulis ke Dexie v3 agar backup lama pengguna tetap dapat dipulihkan tanpa korupsi.

### 2.2 Repository Profile & App Settings (`src/lib/db/profileRepo.ts`)
```ts
export interface SaveProfileAndRaceInput {
  profile: UserProfile;
  raceConfig?: RaceTargetConfig;
}

export async function loadProfileAndRace(): Promise<{
  profile: UserProfile | null;
  raceConfig: RaceTargetConfig | null;
}>;

// Transaksi atomik 2 tabel: db.userProfile + db.appSettings
export async function saveProfileAndRaceAtomic(
  input: SaveProfileAndRaceInput
): Promise<{ profile: UserProfile; raceConfig?: RaceTargetConfig }>;
```

### 2.3 API Ekspor/Impor Baru (`src/lib/db/exportImport.ts`)
```ts
export interface ExportOptions {
  includeAiConfig?: boolean;      // default: true (hanya mode, proxyUrl, sendTelemetry)
  includeSensitiveApiKey?: boolean; // default: false (WAJIB opt-in eksplisit)
}

export async function exportDatabaseToJson(options?: ExportOptions): Promise<string>;
```
- `db.transaction('rw', [db.workoutLogs, db.dailyReadiness, db.userProfile, db.weeklySchedule, db.appSettings, db.postWorkoutDebrief], ...)` wajib mencakup `db.postWorkoutDebrief`.

---

## 3. Penyimpangan Kode Lama & Rencana Refactor

| Lokasi Kode Lama | Penyimpangan Aktual | Refactor Target |
|---|---|---|
| [src/types/workout.ts](../../../src/types/workout.ts) & [src/lib/db/exportImport.ts](../../../src/lib/db/exportImport.ts#L18-L113) | Kontrak data diduplikasi di dua tempat; Zod melemahkan enum jadi `z.string()`, menghilangkan `gender`, `thresholdPace`, `targetBpmRange`, dan `postWorkoutDebrief`. | Konsolidasikan ke `src/contracts/*.schema.ts` dan turunkan semua tipe TS dengan `z.infer`. |
| [src/lib/db/exportImport.ts](../../../src/lib/db/exportImport.ts#L136,L143,L276-L282) | `exportDatabaseToJson` menuliskan `version: 1` (padahal Dexie v2), mengekspor `byokApiKey` plaintext secara default, dan `importDatabaseFromJson` tidak me-wipe/impor `postWorkoutDebrief`. | Tambahkan `ExportOptions` (default tanpa `byokApiKey`), sertakan `postWorkoutDebrief` dalam transaksi & wipe, dan selaraskan versi + migrasi v1/v2. |
| [src/components/OnboardingProfileModal.tsx](../../../src/components/OnboardingProfileModal.tsx#L20,L41-L48,L72-L87,L313-L338) | Memakai `as any` pada `db.userProfile.put`; tidak memuat `targetRaceConfig` dari `appSettings`; tidak menyediakan input `maxHr` saat memilih `custom`; memanggil `db.*` langsung dari komponen UI tanpa transaksi atomik. | Panggil `loadProfileAndRace()` dan `saveProfileAndRaceAtomic()`; tambah field input `maxHr` kondisional saat `hrMaxFormula === 'custom'`. |
| [src/components/NutritionBodyCompCard.tsx](../../../src/components/NutritionBodyCompCard.tsx#L29) | Membaca `(userProfile as any).gender` karena `gender` absen dari kontrak `UserProfile`. | Hapus `as any` setelah `gender` resmi masuk `UserProfileSchema`. |
| [src/hooks/useWorkoutEngine.ts](../../../src/hooks/useWorkoutEngine.ts#L49-L71) & [src/App.tsx](../../../src/App.tsx#L318-L320) | `reloadFromDb()` hanya mengupdate `history` jika `logs.length > 0` (tidak reset saat kosong) dan tidak me-reload `userProfile`, `raceConfig`, maupun `debriefData`. | Perluas `reloadFromDb()` (atau hook domain terpadu) agar mereset dan memuat ulang seluruh 6 store Dexie secara konsisten setelah impor/wipe. |
