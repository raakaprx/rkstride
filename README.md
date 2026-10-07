# RKStride (Pulse Hybrid Athletics)

Platform manajemen beban latihan atletik hibrida (*hybrid athletics*) yang mengintegrasikan program kekuatan (*Push-Pull-Legs*) dengan lari ketahanan (*Endurance Running*). Dibangun di atas fondasi fisiologi olahraga modern, RKStride menyajikan kalkulasi beban kerja deterministik, perlindungan interferensi adaptif, dan panduan latihan berbasis data objektif.

---

## ⚠️ Disclaimer Non-Medis Penting

> **PERNYATAAN RESMI:**
> RKStride adalah sistem komputasi beban kerja dan **alat bantu pengambilan keputusan latihan (*decision-support tool*)**, bukan penyedia layanan medis. Metrik yang dihasilkan (seperti ACWR, status beban, TRIMP, dan skor kesiapan biologis) berfungsi sebagai **indikator risiko beban kerja**, bukan jaminan pencegahan cedera (*injury prevention*). Cedera olahraga dipengaruhi oleh faktor biomekanik, riwayat medis, dan variasi anatomi individual yang multifaktorial. Jika Anda mengalami nyeri hebat, pembengkakan sendi, atau gejala abnormal lainnya, segera hentikan latihan dan konsultasikan dengan dokter atau fisioterapis berlisensi.

---

## Fitur Utama

- **Mesin Kalkulasi ACWR Tiga Model**:
  - Pilihan kalkulasi: *Rolling Coupled* (Gabbett 2016), *Rolling Uncoupled* (Windt & Gabbett 2019), dan *Exponentially Weighted Moving Average* / EWMA (Williams 2017).
  - Proteksi *Cold-Start* cerdas: Menandai status sebagai `insufficient_data` jika riwayat kurang dari 21 hari untuk mencegah rasio semu yang menyesatkan.
  - Deteksi lonjakan beban mingguan (*weekly workload spike* $> 15\%$).
- **Bidirectional Soft Guardrail & Pengecualian Pemulihan**:
  - Mengurangi efek interferensi molekuler AMPK vs mTORC1 (Hickson 1980, Baar 2014) antara latihan kaki berat dan lari intensitas tinggi.
  - *Recovery Exemption*: Lari pemulihan aerobik Zona 1–2 $\le 45$ menit tetap diizinkan terlepas dari status kelelahan kaki.
  - Fleksibilitas atlet: Peringatan bersifat persuasif dengan opsi konfirmasi mandiri (*override*).
- **Universal Session RPE & Edwards TRIMP**:
  - Model Foster et al. (2001) untuk penyatuan beban multi-modalitas latihan.
  - Edwards Heart Rate TRIMP (1993) dengan formula HR max Tanaka / Gellish dan protokol Karvonen HRR.
- **Normalisasi Skor Kesiapan Biologis Baseline Personal**:
  - Menghitung deviasi Z-score personal setelah 14 hari pencatatan untuk menghilangkan bias subjektif atlet.
  - Deteksi dan peringatan khusus nyeri tendon/jaringan lunak.
- **Mesin Nutrisi & Komposisi Tubuh Atlet Hibrida**:
  - Kalkulasi BMR Mifflin-St Jeor (1990) dan TDEE terintegrasi pengeluaran kalori latihan aktual.
  - Target makronutrien terukur: Protein berbasis bukti 1.6–2.2 g/kg (Morton 2018), karbohidrat periodik (Burke 2011), dan protokol hidrasi ACSM (Sawka 2007).
- **Periodisasi Kompetisi & Model Tapering**:
  - Penyesuaian volume otomatis berdasarkan target tanggal lomba (*Race Target*).
  - Protokol tapering eksponensial (Mujika & Padilla 2003) dengan pemotongan volume 40%–50% tanpa menurunkan intensitas.
- **Double Progression Model & Timer Istirahat**:
  - Progresi beban otomatis untuk latihan tubuh atas (+2.5 kg) dan tubuh bawah (+5.0 kg) saat target repetisi tercapai pada RPE $\le 8$ (Helms 2016).
  - Timer istirahat interaktif dengan audio beeps Web Audio API.
- **Privasi & Penyimpanan Data 100% Offline-First**:
  - Semua data atlet tersimpan lokal di peramban menggunakan IndexedDB via Dexie.js.
  - Fitur ekspor/impor cadangan JSON yang divalidasi ketat menggunakan Zod schema.
- **Gemini AI Athletic Coach dengan Protokol Keamanan Berlapis**:
  - Arsitektur fleksibel: Bring Your Own Key (BYOK) langsung di browser atau via proksi lokal aman.
  - *Emergency Medical Interception*: Mendeteksi keluhan medis kritis (nyeri dada, fraktur, vertigo) dan mengalihkan ke layanan darurat tanpa konsultasi AI.
  - Sanitasi telemetri: Data riwayat beban dianonimkan sebelum dikirimkan ke model.
- **Design System Standar Atletik**:
  - Dark mode pekat (`#09090b` kanvas, `#18181c` permukaan, aksen volt `#CCFF00`).
  - Tipografi tegas dan hierarki visual berbasis data.
  - Audit aksesibilitas WCAG AA (axe-core) untuk 4 kartu utama.

---

## Arsitektur Sistem

