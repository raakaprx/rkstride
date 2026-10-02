# RKStride Sports Science & Mathematical Engine Reference

Dokumentasi komprehensif mengenai formulasi matematis, batas empiris, asumsi fisiologis, dan landasan literatur ilmiah yang mendasari mesin komputasi **RKStride** (*Pulse Hybrid Athletics*).

---

## ⚠️ Disclaimer Non-Medis & Batasan Algoritma

> **PERINGATAN NON-MEDIS:**
> Seluruh metrik, indeks rasio beban (*Acute:Chronic Workload Ratio*), estimasi TRIMP, rekomendasi periodisasi, dan skor kesiapan biologis yang dihitung oleh platform ini berfungsi eksklusif sebagai **alat bantu pengambilan keputusan latihan (*decision-support tool*) dan indikator risiko beban kerja**. Platform ini **TIDAK** mendiagnosis, mengobati, memulihkan, maupun mencegah cedera atau kondisi medis apapun. Hubungan antara beban latihan dan risiko cedera bersifat probabilistik multifaktorial, bukan deterministik kausal. Konsultasikan selalu dengan dokter spesialis kedokteran olahraga atau fisioterapis berlisensi sebelum mengambil keputusan pelatihan ekstrem atau jika merasakan gejala abnormal.

---

