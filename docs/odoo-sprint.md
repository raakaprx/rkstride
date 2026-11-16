# Perencanaan Sprint Odoo & Dokumentasi Arsitektur: RKStride (Pulse Hybrid Athletics)

Dokumen ini merupakan cetak biru (*Documentation-First Blueprint*) dan papan perencanaan **Sprint Odoo (`project.task`)** untuk pengembangan dan penyempurnaan aplikasi **RKStride (Pulse Hybrid Athletics)**.

---

## 1. Cara Mengecek & Mengimpor Sprint Odoo

Anda dapat memeriksa dan menggunakan papan Sprint Odoo ini melalui **3 cara**:

1. **Langsung di Dalam Aplikasi Web RKStride:**
   - Pada halaman awal **Login & Pengenalan RKStride**, klik tombol **"Sprint Odoo & Dokumentasi"** di pojok kanan atas.
   - Atau jika sudah masuk ke dalam dasbor utama, buka menu di pojok kanan atas (**Header**) lalu klik tombol **"Sprint Odoo"**.
2. **Melalui Portal Dokumentasi Lokal (`npm run doc:dev`):**
   - Jalankan perintah berikut di terminal:
     ```bash
     npm run doc:dev
     ```
   - Buka alamat yang ditampilkan di terminal (misal `http://localhost:4173/docs/index.html`) untuk melihat Papan Kanban Sprint Odoo, Kamus Bahasa Multi-Tier (Pemula/Menengah/Expert), dan Spesifikasi Arsitektur.
3. **Impor Langsung ke ERP Odoo (Modul *Odoo Project*):**
   - File CSV standar Odoo tersedia di: `docs/odoo-tasks-import.csv` (atau dapat diunduh langsung melalui tombol **Unduh CSV Impor Odoo** di dalam aplikasi).
   - Di dalam Odoo ERP Anda: buka **Project > pilih Proyek RKStride > Tasks > Favorites > Import Records**, unggah `docs/odoo-tasks-import.csv`, lalu klik **Import**.

---

## 2. Dokumentasi Value Proposition & Alur Masuk (Temuan #1)

### Mengapa Pengguna Membutuhkan RKStride?
Atlet yang menggabungkan latihan beban (*Push-Pull-Legs*) dan lari ketahanan (*Endurance Running*) sering mengalami benturan pemulihan (*Interference Effect*):
- Aplikasi gym konvensional tidak memperhitungkan kelelahan kardiovaskular pasca lari interval.
- Aplikasi lari konvensional tidak mengetahui bahwa otot kuadrisep dan tendon patela baru saja dibebani *Squat* atau *Deadlift* berat kurang dari 48 jam yang lalu.

### Solusi Gerbang Awal (`AuthLandingGate.tsx`)
Sebelum pengguna masuk ke dasbor perhitungan, RKStride menampilkan **Gerbang Awal Terpadu**:
1. **Penjelasan Nilai Utama (*Core Value*):** Visualisasi nyata bagaimana RKStride menyatukan beban angkatan (kg x repetisi x RPE) dan beban lari (durasi x zona detak jantung) ke dalam satu rasio adaptasi **ACWR (0.8 sampai 1.4)** serta menjaga jeda pemulihan kaki **48 jam**.
2. **Pemilihan Tingkat Pengalaman (Pemula / Menengah / Expert):** Pengguna memilih tingkat pengalaman sejak saat registrasi/login agar bahasa antarmuka menyesuaikan dengan pemahaman mereka.
3. **Sistem Login & Akun Atlet Lokal (*Offline-First*):**
   - **Tab Masuk Akun:** Masuk dengan akun atlet yang tersimpan di perangkat (verifikasi PIN lokal) atau pilih **Masuk Cepat Evaluasi** dalam 1 klik.
   - **Tab Daftar Atlet Baru:** Mendaftarkan Nama Atlet, Email/ID Lokal, PIN, Tingkat Pengalaman, dan Biometrik Dasar (Usia, Berat, Tinggi) yang langsung tersimpan di IndexedDB (`RKStrideDB`).

---

