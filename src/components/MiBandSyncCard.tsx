import React, { useState } from 'react';
import {
  Watch,
  Bluetooth,
  UploadCloud,
  Sliders,
  CheckCircle2,
  Heart,
  Moon,
  Battery,
} from 'lucide-react';
import { MiBandDeviceState } from '@/lib/engine/mi-band';
import { ReadinessCheckIn } from '@/types/workout';

interface MiBandSyncCardProps {
  miBandState: MiBandDeviceState;
  readiness: ReadinessCheckIn;
  onUpdateReadiness: (readiness: ReadinessCheckIn) => void;
  onConnectBluetooth: () => Promise<{ success: boolean; deviceName: string; error?: string }>;
  onImportFile: (content: string, filename: string) => void;
  onApplyPreset: (key: 'normal' | 'fatigued' | 'peak') => void;
}

export const MiBandSyncCard: React.FC<MiBandSyncCardProps> = ({
  miBandState,
  readiness,
  onUpdateReadiness,
  onConnectBluetooth,
  onImportFile,
  onApplyPreset,
}) => {
  const [activeSyncTab, setActiveSyncTab] = useState<'quick' | 'bluetooth' | 'file'>('quick');
  const [connecting, setConnecting] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);

  // Form check-in cepat lokal
  const [localSleep, setLocalSleep] = useState(readiness.sleepHours);
  const [localRhr, setLocalRhr] = useState(readiness.restingHeartRate || 52);
  const [localSoreness, setLocalSoreness] = useState<1 | 2 | 3 | 4 | 5>(readiness.muscleSoreness);
  const [localLegFatigue, setLocalLegFatigue] = useState(readiness.legFatigue);
  const [localEnergy, setLocalEnergy] = useState<'low' | 'moderate' | 'high'>(readiness.energyLevel);

  // Handler Bluetooth
  const handleConnectBt = async () => {
    setConnecting(true);
    setBtStatus(null);
    const res = await onConnectBluetooth();
    setConnecting(false);
    if (!res.success && res.error) {
      setBtStatus(res.error);
    }
  };

  // Handler File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportFile(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Handler Simpan Check-in Manual
  const handleSaveCheckIn = () => {
    onUpdateReadiness({
      sleepHours: localSleep,
      restingHeartRate: localRhr,
      muscleSoreness: localSoreness,
      legFatigue: localLegFatigue,
      energyLevel: localEnergy,
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-default)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-elevation-2)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(204, 255, 0, 0.1)',
              border: '1px solid var(--accent-neon)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <Watch size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Integrasi Jam Mi Band & Biometrik
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Pusat Sinkronisasi Data Tidur, Resting Heart Rate, dan Detak Jantung Latihan
            </div>
          </div>
        </div>

        {/* Status Perangkat Terkini */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Perangkat Terhubung
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {miBandState.deviceName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              {miBandState.lastSyncTime}
            </div>
          </div>

          {miBandState.batteryLevel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <Battery size={15} style={{ color: 'var(--color-success)' }} />
              <span>{miBandState.batteryLevel}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Switcher Jalur Integrasi */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSyncTab('quick')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: activeSyncTab === 'quick' ? 'rgba(204, 255, 0, 0.12)' : 'transparent',
            border: activeSyncTab === 'quick' ? '1px solid var(--accent-neon)' : '1px solid transparent',
            color: activeSyncTab === 'quick' ? 'var(--accent-neon)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <Sliders size={16} /> Quick Morning Check-In (Rekomendasi)
        </button>

        <button
          onClick={() => setActiveSyncTab('bluetooth')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: activeSyncTab === 'bluetooth' ? 'rgba(204, 255, 0, 0.12)' : 'transparent',
            border: activeSyncTab === 'bluetooth' ? '1px solid var(--accent-neon)' : '1px solid transparent',
            color: activeSyncTab === 'bluetooth' ? 'var(--accent-neon)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <Bluetooth size={16} /> Web Bluetooth Langsung
        </button>

        <button
          onClick={() => setActiveSyncTab('file')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: activeSyncTab === 'file' ? 'rgba(204, 255, 0, 0.12)' : 'transparent',
            border: activeSyncTab === 'file' ? '1px solid var(--accent-neon)' : '1px solid transparent',
            color: activeSyncTab === 'file' ? 'var(--accent-neon)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <UploadCloud size={16} /> Upload Ekspor Mi Fitness
        </button>
      </div>

      {/* Tab 1: Quick Check-in (Paling Praktis Setiap Pagi) */}
      {activeSyncTab === 'quick' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Input Cepat Biometrik Pagi Hari (Dari Layar Mi Band)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Cukup salin 3 metrik yang muncul di layar jam saat bangun tidur (atau gunakan tombol preset uji cepat di sebelah kanan).
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Input Tidur */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Moon size={15} style={{ color: 'var(--color-info)' }} /> Durasi Tidur
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{localSleep} Jam</strong>
              </div>
              <input
                type="range"
                min={3}
                max={11}
                step={0.1}
                value={localSleep}
                onChange={(e) => setLocalSleep(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-neon)', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Target optimal: 7.5 – 8.5 jam pemulihan sistem saraf.
              </div>
            </div>

            {/* Input Resting Heart Rate */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Heart size={15} style={{ color: 'var(--color-danger)' }} /> Resting Heart Rate (RHR)
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{localRhr} bpm</strong>
              </div>
              <input
                type="range"
                min={40}
                max={90}
                step={1}
                value={localRhr}
                onChange={(e) => setLocalRhr(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--color-danger)', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Baseline atlet: ~50-54 bpm. Lonjakan &gt; 5 bpm menandakan stres/kelelahan.
              </div>
            </div>

            {/* Input Pegal Kaki / DOMS */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Tingkat Pegal Kaki (DOMS)
                </span>
                <strong style={{ color: localLegFatigue ? 'var(--color-warning)' : 'var(--color-success)', fontSize: '1rem' }}>
                  {localSoreness}/5 ({localLegFatigue ? 'Pegal' : 'Segar'})
                </strong>
              </div>
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
                style={{ width: '100%', accentColor: 'var(--color-warning)', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Jika &ge; 3/5, sistem otomatis mengunci lari cepat untuk melindungi lutut.
              </div>
            </div>

            {/* Input Level Energi */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Level Energi Hari Ini
                </span>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem', textTransform: 'capitalize' }}>
                  {localEnergy}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {(['low', 'moderate', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLocalEnergy(lvl)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.2rem',
                      borderRadius: 'var(--radius-sm)',
                      background: localEnergy === lvl ? 'var(--accent-neon)' : 'var(--bg-surface)',
                      color: localEnergy === lvl ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preset Simulasi Cepat & Tombol Simpan */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulasi Cepat Preset:</span>
              <button
                onClick={() => onApplyPreset('normal')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Kondisi Normal (7.5h, 52bpm)
              </button>

              <button
                onClick={() => onApplyPreset('fatigued')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Kondisi Kurang Tidur (5.2h, 64bpm, DOMS 4)
              </button>

              <button
                onClick={() => onApplyPreset('peak')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(204, 255, 0, 0.1)',
                  border: '1px solid var(--accent-neon)',
                  color: 'var(--accent-neon)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Kondisi Prima (8.3h, 49bpm)
              </button>
            </div>

            <button
              onClick={handleSaveCheckIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-neon)',
                color: 'var(--text-inverse)',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={16} />
              Terapkan Biometrik ke Engine
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Web Bluetooth Connect */}
      {activeSyncTab === 'bluetooth' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Bluetooth size={22} style={{ color: 'var(--color-info)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Koneksi Langsung Web Bluetooth API
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Fitur ini memanfaatkan standar Web Bluetooth API di browser Google Chrome atau Microsoft Edge untuk membaca detak jantung real-time dari jam Mi Band Anda tanpa kabel.
          </p>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Langkah Menghubungkan:
            </h4>
            <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Nyalakan Bluetooth di laptop/komputer Anda.</li>
              <li>Buka aplikasi <strong>Mi Fitness</strong> di HP Anda &gt; <em>Profil &gt; Pengaturan Perangkat</em> &gt; pastikan <strong>Visibilitas Bluetooth</strong> aktif.</li>
              <li>Klik tombol di bawah ini, lalu pilih <strong>Mi Smart Band</strong> atau <strong>Xiaomi Band</strong> pada popup browser.</li>
            </ol>
          </div>

          {btStatus && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              {btStatus}
            </div>
          )}

          <button
            onClick={handleConnectBt}
            disabled={connecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-info)',
              color: 'var(--text-inverse)',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              cursor: connecting ? 'not-allowed' : 'pointer',
            }}
          >
            <Bluetooth size={18} />
            {connecting ? 'Mencari Perangkat Mi Band...' : 'Cari & Hubungkan Mi Band via Bluetooth'}
          </button>
        </div>
      )}

      {/* Tab 3: Upload File Ekspor Mi Fitness */}
      {activeSyncTab === 'file' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <UploadCloud size={22} style={{ color: 'var(--accent-neon)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Upload File Ekspor Mi Fitness / Zepp Life
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Ekspor riwayat data harian atau sesi lari dari aplikasi Mi Fitness / Zepp Life di ponsel Anda, lalu unggah file `.json` atau `.csv` ke sini.
          </p>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              background: 'var(--bg-surface)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-neon)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          >
            <UploadCloud size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pilih atau Tarik File JSON / CSV ke Sini
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Mendukung data tidur, detak jantung, dan rekaman lari dari Mi Fitness / Zepp Life
            </span>
            <input type="file" accept=".json,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
};



