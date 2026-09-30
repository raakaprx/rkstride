import React from 'react';
import {
  Trophy,
  Activity,
  Droplets,
  Calendar,
  Sparkles,
  X,
  Bot,
} from 'lucide-react';
import { ACWRResult } from '@/types/workout';

export interface PostWorkoutDebriefData {
  sessionLoad: number;
  projectedACWR: number;
  acwrStatus: ACWRResult['status'];
  hasLegWorkout: boolean;
  hasRunWorkout: boolean;
  hasUpperWorkout: boolean;
  totalDurationMin: number;
}

interface PostWorkoutDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  debriefData: PostWorkoutDebriefData;
  onOpenAiCoachWithPrompt: (prompt: string) => void;
}

export const PostWorkoutDebriefModal: React.FC<PostWorkoutDebriefModalProps> = ({
  isOpen,
  onClose,
  debriefData,
  onOpenAiCoachWithPrompt,
}) => {
  if (!isOpen) return null;

  const isSweetSpot = debriefData.projectedACWR >= 0.8 && debriefData.projectedACWR <= 1.3;
  const isSpike = debriefData.projectedACWR > 1.4;

  const proteinGrams = debriefData.hasLegWorkout ? '30–35g' : '25–30g';
  const waterMl = debriefData.totalDurationMin > 45 ? '650–850 ml' : '500–650 ml';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--accent-neon)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-elevation-3)',
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            padding: '0.35rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={16} />
        </button>

        {/* Celebration Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'var(--accent-neon-subtle)',
              border: '1.5px solid var(--accent-neon)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
              marginBottom: '0.75rem',
              boxShadow: '0 0 16px rgba(204, 255, 0, 0.15)',
            }}
          >
            <Trophy size={26} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Workout Logged Successfully! 🎉
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
            Great effort today! Your cardiovascular and musculoskeletal workload have been registered into the ACWR engine.
          </p>
        </div>

        {/* Primary Impact Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session Load</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.2rem' }}>
              {debriefData.sessionLoad} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>pts</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Updated ACWR</div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                marginTop: '0.2rem',
                color: isSpike ? 'var(--color-danger)' : isSweetSpot ? 'var(--color-success)' : 'var(--accent-neon)',
              }}
            >
              {debriefData.projectedACWR}
            </div>
            <div style={{ fontSize: '0.68rem', color: isSpike ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {isSpike ? 'High Load Spike' : isSweetSpot ? 'Sweet Spot (Optimal)' : 'Light Stimulus'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recovery Window</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.2rem' }}>
              {debriefData.hasLegWorkout ? '48h Leg Window' : 'Upper Recovery'}
            </div>
            <div style={{ fontSize: '0.68rem', color: debriefData.hasLegWorkout ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {debriefData.hasLegWorkout ? 'Speed run locked' : 'Lower body fresh'}
            </div>
          </div>
        </div>

        {/* Actionable Recovery Prescriptions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-neon)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
            <Sparkles size={14} /> Immediate Post-Workout Protocol
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Protein & Hydration */}
            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid #38bdf8',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <Droplets size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>Nutrition &amp; Rehydration Target:</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.4 }}>
                  Drink <strong>{waterMl}</strong> with electrolytes and consume <strong>{proteinGrams} protein</strong> within 45–60 minutes to stimulate Muscle Protein Synthesis (MPS).
                </p>
              </div>
            </div>

            {/* Targeted Mobility */}
            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid #10b981',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <Activity size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>Targeted Tissue Flush:</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.4 }}>
                  {debriefData.hasLegWorkout
                    ? 'Quad and glute foam rolling + 90/90 hip stretches. High-speed running is locked for 48h to protect patellar tendons.'
                    : debriefData.hasRunWorkout
                    ? 'Calf and hamstring light flush. Elevate legs for 10 minutes to assist lymphatic drainage and venous return.'
                    : 'Doorway pectoral stretch, lat hangs, and thoracic extension to preserve shoulder mobility.'}
                </p>
              </div>
            </div>

            {/* Tomorrow's Recommended Split */}
            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--accent-neon)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <Calendar size={18} style={{ color: 'var(--accent-neon)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#FFFFFF' }}>Tomorrow&apos;s Training Preview:</strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: 1.4 }}>
                  {debriefData.hasLegWorkout
                    ? 'Upper Body Push / Pull or complete Rest Day. Allow quadriceps motor units to rebuild.'
                    : isSpike
                    ? 'Active Recovery Protocol: 30-min mobility & foam rolling. Do not add heavy volume.'
                    : 'Scheduled session: Steady Zone 2 Aerobic Base Run (40–45 min) or Upper Hypertrophy.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              onClose();
              onOpenAiCoachWithPrompt(
                `Saya baru saja menyelesaikan workout dengan beban ${debriefData.sessionLoad} poin (ACWR sekarang ${debriefData.projectedACWR}). Apa rekomendasi spesifik untuk pemulihan optimal saya malam ini?`
              );
            }}
            style={{
              flex: 1,
              minWidth: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-neon)',
              color: '#09090b',
              fontWeight: 800,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(204, 255, 0, 0.2)',
              transition: 'var(--transition-fast)',
            }}
          >
            <Bot size={16} />
            Ask Gemini AI Coach
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
