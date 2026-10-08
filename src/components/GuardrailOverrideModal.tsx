import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface GuardrailOverrideModalProps {
  isOpen: boolean;
  conflictSummary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GuardrailOverrideModal: React.FC<GuardrailOverrideModalProps> = ({
  isOpen,
  conflictSummary,
  onConfirm,
  onCancel,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) setAcknowledged(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="480px" ariaLabel="Konfirmasi mandiri override guardrail">
      <div
        className="modal-panel"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderTop: '3px solid var(--color-warning)',
          width: '100%',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Konfirmasi Mandiri (Override)
          </h2>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
          {conflictSummary}
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            style={{ marginTop: '0.2rem', cursor: 'pointer' }}
          />
          <span>
            Saya memahami risiko interferensi pemulihan kaki dan tetap ingin mencatat sesi ini.
            Sesi akan ditandai sebagai override pada riwayat latihan.
          </span>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!acknowledged}
            style={{
              background: acknowledged ? 'var(--accent-neon)' : 'var(--bg-surface-elevated)',
              color: acknowledged ? 'var(--text-inverse)' : 'var(--text-muted)',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
            }}
          >
            Lanjutkan tetap
          </Button>
        </div>
      </div>
    </Modal>
  );
};