```
d:/p/
├── docs/
│   └── science.md             # Dokumentasi matematis & referensi ilmiah lengkap
├── src/
│   ├── components/            # Komponen UI atletik
│   │   ├── ui/                # Primitif bersama: Modal, Button, Card, Badge
│   │   ├── WorkloadAdvisorCard.tsx
│   │   ├── TrendsDashboardCard.tsx
│   │   ├── NutritionBodyCompCard.tsx
│   │   ├── PeriodizationTaperCard.tsx
│   │   ├── WorkoutLogger.tsx
│   │   ├── ScheduleCustomizer.tsx
│   │   ├── SmartwatchSyncCard.tsx
│   │   ├── GeminiCoachWidget.tsx
│   │   ├── GuardrailOverrideModal.tsx
│   │   ├── AICoachSettingsModal.tsx
│   │   ├── AboutDisclaimerModal.tsx
│   │   ├── DataManagementModal.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useWorkoutEngine.ts # State orkestrator & integrasi Dexie IndexedDB
│   ├── lib/
│   │   ├── ai/
│   │   │   └── geminiCoach.ts # Interseptor keamanan, filter domain & API runner
│   │   ├── db/
│   │   │   ├── database.ts    # Skema Dexie IndexedDB
│   │   │   └── exportImport.ts# Validasi Zod & utilitas cadangan
│   │   └── engine/            # Mesin komputasi sains murni (Pure Functions)
│   │       ├── constants.ts   # Nilai empiris & sitasi literatur
│   │       ├── workload.ts    # ACWR, sRPE, TRIMP, Soft Guardrail, Readiness
│   │       ├── nutrition.ts   # BMR, TDEE, Makro, Hidrasi
│   │       ├── periodization.ts # Fase kompetisi & tapering
│   │       ├── doubleProgression.ts # Rekomendasi kenaikan beban
│   │       └── ... (engine murni, tanpa dependensi DOM)
│   ├── scripts/
│   │   └── test-engine.ts     # Skrip verifikasi CLI mandiri (39 test)
│   ├── test/
│   │   ├── setup.ts           # Konfigurasi JSDOM, AudioContext, MatchMedia mocks
│   │   └── a11y.test.tsx      # Pengujian aksesibilitas otomatis axe-core
│   └── types/                 # Definisi tipe TypeScript ketat
```

---

## Panduan Instalasi & Penggunaan

### 1. Prasyarat
- Node.js versi 18.x atau lebih baru
- npm versi 9.x atau lebih baru

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/raakaprx/rkstride.git
cd rkstride
npm install
```

### 3. Konfigurasi Environment Variables (Opsional)
Untuk mengaktifkan asisten AI bawaan melalui server:
```env
VITE_GEMINI_API_KEY=masukkan_api_key_gemini_anda_di_sini
```
*(Catatan: kunci API saat ini dibaca dari environment variable. Modal pengaturan API key di dalam aplikasi direncanakan pada Phase 5.)*

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser pada alamat `http://localhost:5173`.

### 5. Membangun untuk Produksi
```bash
npm run build
```
Hasil build siap di-*deploy* pada direktori `dist/`.

---

## Menjalankan Pengujian (Testing Suite)

RKStride dilengkapi dengan suite pengujian komprehensif yang mencakup unit test, property-based testing (fast-check), pengujian integrasi komponen (RTL), dan audit aksesibilitas (axe-core).

### Menjalankan Suite Vitest Lengkap (80 Test)
```bash
npm test
```
Suite ini memverifikasi:
- `src/lib/engine/__tests__/workload.test.ts` (33 unit test logika beban, ambang 1.4, audit jadwal)
- `src/lib/engine/__tests__/workload.property.test.ts` (5 property-based test invariant batas numerik)
- `src/lib/engine/__tests__/nutrition.test.ts` (9 unit test mesin nutrisi)
- `src/lib/engine/__tests__/periodization.test.ts` (5 unit test periodisasi & taper)
- `src/lib/engine/__tests__/doubleProgression.test.ts` (5 unit test progresi beban)
- `src/lib/ai/__tests__/geminiCoach.test.ts` (7 test filter domain, red-flag medis & engine offline)
- `src/hooks/__tests__/useWorkoutEngine.test.ts` (2 test persistensi flag override guardrail)
- `src/components/__tests__/WorkoutLogger.test.tsx` (4 test interaksi form & katalog)
- `src/components/__tests__/Dashboard.test.tsx` (6 test variasi status beban historis)
- `src/test/a11y.test.tsx` (4 audit aksesibilitas WCAG AA axe-core, termasuk kontras warna)

### Menjalankan Standalone Sports Science Engine CLI Suite (39 Test)
```bash
npm run test:engine
```
Suite deterministik berbasis CLI tanpa dependensi DOM untuk memverifikasi akurasi matematis seluruh formula fisiologis.

### Dukungan Offline / PWA
Build produksi (`npm run build`) menghasilkan ikon PWA (`public/pwa-*.png`,
dibuat via `scripts/generate-pwa-icons.mjs`) dan service worker app-shell
(`public/sw.js`, didaftarkan otomatis hanya pada mode produksi).

---

## Lisensi & Hak Cipta

Dilisensikan di bawah [MIT License](LICENSE).
Dokumentasi sains lengkap tersedia di [docs/science.md](docs/science.md).
