# Design Specification: `smartwatch-readiness`

**Modul:** Smartwatch Integration, File Import Parser, & Personal Baseline Bio-Readiness  
**Referensi:** [requirements.md](requirements.md), [docs/steering/tech.md](../../steering/tech.md)

---

## 1. Kontrak Data & Parser Target

### 1.1 Kontrak Zod Input & Output Smartwatch (`src/contracts/smartwatch.schema.ts`)
```ts
export const SmartwatchSourceSchema = z.enum([
  'disconnected',
  'bluetooth',
  'file_export',
  'manual_sync',
  'preset',
]);

export const SmartwatchImportResultSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    data: ParsedSmartwatchDataSchema,
  }),
  z.object({
    ok: z.literal(false),
    code: z.enum(['UNSUPPORTED_FORMAT', 'PARSE_ERROR', 'EMPTY_METRICS']),
    message: z.string(),
  }),
]);
```

### 1.2 Aturan Parser Jujur (`src/lib/engine/smartwatch.ts`)
- `parseUniversalSmartwatchFile(content: string | ArrayBuffer, filename: string)` diubah menjadi mengembalikan `SmartwatchImportResult` (`{ ok: true, data }` atau `{ ok: false, code, message }`):
  - **`.json`**: Validasi field terukur secara eksplisit; tidak boleh mengisi default `7.4` jam tidur / `52` bpm RHR jika field tidak ada di JSON (gunakan field opsional / pertahankan nilai sebelumnya hanya saat merge di check-in, atau tolak jika kosong).
  - **`.csv`**: Harus menemukan minimal 1 baris metrik yang valid; jika 0 match, kembalikan `EMPTY_METRICS`.
  - **`.gpx` / `.tcx`**: Jika belum diimplementasikan parser XML (`DOMParser`), atau jika diimplementasikan harus mengekstrak `<trkpt>`/`<Trackpoint>` nyata; **dilarang** jatuh ke blok CSV fallback yang mengembalikan angka dummy.
  - **`.fit`**: Sebelum binary FIT parser terpasang, wajib mengembalikan `{ ok: false, code: 'UNSUPPORTED_FORMAT', message: 'Format biner .fit belum didukung di browser. Ekspor ke .json atau .csv dari aplikasi jam Anda.' }` dan hapus ekstensi yang belum didukung dari `accept` UI sampai parser aslinya siap.
- **Bluetooth SIG `0x2A37` Parser**:
  - Baca byte `flags = value.getUint8(0)`. Jika `(flags & 0x01) === 0`, baca `value.getUint8(1)`; jika `1`, baca `value.getUint16(1, true)`.

---

## 2. Perubahan Skema & Repository Readiness (`src/lib/db/readinessRepo.ts`)

1. **Tabel `dailyReadiness` (Dexie)**:
   - Tetap memakai PK `tanggal` (`YYYY-MM-DD` lokal).
   - Tambahkan fungsi repository:
     - `getReadinessByDate(dateKey: string): Promise<StoredReadinessLog | undefined>`
     - `getRecentReadinessHistory(limitDays = 28): Promise<StoredReadinessLog[]>` (diurutkan terbaru ke terlama, mengecualikan hari ini saat menghitung baseline historis agar tidak memengaruhi mean/std hari ini).
     - `saveDailyReadiness(dateKey: string, entry: ReadinessCheckIn): Promise<StoredReadinessLog>`
2. **State Hook (`src/hooks/useReadiness.ts` atau di `useWorkoutEngine.ts`)**:
   - Tambahkan state `readinessHistory: StoredReadinessLog[]` yang di-load di `reloadFromDb()`.
   - Panggil `calculateReadinessScore(todayReadiness, readinessHistory)` alih-alih `calculateReadinessScore(todayReadiness)` tanpa argumen kedua.
   - Tambahkan state `isProvisional` dan `tendonAlert` dari `readinessResult` ke nilai kembalian hook agar UI dapat menampilkannya.
