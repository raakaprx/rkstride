import React from 'react';
import { Moon, Heart, CheckCircle2, Activity, ShieldAlert, Info, Sparkles } from 'lucide-react';

interface DailyReadinessCheckInTabProps {
  localSleep: number;
  setLocalSleep: (val: number) => void;
  localRhr: number;
  setLocalRhr: (val: number) => void;
  localSoreness: 1 | 2 | 3 | 4 | 5;
  setLocalSoreness: (val: 1 | 2 | 3 | 4 | 5) => void;
  localLegFatigue: boolean;
  setLocalLegFatigue: (val: boolean) => void;
  localEnergy: 'low' | 'moderate' | 'high';
  setLocalEnergy: (val: 'low' | 'moderate' | 'high') => void;
  localHrv: number;
  setLocalHrv: (val: number) => void;
  localTendonPain: 0 | 1 | 2 | 3;
  setLocalTendonPain: (val: 0 | 1 | 2 | 3) => void;
  onApplyPreset: (key: 'normal' | 'fatigued' | 'peak') => void;
  onSaveCheckIn: () => void;
}

export const DailyReadinessCheckInTab: React.FC<DailyReadinessCheckInTabProps> = ({
  localSleep,
  setLocalSleep,
  localRhr,
  setLocalRhr,
  localSoreness,
  setLocalSoreness,
  localLegFatigue,
  setLocalLegFatigue,
  localEnergy,
  setLocalEnergy,
  localHrv,
  setLocalHrv,
  localTendonPain,
  setLocalTendonPain,
  onApplyPreset,
  onSaveCheckIn,
}) => {
  // Label & badge status dinamis untuk memandu atlet
  const getSleepBadge = (hrs: number) => {
    if (hrs < 6) return { text: 'Kurang Tidur (Kapasitas -25%)', color: 'var(--color-danger)' };
    if (hrs < 7) return { text: 'Cukup (Pemulihan Parsial)', color: 'var(--color-warning)' };
    if (hrs <= 9) return { text: 'Optimal (Pemulihan Saraf Penuh)', color: 'var(--color-success)' };
    return { text: 'Tidur Panjang (Sangat Segar)', color: 'var(--accent-neon)' };
  };

  const getRhrBadge = (bpm: number) => {
    if (bpm <= 54) return { text: 'Baseline Atletik Prima', color: 'var(--color-success)' };
    if (bpm <= 62) return { text: 'Stabil Normal', color: 'var(--text-secondary)' };
    if (bpm <= 70) return { text: 'Agak Tinggi (Kelelahan Ringan)', color: 'var(--color-warning)' };
    return { text: 'Tinggi (Stres / Tubuh Belum Pulih)', color: 'var(--color-danger)' };
  };

  const getSorenessLabel = (val: 1 | 2 | 3 | 4 | 5) => {
    switch (val) {
      case 1:
        return { label: '1 - Segar Bugar', desc: 'Tidak ada pegal sama sekali. Aman untuk latihan berat & lari cepat.' };
      case 2:
        return { label: '2 - Pegal Ringan', desc: 'Sedikit terasa pasca latihan kemarin, otot siap menerima beban normal.' };
      case 3:
        return { label: '3 - Pegal Sedang (Lari Cepat Dikunci)', desc: 'Pegal cukup terasa di paha/betis. Lari cepat/interval dikunci demi keselamatan lutut.' };
      case 4:
        return { label: '4 - Sangat Pegal (DOMS Berat)', desc: 'Otot kaku dan nyeri saat ditekan. Disarankan lari santai Zone 2 atau istirahat aktif.' };
      case 5:
        return { label: '5 - Nyeri Hebat / Sulit Jongkok', desc: 'Kerusakan serat otot signifikan. Wajib pemulihan penuh atau deload.' };
    }
  };

  const sleepStatus = getSleepBadge(localSleep);
  const rhrStatus = getRhrBadge(localRhr);
  const sorenessInfo = getSorenessLabel(localSoreness);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Banner Panduan Edukatif & Penjelasan Konsep */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Info size={20} style={{ color: 'var(--accent-neon)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Panduan Check-in Kesiapan &amp; Telemetri Pagi
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          <strong>Mengapa angka-angka ini dibutuhkan?</strong> Tubuh atlet hibrida menggabungkan angkat beban keras dan lari. Setiap pagi, jam biologis Anda memberikan sinyal pemulihan (denyut nadi saat bangun tidur, durasi tidur, dan pegal otot). RKStride membaca metrik ini untuk menghitung <em>Skor Kesiapan</em> harian, melindungi sendi lutut dari cedera, dan otomatis menyesuaikan target latihan hari ini.
        </p>
        <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          &bull; <strong>Punya Jam Pintar?</strong> Cukup lihat 3 angka di layar jam Anda saat bangun tidur (Durasi Tidur, RHR, dan HRV), lalu geser slider di bawah.<br />
          &bull; <strong>Tidak Memakai Jam?</strong> Gunakan tombol <em>Preset Cepat</em> di bagian bawah untuk memilih kondisi tubuh Anda secara instan.
        </div>
      </div>

      {/* Grid 6 Kartu Metrik dengan Penjelasan Spesifik */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '1rem',
        }}
      >
        {/* 1. Durasi Tidur */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Moon size={16} style={{ color: 'var(--color-info)' }} />
              1. Durasi Tidur Malam
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>{localSleep} Jam</strong>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sleepStatus.color }}>
            &bull; {sleepStatus.text}
          </span>
          <input
            type="range"
            min={3}
            max={11}
            step={0.1}
            value={localSleep}
            onChange={(e) => setLocalSleep(parseFloat(e.target.value))}
            aria-label="Durasi tidur dalam jam"
            style={{ width: '100%', accentColor: 'var(--accent-neon)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Di mana melihatnya:</strong> Ringkasan tidur di jam tangan (Garmin Sleep, Apple Sleep, atau Mi Fitness). Tidur &lt; 6 jam otomatis memangkas beban latihan berat demi keselamatan otot.
          </div>
        </div>

        {/* 2. Resting Heart Rate (RHR) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Heart size={16} style={{ color: 'var(--color-danger)' }} />
              2. Detak Jantung Istirahat (RHR)
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.15rem' }}>{localRhr} bpm</strong>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: rhrStatus.color }}>
            &bull; {rhrStatus.text}
          </span>
          <input
            type="range"
            min={40}
            max={90}
            step={1}
            value={localRhr}
            onChange={(e) => setLocalRhr(parseInt(e.target.value, 10))}
            aria-label="Denyut jantung istirahat dalam bpm"
            style={{ width: '100%', accentColor: 'var(--color-danger)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Di mana melihatnya:</strong> Nilai denyut nadi terendah saat baru bangun tidur. Jika RHR naik &gt; 5 bpm di atas rata-rata normal, tubuh sedang mengalami peradangan atau kelelahan.
          </div>
        </div>

        {/* 3. Pegal Otot Kaki (DOMS) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={16} style={{ color: 'var(--color-warning)' }} />
              3. Pegal Otot Kaki (DOMS)
            </span>
            <strong style={{ color: localLegFatigue ? 'var(--color-warning)' : 'var(--color-success)', fontSize: '1rem' }}>
              Skala {localSoreness} / 5
            </strong>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: localLegFatigue ? 'var(--color-warning)' : 'var(--color-success)' }}>
            &bull; {sorenessInfo.label}
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={localSoreness}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5;
              setLocalSoreness(val);
              setLocalLegFatigue(val >= 3);
            }}
            aria-label="Tingkat pegal otot kaki skala 1 hingga 5"
            style={{ width: '100%', accentColor: 'var(--color-warning)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Aturan Olahraga Hibrida:</strong> {sorenessInfo.desc}
          </div>
        </div>

        {/* 4. Tingkat Energi Subjektif */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-neon)' }} />
              4. Tingkat Energi &amp; Fokus Mental
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem', textTransform: 'capitalize' }}>
              {localEnergy === 'low' ? 'Rendah' : localEnergy === 'moderate' ? 'Sedang' : 'Tinggi'}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {([
              { key: 'low', label: 'Rendah (Lelah)' },
              { key: 'moderate', label: 'Sedang (Normal)' },
              { key: 'high', label: 'Tinggi (Bugar)' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setLocalEnergy(key)}
                style={{
                  flex: 1,
                  padding: '0.5rem 0.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: localEnergy === key ? 'var(--accent-neon)' : 'var(--bg-surface)',
                  color: localEnergy === key ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Fungsi:</strong> Evaluasi rasa kantuk dan motivasi Anda pagi ini untuk kalibrasi beban mental.
          </div>
        </div>

        {/* 5. HRV (rMSSD Autonomik) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={16} style={{ color: 'var(--accent-neon)' }} />
              5. Variabilitas Detak Jantung (HRV)
            </span>
            <strong style={{ color: 'var(--accent-neon)', fontSize: '1.15rem' }}>{localHrv} ms</strong>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: localHrv >= 50 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            &bull; {localHrv >= 50 ? 'Sistem Saraf Otonom Siap (Parasympatis Seimbang)' : 'Sistem Saraf Tegang / Belum Pulih Sepenuhnya'}
          </span>
          <input
            type="range"
            min={20}
            max={120}
            step={1}
            value={localHrv}
            onChange={(e) => setLocalHrv(parseInt(e.target.value, 10))}
            aria-label="HRV rMSSD dalam milidetik"
            style={{ width: '100%', accentColor: 'var(--accent-neon)', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Di mana melihatnya:</strong> Menu <em>HRV Status</em> di Garmin / Apple Watch / Whoop. Mengukur variasi jeda milidetik antar denyut jantung saat tidur.
          </div>
        </div>

        {/* 6. Nyeri Sendi / Tendon */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldAlert size={16} style={{ color: localTendonPain >= 2 ? 'var(--color-danger)' : 'var(--color-success)' }} />
              6. Nyeri Sendi / Tendon (Lutut / Achilles)
            </span>
            <strong style={{ color: localTendonPain >= 2 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '1rem' }}>
              Skala {localTendonPain} / 3
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {([
              { val: 0, label: '0 Bebas Nyeri' },
              { val: 1, label: '1 Kaku Ringan' },
              { val: 2, label: '2 Nyeri Gerak' },
              { val: 3, label: '3 Nyeri Tajam' },
            ] as const).map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setLocalTendonPain(val)}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: localTendonPain === val ? 'var(--accent-neon)' : 'var(--bg-surface)',
                  color: localTendonPain === val ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Proteksi Cedera:</strong> Skala &ge; 2 memicu peringatan tendon dan melarang latihan lari di aspal keras atau lompatan plyometrik.
          </div>
        </div>
      </div>

      {/* Simulasi Preset Cepat & Tombol Simpan */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
            Tombol Cepat (Bagi Anda yang Tidak Memakai Smartwatch):
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Klik salah satu tombol kondisi di bawah untuk mengisi semua metrik di atas secara otomatis sesuai kondisi tubuh Anda hari ini:
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => onApplyPreset('normal')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>1. Kondisi Normal</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tidur 7.5j &bull; RHR 52 bpm &bull; Kaki Segar (2/5)</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyPreset('fatigued')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--color-danger)',
              color: 'var(--color-danger)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <strong style={{ fontSize: '0.82rem', color: 'var(--color-danger)' }}>2. Kondisi Lelah / Kurang Tidur</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tidur 5.2j &bull; RHR 64 bpm &bull; Kaki Pegal (4/5)</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyPreset('peak')}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-neon)',
              color: 'var(--accent-neon)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <strong style={{ fontSize: '0.82rem', color: 'var(--accent-neon)' }}>3. Kondisi Sangat Prima</strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tidur 8.3j &bull; RHR 49 bpm &bull; Kaki Segar (1/5)</span>
          </button>
        </div>

        {/* Tombol Simpan ke Engine */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onSaveCheckIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-neon)',
              color: 'var(--text-inverse)',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(204, 255, 0, 0.25)',
              transition: 'var(--transition-fast)',
              minHeight: '44px',
            }}
          >
            <CheckCircle2 size={18} />
            <span>Simpan &amp; Terapkan ke Mesin Latihan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
