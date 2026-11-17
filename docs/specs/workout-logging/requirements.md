# Requirements Specification: `workout-logging`

**Modul:** Workout Logging, Live ACWR Projection, Guardrail & Plan-to-Log Continuity  
**Referensi:** [docs/prd.md](../../prd.md), [docs/glosarium.md](../../glosarium.md), [docs/steering/tech.md](../../steering/tech.md)  
**Format:** EARS (*Easy Approach to Requirements Syntax*)

---

## 1. Perencanaan Harian & Kontinuitas Jadwal (Plan-to-Log)

- **REQ-WL-01:** KETIKA atlet membuka tab `Hari Ini` (`WorkoutLogger`) dan belum ada sesi yang dicatat untuk tanggal lokal hari ini, MAKA sistem HARUS memuat sesi terencana hari ini dari `weeklySchedule` (berdasarkan `dayIndex` hari lokal perangkat) sebagai prasetel awal yang dapat disesuaikan atlet.
- **REQ-WL-02:** KETIKA atlet ingin mencatat sesi untuk hari sebelumnya (*backfill*), MAKA sistem HARUS menyediakan pemilih tanggal sesi dengan format `YYYY-MM-DD` zona waktu lokal perangkat dan menolak tanggal di masa depan.
- **REQ-WL-03:** DI MANA jadwal mingguan di `ScheduleCustomizer` disunting, MAKA sistem HARUS menyediakan seluruh 12 kategori kanonikal `WorkoutCategory` (termasuk `arms`, `core`, `run_recovery`, dan `run_intervals`) dan melakukan lookup hari berdasarkan `dayIndex`, bukan indeks posisi array.

---

## 2. Kalkulasi Beban & Konsistensi Rumus

- **REQ-WL-04:** SAAT menampilkan skor beban kekuatan dan lari di UI maupun Formula Guide, MAKA sistem HARUS menggunakan fungsi tunggal dari `src/lib/engine/` (`calculateStrengthLoad` dengan estimasi `2.5` menit/set, `calculateStrengthVolumeLoad` dalam satuan `kg`, `calculateRunningLoad` dengan `durasiMenit × rpe`, dan `calculateEdwardsTrimp` dengan bobot zona `1, 2, 3, 4, 5`).
- **REQ-WL-05:** KETIKA pengguna mengubah parameter lari secara manual (`durasiMenit`, `jarakKm`, atau `avgHeartRate`) setelah memilih preset, MAKA sistem HARUS menyesuaikan atau mengosongkan `blocks` interval agar tidak menghitung TRIMP menggunakan struktur blok preset lama yang tidak lagi cocok.
- **REQ-WL-06:** KETIKA atlet menyimpan sesi latihan, MAKA sistem HARUS menghitung dan menyimpan `totalLoadScore`, `volumeLoadSecondary`, `runningTrimpSecondary`, serta `sRpe` dan `trimp` pada setiap `RunSession`.

---

## 3. Proyeksi ACWR & Deteksi Konflik Kaki

- **REQ-WL-07:** KETIKA `calculateProjectedImpact` mengevaluasi draf sesi sebelum disimpan dan jumlah hari data historis `< 21` hari, MAKA sistem HARUS mengklasifikasikan `projectedStatus` sebagai `insufficient_data` (Cold-Start Guard) dan DILARANG memicu status `danger` atau label `WORKLOAD OVERLOAD` semu.
- **REQ-WL-08:** KETIKA menghitung `lastLegsTrainedHoursAgo`, MAKA sistem HARUS menghitung selisih waktu aktual berdasarkan `tanggal` (YYYY-MM-DD lokal) dari log latihan kaki terakhir terhadap tanggal sesi target, bukan mengalikan indeks array `history` dengan 24.
- **REQ-WL-09:** KETIKA mendeteksi apakah suatu latihan kekuatan membebani kaki (`hasLegExercise`), MAKA sistem HARUS memeriksa `ex.isLegExercise === true` atau `ex.category === 'legs'` terlebih dahulu sebelum fallback pencocokan nama gerakan (termasuk `squat`, `deadlift`, `lunge`, `hip thrust`, `leg`, `calf`, `quad`, `hamstring`).
- **REQ-WL-10:** JIKA terdapat konflik pemulihan kaki (`legs_to_run` `< 48` jam atau `run_to_legs` `< 24` jam) dan sesi lari BUKAN pengecualian aerobik (`recovery`/`easy` `<= 45` menit), MAKA sistem HARUS menampilkan `GuardrailOverrideModal` sebelum menyimpan; JIKA atlet mencentang konfirmasi mandiri dan melanjutkan, MAKA sistem HARUS menyimpan sesi dengan `isOverridden: true` tanpa memblokir penyimpanan.

---

## 4. Persistensi Multi-Sesi, Transaksi Atomik, & Debrief

- **REQ-WL-11:** KETIKA atlet menyimpan sesi latihan baru pada tanggal lokal `YYYY-MM-DD` yang sudah memiliki log sesi sebelumnya, MAKA sistem HARUS menambahkan sesi baru ke daftar sesi pada tanggal tersebut (mendukung multi-sesi AM/PM dan opsi edit/hapus per `sessionId`), dan DILARANG menimpa sesi sebelumnya secara diam-diam.
- **REQ-WL-12:** KETIKA atlet menyimpan sesi latihan, MAKA sistem HARUS membungkus pembaruan `workoutLogs` dan `postWorkoutDebrief` dalam satu transaksi atomik `db.transaction('rw', [db.workoutLogs, db.postWorkoutDebrief], ...)`.
- **REQ-WL-13:** JIKA transaksi penyimpanan ke IndexedDB gagal, MAKA sistem HARUS membatalkan pembaruan state in-memory (atau tidak memutasinya sebelum commit berhasil) dan menampilkan pesan error inline yang jelas kepada pengguna.
- **REQ-WL-14:** KETIKA `NutritionBodyCompCard` menghitung kebutuhan kalori dan hidrasi harian, MAKA sistem HARUS membaca agregat durasi dan beban dari `workoutLogs` pada tanggal lokal hari ini (bukan mengandalkan sisa `postWorkoutDebrief` dari hari sebelumnya).
- **REQ-WL-15:** KETIKA `TrendsDashboardCard` atau `WorkloadAdvisorCard` mengevaluasi ACWR, MAKA sistem HARUS menyediakan pilihan metode kanonikal (`rolling_coupled`, `rolling_uncoupled`, `ewma`) yang tersimpan di `appSettings` dan hanya menggunakan status `insufficient_data`, `undertraining`, `sweet_spot`, atau `danger` (ambang tunggal `1.4`).
