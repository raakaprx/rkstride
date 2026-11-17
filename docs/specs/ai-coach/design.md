# Design Specification: `ai-coach`

**Modul:** AI Athletic Coach (`rkbot`), Telemetry Context, Security Guards, & Navigation Alignment  
**Referensi:** [requirements.md](requirements.md), [docs/steering/tech.md](../../steering/tech.md)

---

## 1. Kontrak API & Payload Target (`src/contracts/ai.schema.ts`)

```ts
export const AiCoachModeSchema = z.enum(['byok', 'proxy']);

export const AiCoachConfigSchema = z.object({
  mode: AiCoachModeSchema,
  byokApiKey: z.string(),
  proxyUrl: z.string(),
  sendTelemetry: z.boolean(),
});

export const ProxyCoachRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(ChatMessageSchema).max(6),
  athleteContext: AthleteContextSchema.optional(),
});

export const ProxyCoachResponseSchema = z.object({
  reply: z.string().min(1),
});
```

### Validasi URL & Request Proxy (`src/lib/ai/geminiCoach.ts`)
- Tambahkan helper `isSafeProxyUrl(rawUrl: string): boolean`:
  - Hanya mengizinkan `url.protocol === 'https:'` atau `url.hostname === 'localhost' || url.hostname === '127.0.0.1'`.
- Gunakan `AbortController` dengan timeout (mis. `15000` ms) saat `fetch(config.proxyUrl, ...)`.
- Validasi response JSON dengan `ProxyCoachResponseSchema.safeParse(data)`. Jika gagal/timeout, catat warning internal dan fallback ke `generateOfflineSportsScienceResponse()`.

---

## 2. Alur Gerbang `askGeminiCoach()` Target

Urutan eksekusi wajib di `askGeminiCoach(userMessage, history, ctx)`:
1. `checkMedicalRedFlags(userMessage)` -> jika match, return emergency message segera.
2. `isQueryInSportsDomain(userMessage)` -> jika `false`, return pesan lingkup `rkbot` segera **di semua mode** (`byok`, `proxy`, `offline`) sebelum menyentuh SDK/network!
3. Ambil `config = getAiCoachConfig()` dan `effectiveCtx = config.sendTelemetry ? ctx : undefined`.
4. Jika `config.mode === 'proxy'`: validasi `isSafeProxyUrl(config.proxyUrl)`, kirim `POST` dengan timeout & Zod response parse, fallback ke offline jika gagal.
5. Jika `config.mode === 'byok'`: jika `!apiKey`, fallback ke offline; jika ada `apiKey`, panggil `@google/genai` dengan fallback ke offline bila semua candidate models gagal.

---

## 3. Perbaikan Telemetry Context & Persistensi Chat

### 3.1 Konteks Atlet Nyata (`buildAthleteContext`)
Pindahkan konstruksi `AthleteContext` dari inline `useMemo` di `App.tsx` ke helper teruji `src/lib/ai/buildAthleteContext.ts`:
```ts
export function buildAthleteContext(params: {
  acwrResult: ACWRResult;
  todayReadiness: ReadinessCheckIn;
  readinessScore: number;
  lastLegsHoursAgo: number;
  latestDailyLog?: DailyLog;
}): AthleteContext;
```
- `recentWorkoutSummary` diturunkan langsung dari `latestDailyLog` (log terakhir di `history`):
  - `strengthExercisesCount = latestDailyLog.strengthWorkouts.length`
  - `runningMinutes = sum(r.durasiMenit)`
  - `runningKm = round(sum(r.jarakKm), 1)`
  - `totalLoadScore = latestDailyLog.totalLoadScore`
- Jika `history.length === 0`, `recentWorkoutSummary` bernilai `undefined` (bukan angka tebakan dari `debriefData`).

### 3.2 Persistensi Riwayat Chat (Opsional di `appSettings` atau store `coachMessages`)
- Simpan riwayat percakapan (dibatasi 30 pesan terakhir) melalui `coachRepo.ts` atau `localStorage` terpisah (`rkstride_coach_history`), dan tombol `Trash2` ("Bersihkan Percakapan") menghapus penyimpanan sekaligus mereset state ke pesan selamat datang.

### 3.3 Penyelarasan Navigasi Tab (`BottomNav.tsx` & `App.tsx`)
- Masalah aktual: `BottomNav` menamai tab 5 `Coach` (`Bot` icon) dengan `coachBadgeCount={scheduleConflicts.length}`, padahal tab `coach` hanya merender `SmartwatchSyncCard`, sedangkan `scheduleConflicts` adalah milik tab `program`, dan `rkbot` ada di floating widget.
- Pilihan desain yang disarankan saat refactor:
  - Ubah label/ikon tab 5 menjadi **Perangkat** (`Watch` icon, id tab tetap/dimigrasi ke `devices` atau label UI "Perangkat") dan pindahkan badge `scheduleConflicts.length` ke tab **Program** (`programBadgeCount`), **ATAU** tampilkan panel `rkbot` inline di tab `Coach` sambil menempatkan `SmartwatchSyncCard` di belakang shortcut jam pada `HeaderNavbar` (sesuai komentar desain awal di `BottomNav.tsx:10-13` yang pernah mencatat bahwa smartwatch seharusnya hidup di balik ikon jam pada header).

---

## 4. Daftar Penyimpangan Kode Lama & Rencana Refactor

| Lokasi Kode Lama | Penyimpangan Aktual | Refactor Target |
|---|---|---|
| [src/lib/ai/geminiCoach.ts](../../../src/lib/ai/geminiCoach.ts#L243,L410-L457) | `isQueryInSportsDomain()` hanya dijalankan di `generateOfflineSportsScienceResponse()`, bocor pada mode `byok` dan `proxy`; `fetch` proxy tanpa timeout, URL check, atau Zod response check; cabang `ctx.acwrStatus === 'warning'` masih ada; `generateOfflineSportsScienceResponse()` tidak mengecek `insufficient_data` saat menyarankan menu besok. | Pindahkan `isQueryInSportsDomain()` ke pintu masuk `askGeminiCoach()`; tambah `isSafeProxyUrl()`, `AbortController`, `ProxyCoachResponseSchema`, dan hapus cabang `'warning'` serta hormati status `insufficient_data`. |
| [src/App.tsx](../../../src/App.tsx#L143-L157) | `athleteContext.recentWorkoutSummary` memfabrikasi `strengthExercisesCount: 3` dan `runningKm: totalDurationMin * 0.15`. | Ganti dengan `buildAthleteContext()` berbasis `history[0]` aktual. |
| [src/components/GeminiCoachWidget.tsx](../../../src/components/GeminiCoachWidget.tsx#L102-L113,L319) | Riwayat chat hilang saat reload dan fungsi `renderFormattedMessage()` berada di file UI. | Ekstrak formatter ke `src/lib/ai/formatCoachMessage.ts` dan hubungkan persistensi chat lokal + clear storage. |
| [src/components/BottomNav.tsx](../../../src/components/BottomNav.tsx#L10-L29) & [src/App.tsx](../../../src/App.tsx#L35,L269-L278,L346) | Komentar `BottomNav.tsx` menyebut smartwatch bukan tab, tetapi tab `coach` justru merender `SmartwatchSyncCard` dan menampilkan badge `scheduleConflicts.length` milik tab `Program`. | Selaraskan kepemilikan tab & badge: pindahkan badge konflik jadwal ke tab `program`, dan selaraskan destinasi `Smartwatch` vs `Coach`. |
