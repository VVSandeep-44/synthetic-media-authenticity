import { useState, type FormEvent } from 'react';

type Props = {
  onAnalyze: (file: File) => void | Promise<void>;
  isLoading?: boolean;
  isBackendReady?: boolean;
  helperMessage?: string;
};

export function UploadForm({ onAnalyze, isLoading = false, isBackendReady = true, helperMessage }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  function setFile(file: File | null) {
    setSelectedFile(file);
    setFileName(file?.name ?? null);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    setFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }

    await onAnalyze(selectedFile);
  }

  return (
    <form onSubmit={handleSubmit} className="upload-form surface-card">
      <label
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
      >
        <span className="form-label">Choose an image or video</span>
        <span className="dropzone-caption">Drag and drop media here, or click to browse.</span>
        <input
          className="file-input"
          type="file"
          accept="image/*,video/*"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
          }}
        />
      </label>
      <p className="file-meta">{fileName ? `Selected: ${fileName}` : 'No file selected yet.'}</p>
      {helperMessage ? <p className="helper-text">{helperMessage}</p> : null}
      <button className="primary-button" type="submit" disabled={!selectedFile || isLoading || !isBackendReady}>
        {isLoading ? 'Analyzing...' : 'Analyze media'}
      </button>
    </form>
  );
}
