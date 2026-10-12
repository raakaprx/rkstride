import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from '../BottomNav';

describe('BottomNav Component - Mobile Primary Navigation Dock', () => {
  it('renders all 5 primary destination tabs with proper labels', () => {
    render(<BottomNav activeTab="today" onSelectTab={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: /navigasi utama/i })).toBeInTheDocument();
    expect(screen.getByText('Hari Ini')).toBeInTheDocument();
    expect(screen.getByText('Beban')).toBeInTheDocument();
    expect(screen.getByText('Program')).toBeInTheDocument();
    expect(screen.getByText('Nutrisi')).toBeInTheDocument();
    expect(screen.getByText('Coach')).toBeInTheDocument();
  });

  it('marks active tab with aria-current="page"', () => {
    render(<BottomNav activeTab="load" onSelectTab={vi.fn()} />);

    const loadBtn = screen.getByText('Beban').closest('button');
    const todayBtn = screen.getByText('Hari Ini').closest('button');

    expect(loadBtn).toHaveAttribute('aria-current', 'page');
    expect(todayBtn).not.toHaveAttribute('aria-current');
  });

  it('calls onSelectTab with selected tab id when clicked', () => {
    const handleSelect = vi.fn();
    render(<BottomNav activeTab="today" onSelectTab={handleSelect} />);

    fireEvent.click(screen.getByText('Program'));
    expect(handleSelect).toHaveBeenCalledWith('program');
  });

  it('displays badge dot on Coach tab when coachBadgeCount > 0', () => {
    render(<BottomNav activeTab="today" onSelectTab={vi.fn()} coachBadgeCount={2} />);

    expect(screen.getByLabelText('2 rekomendasi baru')).toBeInTheDocument();
  });
});
