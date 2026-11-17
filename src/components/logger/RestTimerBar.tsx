import React from 'react';
import { Timer } from 'lucide-react';

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export function playTimerChime(): void {
  try {
    const win = window as WindowWithWebkitAudio;
    const AudioCtx = window.AudioContext || win.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch {
    // AudioContext unavailable
  }
}

interface RestTimerBarProps {
  restSecondsRemaining: number | null;
  onAdd30Seconds: () => void;
  onDismiss: () => void;
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
  restSecondsRemaining,
  onAdd30Seconds,
  onDismiss,
}) => {
  if (restSecondsRemaining === null) return null;

  return (
    <div
      className="rest-timer"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--dock-clearance) + 0.5rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-floating)',
        background: 'var(--bg-secondary)',
        border: '2px solid var(--accent-neon)',
        borderRadius: 'var(--radius-full)',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 15px rgba(204,255,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Timer size={18} style={{ color: 'var(--accent-neon)' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Istirahat Antar Set: {Math.floor(restSecondsRemaining / 60)}:
          {(restSecondsRemaining % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={onAdd30Seconds}
          style={{
            padding: '0.35rem 0.75rem',
            minHeight: '40px',
            minWidth: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
          }}
        >
          +30s
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            padding: '0.35rem 0.85rem',
            minHeight: '40px',
            minWidth: '60px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
          }}
        >
          Selesai
        </button>
      </div>
    </div>
  );
};
