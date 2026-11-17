import React from 'react';
import { Moon, Heart, Activity, Flame } from 'lucide-react';
import type { ReadinessCheckIn } from '@/types/workout';

interface AdvisorBiometricsPanelProps {
  readiness: ReadinessCheckIn;
}

export const AdvisorBiometricsPanel: React.FC<AdvisorBiometricsPanelProps> = ({ readiness }) => {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Smartwatch Synced Biometrics
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Moon size={14} style={{ color: 'var(--color-info)' }} /> Sleep
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {readiness.sleepHours} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>hrs</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Heart size={14} style={{ color: 'var(--color-danger)' }} /> Resting HR
          </div>
          {readiness.restingHeartRate != null ? (
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {readiness.restingHeartRate} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>bpm</span>
            </div>
          ) : (
            <div style={{ marginTop: '0.25rem' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-muted)' }}>Kosong</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Belum diukur</div>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Activity size={14} style={{ color: 'var(--accent-neon)' }} /> Leg DOMS
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: readiness.legFatigue ? 'var(--color-warning)' : 'var(--color-success)', marginTop: '0.25rem' }}>
            {readiness.muscleSoreness}/5 ({readiness.legFatigue ? 'Sore' : 'Fresh'})
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Flame size={14} style={{ color: 'var(--chart-orange)' }} /> Energy Level
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
            {readiness.energyLevel}
          </div>
        </div>
      </div>
    </div>
  );
};
