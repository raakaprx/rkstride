# Requirements Specification: `smartwatch-readiness`

**Modul:** Smartwatch Integration, File Import Parser, & Personal Baseline Bio-Readiness  
**Referensi:** [docs/prd.md](../../prd.md), [docs/glosarium.md](../../glosarium.md), [docs/steering/tech.md](../../steering/tech.md)  
**Format:** EARS (*Easy Approach to Requirements Syntax*)

---

## 1. Kejujuran Parser File & Deteksi Format

- **REQ-SR-01:** KETIKA pengguna mengunggah file smartwatch di `SmartwatchSyncCard`, MAKA sistem HARUS memvalidasi ekstensi dan struktur konten file secara eksplisit sebelum memperbarui state kesiapan atau status perangkat.
- **REQ-SR-02:** JIKA pengguna mengunggah file berformat `.fit`, `.gpx`, atau `.tcx` dan parser format tersebut belum tersedia secara penuh, MAKA sistem HARUS menolak file dengan pesan error inline yang jelas dan DILARANG melakukan *silent fallback* ke angka default hardcoded.
- **REQ-SR-03:** KETIKA pengguna mengunggah file `.json` atau `.csv` yang korup atau tidak mengandung satu pun metrik biometrik valid (`sleep`, `resting_hr`, `steps`, `calories`, atau `workout`), MAKA sistem HARUS menampilkan pesan error inline bahwa file tidak memuat data biometrik yang dikenali.
- **REQ-SR-04:** KETIKA file `.json` valid mengandung objek `workout` (`workoutDetected`), MAKA sistem HARUS menawarkan pratinjau sesi latihan yang terdeteksi dengan tombol eksplisit untuk mengimpornya ke `workoutLogs` pada tanggal terkait, bukan membuangnya.

---

## 2. Web Bluetooth & Preset Simulasi

- **REQ-SR-05:** KETIKA perangkat terhubung melalui Web Bluetooth GATT (`0x180D`), MAKA sistem HARUS mem-parse paket *Heart Rate Measurement* sesuai spesifikasi Bluetooth SIG (memeriksa bit flag uint8 vs uint16 pada byte 0) dan hanya menampilkan data aktual yang diterima dari perangkat.
- **REQ-SR-06:** KETIKA pengguna menekan tombol preset simulasi (`normal`, `fatigued`, `peak`), MAKA sistem HARUS memberi penanda visual eksplisit `[SIMULASI]` pada status perangkat (`source: 'preset'`) dan DILARANG menampilkan level baterai atau nama perangkat seolah-olah terhubung ke perangkat keras asli.

---

## 3. Sinkronisasi Form & Kelengkapan Input Biometrik

- **REQ-SR-07:** KETIKA data `todayReadiness` berubah akibat pemuatan dari IndexedDB, impor file, atau aktivasi preset, MAKA kontrol input di `SmartwatchSyncCard` (`localSleep`, `localRhr`, `localSoreness`, `localLegFatigue`, `localEnergy`, `localHrv`, `localTendonPain`) HARUS tersinkronisasi otomatis dengan state `readiness` terbaru.
- **REQ-SR-08:** KETIKA pengguna melakukan *Quick Morning Check-In*, MAKA UI HARUS menyediakan input opsional untuk `hrvRmssd` (ms), `tendonJointPain` (skala `0..3`), dan `tendonPainArea` agar fitur *Tendon Alert* dan komponen HRV pada Z-Score readiness dapat digunakan oleh atlet.
- **REQ-SR-09:** KETIKA atlet menekan tombol simpan check-in pagi, MAKA sistem HARUS mempersist data ke `db.dailyReadiness` dengan kunci tanggal lokal `YYYY-MM-DD` melalui repository dan memperbarui riwayat readiness di state aplikasi.

---

## 4. Aktivasi Personal Baseline Z-Score (14-28 Hari)

- **REQ-SR-10:** KETIKA aplikasi menghitung `readinessResult` via `calculateReadinessScore()`, MAKA sistem HARUS memuat riwayat 14-28 hari terakhir dari `db.dailyReadiness` dan mengirimkannya sebagai argumen kedua ke fungsi engine.
- **REQ-SR-11:** DI MANA jumlah riwayat `dailyReadiness` `< 7` hari, MAKA sistem HARUS menandai status `isProvisional: true` dan menampilkan indikator `Provisional` pada UI; JIKA riwayat `>= 7` hari, MAKA sistem HARUS beralih ke perhitungan Z-Score personal (`isProvisional: false`).
- **REQ-SR-12:** JIKA atlet mencatat `tendonJointPain >= 2`, MAKA sistem HARUS memunculkan `tendonAlert` di `WorkloadAdvisorCard` serta menyertakannya dalam konteks `rkbot`.
