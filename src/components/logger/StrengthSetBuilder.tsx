import React, { useState, useMemo } from 'react';
import { Dumbbell, Plus, Trash2, Search, Timer, TrendingUp } from 'lucide-react';
import { StrengthExercise } from '@/types/workout';
import {
  calculateStrengthLoad,
  calculateStrengthVolumeLoad,
  estimate1RM,
} from '@/lib/engine/workload';
import { evaluateDoubleProgression } from '@/lib/engine/doubleProgression';
import { EXERCISE_CATALOG, ExerciseCategory, ExerciseType } from '@/data/exerciseCatalog';

interface StrengthSetBuilderProps {
  strengthList: StrengthExercise[];
  onAddExercise: (exercise: StrengthExercise) => void;
  onRemoveExercise: (exIndex: number) => void;
  onAddSet: (exIndex: number) => void;
  onRemoveSet: (exIndex: number, setIndex: number) => void;
  onUpdateSet: (
    exIndex: number,
    setIndex: number,
    field: 'bebanKg' | 'reps' | 'rpe' | 'isWarmup',
    value: number | boolean
  ) => void;
  onStartRestTimer: (seconds: number) => void;
}

export const StrengthSetBuilder: React.FC<StrengthSetBuilderProps> = ({
  strengthList,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onStartRestTimer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ExerciseType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');

  const filteredCatalog = useMemo(() => {
    return EXERCISE_CATALOG.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchType = selectedType === 'all' || item.type === selectedType;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.targetMuscles.toLowerCase().includes(q);
      return matchCat && matchType && matchSearch;
    });
  }, [selectedCategory, selectedType, searchQuery]);

  const handleAddFromCatalog = () => {
    const found = EXERCISE_CATALOG.find((item) => item.id === selectedExerciseId);
    if (!found) return;
    const defaultWeight =
      found.category === 'legs' ? 60 : found.category === 'arms' || found.category === 'core' ? 15 : 40;
    onAddExercise({
      namaGerakan: found.name,
      category: found.category,
      isLegExercise: found.isLegStrain,
      sets: [
        { bebanKg: defaultWeight, reps: 10, rpe: 7.5 },
        { bebanKg: defaultWeight, reps: 10, rpe: 8 },
        { bebanKg: defaultWeight, reps: 10, rpe: 8 },
      ],
    });
    setSelectedExerciseId('');
  };

  return (
    <div style={{ marginBottom: '2.5rem' }}>
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
          <Dumbbell size={20} style={{ color: 'var(--accent-neon)' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            1. Movement Catalog &amp; Sets (Push, Pull, Legs, Arms, Core)
          </h3>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Total Strength Load:{' '}
          <strong style={{ color: 'var(--accent-neon)' }}>{calculateStrengthLoad(strengthList)} pts</strong>
        </div>
      </div>

      {/* Catalog Selector */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>
            Target Muscle:
          </span>
          {(
            [
              { id: 'all', label: 'All Categories' },
              { id: 'push', label: 'PUSH (Chest, Shoulders, Triceps)' },
              { id: 'pull', label: 'PULL (Back, Biceps)' },
              { id: 'legs', label: 'LEGS (Quads, Glutes, Hamstrings)' },
              { id: 'arms', label: 'ARMS (Isolation)' },
              { id: 'core', label: 'CORE & STABILIZERS' },
            ] as const
          ).map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedExerciseId('');
                }}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'rgba(204, 255, 0, 0.08)' : 'var(--bg-surface)',
                  color: isActive ? 'var(--accent-neon)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.78rem',
                  border: isActive ? '1px solid rgba(204, 255, 0, 0.35)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface)',
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            marginBottom: '1rem',
          }}
        >
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            aria-label="Search exercise catalog"
            placeholder="Search exercise name or target muscle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Movement Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ExerciseType | 'all')}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.85rem',
              }}
            >
              <option value="all">All Types</option>
              <option value="compound">Compound</option>
              <option value="isolation">Isolation</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="stability">Stability</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Exercise Catalog ({filteredCatalog.length})
            </label>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.55rem 0.75rem',
                fontSize: '0.85rem',
              }}
            >
              <option value="">Choose Exercise from Catalog...</option>
              {filteredCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.category.toUpperCase()}] {item.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!selectedExerciseId}
            onClick={handleAddFromCatalog}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              minHeight: '44px',
              borderRadius: 'var(--radius-sm)',
              background: selectedExerciseId ? 'var(--accent-neon)' : 'var(--bg-surface)',
              color: selectedExerciseId ? 'var(--text-inverse)' : 'var(--text-muted)',
              border: '1px solid var(--border-default)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: selectedExerciseId ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={16} /> Add Exercise
          </button>
        </div>
      </div>

      {/* Active Exercises */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {strengthList.map((exercise, exIdx) => {
          const exLoadPts = calculateStrengthLoad([exercise]);
          const exVolumeKg = calculateStrengthVolumeLoad([exercise]);
          const best1Rm = exercise.sets.reduce((max, s) => {
            const est = estimate1RM(s.bebanKg, s.reps).average;
            return est > max ? est : max;
          }, 0);
          const progression = evaluateDoubleProgression(
            exercise.namaGerakan,
            exercise.sets,
            8,
            12,
            exercise.category
          );

          return (
            <div
              key={`${exercise.namaGerakan}-${exIdx}`}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {exercise.namaGerakan}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Tonnage: <strong style={{ color: 'var(--text-primary)' }}>{exVolumeKg} kg</strong> &bull; Beban
                    sRPE: <strong style={{ color: 'var(--accent-neon)' }}>{exLoadPts} pts</strong> &bull; Est. 1RM:{' '}
                    <strong>{best1Rm} kg</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onStartRestTimer(120)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Timer size={13} /> Rest 2m
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${exercise.namaGerakan}`}
                    onClick={() => onRemoveExercise(exIdx)}
                    style={{
                      padding: '0.35rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {progression.shouldIncreaseWeight && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-success)',
                    marginBottom: '0.65rem',
                  }}
                >
                  <TrendingUp size={14} /> {progression.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {exercise.sets.map((s, setIdx) => (
                  <div
                    key={setIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr 1fr 1fr auto',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      #{setIdx + 1}
                    </span>
                    <input
                      type="number"
                      aria-label={`Set ${setIdx + 1} beban kg`}
                      min={0}
                      step={2.5}
                      value={s.bebanKg}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'bebanKg', Number(e.target.value) || 0)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.85rem',
                      }}
                    />
                    <input
                      type="number"
                      aria-label={`Set ${setIdx + 1} reps`}
                      min={1}
                      value={s.reps}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'reps', Number(e.target.value) || 1)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.85rem',
                      }}
                    />
                    <input
                      type="number"
                      aria-label={`Set ${setIdx + 1} RPE`}
                      min={5}
                      max={10}
                      step={0.5}
                      value={s.rpe}
                      onChange={(e) => onUpdateSet(exIdx, setIdx, 'rpe', Number(e.target.value) || 7)}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.85rem',
                      }}
                    />
                    <button
                      type="button"
                      aria-label={`Hapus set ${setIdx + 1}`}
                      disabled={exercise.sets.length <= 1}
                      onClick={() => onRemoveSet(exIdx, setIdx)}
                      style={{
                        padding: '0.35rem 0.5rem',
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        cursor: exercise.sets.length <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onAddSet(exIdx)}
                style={{
                  marginTop: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--accent-neon)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> + Add Set
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
