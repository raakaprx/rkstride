import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileImportTabProps {
  importFeedback: { isError: boolean; text: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileImportTab: React.FC<FileImportTabProps> = ({
  importFeedback,
  fileInputRef,
  onFileUpload,
}) => {
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <UploadCloud size={22} style={{ color: 'var(--accent-neon)' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Impor File Latihan (.fit / .gpx / .tcx / .json / .csv)
        </h3>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
        Ekspor file aktivitas dari aplikasi pendamping jam Anda lalu unggah di sini.
      </p>

      {importFeedback && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: importFeedback.isError ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            border: importFeedback.isError ? '1px solid var(--color-danger)' : '1px solid var(--color-success)',
            color: importFeedback.isError ? 'var(--color-danger)' : 'var(--color-success)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          {importFeedback.text}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          background: 'var(--bg-surface)',
        }}
      >
        <UploadCloud size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Unggah File GPX / TCX / JSON / CSV
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: '1rem' }}>
          Format ekspor teks/XML standar (file .fit biner perlu diekspor ke .tcx atau .gpx terlebih dahulu)
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-neon-subtle)',
            border: '1px solid rgba(204, 255, 0, 0.25)',
            color: 'var(--accent-neon)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Pilih file latihan
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.gpx,.tcx"
          onChange={onFileUpload}
          aria-label="Pilih file latihan smartwatch"
          style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}
        />
      </div>
    </div>
  );
};
