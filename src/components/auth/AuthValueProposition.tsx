import React from 'react';
import { Dumbbell, Timer, ShieldCheck } from 'lucide-react';

export const AuthValueProposition: React.FC = () => {
  return (
    <section aria-label="Pengenalan nilai RKStride" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1
          style={{
            fontSize: 'clamp(1.65rem, 3.2vw, 2.35rem)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            marginBottom: '0.75rem',
          }}
        >
          SATU MESIN BEBAN UNTUK{' '}
          <span style={{ color: 'var(--accent-neon)' }}>ANGKAT BEBAN &amp; LARI</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Mengapa atlet hibrida membutuhkan RKStride? Aplikasi gym biasa tidak tahu Anda baru saja berlari interval kemarin. Sebaliknya, aplikasi lari tidak tahu otot paha Anda masih mengalami kelelahan pasca latihan beban kaki (<em>Leg Day</em>). Benturan ini memicu kelelahan berlebih pada tendon lutut dan menghambat perkembangan otot.
        </p>
      </div>

      {/* Identity Motif: Live ACWR Zone Explanation Card */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderLeft: '3px solid var(--color-success)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Cara Kerja Penjaga Beban RKStride (ACWR)
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.15rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
            }}
          >
            TARGET SWEET SPOT: 0.8 - 1.4
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.9rem' }}>
          RKStride membandingkan beban latihan <strong>7 hari terakhir (Akut)</strong> dengan rata-rata <strong>28 hari terakhir (Kronis)</strong> agar peningkatan porsi latihan Anda selalu berada di zona adaptasi aman:
        </p>

        {/* Segmented Gauge Visual */}
        <div style={{ position: 'relative', height: '14px', display: 'flex', alignItems: 'center', marginBottom: '0.45rem' }}>
          <div style={{ display: 'flex', width: '100%', height: '7px', gap: '3px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ flex: 20, background: 'var(--border-strong)' }} title="Underload (< 0.8)" />
            <div style={{ flex: 40, background: 'var(--color-success)' }} title="Sweet Spot (0.8 - 1.4)" />
            <div style={{ flex: 40, background: 'var(--color-danger)' }} title="Zona Bahaya (> 1.4)" />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '40%',
              top: '-2px',
              width: '4px',
              height: '18px',
              background: 'var(--accent-neon)',
              borderRadius: '2px',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span>&lt; 0.8 Kurang Latihan</span>
          <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>0.8 - 1.4 Zona Adaptasi Aman</span>
          <span style={{ color: 'var(--color-danger)' }}>&gt; 1.4 Lonjakan Berisiko</span>
        </div>
      </div>

      {/* 3 Core Value Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.15rem',
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
          }}
        >
          <Dumbbell size={20} style={{ color: 'var(--accent-neon)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              1. Penyatuan Skor Angkat Beban (PPL) &amp; Lari
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Tidak perlu lagi menebak apakah total latihan minggu ini terlalu berat. Beban repetisi gym dan durasi lari (Zona 2 hingga <em>Norwegian 4x4</em>) dihitung dalam satu indikator terpadu.
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.15rem',
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
          }}
        >
          <Timer size={20} style={{ color: 'var(--color-info)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              2. Proteksi Jeda Pemulihan Kaki 48 Jam
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Sistem memperingatkan Anda jika menjadwalkan lari kecepatan tinggi kurang dari 48 jam setelah latihan kaki berat, namun tetap mengizinkan lari santai pemulihan (Zona 1-2 &le; 45 menit).
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.15rem',
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'flex-start',
          }}
        >
          <ShieldCheck size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              3. Menyesuaikan Level Anda (Pemula, Menengah, Expert) &amp; Privat
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Pilih mode bahasa yang sesuai dengan pemahaman Anda. Seluruh data tersimpan 100% lokal di perangkat Anda (IndexedDB) dan dapat dicadangkan kapan saja.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
