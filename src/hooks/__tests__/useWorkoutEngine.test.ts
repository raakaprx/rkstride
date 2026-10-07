import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutEngine } from '../useWorkoutEngine';
import { RunSession } from '@/types/workout';

const fastRun: RunSession = {
  jarakKm: 7.2,
  durasiMenit: 44,
  avgPace: 4.8,
  avgHeartRate: 168,
  runningType: 'norwegian_4x4',
};

describe('useWorkoutEngine - guardrail override persistence', () => {
  it('stamps isOverridden on logged running sessions when override is passed', () => {
    const { result } = renderHook(() => useWorkoutEngine());

    act(() => {
      result.current.logTodayWorkout({
        strengthExercises: [],
        runningSessions: [fastRun],
        isOverridden: true,
      });
    });

    const latest = result.current.history[0];
    expect(latest.runningWorkouts).toHaveLength(1);
    expect(latest.runningWorkouts[0].isOverridden).toBe(true);
  });

  it('leaves logged sessions unflagged when no override is passed', () => {
    const { result } = renderHook(() => useWorkoutEngine());

    act(() => {
      result.current.logTodayWorkout({
        strengthExercises: [],
        runningSessions: [fastRun],
      });
    });

    const latest = result.current.history[0];
    expect(latest.runningWorkouts).toHaveLength(1);
    expect(latest.runningWorkouts[0].isOverridden).toBeFalsy();
  });
});
