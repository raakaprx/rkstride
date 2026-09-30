import React, { useState } from 'react';
import {
  AlertTriangle,
  Edit2,
  Clock,
  Dumbbell,
  Timer,
  Coffee,
} from 'lucide-react';
import { ScheduledDay, ScheduleConflict } from '@/types/schedule';
import { WorkoutCategory } from '@/types/workout';
import { scheduleTemplates } from '@/data/defaultSchedule';

interface ScheduleCustomizerProps {
  weeklySchedule: ScheduledDay[];
  scheduleConflicts: ScheduleConflict[];
  onUpdateDay: (dayIndex: number, updates: Partial<ScheduledDay>) => void;
  onApplyTemplate: (templateId: string) => void;
}

const CATEGORY_DETAILS: Record<
  WorkoutCategory,
  { label: string; color: string; bg: string; icon: 'strength' | 'run' | 'rest' }
> = {
  push: { label: 'Push (Chest & Shoulders)', color: '#ccff00', bg: 'rgba(204, 255, 0, 0.1)', icon: 'strength' },
  pull: { label: 'Pull (Back & Biceps)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'strength' },
  legs: { label: 'Legs (Squats & Posterior)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: 'strength' },
  arms: { label: 'Arms (Biceps & Triceps)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', icon: 'strength' },
  core: { label: 'Core & Stabilizers', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'strength' },
  run_recovery: { label: 'Recovery Run (Zone 1)', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', icon: 'run' },
  run_easy: { label: 'Easy Run (Zone 2 Base)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', icon: 'run' },
  run_tempo: { label: 'Tempo Run (Threshold)', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', icon: 'run' },
  run_long: { label: 'Long Run (Endurance)', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', icon: 'run' },
  run_intervals: { label: 'VO2 Max Intervals', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: 'run' },
  norwegian_4x4: { label: 'Norwegian 4x4 (VO2 Max)', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', icon: 'run' },
  mobility_recovery: { label: 'Rest / Active Mobility', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', icon: 'rest' },
};

export const ScheduleCustomizer: React.FC<ScheduleCustomizerProps> = ({
  weeklySchedule,
  scheduleConflicts,
  onUpdateDay,
  onApplyTemplate,
}) => {
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);

  const editingDay = editingDayIndex !== null ? weeklySchedule[editingDayIndex] : null;

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
      {/* Header & Template Selector */}
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
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent-neon)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Custom Schedule Builder
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.2rem' }}>
            Weekly Training Schedule &amp; Hybrid Split
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Click on any day to customize sessions. The engine automatically audits 48-hour recovery conflicts between leg days and high-speed running.
          </p>
        </div>

        {/* Template Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Templates:</span>
          {scheduleTemplates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onApplyTemplate(tpl.id)}
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-neon)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {tpl.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Conflicts Banner */}
      {scheduleConflicts.length > 0 && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderLeft: '3px solid var(--color-warning)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.88rem' }}>
            <AlertTriangle size={17} />
            Schedule Audit: {scheduleConflicts.length} Potential Recovery Clashes Detected
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {scheduleConflicts.map((c, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#FFFFFF', lineHeight: 1.4 }}>
                <strong>• {c.message}</strong> — <span style={{ color: 'var(--text-secondary)' }}>{c.suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {weeklySchedule.map((day) => {
          const catInfo = CATEGORY_DETAILS[day.category] || CATEGORY_DETAILS.mobility_recovery;
          const isSelected = editingDayIndex === day.dayIndex;
          const hasClash = scheduleConflicts.some((c) => c.dayIndex === day.dayIndex);

          return (
            <div
              key={day.id}
              onClick={() => setEditingDayIndex(day.dayIndex)}
              style={{
                background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                border: isSelected
                  ? '1px solid var(--accent-neon)'
                  : hasClash
                  ? '1px solid rgba(245, 158, 11, 0.5)'
                  : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? '0 0 0 1px var(--accent-neon)' : 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !hasClash) e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              {/* Day Name & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF' }}>{day.dayName}</span>
                <span style={{ color: catInfo.color }}>
                  {catInfo.icon === 'strength' ? (
                    <Dumbbell size={15} />
                  ) : catInfo.icon === 'run' ? (
                    <Timer size={15} />
                  ) : (
                    <Coffee size={15} />
                  )}
                </span>
              </div>

              {/* Category Badge */}
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: catInfo.bg,
                  color: catInfo.color,
                  marginBottom: '0.65rem',
                  display: 'inline-block',
                }}
              >
                {day.category.toUpperCase().replace('_', ' ')}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: day.isRestDay ? 'var(--text-muted)' : '#FFFFFF',
                  marginBottom: '0.5rem',
                  minHeight: '2.4rem',
                  lineHeight: 1.3,
                }}
              >
                {day.title}
              </div>

              {/* Duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <Clock size={12} />
                <span>{day.isRestDay ? 'Rest Day' : `${day.targetDurationMinutes} Minutes`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Panel */}
      {editingDay && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2 size={16} style={{ color: 'var(--accent-neon)' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                Edit Schedule for {editingDay.dayName}
              </h4>
            </div>
            <button
              onClick={() => setEditingDayIndex(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Close ✕
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Workout Category
              </label>
              <select
                value={editingDay.category}
                onChange={(e) => {
                  const cat = e.target.value as WorkoutCategory;
                  const isRest = cat === 'mobility_recovery';
                  onUpdateDay(editingDay.dayIndex, {
                    category: cat,
                    isRestDay: isRest,
                    title: CATEGORY_DETAILS[cat]?.label || 'Training Session',
                  });
                }}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="push">Upper Push (Chest, Shoulders, Triceps)</option>
                <option value="pull">Upper Pull (Back &amp; Biceps)</option>
                <option value="legs">Legs (Squats, Deadlifts, Quads)</option>
                <option value="run_easy">Easy Run (Zone 2 Base)</option>
                <option value="run_tempo">Tempo Run (Threshold &amp; Intervals)</option>
                <option value="run_long">Long Run (Endurance)</option>
                <option value="norwegian_4x4">Norwegian 4x4 (VO2 Max Protocol)</option>
                <option value="mobility_recovery">Rest / Active Recovery</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Session Title
              </label>
              <input
                type="text"
                value={editingDay.title}
                onChange={(e) => onUpdateDay(editingDay.dayIndex, { title: e.target.value })}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            {/* Target Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Target Duration (Minutes)
              </label>
              <input
                type="number"
                min={10}
                step={5}
                value={editingDay.targetDurationMinutes}
                onChange={(e) =>
                  onUpdateDay(editingDay.dayIndex, {
                    targetDurationMinutes: parseInt(e.target.value, 10) || 30,
                  })
                }
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
