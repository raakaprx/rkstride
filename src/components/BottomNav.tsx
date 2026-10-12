import React from 'react';
import { Activity, GaugeCircle, Layers, Apple, Bot } from 'lucide-react';
import { hapticTap } from '@/lib/platform';

/**
 * Destination identity for primary navigation. Single source of truth:
 * App.tsx derives its active-tab type from this union, so adding or removing
 * a destination is a one-line change here plus its panel.
 *
 * Note what is NOT a tab: the smartwatch hub. It is a data source that feeds
 * three of these five surfaces, not a place an athlete goes to do work, so it
 * lives behind the header's watch affordance instead of consuming a fifth of
 * the prime thumb zone.
 */
export type AppTab = 'today' | 'load' | 'program' | 'fuel' | 'coach';

interface DockTab {
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ size?: number | string }>;
}

const DOCK_TABS: DockTab[] = [
  { id: 'today', label: 'Hari Ini', icon: Activity },
  { id: 'load', label: 'Beban', icon: GaugeCircle },
  { id: 'program', label: 'Program', icon: Layers },
  { id: 'fuel', label: 'Nutrisi', icon: Apple },
  { id: 'coach', label: 'Coach', icon: Bot },
];

export interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  /** Unread coach insight; renders a dot on the Coach tab. 0 hides it. */
  coachBadgeCount?: number;
}

/**
 * Floating bottom dock (Pilar 1). Every reachable destination sits inside the
 * natural thumb arc. Fixed surfaces offset by --safe-bottom so the labels
 * never collide with the iOS home indicator.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  coachBadgeCount = 0,
}) => (
  <nav
    className="bottom-dock"
    aria-label="Navigasi utama"
    style={{
      position: 'fixed',
      left: '0.75rem',
      right: '0.75rem',
      bottom: 'calc(0.75rem + var(--safe-bottom))',
      zIndex: 'var(--z-floating)',
      height: 'var(--size-dock)',
      background: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-elevation-3)',
      display: 'grid',
      gridTemplateColumns: `repeat(${DOCK_TABS.length}, 1fr)`,
      alignItems: 'stretch',
      padding: '0.25rem',
    }}
  >
    {DOCK_TABS.map((tab) => {
      const isActive = tab.id === activeTab;
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          type="button"
          aria-current={isActive ? 'page' : undefined}
          onClick={() => {
            if (!isActive) hapticTap();
            onSelectTab(tab.id);
          }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.15rem',
            minHeight: 0,
            background: isActive ? 'var(--accent-neon-subtle)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            color: isActive ? 'var(--accent-neon)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          <Icon size={20} />
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: isActive ? 800 : 600,
              letterSpacing: 'var(--tracking-status)',
            }}
          >
            {tab.label}
          </span>
          {tab.id === 'coach' && coachBadgeCount > 0 && (
            <span
              aria-label={`${coachBadgeCount} rekomendasi baru`}
              style={{
                position: 'absolute',
                top: '0.35rem',
                right: '28%',
                width: '7px',
                height: '7px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-recovery)',
              }}
            />
          )}
        </button>
      );
    })}
  </nav>
);
