import { useState, useRef, type FormEvent } from 'react';

type Props = {
  onAnalyze: (file: File) => void | Promise<void>;
  isLoading?: boolean;
  isBackendReady?: boolean;
  helperMessage?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadForm({ onAnalyze, isLoading = false, isBackendReady = true, helperMessage }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearFile() {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function pickFile(file: File | null) {
    setSelectedFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    pickFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;
    await onAnalyze(selectedFile);
  }

  const fileKind = selectedFile
    ? selectedFile.type.startsWith('video/')
      ? 'video'
      : 'image'
    : null;

  return (
    <form onSubmit={handleSubmit} className="upload-form surface-card" id="upload-form">
      {/* ── header bar ── */}
      <div className="card-hud">
        <span className="card-status">SIGNAL</span>
        <span className={`caption-chip ${isBackendReady ? 'live' : 'signal'}`}>
          {isBackendReady ? 'LIVE LINK' : 'WAITING'}
        </span>
      </div>

      {/* ── dropzone ── */}
      <div
        className={`dropzone${isDragActive ? ' active' : ''}${selectedFile ? ' has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        id="upload-dropzone"
      >
        {/* hidden native input */}
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          tabIndex={-1}
        />

        {/* upload icon */}
        <div className="dropzone-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35" />
            <path d="M24 32V18M24 18l-6 6M24 18l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="34" width="20" height="2" rx="1" fill="currentColor" opacity="0.25" />
          </svg>
        </div>

        <span className="dropzone-title">
          {isDragActive ? 'Release to upload' : 'Drop media here or click to browse'}
        </span>

        <span className="dropzone-caption">
          Supports images &amp; videos up to 80 MB
        </span>
      </div>

      {/* ── file preview ── */}
      {selectedFile && (
        <div className="file-preview" id="file-preview">
          <div className="file-preview-icon" aria-hidden="true">
            {fileKind === 'video' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="15" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M17 9l5-3v12l-5-3V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="file-preview-details">
            <span className="file-preview-name">{selectedFile.name}</span>
            <span className="file-preview-meta">
              {formatFileSize(selectedFile.size)} · {fileKind}
            </span>
          </div>
          <button
            type="button"
            className="file-preview-remove"
            onClick={(e) => { e.stopPropagation(); clearFile(); }}
            aria-label="Remove selected file"
            id="remove-file-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── helper text ── */}
      {helperMessage && <p className="helper-text">{helperMessage}</p>}

      {/* ── submit ── */}
      <button
        className="primary-button upload-cta"
        type="submit"
        disabled={!selectedFile || isLoading || !isBackendReady}
        id="analyze-btn"
      >
        {isLoading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Analyzing…
          </>
        ) : (
          <>
            <svg className="cta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Analyze media
          </>
        )}
      </button>
    </form>
  );
}
