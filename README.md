# RKStride (Pulse Hybrid Athletics)

RKStride adalah platform manajemen beban latihan hibrida tingkat lanjut yang mengawinkan program kekuatan (Push-Pull-Legs) dengan lari ketahanan (Endurance Running). Dibangun di atas fondasi *sports science* modern, RKStride mencegah *overtraining* dan cedera melalui kalkulasi beban kerja yang presisi.

## 🚀 Latar Belakang

Banyak atlet rekreasional mengalami kesulitan saat menggabungkan latihan angkat beban dan lari. Seringkali, latihan kaki (Leg day) yang berat dilakukan terlalu dekat dengan sesi lari interval, yang menyebabkan *Interference Effect* (efek gangguan adaptasi) dan meningkatkan risiko cedera. 

RKStride memecahkan masalah ini dengan mesin **Acute:Chronic Workload Ratio (ACWR)** yang memantau beban latihan harian Anda dan secara cerdas memberikan peringatan jika Anda berada di zona bahaya.

## ✨ Fitur Utama

- **Mesin Kalkulasi ACWR (Dr. Tim Gabbett)**: Memantau rasio beban latihan akut (7 hari) terhadap beban kronis (28 hari) untuk menjaga Anda di zona adaptasi yang aman (0.8 - 1.3).
- **Pencegahan Interference Effect**: Sistem mengunci sesi lari intensitas tinggi jika mendeteksi latihan kaki (Legs) dalam 48 jam terakhir.
- **Universal Smartwatch Hub**: Antarmuka untuk mensimulasikan integrasi data dari perangkat wearable (seperti Mi Band, Garmin, Apple Watch) untuk mengambil data durasi, jarak, pace, dan detak jantung rata-rata.
- **Gemini AI Athletic Coach**: Asisten pelatih berbasis AI yang dibangun dengan `@google/genai`. Coach ini membaca data metrik tubuh Anda (ACWR, kelelahan, jadwal) secara *real-time* untuk memberikan saran nutrisi, pemulihan, dan strategi latihan.
- **Post-Workout Debrief**: Modal interaktif pasca-latihan yang memberikan umpan balik langsung mengenai skor beban latihan (TRIMP) dan rekomendasi hidrasi/pemulihan jaringan otot.
- **Modern Athletic Design**: UI gelap, minimalis, dan berfokus pada data. Sepenuhnya responsif untuk penggunaan di perangkat *mobile*.

## 🛠️ Tech Stack

- **Framework**: React 18 (Vite)
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, CSS Variables (Design Tokens)
- **Iconography**: Lucide React
- **Kecerdasan Buatan**: Google Gemini API (`@google/genai`)

## 📦 Panduan Instalasi (Setup)

Ikuti langkah-langkah berikut untuk menjalankan RKStride di mesin lokal Anda:

### 1. Kloning Repositori & Install Dependencies

```bash
# Install dependensi
npm install
```

### 2. Konfigurasi Environment Variables

Buat file `.env` di *root* direktori proyek dan tambahkan API Key Gemini Anda. Jika Anda tidak mengatur ini, aplikasi akan menggunakan mesin *fallback* luring bawaan.

```env
VITE_GEMINI_API_KEY=masukkan_api_key_gemini_anda_di_sini
```
*(Catatan: Anda juga bisa memasukkan API Key secara langsung melalui antarmuka Gemini Chat di dalam aplikasi)*

### 3. Jalankan Development Server

```bash
npm run dev
```

Buka browser dan navigasikan ke `http://localhost:5173` (atau port yang diberikan oleh Vite).

## 🧠 Arsitektur Logika (Sports Science Engine)

Mesin utama terletak di `src/hooks/useWorkoutEngine.ts` dan fungsi kalkulasi di `src/lib/calculations/`.
1. **TRIMP (Training Impulse)**: Menghitung beban dari sesi lari berdasarkan durasi, jarak, dan zona detak jantung.
2. **RPE Load**: Menghitung beban dari sesi angkat beban menggunakan skala *Rate of Perceived Exertion* (Volume x RPE).
3. **Readiness Score**: Mengkalkulasi kesiapan harian berdasarkan metrik tidur, kelelahan kaki, dan *soreness*.

---
*Didesain dan dibangun untuk performa atletik maksimal tanpa kompromi.*
