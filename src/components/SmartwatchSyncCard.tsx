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
import { SmartwatchDeviceState } from '@/lib/engine/smartwatch';
import { ReadinessCheckIn } from '@/types/workout';

interface SmartwatchSyncCardProps {
  smartwatchState: SmartwatchDeviceState;
  readiness: ReadinessCheckIn;
  onUpdateReadiness: (readiness: ReadinessCheckIn) => void;
  onConnectBluetooth: () => Promise<{ success: boolean; deviceName: string; error?: string }>;
  onImportFile: (content: string, filename: string) => void;
  onApplyPreset: (key: 'normal' | 'fatigued' | 'peak') => void;
}

export const SmartwatchSyncCard: React.FC<SmartwatchSyncCardProps> = ({
  smartwatchState,
  readiness,
  onUpdateReadiness,
  onConnectBluetooth,
  onImportFile,
  onApplyPreset,
}) => {
  const [activeSyncTab, setActiveSyncTab] = useState<'quick' | 'bluetooth' | 'file'>('quick');
  const [connecting, setConnecting] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);

  // Form check-in state (slider defaults are input starting points, not measurements)
  const [localSleep, setLocalSleep] = useState(readiness.sleepHours);
  const [localRhr, setLocalRhr] = useState(readiness.restingHeartRate ?? 52);
  const [localSoreness, setLocalSoreness] = useState<1 | 2 | 3 | 4 | 5>(readiness.muscleSoreness);
  const [localLegFatigue, setLocalLegFatigue] = useState(readiness.legFatigue);
  const [localEnergy, setLocalEnergy] = useState<'low' | 'moderate' | 'high'>(readiness.energyLevel);

  // Bluetooth Connection Handler
  const handleConnectBt = async () => {
    setConnecting(true);
    setBtStatus(null);
    const res = await onConnectBluetooth();
    setConnecting(false);
    if (!res.success && res.error) {
      setBtStatus(res.error);
    }
  };

  // File Upload Handler
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

  // Save manual check-in
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
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <Watch size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF' }}>
              Smartwatch Integration Hub
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Bluetooth HR (0x180D) + impor file .fit / .gpx / .tcx / .json / .csv
            </div>
          </div>
        </div>

        {/* Current Device Status */}
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
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Connected Device
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
              {smartwatchState.connected ? smartwatchState.deviceName : 'Belum terhubung'}
            </div>
            <div style={{ fontSize: '0.72rem', color: smartwatchState.connected ? 'var(--color-success)' : 'var(--text-muted)' }}>
              {smartwatchState.connected ? smartwatchState.lastSyncTime : 'Hubungkan perangkat atau isi check-in pagi'}
            </div>
          </div>

          {smartwatchState.batteryLevel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <Battery size={15} style={{ color: 'var(--color-success)' }} />
              <span>{smartwatchState.batteryLevel}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Integration Mode Tabs (Segmented Control) */}
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--bg-secondary)',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '2px',
        }}
      >
        <button
          onClick={() => setActiveSyncTab('quick')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'calc(var(--radius-md) - 2px)',
            background: activeSyncTab === 'quick' ? 'var(--bg-surface-elevated)' : 'transparent',
            border: 'none',
            color: activeSyncTab === 'quick' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: activeSyncTab === 'quick' ? 700 : 500,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <Sliders size={15} style={{ color: activeSyncTab === 'quick' ? 'var(--accent-neon)' : 'inherit' }} />
          <span>Quick Morning Check-In</span>
        </button>

        <button
          onClick={() => setActiveSyncTab('bluetooth')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'calc(var(--radius-md) - 2px)',
            background: activeSyncTab === 'bluetooth' ? 'var(--bg-surface-elevated)' : 'transparent',
            border: 'none',
            color: activeSyncTab === 'bluetooth' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: activeSyncTab === 'bluetooth' ? 700 : 500,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <Bluetooth size={15} style={{ color: activeSyncTab === 'bluetooth' ? 'var(--accent-neon)' : 'inherit' }} />
          <span>Web Bluetooth BLE</span>
        </button>

        <button
          onClick={() => setActiveSyncTab('file')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'calc(var(--radius-md) - 2px)',
            background: activeSyncTab === 'file' ? 'var(--bg-surface-elevated)' : 'transparent',
            border: 'none',
            color: activeSyncTab === 'file' ? '#FFFFFF' : 'var(--text-secondary)',
            fontWeight: activeSyncTab === 'file' ? 700 : 500,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <UploadCloud size={15} style={{ color: activeSyncTab === 'file' ? 'var(--accent-neon)' : 'inherit' }} />
          <span>File Import (.fit / .gpx / .csv)</span>
        </button>
      </div>

      {/* Tab 1: Quick Check-in */}
      {activeSyncTab === 'quick' && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Quick Morning Biometric Sync (Direct from Watch Display)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Mirror the 3 core metrics visible on your watch screen upon waking up (Garmin, Apple Watch, Xiaomi, Samsung, etc.).
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Sleep Input */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Moon size={15} style={{ color: '#38bdf8' }} /> Sleep Duration
                </span>
                <strong style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>{localSleep} hrs</strong>
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
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Optimal target: 7.5 – 8.5 hours for autonomic nervous system restoration.
              </div>
            </div>

            {/* Resting Heart Rate */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Heart size={15} style={{ color: '#ef4444' }} /> Resting Heart Rate (RHR)
                </span>
                <strong style={{ color: '#FFFFFF', fontSize: '1.1rem' }}>{localRhr} bpm</strong>
              </div>
              <input
                type="range"
                min={40}
                max={90}
                step={1}
                value={localRhr}
                onChange={(e) => setLocalRhr(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Athletic baseline: ~50-54 bpm. A spike &gt; 5 bpm signals incomplete recovery.
              </div>
            </div>

            {/* Leg DOMS */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Leg Muscle Soreness (DOMS)
                </span>
                <strong style={{ color: localLegFatigue ? 'var(--color-warning)' : 'var(--color-success)', fontSize: '1rem' }}>
                  {localSoreness}/5 ({localLegFatigue ? 'Sore' : 'Fresh'})
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
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                If &ge; 3/5, high-intensity running is locked to safeguard knee ligaments.
              </div>
            </div>

            {/* Energy Level */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Subjective Energy Level
                </span>
                <strong style={{ color: '#FFFFFF', fontSize: '1rem', textTransform: 'capitalize' }}>
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
                      color: localEnergy === lvl ? '#0A0A0A' : 'var(--text-secondary)',
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

          {/* Quick Simulation Presets & Save */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
              <button
                onClick={() => onApplyPreset('normal')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                Normal Recovery (7.5h, 52bpm)
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
                Sleep Deprived (5.2h, 64bpm, DOMS 4)
              </button>

              <button
                onClick={() => onApplyPreset('peak')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-neon-subtle)',
                  border: '1px solid rgba(204, 255, 0, 0.25)',
                  color: 'var(--accent-neon)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Prime Athletic State (8.3h, 49bpm)
              </button>
            </div>

            <button
              onClick={handleSaveCheckIn}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-neon)',
                color: '#09090b',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(204, 255, 0, 0.18)',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <CheckCircle2 size={16} />
              Apply Biometrics to Engine
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Web Bluetooth BLE */}
      {activeSyncTab === 'bluetooth' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Bluetooth size={22} style={{ color: '#38bdf8' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              Direct Web Bluetooth GATT Stream
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Pair with any smartwatch or chest strap broadcasting standard Bluetooth Heart Rate (Service 0x180D), including Garmin Forerunner, Apple Watch, Xiaomi Band, Polar, and Coros.
          </p>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
              Pairing Instructions:
            </h4>
            <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Ensure Bluetooth is enabled on your host computer/laptop.</li>
              <li>On your watch, enable Heart Rate Broadcasting / pairing mode (e.g., Garmin: <em>Settings &gt; Sensors &gt; Broadcast Heart Rate</em>, or Xiaomi/Apple: open workout heart rate monitor).</li>
              <li>Click the button below and select your device from the browser permission popup.</li>
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
              background: '#38bdf8',
              color: '#0A0A0A',
              fontWeight: 800,
              fontSize: '0.9rem',
              border: 'none',
              cursor: connecting ? 'not-allowed' : 'pointer',
            }}
          >
            <Bluetooth size={18} />
            {connecting ? 'Scanning for Smartwatch...' : 'Scan &amp; Connect Smartwatch via Bluetooth'}
          </button>
        </div>
      )}

      {/* Tab 3: File Import */}
      {activeSyncTab === 'file' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <UploadCloud size={22} style={{ color: 'var(--accent-neon)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              Impor File Latihan (.fit / .gpx / .tcx / .json / .csv)
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Ekspor file aktivitas dari aplikasi pendamping jam Anda lalu unggah di sini.
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
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>
              Drop FIT / GPX / TCX / JSON / CSV File Here or Browse
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Format ekspor standar aplikasi pendamping jam
            </span>
            <input type="file" accept=".json,.csv,.fit,.gpx,.tcx" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
};
