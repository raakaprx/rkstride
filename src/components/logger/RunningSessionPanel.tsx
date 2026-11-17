import React from 'react';
import { Timer, Watch } from 'lucide-react';
import { RunSession } from '@/types/workout';
import { calculateRunningLoad, RUNNING_PRESETS } from '@/lib/engine/workload';

interface RunningSessionPanelProps {
  runningSession: RunSession;
  activeRunToEvaluate: RunSession;
  selectedPreset: string;
  useSensorlessRpe: boolean;
  sensorlessRpe: number;
  liveSmartwatchHeartRate?: number;
  onSelectPreset: (presetKey: keyof typeof RUNNING_PRESETS) => void;
  onChangeField: (field: 'jarakKm' | 'durasiMenit' | 'avgHeartRate', value: number) => void;
  onToggleSensorlessRpe: (checked: boolean) => void;
  onChangeSensorlessRpe: (rpe: number) => void;
}

export const RunningSessionPanel: React.FC<RunningSessionPanelProps> = ({
  runningSession,
  activeRunToEvaluate,
  selectedPreset,
  useSensorlessRpe,
  sensorlessRpe,
  liveSmartwatchHeartRate,
  onSelectPreset,
  onChangeField,
  onToggleSensorlessRpe,
  onChangeSensorlessRpe,
}) => {
  const runningLoad = calculateRunningLoad(activeRunToEvaluate);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Timer size={20} style={{ color: 'var(--color-info)' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            2. Running Spectrum &amp; TRIMP Workload
          </h3>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Running TRIMP: <strong style={{ color: 'var(--color-info)' }}>{runningLoad} pts</strong>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {(Object.keys(RUNNING_PRESETS) as Array<keyof typeof RUNNING_PRESETS>).map((key) => {
            const preset = RUNNING_PRESETS[key];
            const isSelected = selectedPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectPreset(key)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--color-info)' : '1px solid var(--border-default)',
                  color: isSelected ? 'var(--color-info)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Distance (km)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={runningSession.jarakKm}
              onChange={(e) => onChangeField('jarakKm', parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Duration (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={runningSession.durasiMenit}
              onChange={(e) => onChangeField('durasiMenit', parseInt(e.target.value, 10) || 0)}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Avg Heart Rate (bpm)
              {liveSmartwatchHeartRate && <Watch size={12} style={{ color: 'var(--accent-neon)' }} />}
            </label>
            <input
              type="number"
              min={80}
              max={220}
              disabled={useSensorlessRpe}
              value={runningSession.avgHeartRate}
              onChange={(e) => onChangeField('avgHeartRate', parseInt(e.target.value, 10) || 120)}
              style={{
                width: '100%',
                background: useSensorlessRpe ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: useSensorlessRpe ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.95rem',
              }}
            />
          </div>
        </div>

        {/* Sensorless RPE fallback */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <label htmlFor="rpeFallbackCheck" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="rpeFallbackCheck"
              checked={useSensorlessRpe}
              onChange={(e) => onToggleSensorlessRpe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Sensorless Mode (gunakan RPE tanpa HR monitor)
          </label>

          {useSensorlessRpe && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>RPE Intensity:</span>
              <select
                value={sensorlessRpe}
                onChange={(e) => onChangeSensorlessRpe(parseInt(e.target.value, 10) || 7)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.82rem',
                }}
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <option key={v} value={v}>
                    RPE {v}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
