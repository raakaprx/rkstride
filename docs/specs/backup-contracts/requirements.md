# Requirements Specification: `backup-contracts`

**Modul:** Single Source of Truth Contracts (Zod), Profile Persistence, & Data Backup/Restore  
**Referensi:** [docs/prd.md](../../prd.md), [docs/glosarium.md](../../glosarium.md), [docs/steering/tech.md](../../steering/tech.md)  
**Format:** EARS (*Easy Approach to Requirements Syntax*)

---

## 1. Sumber Kontrak Skema Tunggal (Zod-First)

- **REQ-BC-01:** DI MANA entitas data domain didefinisikan (`DailyLog`, `StrengthExercise`, `RunSession`, `ReadinessCheckIn`, `UserProfile`, `ScheduledDay`, `RaceTargetConfig`, `StoredDebrief`, `AiCoachConfig`), MAKA seluruh tipe TypeScript dan validator runtime HARUS diturunkan dari satu sumber skema Zod terpusat (`z.infer`).
- **REQ-BC-02:** SAAT memvalidasi `StrengthExercise.category`, `ScheduledDay.category`, dan `RunSession.runningType`, MAKA skema Zod HARUS memvalidasi nilai enum literal kanonikal (`WorkoutCategory` dan `RunningType`) secara ketat, dan DILARANG memperlemahnya menjadi `z.string()`.
- **REQ-BC-03:** KETIKA pengguna menyimpan profil dengan `gender`, `maxHr` custom, atau `targetRaceConfig`, MAKA skema `UserProfileSchema` dan `RaceTargetConfigSchema` HARUS mencakup seluruh field tersebut secara resmi tanpa cast `as any`, sehingga tidak ada field yang terhapus oleh Zod saat proses ekspor/impor.

---

## 2. Profil Fisiologi & Target Kompetisi

- **REQ-BC-04:** KETIKA pengguna memilih `hrMaxFormula === 'custom'` pada `OnboardingProfileModal`, MAKA sistem HARUS menampilkan kolom input angka `maxHr` (rentang valid `100..230` bpm) dan memvalidasinya sebelum menyimpan.
- **REQ-BC-05:** KETIKA `OnboardingProfileModal` dibuka kembali, MAKA sistem HARUS memuat `userProfile` dari `db.userProfile` DAN `targetRaceConfig` dari `db.appSettings` (termasuk `eventName`, `category`, `raceDate`) agar nilai yang tampil mencerminkan data tersimpan terakhir.
- **REQ-BC-06:** KETIKA pengguna menyimpan perubahan di `OnboardingProfileModal`, MAKA sistem HARUS menulis `db.userProfile` dan `db.appSettings ('targetRaceConfig')` dalam satu transaksi atomik melalui repository DB, lalu memperbarui state aplikasi secara konsisten.

---

## 3. Ekspor & Impor Cadangan (Keamanan Kredensial & Kelengkapan Tabel)

- **REQ-BC-07:** KETIKA pengguna mengekspor cadangan JSON melalui `exportDatabaseToJson()`, MAKA sistem DILARANG menyertakan `byokApiKey` di dalam file backup secara default; jika pengguna secara eksplisit mencentang opsi "Sertakan pengaturan AI tanpa kunci sensitif" atau opt-in terpisah dengan peringatan, nilai rahasia tetap harus ditangani sesuai pilihan sadar pengguna.
- **REQ-BC-08:** KETIKA mengekspor cadangan JSON, MAKA payload HARUS menyertakan seluruh tabel persisten aktif termasuk `postWorkoutDebrief` (serta `nutritionPrefs` dan `acwrMethod` di `appSettings`) dan menuliskan nomor `version` yang sama persis dengan versi skema `RKStrideDB` aktif.
- **REQ-BC-09:** KETIKA pengguna mengimpor cadangan JSON dengan opsi `wipeBeforeImport: true` (*replace mode*), MAKA transaksi atomik `db.transaction('rw', ...)` HARUS membersihkan **seluruh** tabel data pengguna (`workoutLogs`, `dailyReadiness`, `weeklySchedule`, `userProfile`, dan `postWorkoutDebrief`) sebelum menuliskan payload baru.
- **REQ-BC-10:** KETIKA impor cadangan JSON selesai dengan sukses, MAKA aplikasi HARUS me-reload **seluruh** state dari database (termasuk `userProfile`, `raceConfig`, `debriefData`, `history`, `todayReadiness`, `readinessHistory`, dan `weeklySchedule`) tanpa mengharuskan reload browser manual.
- **REQ-BC-11:** JIKA database kosong setelah penghapusan data atau impor dengan `workoutLogs: []`, MAKA fungsi `reloadFromDb()` HARUS mereset state React (`history`, `debriefData`, `todayReadiness`) kembali ke kondisi kosong/netral, bukan mempertahankan state lama di memori.
