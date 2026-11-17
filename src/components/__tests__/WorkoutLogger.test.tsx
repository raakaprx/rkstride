import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutLogger } from '../WorkoutLogger';

describe('WorkoutLogger Component - Unit & Interaction Tests', () => {
  const mockSaveWorkout = vi.fn();
  const mockCalculateProjectedImpact = vi.fn().mockReturnValue({
    draftLoad: 350,
    projectedACWR: 1.05,
    projectedStatus: 'sweet_spot',
    isOverloaded: false,
    legConflict: false,
    advice: 'Optimal training zone.',
  });
  const mockDebrief = vi.fn();

  const defaultProps = {
    onSaveWorkout: mockSaveWorkout,
    calculateProjectedImpact: mockCalculateProjectedImpact,
    lastLegsHoursAgo: 48,
    onWorkoutCompletedDebrief: mockDebrief,
  };

  it('renders workout logger heading and initial exercises', () => {
    render(<WorkoutLogger {...defaultProps} />);

    expect(screen.getByText(/Interactive Workout Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Movement Catalog & Sets/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Running Spectrum & TRIMP Workload/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Flat Barbell \/ Dumbbell Bench Press/i })).toBeInTheDocument();
  });

  it('adds an exercise from catalog dropdown when selected and button clicked', () => {
    render(<WorkoutLogger {...defaultProps} />);

    // Target the catalog select dropdown
    const select = screen.getByDisplayValue(/Choose Exercise from Catalog/i);
    expect(select).toBeInTheDocument();

    // Select an exercise option by valid catalog ID
    fireEvent.change(select, { target: { value: 'push-bw-1' } });

    // Click "Add Exercise" button
    const addButton = screen.getByRole('button', { name: /Add Exercise/i });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    // Verify exercise is added to active workout list as an h4 heading
    expect(screen.getByRole('heading', { name: /Standard Push-Up/i })).toBeInTheDocument();
  });

  it('allows adding sets to existing exercises', () => {
    render(<WorkoutLogger {...defaultProps} />);

    // Click the first "+ Add Set" button
    const addSetButtons = screen.getAllByRole('button', { name: /Add Set/i });
    expect(addSetButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(addSetButtons[0]);

    // Verify sets are rendered (indicated by set index #1, #2, #3, #4)
    const setNumbers = screen.getAllByText(/#\d/);
    expect(setNumbers.length).toBeGreaterThan(5);
  });

  it('triggers onSaveWorkout when user clicks Save button', () => {
    mockSaveWorkout.mockClear();
    render(<WorkoutLogger {...defaultProps} />);

    // Click Save & Log Today's Workout button
    const saveButton = screen.getByRole('button', { name: /Save & Log Today/i });
    fireEvent.click(saveButton);

    // Verify onSaveWorkout callback was triggered
    expect(mockSaveWorkout).toHaveBeenCalledTimes(1);
    const calledArg = mockSaveWorkout.mock.calls[0][0];
    expect(calledArg.strengthExercises).toBeDefined();
    expect(calledArg.strengthExercises.length).toBeGreaterThanOrEqual(2);
    expect(calledArg.mode).toBe('append');
    expect(calledArg.targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('supports Plan-to-Log button when weeklySchedule is provided', () => {
    render(
      <WorkoutLogger
        {...defaultProps}
        weeklySchedule={[
          { id: 'd0', dayIndex: 0, dayName: 'Senin', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
          { id: 'd1', dayIndex: 1, dayName: 'Selasa', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
          { id: 'd2', dayIndex: 2, dayName: 'Rabu', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
          { id: 'd3', dayIndex: 3, dayName: 'Kamis', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
          { id: 'd4', dayIndex: 4, dayName: 'Jumat', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
          { id: 'd5', dayIndex: 5, dayName: 'Sabtu', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
          { id: 'd6', dayIndex: 6, dayName: 'Minggu', category: 'norwegian_4x4', title: 'VO2 Max 4x4', targetDurationMinutes: 44, isRestDay: false },
        ]}
      />
    );
    const planButton = screen.getByRole('button', { name: /Muat Menu Hari Ini/i });
    expect(planButton).toBeInTheDocument();
    fireEvent.click(planButton);
  });
});
