import React from 'react';
import {
  X,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Database,
  Lock,
} from 'lucide-react';
import { Modal } from './ui/Modal';

interface AboutDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDisclaimerModal: React.FC<AboutDisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="680px" ariaLabel="Tentang RKStride dan batasan sains">
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          borderTop: '3px solid var(--accent-neon)',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-elevation-3)',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Tutup jendela informasi"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(204, 255, 0, 0.1)',
              border: '1px solid rgba(204, 255, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Tentang RKStride &amp; Batasan Sains
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Prinsip Fisiologi Olahraga, Keterbatasan ACWR, dan Privasi Data
            </p>
          </div>
        </div>

        {/* Section 1: Non-Medical Disclaimer */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--color-warning)' }}>
            <AlertTriangle size={18} />
            <strong style={{ fontSize: '0.9rem' }}>Disclaimer Non-Medis Resmi</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            RKStride adalah sistem pendukung keputusan latihan atletik (*decision-support tool*), bukan alat diagnostik medis atau pengganti pertimbangan klinis profesional. Aplikasi ini tidak menjamin pencegahan cedera secara mutlak. Jika Anda mengalami nyeri sendi tajam, nyeri dada, sesak nafas mendadak, atau cedera akut, segera hentikan latihan dan konsultasikan dengan dokter atau tenaga medis berwenang.
          </p>
        </div>

        {/* Section 2: Keterbatasan ACWR */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--accent-neon)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Keterbatasan Model ACWR (Kritik Ilmiah)
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            Meskipun formula *Acute:Chronic Workload Ratio* (Dr. Tim Gabbett, 2016) banyak digunakan dalam manajemen performa olahraga, komunitas sains olahraga modern (misalnya kritik Impellizzeri et al., 2020) menggarisbawahi beberapa keterbatasan penting:
          </p>
          <ul style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.25rem', margin: 0 }}>
            <li>
              <strong>ACWR adalah Rasio Beban, Bukan Peramal Cedera:</strong> Cedera atletik bersifat multifaktorial (kualitas jaringan, biomekanik gerak, riwayat cedera lama, tingkat hidrasi, dan stres psikososial). ACWR hanya memantau satu variabel: fluktuasi beban mekanis.
            </li>
            <li>
              <strong>Masalah Artefak Matematis (Coupling):</strong> Pada metode bergulir klasik (7/28 hari), beban akut juga termasuk di dalam beban kronis sehingga terjadi korelasi buatan. RKStride mengatasi hal ini dengan menyediakan opsi metode *Uncoupled* (7 vs 21 hari) dan *EWMA* (Exponentially Weighted Moving Average).
            </li>
            <li>
              <strong>Kebutuhan Periode Baseline (Cold-Start):</strong> ACWR membutuhkan minimal 21 hari pencatatan kontinu sebelum rasionya memiliki signifikansi statistik.
            </li>
          </ul>
        </div>

        {/* Section 3: Privasi & Keamanan Data Lokal */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Database size={18} style={{ color: 'var(--color-info)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Privasi &amp; Kedaulatan Data Atlet
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Semua riwayat latihan, metrik biometrik kesiapan tubuh, dan jadwal Anda disimpan secara lokal di peramban Anda menggunakan teknologi **IndexedDB (Dexie)**. Data Anda tidak pernah dikirim ke server pusat milik pengembang. Fitur ekspor/impor JSON dan CSV tersedia agar Anda memiliki kendali penuh atas data Anda.
          </p>
        </div>

        {/* Section 4: Mode AI Coach (BYOK & Proxy) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Lock size={18} style={{ color: 'var(--accent-neon)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Keamanan Google Gemini AI Coach
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            AI Coach RKStride tidak menyimpan kunci API pada bundel rilis publik. Pengguna dapat menggunakan mode **BYOK (Bring Your Own Key)** yang disimpan secara lokal di browser, atau menghubungkan **Proxy Backend Tipis** pribadi. Telemetri yang dikirimkan hanya berupa rangkuman metrik tingkat tinggi (agregat), dan dapat dinonaktifkan sepenuhnya melalui tombol privasi.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-neon)',
            color: 'var(--text-inverse)',
            fontWeight: 800,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity var(--transition-fast)',
          }}
        >
          Saya Memahami Ketentuan Ini
        </button>
      </div>
    </Modal>
  );
};

