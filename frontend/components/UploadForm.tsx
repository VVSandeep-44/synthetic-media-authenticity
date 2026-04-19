import { useState, useRef, type FormEvent } from "react";

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

function IconServer({ ready }: { ready: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" opacity={ready ? 0.9 : 0.4}/>
      <rect x="2" y="14" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" opacity={ready ? 0.9 : 0.4}/>
      <circle cx="6" cy="6.5" r="1.3" fill={ready ? "#74fdff" : "#ff9999"}/>
      <circle cx="6" cy="17.5" r="1.3" fill={ready ? "#74fdff" : "#ff9999"}/>
    </svg>
  );
}

function IconScan() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M7 12h10M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

export function UploadForm({
  onAnalyze,
  isLoading = false,
  isBackendReady = true,
  helperMessage,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function clearFile() {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickFile(file: File | null) {
    setSelectedFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    pickFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) return;
    await onAnalyze(selectedFile);
  }

  const fileKind = selectedFile
    ? selectedFile.type.startsWith("video/") ? "video" : "image"
    : null;

  return (
    <form onSubmit={handleSubmit} className="upload-form surface-card" id="upload-form">
      {/* HUD header */}
      <div className="card-hud upload-hud">
        <div className="upload-hud-left">
          <IconScan />
          <span className="card-status">MEDIA INTAKE</span>
        </div>
        <div className="upload-hud-right">
          <span className={`caption-chip ${isBackendReady ? "live" : "signal"}`}>
            <IconServer ready={isBackendReady} />
            {isBackendReady ? "ENGINE READY" : "CONNECTING..."}
          </span>
        </div>
      </div>

      {/* Dropzone */}
      <div
        className={`dropzone${isDragActive ? " active" : ""}${selectedFile ? " has-file" : ""}${isLoading ? " is-scanning" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isLoading) inputRef.current?.click(); }}
        id="upload-dropzone"
        aria-label={isLoading ? "Scanning media..." : "Upload area — click or drag file here"}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          tabIndex={-1}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="scan-state">
            <div className="scan-beam-icon" aria-hidden="true">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" stroke="rgba(94,240,255,0.18)" strokeWidth="2"/>
                <circle cx="26" cy="26" r="18" stroke="rgba(94,240,255,0.25)" strokeWidth="1.5"/>
                <circle cx="26" cy="26" r="10" stroke="rgba(94,240,255,0.35)" strokeWidth="1.5"/>
                <line x1="26" y1="2" x2="26" y2="50" stroke="rgba(94,240,255,0.15)" strokeWidth="1"/>
                <line x1="2" y1="26" x2="50" y2="26" stroke="rgba(94,240,255,0.15)" strokeWidth="1"/>
                <circle cx="26" cy="26" r="3" fill="#74fdff" className="scan-center-dot"/>
              </svg>
            </div>
            <span className="scan-state-title">Scanning media...</span>
            <span className="scan-state-sub">Neural inference in progress</span>
            <div className="scan-bar-track"><div className="scan-bar-fill" /></div>
          </div>
        ) : (
          <>
            <div className="dropzone-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="4" width="40" height="40" rx="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35"/>
                <path d="M24 32V18M24 18l-6 6M24 18l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="14" y="34" width="20" height="2" rx="1" fill="currentColor" opacity="0.25"/>
              </svg>
            </div>
            <span className="dropzone-title">
              {isDragActive ? "Release to upload" : "Drop media here or click to browse"}
            </span>
            <span className="dropzone-caption">Supports images &amp; videos up to 80 MB</span>
          </>
        )}
      </div>

      {/* File preview */}
      {selectedFile && !isLoading && (
        <div className="file-preview" id="file-preview">
          <div className="file-preview-icon" aria-hidden="true">
            {fileKind === "video" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="15" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M17 9l5-3v12l-5-3V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <div className="file-preview-details">
            <span className="file-preview-name">{selectedFile.name}</span>
            <span className="file-preview-meta">{formatFileSize(selectedFile.size)} &middot; {fileKind}</span>
          </div>
          <button
            type="button"
            className="file-preview-remove"
            onClick={(e) => { e.stopPropagation(); clearFile(); }}
            aria-label="Remove selected file"
            id="remove-file-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {helperMessage && !isLoading && <p className="helper-text">{helperMessage}</p>}

      <button
        className="primary-button upload-cta"
        type="submit"
        disabled={!selectedFile || isLoading || !isBackendReady}
        id="analyze-btn"
      >
        {isLoading ? (
          <><span className="spinner" aria-hidden="true" />Analyzing...</>
        ) : (
          <>
            <svg className="cta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Analyze Media
          </>
        )}
      </button>
    </form>
  );
}