## Daftar Isi
1. [Metrik Beban Sesi Latihan (Training Load Metrics)](#1-metrik-beban-sesi-latihan)
   - [Universal Session RPE (Foster et al., 2001)](#11-universal-session-rpe-foster-et-al-2001)
   - [Secondary Volume Load Angkat Beban](#12-secondary-volume-load-angkat-beban)
   - [Edwards Heart Rate TRIMP (Edwards, 1993)](#13-edwards-heart-rate-trimp-edwards-1993)
   - [Norwegian 4x4 Interval Protocol & Karvonen HRR](#14-norwegian-4x4-interval-protocol--karvonen-hrr)
2. [Model Manajemen Beban: Acute:Chronic Workload Ratio (ACWR)](#2-model-manajemen-beban-acwr)
   - [Coupled vs Uncoupled Rolling Average (Gabbett, 2016 vs Windt & Gabbett, 2019)](#21-coupled-vs-uncoupled-rolling-average)
   - [Exponentially Weighted Moving Average / EWMA (Williams et al., 2017)](#22-exponentially-weighted-moving-average-ewma)
   - [Kritik Metodologis Impellizzeri et al. (2020) & Solusi RKStride](#23-kritik-metodologis-impellizzeri-et-al-2020)
   - [Zona Toleransi Beban & Deteksi Lonjakan Mingguan](#24-zona-toleransi-beban--deteksi-lonjakan-mingguan)
3. [Interference Effect & Pelindung Kaki Adaptif](#3-interference-effect--pelindung-kaki-adaptif)
   - [Jalur Molekuler AMPK vs mTORC1 (Hickson, 1980; Baar, 2014)](#31-jalur-molekuler-ampk-vs-mtorc1)
   - [Aturan Soft Guardrail Dua Arah (Bidirectional)](#32-aturan-soft-guardrail-dua-arah)
4. [Skor Kesiapan Biologis & Z-Score Baseline Personal](#4-skor-kesiapan-biologis-baseline-personal)
   - [Normalisasi Z-Score untuk Subjektivitas Atlet](#41-normalisasi-z-score-atlet)
   - [Peringatan Nyeri Tendon & Jaringan Lunak](#42-peringatan-nyeri-tendon--jaringan-lunak)
5. [Estimasi Kekuatan Maksimal (1RM) & Volume Otot](#5-estimasi-kekuatan-maksimal-1rm--volume-otot)
   - [Formula Epley (1985) & Brzycki (1993)](#51-formula-epley--brzycki)
   - [Beban Volume Set Keras Mingguan](#52-beban-volume-set-keras-mingguan)
6. [Mesin Nutrisi & Kebutuhan Energi Atlet Hibrida](#6-mesin-nutrisi--kebutuhan-energi-atlet-hibrida)
   - [Basal Metabolic Rate: Mifflin-St Jeor (1990)](#61-basal-metabolic-rate-bmr)
   - [Total Daily Energy Expenditure (TDEE)](#62-total-daily-energy-expenditure-tdee)
   - [Distribusi Makronutrien: Protein, Karbohidrat, Lemak](#63-distribusi-makronutrien)
   - [Kebutuhan Hidrasi Harian & Penggantian Keringat (Sawka et al., 2007)](#64-kebutuhan-hidrasi-harian)
7. [Periodisasi Kompetisi & Strategi Tapering](#7-periodisasi-kompetisi--strategi-tapering)
   - [Fase Periodisasi Kompetisi](#71-fase-periodisasi-kompetisi)
   - [Dinamika Pengurangan Volume Taper (Mujika & Padilla, 2003)](#72-dinamika-pengurangan-volume-taper)
8. [Progresi Beban: Double Progression Model](#8-progresi-beban-double-progression-model)
9. [Daftar Referensi Ilmiah](#9-daftar-referensi-ilmiah)

---

## 1. Metrik Beban Sesi Latihan

Beban latihan internal (*internal training load*) dan eksternal (*external training load*) dihitung secara terpisah untuk strength training dan endurance running sebelum dikonversikan ke dalam unit beban universal harian (*workload units* / arbitrary units - AU).

### 1.1 Universal Session RPE (Foster et al., 2001)

Untuk menyatukan modalitas latihan yang berbeda (angkat beban, lari, mobilitas, kalistenik) ke dalam satu mata uang beban akumulatif, RKStride mengimplementasikan model **Session RPE** dari Carl Foster et al. (2001).

$$\text{Workload}_{\text{sRPE}} = \text{Durasi (menit)} \times \text{RPE}_{\text{CR-10}}$$

- **Durasi**: Total durasi bersih sesi dalam satuan menit.
- **$\text{RPE}_{\text{CR-10}}$**: Nilai *Borg Category-Ratio Scale* (1 s.d. 10).
- **Asumsi Fisiologis**: Mengukur persepsi usaha psikofisik keseluruhan sistem kardiorespirasi dan neuromuskular yang berkorelasi tinggi dengan akumulasi asam laktat darah dan denyut jantung rata-rata.

### 1.2 Secondary Volume Load Angkat Beban

Sebagai metrik beban eksternal sekunder untuk hipertrofi dan stimulasi neuromuskular lokal:

$$\text{Volume Load} = \sum_{i=1}^{n} \left( \text{Beban}_i \times \text{Repetisi}_i \right)$$

Di mana $n$ adalah total set kerja (*work sets*) yang dilakukan, tidak termasuk pemanasan ringan (*warm-up sets*).

### 1.3 Edwards Heart Rate TRIMP (Edwards, 1993)

Jika atlet berlari menggunakan monitor detak jantung (*chest strap* atau *optical HR sensor*), beban sesi dikuantifikasi menggunakan metode **Edwards Training Impulse (TRIMP)**:

$$\text{TRIMP}_{\text{Edwards}} = \sum_{z=1}^{5} \left( D_z \times w_z \right)$$

Di mana:
- $D_z$ adalah akumulasi durasi waktu (dalam menit) yang dihabiskan pada zona detak jantung $z$.
- $w_z$ adalah koefisien bobot eksponensial Edwards:
  - Zona 1 ($50\% - 60\% \text{ HR}_{\max}$): $w_1 = 1$
  - Zona 2 ($60\% - 70\% \text{ HR}_{\max}$): $w_2 = 2$
  - Zona 3 ($70\% - 80\% \text{ HR}_{\max}$): $w_3 = 3$
  - Zona 4 ($80\% - 90\% \text{ HR}_{\max}$): $w_4 = 4$
  - Zona 5 ($90\% - 100\% \text{ HR}_{\max}$): $w_5 = 5$

### 1.4 Norwegian 4x4 Interval Protocol & Karvonen HRR

Untuk atlet yang menghitung ambang batas detak jantung spesifik berdasarkan kapasitas fisiologis istirahat, zona dapat ditentukan menggunakan **Heart Rate Reserve (HRR) Karvonen**:

$$\text{HRR} = \text{HR}_{\max} - \text{HR}_{\text{rest}}$$
$$\text{Target HR} = \text{HR}_{\text{rest}} + (\% \text{ Intensitas} \times \text{HRR})$$

Estimasi $\text{HR}_{\max}$ menggunakan formula Tanaka et al. (2001):
$$\text{HR}_{\max,\text{Tanaka}} = 208 - (0.7 \times \text{Umur})$$

Atau Gellish et al. (2007) untuk populasi umum:
$$\text{HR}_{\max,\text{Gellish}} = 207 - (0.7 \times \text{Umur})$$

**Protokol Interval Norwegian 4x4 (Helgerud et al., 2007):**
- 10 menit pemanasan (Zona 2, $\approx 65\% - 75\% \text{ HR}_{\max}$)
- $4 \times 4$ menit interval kerja keras (Zona 4/5, $90\% - 95\% \text{ HR}_{\max}$) diselingi 3 menit *active recovery* (Zona 1/2, $\approx 70\% \text{ HR}_{\max}$)
- 5 menit pendinginan (Zona 1)
- *Total Edwards TRIMP tipikal*: $\approx 114\text{ AU}$.

---

## 2. Model Manajemen Beban: ACWR

Acute:Chronic Workload Ratio (ACWR) membandingkan beban latihan jangka pendek (kelelahan / *fatigue*) dengan kapasitas kebugaran jangka panjang (*fitness*) atlet berdasarkan teori Banister *Fitness-Fatigue Model* (1975).

$$\text{Kapasitas Performa} = \text{Fitness} - \text{Fatigue}$$

### 2.1 Coupled vs Uncoupled Rolling Average

#### A. Coupled Rolling Average (Gabbett, 2016)
Beban akut (7 hari terakhir) dibagi rata-rata 28 hari terakhir, di mana jendela 7 hari termasuk di dalam rata-rata 28 hari:

$$\text{Load}_{\text{acute}} = \frac{1}{7} \sum_{i=0}^{6} L_{t-i}$$
$$\text{Load}_{\text{chronic, coupled}} = \frac{1}{28} \sum_{j=0}^{27} L_{t-j}$$
$$\text{ACWR}_{\text{coupled}} = \frac{\text{Load}_{\text{acute}}}{\text{Load}_{\text{chronic, coupled}}}$$

#### B. Uncoupled Rolling Average (Windt & Gabbett, 2019)
Memisahkan beban 7 hari terkini dari jendela historis untuk mengeliminasi korelasi matematis artifisial (*mathematical coupling*):

$$\text{Load}_{\text{chronic, uncoupled}} = \frac{1}{21} \sum_{j=7}^{27} L_{t-j}$$
$$\text{ACWR}_{\text{uncoupled}} = \frac{\text{Load}_{\text{acute}}}{\text{Load}_{\text{chronic, uncoupled}}}$$

### 2.2 Exponentially Weighted Moving Average (EWMA)

Model EWMA memberikan bobot yang meluruh secara eksponensial seiring bertambahnya waktu, mencerminkan peluruhan biologis kelelahan dan kebugaran (Williams et al., 2017; Hunter, 1986).

Faktor peluruhan ($\lambda_N$) untuk periode $N$ hari didefinisikan sebagai:
$$\lambda_N = \frac{2}{N + 1}$$

Beban EWMA pada hari $t$ ($EMWA_t$) dihitung secara rekursif:
$$\text{EWMA}_t = L_t \times \lambda_N + \text{EWMA}_{t-1} \times (1 - \lambda_N)$$

- Untuk Beban Akut ($N = 7$ hari): $\lambda_7 = \frac{2}{7 + 1} = 0.25$
- Untuk Beban Kronis ($N = 28$ hari): $\lambda_{28} = \frac{2}{28 + 1} \approx 0.069$

Rasio EWMA dihitung dengan:
$$\text{ACWR}_{\text{EWMA}} = \frac{\text{EWMA}_{\text{acute}, t}}{\text{EWMA}_{\text{chronic}, t}}$$

### 2.3 Kritik Metodologis Impellizzeri et al. (2020) & Solusi RKStride

Impellizzeri et al. (2020) dan Lolli et al. (2019) mempublikasikan kritik tajam terhadap ACWR, menyoroti beberapa kelemahan fundamental:
1. **Artefak Matematika**: Pembagian rasio ($A/C$) rentan terhadap variansi palsu ketika penyebut ($C$) sangat kecil.
2. **Ketiadaan Hubungan Kausal Langsung**: ACWR bukan peramal cedera pasti (*fallacy of prediction*); cedera adalah proses biologis yang dipengaruhi faktor biomekanik, riwayat cedera, usia, dan anatomi.
3. **Efek Cold-Start**: Atlet pemula atau yang baru mencatat data 3–14 hari akan memiliki nilai ACWR semu yang sangat volatil dan tidak mencerminkan fisiologi sebenarnya.

#### Solusi RKStride:
- **Perlindungan Cold-Start**: Sistem menolak menghasilkan rasio ACWR jika riwayat data $< 21$ hari, menandai status sebagai `"insufficient_data"` dan menampilkan persentase kematangan data ($N / 21 \times 100\%$).
- **Bahasa Probabilistik Non-Deterministik**: UI tidak pernah mengklaim "mencegah cedera", melainkan "indikator risiko lonjakan beban kerja" dan "alat bantu keputusan".
- **Dukungan Tiga Model**: Pengguna dapat memilih model *Coupled*, *Uncoupled*, atau *EWMA*.

### 2.4 Zona Toleransi Beban & Deteksi Lonjakan Mingguan

Berdasarkan konsensus empiris Gabbett (2016) dan Blanch & Gabbett (2016):

| Rentang ACWR | Klasifikasi Status | Implikasi Fisiologis | Rekomendasi Sistem |
| :--- | :--- | :--- | :--- |
| $\text{ACWR} < 0.8$ | Under-training | Kapasitas kebugaran mengalami detraining atau pemulihan berlebih | Rekomendasi peningkatan beban bertahap |
| $0.8 \le \text{ACWR} \le 1.3$ | Sweet Spot | Keseimbangan optimal stimulasi kebugaran dan kelelahan | Lanjutkan program latihan progresif |
| $1.3 < \text{ACWR} \le 1.5$ | Warning Zone | Kelelahan mulai menumpuk melampaui adaptasi kronis | Pantau tidur dan kurangi volume aksesori |
| $\text{ACWR} > 1.5$ | Danger Zone (Spike) | Lonjakan beban akut signifikan; risiko overload jaringan | Rekomendasi sesi Deload / Recovery (cut volume 20% - 40%) |

**Deteksi Lonjakan Beban Mingguan (*Weekly Spike Alert*):**
Jika total beban 7 hari terkini ($W_0$) meningkat $> 15\%$ dibanding total beban 7 hari sebelumnya ($W_1$):
$$\Delta_{\text{spike}} = \frac{W_0 - W_1}{W_1} \times 100\% > 15\%$$
Sistem memicu sinyal peringatan lonjakan mingguan terlepas dari status rasio ACWR.

---

## 3. Interference Effect & Pelindung Kaki Adaptif

### 3.1 Jalur Molekuler AMPK vs mTORC1

Fenomena *Concurrent Training Interference Effect* pertama kali didokumentasikan secara ilmiah oleh Robert C. Hickson (1980) dan dielaborasi secara molekuler oleh Keith Baar (2014):

```
       Endurance Training (Running)              Heavy Resistance Training (PPL)
                    │                                           │
                    ▼                                           ▼
             High AMP:ATP Ratio                       Mechanical Tension / Leucine
                    │                                           │
                    ▼                                           ▼
             AMPK Activation                             Akt / mTORC1 Pathway
                    │                                           │
                    ▼                                           ▼
        Mitochondrial Biogenesis (PGC-1α)            Muscle Protein Synthesis (MPS)
                    │                                           │
                    └───► Phosphorylation of TSC2 ──────────────┘
                          (Menghambat Aktivasi mTORC1)
```

1. **Jalur AMPK (Endurance)**: Lari intensitas tinggi menguras glikogen dan mengaktifkan protein kinase AMPK, yang merangsang biogenesis mitokondria via PGC-1$\alpha$. Namun, AMPK memfosforilasi TSC2 yang secara langsung **menghambat** pensinyalan mTORC1.
2. **Jalur mTORC1 (Hipertrofi)**: Latihan beban merangsang tensi mekanis yang memicu sintesis protein otot via mTORC1.
3. **Waktu Pemulihan Neuromuskular**: Kerusakan membran serat otot (*exercise-induced muscle damage* - EIMD) dan penurunan fungsi *cross-bridge actin-myosin* pada otot paha/betis bertahan selama 24–48 jam pasca-sesi latihan kaki berat (*heavy squats, deadlifts*).

### 3.2 Aturan Soft Guardrail Dua Arah

RKStride menerapkan proteksi *Soft Guardrail* dua arah tanpa pernah memblokir kebebasan pengguna (*user override* selalu tersedia):

```
Arah 1: Sesi Kaki Berat (Legs) ──[ < 48 jam ]──► Sesi Lari Cepat (Interval/Tempo)
        => Tingkat Risiko: HIGH RISK
        => Tindakan: Kunci rekomendasi lari cepat, sarankan Zona 2 atau Istirahat Aktif
        => Pengecualian: Lari Zona 1-2 <= 45 menit selalu DISETUJUI (Tingkat Risiko: NONE)

Arah 2: Lari Cepat/Lompat Tinggi ──[ < 24 jam ]──► Sesi Kaki Berat (Squat/Deadlift)
        => Tingkat Risiko: HIGH RISK
        => Tindakan: Sarankan penundaan beban maksimal atau penggantian hari Upper Body
```

---

## 4. Skor Kesiapan Biologis Baseline Personal

### 4.1 Normalisasi Z-Score Atlet

Skor kesiapan harian biologis (*Bio-Readiness Score*) tidak mengasumsikan nilai rata-rata absolut populasi umum, melainkan mengukur deviasi individual menggunakan metode **Z-Score Normalization** setelah data matang minimal 14 hari:

$$Z_x = \frac{x - \mu_{14}}{\sigma_{14}}$$

Di mana:
- $x$ adalah nilai check-in harian (kualitas tidur, durasi tidur, kelelahan otot, stres mental).
- $\mu_{14}$ adalah rata-rata personal 14 hari terakhir.
- $\sigma_{14}$ adalah standar deviasi personal 14 hari terakhir (dijaga $\ge 0.5$ untuk mencegah pembagian dengan nol).

Skor gabungan $\text{Readiness} \in [0, 100]$:
$$\text{Readiness} = w_{\text{sleep}} \cdot S_{\text{sleep}} + w_{\text{soreness}} \cdot S_{\text{soreness}} + w_{\text{stress}} \cdot S_{\text{stress}} - P_{\text{tendon}}$$

- Jika data historis $< 7$ hari: Skor berstatus **Provisional** dengan fallback berbasis bobot linier empiris.
- Jika data historis $\ge 14$ hari: Skor menggunakan Z-Score personal yang dipetakan ke skala 0–100.

### 4.2 Peringatan Nyeri Tendon & Jaringan Lunak

Tendonitis dan tendinopati patela atau achilles berkembang melalui mekanisme *mechanotransduction* berlebih tanpa vaskularisasi yang cukup (Cook & Purdam, 2009). Jika atlet menandai nyeri tendon $\ge 2$ pada skala 1–5:
- Sistem mengeluarkan *Tendon Alert* khusus.
- Beban eksentrik cepat dan volume plyometric otomatis dikurangi dalam rekomendasi latihan harian.

---

## 5. Estimasi Kekuatan Maksimal (1RM) & Volume Otot

### 5.1 Formula Epley & Brzycki

Untuk menghitung estimasi satu repetisi maksimal (*One-Repetition Maximum* / 1RM) dari set latihan sub-maksimal ($r \le 10$):

#### Formula Epley (1985):
$$1\text{RM}_{\text{Epley}} = w \cdot \left(1 + \frac{r}{30}\right)$$

#### Formula Brzycki (1993):
$$1\text{RM}_{\text{Brzycki}} = w \cdot \frac{36}{37 - r}$$

Di mana $w$ adalah beban yang diangkat (kg) dan $r$ adalah jumlah repetisi yang diselesaikan hingga batas *fatigue*. RKStride menampilkan rata-rata dari kedua formula tersebut untuk stabilitas estimasi:
$$1\text{RM}_{\text{composite}} = \frac{1\text{RM}_{\text{Epley}} + 1\text{RM}_{\text{Brzycki}}}{2}$$

### 5.2 Beban Volume Set Keras Mingguan

Schoenfeld et al. (2017) menemukan hubungan kurvilinier dosis-respons antara jumlah set kerja keras per kelompok otot per minggu (*hard sets per muscle group per week*) dan hipertrofi otot:
- **Minimal Maintenance**: 4–6 set keras / minggu
- **Optimal Hypertrophy**: 10–20 set keras / minggu
- **Excessive / Overreaching**: $> 22$ set keras / minggu

---

## 6. Mesin Nutrisi & Kebutuhan Energi Atlet Hibrida

### 6.1 Basal Metabolic Rate (BMR)

RKStride mengadopsi formula **Mifflin-St Jeor (1990)** yang diakui oleh *Academy of Nutrition and Dietetics* sebagai formula BMR paling akurat secara klinis:

$$\text{BMR}_{\text{pria}} = (10 \times \text{BB}_{\text{kg}}) + (6.25 \times \text{TB}_{\text{cm}}) - (5 \times \text{Usia}_{\text{tahun}}) + 5$$
$$\text{BMR}_{\text{wanita}} = (10 \times \text{BB}_{\text{kg}}) + (6.25 \times \text{TB}_{\text{cm}}) - (5 \times \text{Usia}_{\text{tahun}}) - 161$$

### 6.2 Total Daily Energy Expenditure (TDEE)

Kebutuhan energi harian dihitung dengan mengalikan BMR terhadap faktor aktivitas non-latihan (*Physical Activity Level* / PAL), lalu menambahkan estimasi kalori latihan aktual:

$$\text{TDEE} = (\text{BMR} \times \text{PAL}_{\text{baseline}}) + \text{Kalori Sesi Latihan}$$

- Sedentary: $1.20$
- Lightly Active: $1.375$
- Moderately Active: $1.55$
- Very Active: $1.725$

Pengeluaran kalori lari diestimasikan via ACSM METs:
$$\text{Kalori Lari} \approx \text{Jarak (km)} \times \text{BB (kg)} \times 1.036$$

Pengeluaran kalori angkat beban:
$$\text{Kalori Strength} \approx \text{Durasi (menit)} \times \left(\frac{6.0 \times 3.5 \times \text{BB (kg)}}{200}\right)$$

### 6.3 Distribusi Makronutrien

1. **Protein (Morton et al., 2018; Helms et al., 2014)**:
   - Atlet hibrida membutuhkan sintesis protein otot sekaligus pemulihan enzim mitokondria:
   $$\text{Target Protein} = 1.6 \text{ s.d. } 2.2 \text{ g/kg BB}$$
2. **Karbohidrat (Burke et al., 2011)**:
   - Sebagai substrat utama glikolisis anaerobik dan pemulihan simpanan glikogen hati/otot:
   $$\text{Target Karbohidrat} = 4.0 \text{ s.d. } 7.0 \text{ g/kg BB (tergantung beban harian)}$$
3. **Lemak**:
   - Menjaga integritas hormon steroid dan absorpsi vitamin larut lemak:
   $$\text{Target Lemak} = 20\% - 30\% \text{ dari sisa total energi TDEE}$$

### 6.4 Kebutuhan Hidrasi Harian & Penggantian Keringat (Sawka et al., 2007)

Berdasarkan konsensus hidrasi *American College of Sports Medicine* (Sawka et al., 2007):

$$\text{Kebutuhan Air Baseline} = \text{BB (kg)} \times 35 \text{ mL/kg}$$
$$\text{Tambahan Latihan} = \text{Durasi Latihan (menit)} \times 12 \text{ mL/menit}$$
$$\text{Total Hidrasi (L)} = \frac{\text{Baseline} + \text{Tambahan Latihan}}{1000}$$

---

## 7. Periodisasi Kompetisi & Strategi Tapering

### 7.1 Fase Periodisasi Kompetisi

Jadwal periodisasi kompetisi (*Race Target Periodization*) dibagi menjadi empat fase:

```
[ > 12 Minggu ]          [ 4 - 12 Minggu ]           [ 1 - 3 Minggu ]          [ < 7 Hari ]
      │                         │                           │                       │
      ▼                         ▼                           ▼                       ▼
  Fase Base               Fase Peak / Build             Fase Taper              Fase Race Week
Kapasitas Aerobik        Beban Spesifik Rasio      Penurunan Volume Eksponensial  Aktivasi Neuromuskular
Volume Progresif         Intensitas Puncak 4x4       Intensitas Dipertahankan      Karbohidrat Loading
```

### 7.2 Dinamika Pengurangan Volume Taper (Mujika & Padilla, 2003)

Iñigo Mujika dan Sabino Padilla (2003) menunjukkan bahwa strategi *tapering* yang paling efektif untuk memulihkan kelelahan tanpa kehilangan adaptasi kebugaran kardiorespirasi adalah:
1. **Penurunan Volume Beban**: Kurangi volume total sebesar $40\% - 60\%$.
2. **Mempertahankan Intensitas**: Intensitas lari kunci (pace lomba) dan intensitas angkatan beban harus **dipertahankan**.
3. **Mempertahankan Frekuensi**: Frekuensi latihan diturunkan tidak lebih dari $20\%$.

$$\text{Volume}_{\text{taper}} = \text{Volume}_{\text{baseline}} \times (1 - \text{Taper Cut})$$
Di mana $\text{Taper Cut} \in [0.30, 0.50]$.

---

## 8. Progresi Beban: Double Progression Model

Untuk mencegah stagnasi kekuatan dan mengurangi risiko overexertion, RKStride menggunakan model **Double Progression** (Helms, 2016):

1. **Tahap 1 (Repetition Progression)**: Pertahankan beban (*weight* $w$), tingkatkan repetisi di setiap set hingga mencapai batas atas rentang repetisi target ($R_{\max}$, misal 12 repetisi) dengan $\text{RPE} \le 8$.
2. **Tahap 2 (Load Progression)**: Ketika seluruh set telah berhasil mencapai $R_{\max}$, tingkatkan beban:
   - Latihan Tubuh Atas (*Upper Body*): $+1.25\text{ s.d. } 2.5\text{ kg}$
   - Latihan Tubuh Bawah / Compound (*Lower Body*): $+2.5\text{ s.d. } 5.0\text{ kg}$
   - Repetisi direset kembali ke batas bawah ($R_{\min}$, misal 8 repetisi).

---

## 9. Daftar Referensi Ilmiah

1. **Baar, K. (2014).** Using molecular biology to maximize concurrent training. *Sports Medicine*, 44(Suppl 2), S117-S125.
2. **Banister, E. W., et al. (1975).** A systems model of training for athletic performance. *Australian Journal of Sports Medicine*, 7(3), 57-61.
3. **Blanch, P., & Gabbett, T. J. (2016).** Has the code been cracked? The nut-shell guide to the acute:chronic workload ratio and injury prevention. *British Journal of Sports Medicine*, 50(8), 471-475.
4. **Brzycki, M. (1993).** Strength testing—predicting a one-rep max from reps-to-fatigue. *Journal of Physical Education, Recreation & Dance*, 64(1), 88-90.
5. **Burke, L. M., et al. (2011).** Carbohydrates for training and competition. *Journal of Sports Sciences*, 29(Suppl 1), S17-S27.
6. **Cook, J. L., & Purdam, C. R. (2009).** Is tendon pathology a continuum? A pathology model to explain the clinical presentation of load-induced tendinopathy. *British Journal of Sports Medicine*, 43(6), 409-416.
7. **Edwards, S. (1993).** *High performance training and racing*. In: Edwards S, ed. The Heart Rate Monitor Book. Sacramento, CA: Feet Fleet Press, 113-123.
8. **Epley, B. (1985).** *Poundage Chart*. Lincoln, NE: Boyd Epley Workout.
9. **Foster, C., et al. (2001).** A new approach to monitoring exercise training. *Journal of Strength and Conditioning Research*, 15(1), 109-115.
10. **Gabbett, T. J. (2016).** The training—injury prevention paradox: should athletes be training smarter and harder? *British Journal of Sports Medicine*, 50(5), 273-280.
11. **Gellish, R. L., et al. (2007).** Longitudinal modeling of the relationship between age and maximal heart rate. *Medicine & Science in Sports & Exercise*, 39(5), 822-829.
12. **Helgerud, J., et al. (2007).** Aerobic high-intensity intervals improve VO2max more than moderate training. *Medicine & Science in Sports & Exercise*, 39(4), 665-671.
13. **Helms, E. R., et al. (2014).** Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. *Journal of the International Society of Sports Nutrition*, 11, 20.
14. **Helms, E. R. (2016).** *The Muscle and Strength Pyramid: Training*. 2nd ed.
15. **Hickson, R. C. (1980).** Interference of strength development by simultaneously training for strength and endurance. *European Journal of Applied Physiology and Occupational Physiology*, 45(2-3), 255-263.
16. **Hunter, J. S. (1986).** The exponentially weighted moving average. *Journal of Quality Technology*, 18(4), 203-210.
17. **Impellizzeri, F. M., et al. (2020).** The acute:chronic workload ratio—inconsistencies and challenges. *Sports Medicine*, 50(7), 1251-1263.
18. **Lolli, L., et al. (2019).** The acute-to-chronic workload ratio: An inaccurate method for index calculation and misleading injury risk estimate. *Journal of Science and Medicine in Sport*, 22(6), 650-651.
19. **Mifflin, M. D., St Jeor, S. T., et al. (1990).** A new predictive equation for resting energy expenditure in healthy individuals. *The American Journal of Clinical Nutrition*, 51(2), 241-247.
20. **Morton, R. W., et al. (2018).** A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *British Journal of Sports Medicine*, 52(6), 376-384.
21. **Mujika, I., & Padilla, S. (2003).** Scientific bases for precompetition tapering: a review. *International Journal of Sports Medicine*, 24(7), 479-487.
22. **Sawka, M. N., et al. (2007).** American College of Sports Medicine position stand: Exercise and fluid replacement. *Medicine & Science in Sports & Exercise*, 39(2), 377-390.
23. **Schoenfeld, B. J., et al. (2017).** Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis. *Journal of Sports Sciences*, 35(11), 1073-1082.
24. **Tanaka, H., et al. (2001).** Age-predicted maximal heart rate revisited. *Journal of the American College of Cardiology*, 37(1), 153-156.
25. **Williams, S., et al. (2017).** Better way to determine the acute:chronic workload ratio? *British Journal of Sports Medicine*, 51(3), 209-210.
26. **Windt, J., & Gabbett, T. J. (2019).** Is it all for naught? What the acute:chronic workload ratio can and cannot tell us about injury risk. *British Journal of Sports Medicine*, 53(7), 389-390.
