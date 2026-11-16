import React, { useState } from 'react';
import { X, Download, CheckCircle2, Clock, CircleDot, Layers, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Modal } from './ui/Modal';
import { ODOO_SPRINT_TASKS, generateOdooCsvContent, OdooTaskItem } from '@/data/odooSprintData';

interface OdooSprintDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OdooSprintDocsModal: React.FC<OdooSprintDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'board' | 'blueprint' | 'glossary'>('board');
  const [selectedSprintFilter, setSelectedSprintFilter] = useState<string>('all');

  if (!isOpen) return null;

  const sprints = Array.from(new Set(ODOO_SPRINT_TASKS.map((t) => t.sprint)));
  const filteredTasks =
    selectedSprintFilter === 'all'
      ? ODOO_SPRINT_TASKS
      : ODOO_SPRINT_TASKS.filter((t) => t.sprint === selectedSprintFilter);

  const totalPoints = ODOO_SPRINT_TASKS.reduce((acc, t) => acc + t.storyPoints, 0);
  const donePoints = ODOO_SPRINT_TASKS.filter((t) => t.stage === 'Done').reduce(
    (acc, t) => acc + t.storyPoints,
    0
  );

  const handleDownloadOdooCsv = () => {
    const csv = generateOdooCsvContent();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rkstride-odoo-sprint-tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStageBadge = (stage: OdooTaskItem['stage']) => {
    if (stage === 'Done') {
      return {
        label: 'Done (Selesai)',
        color: 'var(--color-success)',
        bg: 'var(--color-success-bg)',
        icon: <CheckCircle2 size={13} />,
      };
    }
    if (stage === 'In Progress') {
      return {
        label: 'In Progress',
        color: 'var(--color-warning)',
        bg: 'var(--color-warning-bg)',
        icon: <Clock size={13} />,
      };
    }
    return {
      label: 'To Do (Backlog)',
      color: 'var(--text-secondary)',
      bg: 'var(--bg-surface-elevated)',
      icon: <CircleDot size={13} />,
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="920px" ariaLabel="Papan Sprint Odoo dan Dokumentasi Sistem">
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
          type="button"
          onClick={onClose}
          aria-label="Tutup jendela Sprint Odoo dan Dokumentasi"
          style={{
            position: 'absolute',
            top: '1.1rem',
            right: '1.1rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingRight: '3rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-neon-subtle)',
              border: '1px solid var(--border-focus)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
              flexShrink: 0,
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Papan Sprint Odoo &amp; Dokumentasi Arsitektur RKStride
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Documentation-First Blueprint, Peta Jalan Sprint 1 s.d. 4 ({donePoints}/{totalPoints} Story Points selesai), &amp; Ekspor CSV Odoo Project
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Download CSV Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'board' ? 'var(--accent-neon)' : 'var(--bg-surface)',
                color: activeTab === 'board' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: activeTab === 'board' ? 'none' : '1px solid var(--border-default)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Layers size={15} />
              <span>1. Papan Sprint Odoo ({ODOO_SPRINT_TASKS.length} Task)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('blueprint')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'blueprint' ? 'var(--accent-neon)' : 'var(--bg-surface)',
                color: activeTab === 'blueprint' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: activeTab === 'blueprint' ? 'none' : '1px solid var(--border-default)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <BookOpen size={15} />
              <span>2. Blueprint Produk &amp; Cara Cek</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('glossary')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'glossary' ? 'var(--accent-neon)' : 'var(--bg-surface)',
                color: activeTab === 'glossary' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: activeTab === 'glossary' ? 'none' : '1px solid var(--border-default)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <FileSpreadsheet size={15} />
              <span>3. Kamus Bahasa (Pemula / Menengah / Expert)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadOdooCsv}
            style={{
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-focus)',
              color: 'var(--accent-neon)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Download size={15} />
            <span>Unduh CSV Impor Odoo</span>
          </button>
        </div>

        {/* TAB 1: ODOO SPRINT BOARD */}
        {activeTab === 'board' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Filter per Sprint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Filter Sprint:</span>
              <button
                type="button"
                onClick={() => setSelectedSprintFilter('all')}
                style={{
                  padding: '0.35rem 0.7rem',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedSprintFilter === 'all' ? 'var(--accent-neon-subtle)' : 'var(--bg-surface)',
                  color: selectedSprintFilter === 'all' ? 'var(--accent-neon)' : 'var(--text-secondary)',
                  border: selectedSprintFilter === 'all' ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Semua Sprint ({totalPoints} SP)
              </button>
              {sprints.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSelectedSprintFilter(sp)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedSprintFilter === sp ? 'var(--accent-neon-subtle)' : 'var(--bg-surface)',
                    color: selectedSprintFilter === sp ? 'var(--accent-neon)' : 'var(--text-secondary)',
                    border: selectedSprintFilter === sp ? '1px solid var(--border-focus)' : '1px solid var(--border-default)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {sp.split(':')[0]}
                </button>
              ))}
            </div>

            {/* Task Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredTasks.map((task) => {
                const badge = getStageBadge(task.stage);
                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: task.stage === 'Done' ? '1px solid var(--color-success)' : '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--accent-neon)',
                            border: '1px solid var(--border-default)',
                          }}
                        >
                          {task.id}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {task.sprint}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-info)', fontWeight: 600 }}>
                          [{task.auditRef}]
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: badge.bg,
                            color: badge.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {task.storyPoints} SP
                        </span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {task.title}
                    </h3>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                      {task.description}
                    </p>

                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        Acceptance Criteria (Definition of Done):
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {task.acceptanceCriteria.map((ac, idx) => (
                          <li key={idx}>{ac}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: BLUEPRINT & CARA CEK */}
        {activeTab === 'blueprint' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-neon)', marginBottom: '0.5rem' }}>
                Di Mana Mengecek Sprint Odoo &amp; Dokumentasi Proyek?
              </h3>
              <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Berkas Markdown Langsung di Editor:</strong> Buka{' '}
                  <code style={{ color: 'var(--accent-neon)' }}>docs/odoo-sprint.md</code> dan{' '}
                  <code style={{ color: 'var(--accent-neon)' }}>docs/science.md</code>.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Berkas Impor ERP Odoo Project:</strong> Buka{' '}
                  <code style={{ color: 'var(--accent-neon)' }}>docs/odoo-tasks-import.csv</code> atau klik tombol{' '}
                  <strong>Unduh CSV Impor Odoo</strong> di kanan atas jendela ini untuk mengimpornya ke modul <em>Odoo Project &gt; Tasks &gt; Import Records</em>.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Server Dokumentasi Interaktif via Terminal:</strong> Jalankan{' '}
                  <code style={{ color: 'var(--accent-neon)' }}>npm run doc:dev</code> di terminal untuk membuka portal dokumentasi mandiri di peramban.
                </li>
              </ol>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Arsitektur Gerbang Awal &amp; Value Proposition (Temuan #1 Selesai)
              </h3>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Sebelum masuk ke dasbor perhitungan, pengguna baru kini melewati <strong>AuthLandingGate</strong> yang menyelesaikan masalah kebingungan pengguna terhadap fungsi aplikasi:
              </p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Edukasi Masalah Hybrid Training:</strong> Menjelaskan mengapa menggabungkan angkat beban (PPL) dan lari tanpa pengukur beban terpadu memicu kelelahan otot kaki berlebih (*interference effect*).
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Login &amp; Registrasi Akun Atlet Lokal:</strong> Mendukung pembuatan akun atlet lokal di perangkat (IndexedDB), masuk kembali dengan PIN, serta tombol masuk cepat untuk evaluasi.
                </li>
                <li>
                  <strong style={{ color: 'var(--text-primary)' }}>Pemilihan Tingkat Pengalaman Sejak Awal:</strong> Pengguna memilih profil <strong>Pemula</strong>, <strong>Menengah</strong>, atau <strong>Expert</strong> saat masuk.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: KAMUS BAHASA MULTI-TIER */}
        {activeTab === 'glossary' && (
          <div style={{ overflowX: 'auto', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--accent-neon)' }}>
                  <th style={{ padding: '0.6rem' }}>Konsep Fisiologis</th>
                  <th style={{ padding: '0.6rem' }}>Bahasa Mode Pemula</th>
                  <th style={{ padding: '0.6rem' }}>Bahasa Mode Menengah</th>
                  <th style={{ padding: '0.6rem' }}>Bahasa Mode Expert</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--text-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Indikator Beban Utama</td>
                  <td style={{ padding: '0.6rem' }}>Status Keamanan Porsi Latihan</td>
                  <td style={{ padding: '0.6rem' }}>Rasio Beban Mingguan (ACWR)</td>
                  <td style={{ padding: '0.6rem' }}>ACWR (Coupled / Uncoupled / EWMA)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rentang Adaptasi 0.8 - 1.4</td>
                  <td style={{ padding: '0.6rem' }}>Porsi Latihan Pas &amp; Aman</td>
                  <td style={{ padding: '0.6rem' }}>Zona Optimal (Sweet Spot 0.8 - 1.4)</td>
                  <td style={{ padding: '0.6rem' }}>Adaptation Sweet Spot (Gabbett Model)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Beban Set Angkatan</td>
                  <td style={{ padding: '0.6rem' }}>Tingkat Capek (1 Ringan s.d. 10 Maksimal)</td>
                  <td style={{ padding: '0.6rem' }}>Skala Usaha RPE (1-10)</td>
                  <td style={{ padding: '0.6rem' }}>Foster Session-RPE &amp; RIR Proximity</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Proteksi Benturan Kaki</td>
                  <td style={{ padding: '0.6rem' }}>Jeda Istirahat Kaki 2 Hari Sebelum Lari Cepat</td>
                  <td style={{ padding: '0.6rem' }}>Jendela Pemulihan Otot Kaki 48 Jam</td>
                  <td style={{ padding: '0.6rem' }}>48h AMPK/mTORC1 Interference Guardrail</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Protokol Interval VO2 Max</td>
                  <td style={{ padding: '0.6rem' }}>Lari Cepat Bergantian 4x4 Menit</td>
                  <td style={{ padding: '0.6rem' }}>Interval VO2 Max (Norwegian 4x4)</td>
                  <td style={{ padding: '0.6rem' }}>Norwegian 4x4 (Helgerud 85-95% HRmax)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};
