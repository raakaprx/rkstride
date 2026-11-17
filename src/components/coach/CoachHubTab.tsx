import React from 'react';
import { Bot, Sparkles, Settings2 } from 'lucide-react';
import type { ACWRResult, ReadinessCheckIn } from '@/types/workout';
import { SmartwatchDeviceState, ParsedSmartwatchData } from '@/lib/engine/smartwatch';
import { SmartwatchSyncCard } from '../SmartwatchSyncCard';

interface CoachHubTabProps {
  acwrResult: ACWRResult;
  readinessScore: number;
  lastLegsTrainedHoursAgo: number;
  smartwatchState: SmartwatchDeviceState;
  todayReadiness: ReadinessCheckIn;
  setTodayReadiness: (readiness: ReadinessCheckIn) => void;
  connectBluetooth: () => Promise<{ success: boolean; deviceName: string; error?: string }>;
  importSmartwatchFile: (content: string, filename: string) => ParsedSmartwatchData | void;
  applyPreset: (key: 'normal' | 'fatigued' | 'peak') => void;
  onOpenCoachChat: (prompt?: string) => void;
  onOpenAiSettings?: () => void;
}

export const CoachHubTab: React.FC<CoachHubTabProps> = ({
  acwrResult,
  readinessScore,
  lastLegsTrainedHoursAgo,
  smartwatchState,
  todayReadiness,
  setTodayReadiness,
  connectBluetooth,
  importSmartwatchFile,
  applyPreset,
  onOpenCoachChat,
  onOpenAiSettings,
}) => {
  return (
    <>
      {/* Kartu Konsultasi Pelatih AI Gemini (rkbot) */}
      <div
        className="card-mobile"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-elevation-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-neon-subtle)',
                border: '1.5px solid var(--accent-neon)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-neon)',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  rkbot AI Athletic Coach
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(204, 255, 0, 0.15)',
                    color: 'var(--accent-neon)',
                    fontWeight: 700,
                  }}
                >
                  Gemini 2.5 Flash
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Pelatih penalaran deterministik beban latihan, nutrisi &amp; pemulihan otot hibrida
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {onOpenAiSettings && (
              <button
                type="button"
                onClick={onOpenAiSettings}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '40px',
                  touchAction: 'manipulation',
                }}
              >
                <Settings2 size={14} style={{ color: 'var(--accent-neon)' }} />
                <span>Pengaturan API Key</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.78rem', fontWeight: 700 }}>
              <Sparkles size={14} />
              <span>Konteks Atletik Terhubung</span>
            </div>
          </div>
        </div>

        {/* Snapshot Telemetri Aktual */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
            gap: '0.75rem',
            background: 'var(--bg-surface)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Rasio ACWR</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {acwrResult.ratio}{' '}
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                ({acwrResult.status === 'sweet_spot' ? 'Sweet Spot' : acwrResult.status === 'danger' ? 'Bahaya' : 'Normal'})
              </span>
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Skor Kesiapan</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-neon)' }}>
              {readinessScore}/100
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Jendela Kaki (48j)</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: lastLegsTrainedHoursAgo < 48 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {lastLegsTrainedHoursAgo < 900 ? `${lastLegsTrainedHoursAgo}j lalu` : '> 72j'}
            </span>
          </div>
        </div>

        {/* Quick Prompt Suggestions */}
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Pilih Topik Konsultasi Cepat:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              'Analisis beban latihan saya hari ini',
              'Bolehkah saya lari besok setelah leg day?',
              'Rekomendasi nutrisi pemulihan pasca workout',
              'Cara eksekusi Norwegian 4x4 yang benar',
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenCoachChat(p)}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)',
                  touchAction: 'manipulation',
                  minHeight: '40px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                &bull; {p}
              </button>
            ))}
          </div>
        </div>

        {/* Tombol Utama Buka Sesi Chat */}
        <button
          type="button"
          onClick={() => onOpenCoachChat()}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '0.8rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-neon)',
            color: 'var(--text-inverse)',
            fontWeight: 800,
            fontSize: '0.92rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 10px rgba(204, 255, 0, 0.2)',
            transition: 'var(--transition-fast)',
            touchAction: 'manipulation',
          }}
        >
          <Bot size={18} />
          <span>Buka Sesi Chat Konsultasi rkbot</span>
        </button>
      </div>

      {/* Integrasi Jam Pintar Universal */}
      <SmartwatchSyncCard
        smartwatchState={smartwatchState}
        readiness={todayReadiness}
        onUpdateReadiness={setTodayReadiness}
        onConnectBluetooth={connectBluetooth}
        onImportFile={importSmartwatchFile}
        onApplyPreset={applyPreset}
      />
    </>
  );
};
