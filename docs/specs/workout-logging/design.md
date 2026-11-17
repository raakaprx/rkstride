# Design Specification: `workout-logging`

**Modul:** Workout Logging, Live ACWR Projection, Guardrail & Plan-to-Log Continuity  
**Referensi:** [requirements.md](requirements.md), [docs/steering/tech.md](../../steering/tech.md)

---

## 1. Arsitektur Target & Pemecahan Modul

Untuk menghentikan hotspot konflik Git pada `WorkoutLogger.tsx` (1.585 baris) dan `workload.ts` (999 baris), modul dipecah menjadi:

- **Contracts (`src/contracts/workout.schema.ts`)**: Sumber tunggal skema Zod untuk `WorkoutSessionEntry`, `DailyLog`, `StrengthExercise`, `RunSession`, `ACWRMethod`, dan `ACWRStatus` (tanpa `'warning'`).
- **Pure Engine (`src/lib/engine/`)**:
  - `dateKey.ts`: `getLocalDateKey(date?: Date)`, `diffHoursBetweenDateKeys(olderKey, newerKey)`.
  - `loadMetrics.ts`: `calculateStrengthLoad`, `calculateStrengthVolumeLoad`, `calculateRunningLoad`, `calculateEdwardsTrimp`, `calculateSessionRpe`.
  - `acwr.ts`: `calculateACWR`, `projectACWRImpact` (menghormati `ACWR_COLD_START_MIN_DAYS = 21`).
  - `guardrail.ts`: `evaluateSoftGuardrail`, `auditWeeklySchedule`, `isLegStrengthExercise`.
- **Repository (`src/lib/db/workoutRepo.ts`)**: Satu-satunya gerbang tulis/baca `workoutLogs` dan `postWorkoutDebrief` dalam transaksi atomik.
- **UI Terpecah (`src/components/logger/`)**:
  - `WorkoutLogger.tsx` (orkestrator tipis `< 250` baris)
  - `StrengthSetBuilder.tsx`
  - `RunningSessionPanel.tsx`
  - `WorkoutImpactSummary.tsx`
  - `RestTimerBar.tsx`
  - `FormulaGuideDrawer.tsx`

---

## 2. Kontrak API / Service Internal Target

### 2.1 Helper & Engine Signature Target
```ts
// src/lib/engine/dateKey.ts
export function getLocalDateKey(date?: Date): string; // YYYY-MM-DD lokal perangkat
export function diffDaysBetweenDateKeys(fromKey: string, toKey: string): number;

// src/lib/engine/guardrail.ts
export function isLegStrengthExercise(ex: Pick<StrengthExercise, 'namaGerakan' | 'category' | 'isLegExercise'>): boolean;

// src/lib/engine/acwr.ts
export interface ProjectedImpactResult {
  draftLoad: number;
  projectedACWR: number;
  projectedStatus: ACWRStatus; // Menghormati 'insufficient_data' jika daysCollected < 21
  isOverloaded: boolean;       // Hanya true jika daysCollected >= 21 && projectedACWR > 1.4
  legConflict: boolean;
  advice: string;
}

export function projectACWRImpact(params: {
  history: DailyLog[];
  targetDate: string;
  draftStrength: StrengthExercise[];
  draftRunning: RunSession[];
  lastLegsHoursAgo: number;
  legFatigue: boolean;
  method: ACWRMethod;
}): ProjectedImpactResult;
```

### 2.2 Repository Transactional API Target
```ts
// src/lib/db/workoutRepo.ts
export interface SaveWorkoutSessionInput {
  targetDate: string; // YYYY-MM-DD lokal
  mode: 'append' | 'replace_session' | 'replace_day';
  sessionId?: string;
  strengthExercises: StrengthExercise[];
  runningSessions: RunSession[];
  isOverridden?: boolean;
}

export interface SaveWorkoutSessionResult {
  dailyLog: DailyLog;
  debrief: StoredDebrief;
}

// Menjalankan db.transaction('rw', [db.workoutLogs, db.postWorkoutDebrief], ...)
export async function saveWorkoutSessionAtomic(
  input: SaveWorkoutSessionInput,
  historySnapshot: DailyLog[],
  acwrMethod: ACWRMethod
): Promise<SaveWorkoutSessionResult>;

export async function deleteWorkoutSessionAtomic(
  targetDate: string,
  sessionId: string
): Promise<void>;
```

---

## 3. Perubahan Skema Database (Dexie `v2` -> `v3`)

Agar pencatatan multi-sesi per hari tidak menimpa data sebelumnya sekaligus menjaga kompatibilitas riwayat lama:

1. **Tabel `workoutLogs` (`PK: tanggal`)**:
   - Tambahkan field `sessions: WorkoutSessionEntry[]` pada `DailyLog`, di mana setiap `WorkoutSessionEntry` memiliki:
     - `sessionId: string` (format `sess_${Date.now()}_${shortRandom}`)
     - `loggedAt: string` (ISO timestamp lokal/UTC untuk urutan kronologis jam dalam hari yang sama)
     - `strengthWorkouts: StrengthExercise[]`
     - `runningWorkouts: RunSession[]`
     - `sessionLoadScore: number`
     - `durationMinutes: number`
     - `isOverridden?: boolean`
   - Field top-level `strengthWorkouts`, `runningWorkouts`, `totalLoadScore`, `volumeLoadSecondary`, dan `runningTrimpSecondary` dihitung sebagai agregat deterministik dari `sessions[]` agar seluruh fungsi `calculateACWR(history)` dan `TrendsDashboardCard` tetap kompatibel.
