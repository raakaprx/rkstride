import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { Modal } from './ui/Modal';

interface OnboardingDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onOpenAboutDetails: () => void;
}

export const OnboardingDisclaimerModal: React.FC<OnboardingDisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onOpenAboutDetails,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onOpenAboutDetails} maxWidth="540px" ariaLabel="Persetujuan awal RKStride">
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--accent-neon)',
          width: '100%',
          boxShadow: 'var(--shadow-elevation-3)',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(204, 255, 0, 0.12)',
              border: '1px solid rgba(204, 255, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Selamat Datang di RKStride
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Persetujuan Awal &amp; Batasan Sistem Pendukung Keputusan
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Sebelum Anda mulai menyusun program latihan hibrida (PPL &amp; Lari), harap pahami 3 prinsip fondasi berikut:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: 'var(--accent-neon)', display: 'block', marginBottom: '0.2rem' }}>
              1. Alat Bantu Keputusan, Bukan Diagnosis Medis
            </strong>
            RKStride adalah sistem pelacakan beban fisiologi. Metrik ACWR dan skor kesiapan bukan garansi mutlak pencegahan cedera, melainkan indikator adaptasi mekanis jaringan lunak.
          </div>

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: 'var(--accent-neon)', display: 'block', marginBottom: '0.2rem' }}>
              2. Kedaulatan &amp; Privasi Data Lokal Penuh
            </strong>
            Seluruh data latihan dan biometrik disimpan privat di peramban Anda (IndexedDB). Anda memegang kontrol penuh untuk mengekspor atau menghapus data Anda kapan pun.
          </div>

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            <strong style={{ color: 'var(--accent-neon)', display: 'block', marginBottom: '0.2rem' }}>
              3. Tanggung Jawab Latihan Mandiri
            </strong>
            Jika mengalami rasa sakit mendadak, pusing berat, atau nyeri sendi tajam saat berolahraga, segera hentikan latihan dan konsultasikan dengan dokter atau fisioterapis.
          </div>
        </div>

        {/* Read more link */}
        <button
          onClick={onOpenAboutDetails}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-neon)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            marginBottom: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>Baca penjelasan ilmiah lengkap &amp; kritik model ACWR</span>
          <Info size={14} />
        </button>

        {/* Checkbox agreement */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-primary)',
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: '0.15rem', accentColor: 'var(--accent-neon)' }}
          />
          <span>
            Saya telah membaca dan memahami bahwa RKStride adalah sistem pendukung keputusan atletik non-medis.
          </span>
        </label>

        {/* Submit */}
        <button
          onClick={onAccept}
          disabled={!agreed}
          style={{
            width: '100%',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: agreed ? 'var(--accent-neon)' : 'var(--border-default)',
            color: agreed ? 'var(--text-inverse)' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            cursor: agreed ? 'pointer' : 'not-allowed',
            transition: 'background var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle size={18} />
          <span>Mulai Menggunakan RKStride</span>
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0, textAlign: 'center' }}>
          Menutup jendela ini akan membuka penjelasan ilmiah lengkap.
        </p>
      </div>
    </Modal>
  );
};


