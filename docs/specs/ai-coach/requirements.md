# Requirements Specification: `ai-coach`

**Modul:** AI Athletic Coach (`rkbot`), Telemetry Context, Security Guards, & Navigation Alignment  
**Referensi:** [docs/prd.md](../../prd.md), [docs/glosarium.md](../../glosarium.md), [docs/steering/tech.md](../../steering/tech.md)  
**Format:** EARS (*Easy Approach to Requirements Syntax*)

---

## 1. Keamanan Berlapis di Semua Mode Koneksi

- **REQ-AI-01:** KETIKA pengguna mengirim pesan ke `askGeminiCoach()`, MAKA sistem HARUS menjalankan `checkMedicalRedFlags()` terlebih dahulu pada **semua mode** (`byok`, `proxy`, maupun `offline`) dan segera mengembalikan rujukan medis darurat jika gejala kritis terdeteksi.
- **REQ-AI-02:** KETIKA pengguna mengirim pesan dan tidak terdeteksi red-flag medis, MAKA sistem HARUS menjalankan `isQueryInSportsDomain()` sebelum melakukan panggilan jaringan ke Gemini API maupun Thin Proxy (bukan hanya di mode offline), sehingga pertanyaan di luar lingkup atletik tidak mengonsumsi kuota API.
- **REQ-AI-03:** KETIKA mode `proxy` aktif, MAKA sistem HARUS memvalidasi bahwa `proxyUrl` menggunakan skema `https:` (atau `http://localhost` / `http://127.0.0.1` untuk pengembangan lokal), menerapkan batas waktu (*timeout*) request, dan memvalidasi payload balasan JSON menggunakan skema Zod sebelum merendernya.

---

## 2. Kejujuran Telemetri & Privasi Konteks

- **REQ-AI-04:** KETIKA `config.sendTelemetry === false`, MAKA sistem HARUS mengirim `athleteContext = undefined` pada mode Proxy maupun mengosongkan blok telemetri pada `buildSystemInstruction()` di mode BYOK.
- **REQ-AI-05:** KETIKA membangun `athleteContext.recentWorkoutSummary` di `App.tsx`, MAKA sistem HARUS menghitung jumlah latihan kekuatan (`strengthExercisesCount`), menit lari (`runningMinutes`), jarak lari (`runningKm`), dan `totalLoadScore` langsung dari `workoutLogs` terbaru aktual (atau mengosongkannya jika belum ada log), dan DILARANG mengarang angka hardcoded (seperti `strengthExercisesCount: 3` atau mengonversi menit angkat beban menjadi jarak lari).
- **REQ-AI-06:** DI MANA `generateOfflineSportsScienceResponse()` memformat status ACWR, MAKA sistem HARUS hanya memetakan status kanonikal (`insufficient_data`, `undertraining`, `sweet_spot`, `danger`) dan mematuhi *Cold-Start Guard* (`< 21` hari tidak boleh diberi saran seolah berada di zona bahaya/sweet spot matang).

---

## 3. Konsistensi UI, Persistensi Chat, & Penamaan Navigasi

- **REQ-AI-07:** KETIKA pengguna berdiskusi dengan `rkbot` dan menutup widget atau me-reload halaman, MAKA riwayat percakapan terakhir (maksimal sejumlah batas wajar, mis. 30 pesan) dapat dipersist secara lokal di IndexedDB/storage lokal dengan tombol "Bersihkan Percakapan" yang juga menghapus penyimpanan tersebut.
- **REQ-AI-08:** KETIKA `AICoachSettingsModal` menampilkan pemberitahuan keamanan kunci API, MAKA teks pemberitahuan HARUS selaras dengan perilaku aktual sistem (kunci disimpan di browser lokal dan tidak diekspor dalam backup standar).
- **REQ-AI-09:** DI MANA `BottomNav` dan `HeaderNavbar` menamai destinasi tab kelima (`coach` vs `SmartwatchSyncCard`), MAKA label tab, ikon, judul halaman, dan badge notifikasi HARUS sesuai dengan isi halaman yang dirender (mis. memisahkan atau menyelaraskan label "Perangkat" / "Sync" agar badge `scheduleConflicts` tidak muncul di tab yang salah).