## 3. Kamus Bahasa Adaptif: Pemula vs Menengah vs Expert (Blueprint Sprint 2)

| Konsep Sistem | Mode **Pemula** (*Bahasa Sehari-hari*) | Mode **Menengah** (*Terpandu*) | Mode **Expert** (*Sports Science Penuh*) |
| :--- | :--- | :--- | :--- |
| **Rasio Beban Utama** | Status Keamanan Latihan Mingguan | Rasio Beban Kerja (ACWR) | ACWR Workload Ratio (Coupled / Uncoupled / EWMA) |
| **Zona 0.8 - 1.4** | Zona Aman (Porsi Latihan Pas) | Zona Optimal (Sweet Spot 0.8 - 1.4) | Adaptation Sweet Spot (0.8 - 1.4 Gabbett Model) |
| **Zona > 1.4** | Latihan Terlalu Berat (Wajib Kurangi Porsi) | Risiko Lonjakan Beban (> 1.4) | Acute Workload Spike (> 1.4 Danger Zone) |
| **Skala Usaha Set (RPE)** | Tingkat Capek (1 = Sangat Ringan, 10 = Maksimal) | Skala RPE (1-10 / Sisa Tenaga) | Borg CR-10 sRPE & Proximity to Failure (RIR) |
| **Proteksi Kaki 48 Jam** | Aturan Istirahat Kaki 2 Hari Sebelum Lari Cepat | Jendela Pemulihan Otot Kaki 48 Jam | 48h AMPK/mTORC1 Interference Soft Guardrail |
| **Protokol Lari Interval** | Lari Cepat Берgantian 4x4 Menit | Interval VO2 Max (Norwegian 4x4) | Norwegian 4x4 Protocol (Helgerud et al., 85-95% HRmax) |

---

## 4. Matriks Backlog & Papan Sprint Odoo

| ID Tugas | Sprint / Milestone | Epic | Judul Tugas | Status | Prioritas | Story Points | Acuan Audit |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **ODOO-101** | Sprint 1: Dokumentasi & Gerbang Masuk | EPIC-01: Documentation-First | Penyusunan Blueprint Dokumentasi Produk & Portal `npm run doc:dev` | **Done** | High | 5 | Temuan #3 |
| **ODOO-102** | Sprint 1: Dokumentasi & Gerbang Masuk | EPIC-02: Onboarding & Local Auth | Implementasi Gerbang Awal: Value Proposition & Login Akun Atlet Lokal | **Done** | High | 8 | Temuan #1 |
| **ODOO-201** | Sprint 2: Bahasa Adaptif | EPIC-03: Adaptive Tiering | Sistem Kosakata & Tampilan Adaptif: Pemula, Menengah, dan Expert | **Done** | High | 8 | Temuan #2 |
| **ODOO-202** | Sprint 2: Bahasa Adaptif | EPIC-03: Adaptive Tiering | Penyeragaman Bahasa Indonesia & Penghapusan Em Dash / CTA Generik | **Done** | Low | 3 | Temuan #6, #10 |
| **ODOO-301** | Sprint 3: Integritas Mesin & UI | EPIC-04: Engine Wiring | Pembersihan Data Asumsi Default & Sinkronisasi Rumus Beban UI-Engine | **Done** | High | 5 | Temuan #4, #7 |
| **ODOO-302** | Sprint 3: Integritas Mesin & UI | EPIC-04: Engine Wiring | Eksposur Metrik Mesin ke UI: Estimasi 1RM, PR Badge, Hard Sets & Karvonen | **Done** | High | 8 | Temuan #7 |
| **ODOO-401** | Sprint 4: Wearable & Otomasi | EPIC-05: Wearable & Hygiene | Perbaikan Parser File `.fit/.gpx/.tcx` Tanpa Angka Palsu & Kepatuhan MOTION 1 | To Do | High | 5 | Temuan #5, #8, #9 |

**Total Story Points:** 42 SP (Sprint 1: 13 SP Selesai, Sprint 2: 11 SP, Sprint 3: 13 SP, Sprint 4: 5 SP).