3. **Impor `workoutDetected` ke `workoutLogs`**:
   - Jika `ParsedSmartwatchData.workoutDetected` tersedia dan pengguna mengonfirmasi impor aktivitas, konversi ke `RunSession` atau `StrengthExercise` dan simpan melalui `saveWorkoutSessionAtomic()` (modul `workout-logging`).

---

## 3. Perubahan UI `SmartwatchSyncCard.tsx`

1. **Sinkronisasi State Form**:
   - Tambahkan `useEffect` yang menyinkronkan `localSleep`, `localRhr`, `localSoreness`, `localLegFatigue`, `localEnergy`, `localHrv`, `localTendonPain`, `localTendonArea` setiap kali prop `readiness` berubah.
   - Hapus default angka palsu `52` pada `localRhr` jika `readiness.restingHeartRate` belum diukur (gunakan placeholder/toggle "Belum diukur" sampai user menggeser atau mengisi nilai).
2. **Tambahkan Kontrol Input yang Hilang**:
   - Input numerik opsional `HRV (rMSSD ms)` (`min: 10`, `max: 250`).
   - Selector `Nyeri Tendon / Sendi` (`0: Tidak ada`, `1: Ringan`, `2: Terasa`, `3: Berat`) + input `Area Nyeri` (muncul saat `tendonJointPain > 0`).
3. **Banner Error Upload & Status Simulasi Jujur**:
   - Tampilkan banner error inline saat `onImportFile` mengembalikan `ok: false`.
   - Untuk preset simulasi, tampilkan badge `SIMULASI PRESET` dan hilangkan `batteryLevel` fabrikasi (`24%` / `95%` / `88%` pada non-BLE source).

---

## 4. Daftar Penyimpangan Kode Lama & Rencana Refactor

| Lokasi Kode Lama | Penyimpangan Aktual | Refactor Target |
|---|---|---|
| [src/lib/engine/smartwatch.ts](../../../src/lib/engine/smartwatch.ts#L133-L213) | `parseUniversalSmartwatchFile()` mengklaim mendukung `.fit`/`.gpx`/`.tcx`, tetapi diam-diam mengembalikan angka hardcoded `7.5h`, `51 bpm`, `8800 steps`, `460 kcal` saat parsing gagal/format biner. | Kembalikan discriminated union `SmartwatchImportResult` dengan penolakan eksplisit format tak didukung dan zero hardcoded biometric fallback. |
| [src/lib/engine/smartwatch.ts](../../../src/lib/engine/smartwatch.ts#L105-L108) | `value.getUint8(1)` mengabaikan bit flag format uint16 pada Bluetooth GATT `0x2A37`. | Implementasikan helper `parseBleHeartRateMeasurement(dataView)` sesuai spesifikasi GATT 0x2A37. |
| [src/hooks/useWorkoutEngine.ts](../../../src/hooks/useWorkoutEngine.ts#L136-L138) | `calculateReadinessScore(todayReadiness)` dipanggil tanpa riwayat 14-28 hari sehingga personal Z-Score tidak pernah aktif. | Load `readinessHistory` dari Dexie di `reloadFromDb()` dan kirimkan ke `calculateReadinessScore(todayReadiness, readinessHistory)`. |
| [src/hooks/useWorkoutEngine.ts](../../../src/hooks/useWorkoutEngine.ts#L232-L276) | `importSmartwatchFile` dan `applyPreset` memfabrikasi `batteryLevel: 88 / 24 / 95` dan membuang `parsed.workoutDetected`. | Hapus `batteryLevel` fabrikasi di luar BLE battery service; sediakan alur konfirmasi impor `workoutDetected`. |
| [src/components/SmartwatchSyncCard.tsx](../../../src/components/SmartwatchSyncCard.tsx#L38-L42,L55-L68) | State slider tidak tersinkronisasi ulang saat prop `readiness` berubah; tidak ada UI untuk `hrvRmssd` dan `tendonJointPain`; tidak ada error banner hasil parsing file; `accept` masih mencantumkan `.fit/.gpx/.tcx`. | Tambah `useEffect` sync prop, kontrol input HRV & Tendon Pain, inline error banner impor file, dan selaraskan `accept` dengan format yang benar-benar ter-parse. |
