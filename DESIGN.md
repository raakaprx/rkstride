# DESIGN.md — RKStride / PULSE Hybrid Athletics

Sumber arah visual tunggal. Filter antislop (`antislop`) bekerja DI ATAS dokumen ini:
arah memberi jiwa, filter menolak slop.

## Identitas

Dasbor performa atletik untuk atlet hibrida (kekuatan Push-Pull-Legs + lari
ketahanan). Nada: disiplin, jujur pada data, kontras tinggi. Tidak ada angka
yang tidak diukur, tidak ada klaim tanpa bukti.

## Kepribadian

- Disiplin ketimbang meriah: panel gelap tenang, satu aksen volt pada momen kunci.
- Jujur ketimbang mengesankan: empty state eksplisit, label estimasi, bukan angka hiasan.
- Ilmiah ketimbang pemasaran: sitasi model (Gabbett, Foster, Edwards) di tempat yang relevan.

## Palet

| Token | Nilai | Pakai |
|---|---|---|
| `--bg-primary` | `#0B0B0B` | Kanvas |
| `--bg-surface` | `#171717` | Kartu & modal |
| `--border-default` | `#262626` | Batas |
| `--accent-neon` | `#CCFF00` | Aksen tunggal: CTA primer, badge status kunci, penanda meter |
| `--color-success` / `--color-warning` / `--color-danger` / `--color-info` | hijau / amber / merah / biru | Status beban & biometrik saja |
| `--text-muted` | `#94A3B8` | Teks sekunder (lolos WCAG AA di permukaan gelap) |

Maksimal 2-3 warna inti + 1 aksen per layar (R-29). Aksen volt hanya di momen
kunci, tidak di semua elemen (satu aksen disengaja).

## Tipografi

- Display: Syne (angka besar, judul), Heading: Space Grotesk, Body: Plus Jakarta Sans,
  masing-masing dengan fallback stack sistem.
- Alasan: geometris-tegas untuk angka performa, humanis-terbaca untuk narasi
  latihan (R-06, R-31).
- Batas bawah 12px (`0.75rem`) untuk semua teks UI.

## Dial (Part 3)

> Reading this as: athletic performance dashboard for hybrid strength+endurance
> athletes, in a disciplined dark high-contrast style, dial
> **ENERGY 2 / RHYTHM 2 / MOTION 1**.

- ENERGY 2 (seimbang): sapaan tegas lewat angka ACWR besar, bukan dekorasi.
- RHYTHM 2 (konsisten dengan jeda): kartu berulang untuk metrik, diselingi
  panel rekomendasi full-width dan banner peringatan.
- MOTION 1 (tenang): hover state saja; tanpa loop/pulse abadi (R-19).

## Motif identitas

- Jarum meter ACWR + pita zona (0.8 / 1.4) sebagai bahasa visual berulang.
- Garis tepi kiri berwarna HANYA sebagai penanda status nyata
  (bahaya/peringatan/sweet-spot), bukan dekorasi.

## Suara tulisan

- Primer Bahasa Indonesia; istilah teknis Inggris dipertahankan
  (ACWR, Norwegian 4x4, Zone 2, deload, progressive overload).
- Tanpa emoji di UI produksi; tanpa em dash; CTA spesifik menyebut aksi
  ("Catat sesi pertama", "Pilih file latihan").

## Aturan keras turunan

- Setiap warna di komponen via `var(--token)`; nol literal hex di `src/components`.
- Setiap modal memakai primitif `ui/Modal` (dialog, Escape, focus trap).
- Setiap komponen data punya empty/loading/error state.
- Target sentuh minimum 44px; fokus keyboard selalu terlihat.
