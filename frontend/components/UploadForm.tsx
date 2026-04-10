import { useState, type FormEvent } from 'react';

type Props = {
  onAnalyze: (file: File) => void | Promise<void>;
  isLoading?: boolean;
};

export function UploadForm({ onAnalyze, isLoading = false }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      return;
    }

    await onAnalyze(selectedFile);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 640 }}>
      <label style={{ display: 'grid', gap: '0.5rem' }}>
        <span>Choose an image or video</span>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            setFileName(file?.name ?? null);
          }}
        />
      </label>
      <p>{fileName ? `Selected: ${fileName}` : 'No file selected yet.'}</p>
      <button type="submit" disabled={!selectedFile || isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze media'}
      </button>
    </form>
  );
}
