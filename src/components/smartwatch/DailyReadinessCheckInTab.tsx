import React from 'react';
import { Moon, Heart, CheckCircle2 } from 'lucide-react';

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
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Quick Morning Biometric Sync (Direct from Watch Display)
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Mirror the 3 core metrics visible on your watch screen upon waking up (Garmin, Apple Watch, Xiaomi, Samsung, etc.).
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
        {/* Sleep Input */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Moon size={15} style={{ color: 'var(--color-info)' }} /> Sleep Duration
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{localSleep} hrs</strong>
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
            Optimal target: 7.5 – 8.5 hours for autonomic nervous system restoration.
          </div>
        </div>

        {/* Resting Heart Rate */}
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            If &ge; 3/5, high-intensity running is locked to safeguard knee ligaments.
          </div>
        </div>

        {/* Energy Level */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Subjective Energy Level
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

        {/* HRV rMSSD Input */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              HRV (rMSSD Autonomik)
            </span>
            <strong style={{ color: 'var(--accent-neon)', fontSize: '1.05rem' }}>{localHrv} ms</strong>
          </div>
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Digunakan untuk normalisasi Z-Score kesiapan saraf otonom.
          </div>
        </div>

        {/* Tendon / Joint Pain Input */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Nyeri Sendi / Tendon (0-3)
            </span>
            <strong style={{ color: localTendonPain >= 2 ? 'var(--color-danger)' : 'var(--color-success)', fontSize: '1rem' }}>
              {localTendonPain}/3
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            {([0, 1, 2, 3] as const).map((painLvl) => (
              <button
                key={painLvl}
                type="button"
                onClick={() => setLocalTendonPain(painLvl)}
                style={{
                  flex: 1,
                  padding: '0.4rem 0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: localTendonPain === painLvl ? 'var(--accent-neon)' : 'var(--bg-surface)',
                  color: localTendonPain === painLvl ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                {painLvl === 0 ? '0 Aman' : painLvl === 1 ? '1 Ringan' : painLvl === 2 ? '2 Nyeri' : '3 Tajam'}
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
              color: 'var(--text-primary)',
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
          onClick={onSaveCheckIn}
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
  );
};
