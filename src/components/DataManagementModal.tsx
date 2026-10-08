import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import {
  exportDatabaseToJson,
  exportWorkoutLogsToCsv,
  importDatabaseFromJson,
  ImportResult,
} from '@/lib/db/exportImport';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
}) => {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [wipeBeforeImport, setWipeBeforeImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export to JSON
  const handleExportJson = async () => {
    setExportError(null);
    try {
      const jsonString = await exportDatabaseToJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rkstride-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export JSON error:', err);
      setExportError('Gagal mengekspor data JSON: ' + (err.message || 'kesalahan tak dikenal'));
    }
  };

  // Handle Export to CSV
  const handleExportCsv = async () => {
    setExportError(null);
    try {
      const csvString = await exportWorkoutLogsToCsv();
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rkstride-workout-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export CSV error:', err);
      setExportError('Gagal mengekspor data CSV: ' + (err.message || 'kesalahan tak dikenal'));
    }
  };

  // Handle File Upload Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = await importDatabaseFromJson(content, { wipeBeforeImport });
        setImportResult(result);
        setIsProcessing(false);
        if (result.success) {
          onDataImported();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="600px" ariaLabel="Manajemen dan portabilitas data">
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
          }}
          aria-label="Tutup modal manajemen data"
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
            <Database size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Manajemen &amp; Portabilitas Data
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Ekspor, Impor, dan Validasi Skema Cadangan Lokal (IndexedDB)
            </p>
          </div>
        </div>

        {/* Import Status Messages */}
        {importResult && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: importResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: importResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              {importResult.success ? (
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
              ) : (
                <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} />
              )}
              <strong style={{ fontSize: '0.88rem', color: importResult.success ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {importResult.success ? 'Impor Berhasil' : 'Impor Gagal (Data Ditolak)'}
              </strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
              {importResult.message}
            </p>

            {importResult.errorDetails && importResult.errorDetails.length > 0 && (
              <div style={{ marginTop: '0.75rem', maxHeight: '140px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
                  Rincian Validasi Skema (Zod):
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {importResult.errorDetails.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {importResult.errorDetails.length > 5 && (
                    <li>...dan {importResult.errorDetails.length - 5} kesalahan lainnya</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Card 1: Ekspor JSON */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <FileText size={18} style={{ color: 'var(--accent-neon)' }} />
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Cadangan Lengkap (JSON)</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Menyimpan seluruh data riwayat log, profil, kesiapan harian, dan jadwal mingguan.
              </p>
            </div>
            <button
              onClick={handleExportJson}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-neon)',
                color: 'var(--text-inverse)',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Download size={15} />
              <span>Ekspor JSON</span>
            </button>
          </div>

          {/* Card 2: Ekspor CSV */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--color-info)' }} />
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Tabel Riwayat Latihan (CSV)</strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Format tabular ramah Excel/Google Sheets untuk analisis beban dan perkembangan.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: 'var(--color-info)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Download size={15} />
              <span>Ekspor CSV</span>
            </button>
          </div>

          {/* Card 3: Impor JSON */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Upload size={18} style={{ color: 'var(--color-warning)' }} />
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Pulihkan Cadangan (Impor JSON)</strong>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Unggah file backup `.json` sebelumnya. Data divalidasi dengan Zod secara atomik untuk mencegah korupsi database.
            </p>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                marginBottom: '1rem',
              }}
            >
              <input
                type="checkbox"
                checked={wipeBeforeImport}
                onChange={(e) => setWipeBeforeImport(e.target.checked)}
              />
              <span>
                Ganti seluruh data (hapus data lama dulu)
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tanpa ini, data backup digabung dengan data yang sudah ada.
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: isProcessing ? 'wait' : 'pointer',
              }}
            >
              <Upload size={15} />
              <span>{isProcessing ? 'Memvalidasi...' : 'Pilih File Backup JSON'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              disabled={isProcessing}
              aria-label="Pilih file backup JSON"
              style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
            />
          </div>
        </div>

        {/* Export error banner (inline, never alert()) */}
        {exportError && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              fontSize: '0.82rem',
              color: 'var(--color-danger)',
            }}
          >
            {exportError}
          </div>
        )}

        {/* Security & Privacy Notice */}
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          <strong>Kedaulatan Data:</strong> File backup JSON berisi salinan data biometrik Anda. Simpan file backup Anda di media penyimpanan yang aman.
        </div>
      </div>
    </Modal>
  );
};


