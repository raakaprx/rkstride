import React, { useState } from 'react';
import { Watch, Database, Info, User, Settings2, Menu, WifiOff, X, Layers, LogOut } from 'lucide-react';
import { SmartwatchDeviceState } from '@/lib/engine/smartwatch';
import { AthleteAuthSession, ExperienceLevel } from '@/types/workout';

const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  expert: 'Expert',
};

interface HeaderNavbarProps {
  smartwatchState: SmartwatchDeviceState;
  isOnline: boolean;
  authSession?: AthleteAuthSession | null;
  experienceLevel?: ExperienceLevel;
  onChangeExperienceLevel?: (level: ExperienceLevel) => void;
  onOpenSmartwatchModal: () => void;
  onOpenDataModal?: () => void;
  onOpenAboutModal?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAiSettingsModal?: () => void;
  onOpenOdooModal?: () => void;
  onLogout?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  smartwatchState,
  isOnline,
  authSession,
  experienceLevel = 'intermediate',
  onChangeExperienceLevel,
  onOpenSmartwatchModal,
  onOpenDataModal,
  onOpenAboutModal,
  onOpenProfileModal,
  onOpenAiSettingsModal,
  onOpenOdooModal,
  onLogout,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const hr = smartwatchState.liveHeartRate;
  const activeLevel = authSession?.experienceLevel || experienceLevel;
  return (
    <header className="site-header" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 'var(--z-header)', paddingTop: 'var(--safe-top)' }}>
      <div className="site-header-inner" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 19L11 4H15L8 19H4Z" style={{ fill: 'var(--accent-neon)' }} />
              <path d="M13 11L18 4H21L15 13L20 20H16L12.5 15" style={{ stroke: 'var(--accent-neon)' }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-family-display)', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.04em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            RK<span style={{ color: 'var(--accent-neon)' }}>STRIDE</span>
          </span>
          {authSession && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.18rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent-neon-subtle)',
                border: '1px solid var(--border-default)',
                color: 'var(--accent-neon)',
                whiteSpace: 'nowrap',
              }}
            >
              {authSession.athleteName} ({LEVEL_LABELS[activeLevel]})
            </span>
          )}
          {!isOnline && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 'var(--tracking-status)', color: 'var(--text-muted)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.55rem' }}>
              <WifiOff size={12} /> OFFLINE
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
          {onChangeExperienceLevel && (
            <div
              role="group"
              aria-label="Pilih mode tingkat pengalaman"
              style={{
                display: 'inline-flex',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '2px',
                gap: '2px',
              }}
            >
              {(['beginner', 'intermediate', 'expert'] as const).map((lvl) => {
                const isSelected = activeLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChangeExperienceLevel(lvl)}
                    style={{
                      minHeight: '38px',
                      minWidth: '44px',
                      padding: '0 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-neon)' : 'transparent',
                      color: isSelected ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      border: 'none',
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {LEVEL_LABELS[lvl]}
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" onClick={onOpenSmartwatchModal} aria-label={hr ? `Jam terhubung, denyut ${hr} per menit. Buka sinkronisasi jam` : 'Buka sinkronisasi jam'} title="Sinkronisasi jam" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minHeight: '44px', padding: '0 0.7rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
            <Watch size={15} style={{ color: smartwatchState.connected ? 'var(--accent-neon)' : 'var(--text-muted)' }} />
            {hr !== undefined && <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{hr}</span>}
          </button>
          <button type="button" onClick={() => setIsMenuOpen((v) => !v)} aria-expanded={isMenuOpen} aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div role="menu" aria-label="Menu lanjutan" className="header-actions" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem 0.7rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {onOpenProfileModal && <button role="menuitem" type="button" onClick={() => { closeMenu(); onOpenProfileModal(); }} style={menuBtn}><User size={14} style={{ color: 'var(--accent-neon)' }} /><span>Profil</span></button>}
          {onOpenOdooModal && <button role="menuitem" type="button" onClick={() => { closeMenu(); onOpenOdooModal(); }} style={menuBtn}><Layers size={14} style={{ color: 'var(--accent-neon)' }} /><span>Sprint Odoo</span></button>}
          {onOpenDataModal && <button role="menuitem" type="button" onClick={() => { closeMenu(); onOpenDataModal(); }} style={menuBtn}><Database size={14} style={{ color: 'var(--accent-neon)' }} /><span>Backup</span></button>}
          {onOpenAiSettingsModal && <button role="menuitem" type="button" onClick={() => { closeMenu(); onOpenAiSettingsModal(); }} style={menuBtn}><Settings2 size={14} style={{ color: 'var(--accent-neon)' }} /><span>AI Coach</span></button>}
          {onOpenAboutModal && <button role="menuitem" type="button" onClick={() => { closeMenu(); onOpenAboutModal(); }} style={menuBtn}><Info size={14} style={{ color: 'var(--accent-neon)' }} /><span>Science</span></button>}
          {onLogout && <button role="menuitem" type="button" onClick={() => { closeMenu(); onLogout(); }} style={menuBtn}><LogOut size={14} style={{ color: 'var(--color-danger)' }} /><span>Keluar</span></button>}
        </div>
      )}
    </header>
  );
};

const menuBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.45rem', minHeight: '44px', padding: '0 0.8rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' };