2. **Migrasi `.upgrade()` Dexie v2 -> v3**:
   - Untuk setiap row `DailyLog` lama yang belum memiliki `sessions`, bungkus `strengthWorkouts` dan `runningWorkouts` lama menjadi 1 entri `sessions[0]` (`sessionId: 'legacy-' + log.tanggal`) serta hitung ulang `volumeLoadSecondary` dan `runningTrimpSecondary`.
3. **Tabel `appSettings`**:
   - Tambahkan key resmi `'acwrMethod'` dengan nilai `'rolling_coupled' | 'rolling_uncoupled' | 'ewma'`.

---

## 4. Daftar Penyimpangan Kode Lama & Rencana Refactor

| Lokasi Kode Lama | Penyimpangan Aktual | Refactor Target |
|---|---|---|
| [src/hooks/useWorkoutEngine.ts](../../../src/hooks/useWorkoutEngine.ts#L334-L376) | `logTodayWorkout()` memakai `new Date().toISOString().split('T')[0]` (UTC), memanggil `db.workoutLogs.put()` (menimpa hari yang sama), memutasi `setHistory` sebelum DB sukses, dan mengabaikan error DB. | Pindah ke `saveWorkoutSessionAtomic()` dengan `getLocalDateKey()`, mode `append` multi-sesi, dan update state hanya setelah transaksi Dexie commit; tampilkan `dbError` jika gagal. |
| [src/hooks/useWorkoutEngine.ts](../../../src/hooks/useWorkoutEngine.ts#L100-L108) | `lastLegsTrainedHoursAgo` memakai `legWorkoutIndex * 24` dan regex tidak mengecek `category === 'legs'`, `isLegExercise`, atau `deadlift`/`hip thrust`. | Gunakan `isLegStrengthExercise()` + selisih tanggal aktual (`diffDaysBetweenDateKeys`) terhadap sesi target. |
| [src/hooks/useWorkoutEngine.ts](../../../src/hooks/useWorkoutEngine.ts#L279-L329) | `calculateProjectedImpact()` tidak punya Cold-Start Guard (`< 21` hari), selalu menimpa `history[0]`, dan hanya mendukung coupled average. | Pindahkan ke pure engine `projectACWRImpact()` yang menggunakan `calculateACWR()` dan menjaga status `insufficient_data` saat `< 21` hari. |
| [src/components/WorkoutLogger.tsx](../../../src/components/WorkoutLogger.tsx#L469,L484,L738,L818,L1333) | Formula Guide & skor per set/lapisan memakai rumus berbeda (`* (rpe/10) * 0.1`, bobot lari `1.0/1.2/1.5/2.2/3.5`, fallback `rpe/2`, durasi debrief `3 mnt/set`) yang bertentangan dengan `workload.ts` & `constants.ts`. | Hapus perhitungan inline di JSX; panggil langsung `calculateStrengthLoad`, `calculateStrengthVolumeLoad`, `calculateRunningLoad`, `calculateEdwardsTrimp`, dan `SRPE_CONFIG.ESTIMATED_MINUTES_PER_STRENGTH_SET` (`2.5`). |
| [src/components/WorkoutLogger.tsx](../../../src/components/WorkoutLogger.tsx#L85-L112,L317-L329) | Selalu memuat draft statis Bench Press + Norwegian 4x4; edit manual `durasiMenit`/`avgHeartRate` tidak membersihkan `blocks` preset lama. | Muat draf awal dari jadwal hari ini (`weeklySchedule`); bersihkan `blocks` saat user mengedit parameter lari secara manual di luar preset. |
| [src/components/WorkoutLogger.tsx](../../../src/components/WorkoutLogger.tsx#L1-L1585) | File monolitik 1.585 baris sulit dirawat tim paralel. | Pecah ke sub-komponen di `src/components/logger/`. |
| [src/components/ScheduleCustomizer.tsx](../../../src/components/ScheduleCustomizer.tsx#L47,L336-L344) | `weeklySchedule[editingDayIndex]` mengakses indeks array bukan `dayIndex`; dropdown hanya berisi 8 dari 12 `WorkoutCategory`. | Ganti ke `weeklySchedule.find(d => d.dayIndex === editingDayIndex)` dan lengkapi opsi 12 kategori. |
| [src/lib/engine/periodization.ts](../../../src/lib/engine/periodization.ts#L44,L83,L90) | Teks saran masih menyebut ambang ACWR lama `> 1.3`, `0.8 - 1.3`, `> 1.5`. | Selaraskan ke ambang tunggal `0.8 - 1.4` dan `> 1.4` dari `ACWR_THRESHOLDS`. |
| [src/App.tsx](../../../src/App.tsx#L159-L165,L249-L255) | `handleWorkoutCompletedDebrief()` menulis Dexie langsung tanpa transaksi; `NutritionBodyCompCard` memakai `debriefData` singleton alih-alih log hari ini. | Pindahkan penulisan debrief ke transaksi atomik di `workoutRepo.ts`; hitung durasi & kalori nutrisi dari agregat `workoutLogs` tanggal lokal hari ini. |
