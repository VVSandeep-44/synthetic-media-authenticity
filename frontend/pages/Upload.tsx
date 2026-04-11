import { useEffect, useState } from 'react';

import { UploadForm } from '../components/UploadForm';
import { PredictionResultView } from '../components/PredictionResultView';
import { checkApiHealth, predictMedia, PredictionResponse } from '../services/api';

const MAX_UPLOAD_SIZE_BYTES = 80 * 1024 * 1024;

export default function UploadPage() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function refreshHealth() {
      const healthy = await checkApiHealth();
      if (mounted) {
        setIsBackendReady(healthy);
      }
    }

    refreshHealth();
    const interval = setInterval(refreshHealth, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  async function handleAnalyze(file: File) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setErrorMessage('File is too large. Please upload a file under 80MB.');
      setResult(null);
      return;
    }

    if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setErrorMessage('Unsupported file type. Please upload an image or video file.');
      setResult(null);
      return;
    }

    if (!isBackendReady) {
      setErrorMessage('Backend is offline. Start the API server and retry.');
      setResult(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMediaUrl(previewUrl);
    setMediaKind(file.type.startsWith('video/') ? 'video' : 'image');
    setResult(null);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const prediction = await predictMedia({ file });
      setResult(prediction);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Prediction failed.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <h1 className="hero-title">Upload Media</h1>
        <p className="hero-subtitle">
          Upload an image or video to reveal authenticity signals, confidence, and explainability overlays.
        </p>
        <p className={`status-badge ${isBackendReady ? 'ok' : 'offline'}`}>
          Backend status: {isBackendReady ? 'Connected' : 'Offline'}
        </p>
      </section>

      <UploadForm
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        isBackendReady={isBackendReady}
        helperMessage="Supported types: image/* and video/*"
      />

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {result && mediaUrl && mediaKind ? (
        <PredictionResultView mediaUrl={mediaUrl} mediaKind={mediaKind} result={result} />
      ) : null}
    </main>
  );
}
