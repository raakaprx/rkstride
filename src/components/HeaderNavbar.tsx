import React from 'react';
import { Activity, Watch, Calendar, Dumbbell, Database, Info, TrendingUp, Apple, User } from 'lucide-react';
import { SmartwatchDeviceState } from '@/lib/engine/smartwatch';

interface HeaderNavbarProps {
  activeTab: 'training' | 'trends' | 'nutrition' | 'schedule' | 'smartwatch';
  setActiveTab: (tab: 'training' | 'trends' | 'nutrition' | 'schedule' | 'smartwatch') => void;
  smartwatchState: SmartwatchDeviceState;
  onOpenSmartwatchModal: () => void;
  onOpenDataModal?: () => void;
  onOpenAboutModal?: () => void;
  onOpenProfileModal?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  smartwatchState,
  onOpenSmartwatchModal,
  onOpenDataModal,
  onOpenAboutModal,
  onOpenProfileModal,
}) => {
  return (
    <header
      style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.875rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: '#141417',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-elevation-1)',
            }}
          >
            {/* Custom RKStride Athletic Vector Logo */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 19L11 4H15L8 19H4Z"
                fill="var(--accent-neon)"
              />
              <path
                d="M13 11L18 4H21L15 13L20 20H16L12.5 15"
                stroke="var(--accent-neon)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 900,
                  fontSize: '1.35rem',
                  letterSpacing: '0.04em',
                  color: '#FFFFFF',
                }}
              >
                RK<span style={{ color: 'var(--accent-neon)' }}>STRIDE</span>
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-neon-subtle)',
                  color: 'var(--accent-neon)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(204, 255, 0, 0.2)',
                }}
              >
                Hybrid Engine
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Push-Pull-Legs &amp; Running Workload Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Segmented Control) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-primary)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: '2px',
            overflowX: 'auto',
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <button
            onClick={() => setActiveTab('training')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              background: activeTab === 'training' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'training' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'training' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <Dumbbell size={15} style={{ color: activeTab === 'training' ? 'var(--accent-neon)' : 'inherit' }} />
            <span>Workout &amp; Workload</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              background: activeTab === 'trends' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'trends' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'trends' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <TrendingUp size={15} style={{ color: activeTab === 'trends' ? 'var(--accent-neon)' : 'inherit' }} />
            <span>ACWR Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('nutrition')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              background: activeTab === 'nutrition' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'nutrition' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'nutrition' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <Apple size={15} style={{ color: activeTab === 'nutrition' ? 'var(--accent-neon)' : 'inherit' }} />
            <span>Nutrition &amp; TDEE</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              background: activeTab === 'schedule' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'schedule' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'schedule' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <Calendar size={15} style={{ color: activeTab === 'schedule' ? 'var(--accent-neon)' : 'inherit' }} />
            <span>Weekly Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('smartwatch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              border: 'none',
              background: activeTab === 'smartwatch' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'smartwatch' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'smartwatch' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <Watch size={15} style={{ color: activeTab === 'smartwatch' ? 'var(--accent-neon)' : 'inherit' }} />
            <span>Smartwatch Hub</span>
          </button>
        </nav>

        {/* Right Action Badges & Modal Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Athlete Profile & Target Race Trigger */}
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              title="Atur Profil Fisiologi & Target Lomba"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              <User size={13} style={{ color: 'var(--accent-neon)' }} />
              <span>Profile &amp; Race</span>
            </button>
          )}

          {/* Smartwatch Status Badge */}
          <button
            onClick={onOpenSmartwatchModal}
            title="Open Smartwatch Sync & Biometric Hub"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: smartwatchState.connected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-default)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: smartwatchState.connected ? 'var(--color-success)' : 'var(--text-muted)',
              }}
            />
            <Watch size={13} style={{ color: smartwatchState.connected ? 'var(--color-success)' : 'var(--text-muted)' }} />
            <span style={{ fontWeight: 600 }}>
              {smartwatchState.connected ? smartwatchState.deviceName.split(' ')[0] : 'Device'}{' '}
              {smartwatchState.connected ? 'Connected' : 'Offline'}
            </span>
            {smartwatchState.liveHeartRate && (
              <span
                style={{
                  color: 'var(--accent-neon)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Activity size={12} /> {smartwatchState.liveHeartRate} bpm
              </span>
            )}
          </button>

          {/* Backup / Export / Import Trigger */}
          {onOpenDataModal && (
            <button
              onClick={onOpenDataModal}
              title="Backup, Export & Import Local Data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              <Database size={13} style={{ color: 'var(--accent-neon)' }} />
              <span>Backup</span>
            </button>
          )}

          {/* Scientific Disclaimer & About Trigger */}
          {onOpenAboutModal && (
            <button
              onClick={onOpenAboutModal}
              title="About RKStride & Sports Science Disclaimer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              <Info size={13} style={{ color: 'var(--accent-neon)' }} />
              <span>Science &amp; About</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

