import React, { useState, useMemo } from 'react';
import { Apple, Flame, Droplets, Dumbbell, Activity } from 'lucide-react';
import { UserProfile } from '@/types/workout';
import { NutritionGoal, DailyActivityLevel } from '@/types/productFeatures';
import { calculateAthleteNutritionPlan } from '@/lib/engine/nutrition';

interface NutritionBodyCompCardProps {
  userProfile: UserProfile;
  todayWorkoutDurationMinutes?: number;
  todayWorkoutCaloriesBurned?: number;
  isWorkoutEstimated?: boolean;
}

export const NutritionBodyCompCard: React.FC<NutritionBodyCompCardProps> = ({
  userProfile,
  todayWorkoutDurationMinutes = 0,
  todayWorkoutCaloriesBurned = 0,
  isWorkoutEstimated = false,
}) => {
  const [goal, setGoal] = useState<NutritionGoal>('maintenance');
  const [activityLevel, setActivityLevel] = useState<DailyActivityLevel>('lightly_active');

  const plan = useMemo(() => {
    return calculateAthleteNutritionPlan(
      {
        weightKg: userProfile.weightKg || 72,
        heightCm: userProfile.heightCm || 175,
        age: userProfile.age || 28,
        gender: (userProfile as any).gender || 'male',
      },
      goal,
      activityLevel,
      todayWorkoutDurationMinutes,
      todayWorkoutCaloriesBurned
    );
  }, [userProfile, goal, activityLevel, todayWorkoutDurationMinutes, todayWorkoutCaloriesBurned]);

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-elevation-1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(204, 255, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <Apple size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              Nutrisi &amp; Keseimbangan Energi Atlet Hibrida
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Target makronutrisi berbasis bukti sains untuk sintesis protein &amp; glikogen lari
            </span>
          </div>
        </div>

        {/* Goal Selector */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setGoal('fat_loss')}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              background: goal === 'fat_loss' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: 'none',
              color: goal === 'fat_loss' ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Fat Loss (-400 kcal)
          </button>
          <button
            onClick={() => setGoal('maintenance')}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              background: goal === 'maintenance' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: 'none',
              color: goal === 'maintenance' ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Maintenance
          </button>
          <button
            onClick={() => setGoal('muscle_gain')}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'calc(var(--radius-sm) - 2px)',
              background: goal === 'muscle_gain' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: 'none',
              color: goal === 'muscle_gain' ? '#FFFFFF' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Lean Bulk (+300 kcal)
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid: Calories, Protein, Carbs, Fats, Water */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {/* Calories Card */}
        <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Energi</span>
            <Flame size={14} style={{ color: 'var(--accent-neon)' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF' }}>
            {plan.targetCalories.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>kcal</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            BMR: {plan.bmr} | TDEE: {plan.tdee}
            {isWorkoutEstimated && ' (kalori latihan: estimasi kasar sRPE x 1.5)'}
          </div>
        </div>

        {/* Protein Card */}
        <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Protein Harian</span>
            <Dumbbell size={14} style={{ color: 'var(--accent-neon)' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF' }}>
            {plan.proteinGrams} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--accent-neon)', marginTop: '0.2rem' }}>
            {plan.proteinPerKg} g/kg BB (Morton 2018)
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Karbohidrat (Bahan Bakar)</span>
            <Activity size={14} style={{ color: '#60A5FA' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF' }}>
            {plan.carbsGrams} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {plan.carbsPerKg} g/kg BB (Burke 2011)
          </div>
        </div>

        {/* Fats Card */}
        <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lemak Sehat</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>25% kkal</span>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF' }}>
            {plan.fatsGrams} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {plan.fatsCalories} kcal total
          </div>
        </div>

        {/* Hydration Card */}
        <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Target Hidrasi</span>
            <Droplets size={14} style={{ color: '#38BDF8' }} />
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#FFFFFF' }}>
            {plan.hydrationLiters} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Liter</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Sawka (2007) + Latihan
          </div>
        </div>
      </div>

      {/* Scientific Insights Callout */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          <strong style={{ color: '#FFFFFF' }}>Kaidah Fisiologi Nutrisi Hibrida:</strong> Asupan karbohidrat tinggi ({plan.carbsPerKg} g/kg) esensial untuk memulihkan cadangan glikogen otot pasca lari, sedangkan protein ({plan.proteinPerKg} g/kg) menstimulasi sintesis protein miofibril pasca sesi angkat beban.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tingkat Aktivitas Harian:</span>
          <select
            aria-label="Tingkat Aktivitas Harian"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as DailyActivityLevel)}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: '#FFFFFF',
              fontSize: '0.72rem',
            }}
          >
            <option value="sedentary">Sedentary (Pekerja Meja)</option>
            <option value="lightly_active">Ringan (Jalan Santai)</option>
            <option value="moderately_active">Moderat (Aktif Fisik)</option>
            <option value="very_active">Sangat Aktif (Pekerjaan Fisik)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
