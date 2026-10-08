import React, { useState, useEffect } from 'react';
import { X, KeyRound, ShieldCheck } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import {
  getAiCoachConfig,
  saveAiCoachConfig,
  getEnvApiKey,
  AiCoachConfig,
} from '@/lib/ai/geminiCoach';

interface AICoachSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICoachSettingsModal: React.FC<AICoachSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [config, setConfig] = useState<AiCoachConfig>({
    mode: 'byok',
    byokApiKey: '',
    proxyUrl: '',
    sendTelemetry: true,
  });
  const [saved, setSaved] = useState(false);
  const envKeyPresent = getEnvApiKey().length > 0;

  useEffect(() => {
    if (isOpen) {
      setConfig(getAiCoachConfig());
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveAiCoachConfig(config);
    setSaved(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="520px" ariaLabel="Pengaturan AI Coach">
      <div
        className="modal-panel"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--accent-neon)',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-elevation-3)',
          padding: '1.75rem',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Tutup pengaturan AI Coach"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-neon-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <KeyRound size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Pengaturan AI Coach
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kunci API tersimpan lokal di browser Anda
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Mode Koneksi
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['byok', 'proxy'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setConfig({ ...config, mode: m })}
                  aria-pressed={config.mode === m}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    background: config.mode === m ? 'var(--accent-neon-subtle)' : 'var(--bg-surface)',
                    border: config.mode === m ? '1px solid var(--accent-neon)' : '1px solid var(--border-default)',
                    color: config.mode === m ? 'var(--accent-neon)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {m === 'byok' ? 'BYOK (Kunci Sendiri)' : 'Proxy Lokal'}
                </button>
              ))}
            </div>
          </div>

          {config.mode === 'byok' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Gemini API Key
              </label>
              <input
                type="password"
                value={config.byokApiKey}
                onChange={(e) => setConfig({ ...config, byokApiKey: e.target.value })}
                placeholder="Tempel API key Gemini Anda"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {envKeyPresent
                  ? 'Kunci dari file .env terdeteksi dan dipakai sebagai cadangan.'
                  : 'Tanpa kunci, rkbot menjawab dengan mesin offline lokal.'}
              </span>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                URL Proxy Lokal
              </label>
              <input
                type="url"
                value={config.proxyUrl}
                onChange={(e) => setConfig({ ...config, proxyUrl: e.target.value })}
                placeholder="https://proxy-anda/send"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              cursor: 'pointer',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            <input
              type="checkbox"
              checked={config.sendTelemetry}
              onChange={(e) => setConfig({ ...config, sendTelemetry: e.target.checked })}
            />
            <span>
              Kirim ringkasan metrik anonim ke AI Coach
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hanya agregat (ACWR, kesiapan, jam kaki). Matikan untuk jawaban berbasis sains umum.
              </span>
            </span>
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
            <span>Kunci API tidak pernah masuk bundel rilis atau backup selain milik Anda sendiri.</span>
          </div>

          {saved && (
            <div style={{ fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600 }}>
              Pengaturan tersimpan di browser ini.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
