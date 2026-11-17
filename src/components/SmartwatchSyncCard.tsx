import React, { useState, useRef, useEffect } from 'react';
import {
  Watch,
  Bluetooth,
  UploadCloud,
  Sliders,
  Battery,
} from 'lucide-react';
import { SmartwatchDeviceState, ParsedSmartwatchData } from '@/lib/engine/smartwatch';
import { ReadinessCheckIn } from '@/types/workout';
import { DailyReadinessCheckInTab } from './smartwatch/DailyReadinessCheckInTab';
import { BluetoothBleTab } from './smartwatch/BluetoothBleTab';
import { FileImportTab } from './smartwatch/FileImportTab';

interface SmartwatchSyncCardProps {
  smartwatchState: SmartwatchDeviceState;
  readiness: ReadinessCheckIn;
  onUpdateReadiness: (readiness: ReadinessCheckIn) => void;
  onConnectBluetooth: () => Promise<{ success: boolean; deviceName: string; error?: string }>;
  onImportFile: (content: string, filename: string) => ParsedSmartwatchData | void;
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
  const [importFeedback, setImportFeedback] = useState<{ isError: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form check-in state (slider defaults are input starting points, not measurements)
  const [localSleep, setLocalSleep] = useState(readiness.sleepHours);
  const [localRhr, setLocalRhr] = useState(readiness.restingHeartRate ?? 52);
  const [localSoreness, setLocalSoreness] = useState<1 | 2 | 3 | 4 | 5>(readiness.muscleSoreness);
  const [localLegFatigue, setLocalLegFatigue] = useState(readiness.legFatigue);
  const [localEnergy, setLocalEnergy] = useState<'low' | 'moderate' | 'high'>(readiness.energyLevel);
  const [localHrv, setLocalHrv] = useState<number>(readiness.hrvRmssd ?? 55);
  const [localTendonPain, setLocalTendonPain] = useState<0 | 1 | 2 | 3>(readiness.tendonJointPain ?? 0);
  const [localTendonArea, setLocalTendonArea] = useState<string>(readiness.tendonPainArea ?? '');

  useEffect(() => {
    setLocalSleep(readiness.sleepHours);
    setLocalRhr(readiness.restingHeartRate ?? 52);
    setLocalSoreness(readiness.muscleSoreness);
    setLocalLegFatigue(readiness.legFatigue);
    setLocalEnergy(readiness.energyLevel);
    setLocalHrv(readiness.hrvRmssd ?? 55);
    setLocalTendonPain(readiness.tendonJointPain ?? 0);
    setLocalTendonArea(readiness.tendonPainArea ?? '');
  }, [readiness]);

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
        const res = onImportFile(content, file.name);
        if (res && res.parseError) {
          setImportFeedback({ isError: true, text: res.parseError });
        } else if (res) {
          setImportFeedback({
            isError: false,
            text: `Berhasil mengimpor ${file.name} (Tidur: ${res.sleepHours} jam, RHR: ${res.restingHeartRate} bpm${res.workoutDetected ? `, Sesi lari ${res.workoutDetected.durationMinutes} mnt tercatat` : ''}).`,
          });
        }
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
      hrvRmssd: localHrv,
      tendonJointPain: localTendonPain,
      tendonPainArea: localTendonPain > 0 && localTendonArea.trim() ? localTendonArea.trim() : undefined,
    });
  };

  return (
    <div
      className="card-mobile"
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
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Smartwatch Integration Hub
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Bluetooth HR (0x180D) + impor file .gpx / .tcx / .json / .csv
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
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Connected Device
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {smartwatchState.connected ? smartwatchState.deviceName : 'Belum terhubung'}
            </div>
            <div style={{ fontSize: '0.75rem', color: smartwatchState.connected ? 'var(--color-success)' : 'var(--text-muted)' }}>
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
            color: activeSyncTab === 'quick' ? 'var(--text-primary)' : 'var(--text-secondary)',
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
            color: activeSyncTab === 'bluetooth' ? 'var(--text-primary)' : 'var(--text-secondary)',
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
            color: activeSyncTab === 'file' ? 'var(--text-primary)' : 'var(--text-secondary)',
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

      {activeSyncTab === 'quick' && (
        <DailyReadinessCheckInTab
          localSleep={localSleep}
          setLocalSleep={setLocalSleep}
          localRhr={localRhr}
          setLocalRhr={setLocalRhr}
          localSoreness={localSoreness}
          setLocalSoreness={setLocalSoreness}
          localLegFatigue={localLegFatigue}
          setLocalLegFatigue={setLocalLegFatigue}
          localEnergy={localEnergy}
          setLocalEnergy={setLocalEnergy}
          localHrv={localHrv}
          setLocalHrv={setLocalHrv}
          localTendonPain={localTendonPain}
          setLocalTendonPain={setLocalTendonPain}
          onApplyPreset={onApplyPreset}
          onSaveCheckIn={handleSaveCheckIn}
        />
      )}

      {activeSyncTab === 'bluetooth' && (
        <BluetoothBleTab
          connecting={connecting}
          btStatus={btStatus}
          onConnectBt={handleConnectBt}
        />
      )}

      {activeSyncTab === 'file' && (
        <FileImportTab
          importFeedback={importFeedback}
          fileInputRef={fileInputRef}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
};
