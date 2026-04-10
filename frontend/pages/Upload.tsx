import { useEffect, useState } from 'react';

import { UploadForm } from '../components/UploadForm';
import { PredictionResultView } from '../components/PredictionResultView';
import { predictMedia, PredictionResponse } from '../services/api';

export default function UploadPage() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  async function handleAnalyze(file: File) {
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
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', display: 'grid', gap: '1.5rem' }}>
      <section style={{ display: 'grid', gap: '0.5rem' }}>
        <h1 style={{ marginBottom: 0 }}>Upload Media</h1>
        <p style={{ marginTop: 0 }}>Upload an image or video to see the model output, confidence, and explanation overlays.</p>
      </section>

      <UploadForm onAnalyze={handleAnalyze} isLoading={isLoading} />

      {errorMessage ? <p style={{ color: '#b42318' }}>{errorMessage}</p> : null}

      {result && mediaUrl && mediaKind ? (
        <PredictionResultView mediaUrl={mediaUrl} mediaKind={mediaKind} result={result} />
      ) : null}
    </main>
  );
}
