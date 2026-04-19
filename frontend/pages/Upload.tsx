import { useEffect, useState } from "react";
import { UploadForm } from "../components/UploadForm";
import { PredictionResultView } from "../components/PredictionResultView";
import { PredictionResultSkeleton } from "../components/PredictionResultSkeleton";
import { useToast } from "../components/ToastStack";
import { checkApiHealth, predictMedia, PredictionResponse } from "../services/api";

const MAX_UPLOAD_SIZE_BYTES = 80 * 1024 * 1024;

export default function UploadPage() {
  const { addToast } = useToast();
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<"image" | "video" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function refreshHealth() {
      const healthy = await checkApiHealth();
      if (mounted) setIsBackendReady(healthy);
    }
    refreshHealth();
    const interval = setInterval(refreshHealth, 8000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    return () => { if (mediaUrl) URL.revokeObjectURL(mediaUrl); };
  }, [mediaUrl]);

  async function handleAnalyze(file: File) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      addToast("File is too large. Please upload a file under 80 MB.", "error");
      return;
    }
    if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      addToast("Unsupported file type. Please upload an image or video file.", "error");
      return;
    }
    if (!isBackendReady) {
      addToast("Backend is offline. Start the API server and retry.", "error");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMediaUrl(previewUrl);
    setMediaKind(file.type.startsWith("video/") ? "video" : "image");
    setResult(null);
    setIsLoading(true);

    try {
      const prediction = await predictMedia({ file });
      setResult(prediction);
      addToast("Analysis complete - results ready below.", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Prediction failed.", "error");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card hero-cyber upload-hero">
        <div className="hero-grid-overlay" aria-hidden="true" />
        <div className="upload-hero-content hero-content">
          <p className="hero-kicker">ANALYSIS TERMINAL</p>
          <h1 className="hero-title">Upload Media</h1>
          <p className="hero-subtitle">
            Upload an image or video to reveal authenticity signals, confidence score,
            and explainability overlays.
          </p>
          <p className={`status-badge ${isBackendReady ? "ok" : "offline"}`}>
            <span aria-hidden="true">{isBackendReady ? "◉" : "○"}</span>&nbsp;
            {isBackendReady ? "Engine Connected" : "Engine Offline"}
          </p>
        </div>
        <div className="upload-hero-corner-scanner" aria-hidden="true">
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <circle cx="45" cy="45" r="38" stroke="rgba(94,240,255,0.1)" strokeWidth="1.5"/>
            <circle cx="45" cy="45" r="28" stroke="rgba(94,240,255,0.12)" strokeWidth="1.5"/>
            <circle cx="45" cy="45" r="16" stroke="rgba(94,240,255,0.18)" strokeWidth="1.5"/>
            <circle cx="45" cy="45" r="5" fill="rgba(94,240,255,0.4)"/>
            <line x1="45" y1="7" x2="45" y2="83" stroke="rgba(94,240,255,0.08)" strokeWidth="1"/>
            <line x1="7" y1="45" x2="83" y2="45" stroke="rgba(94,240,255,0.08)" strokeWidth="1"/>
          </svg>
        </div>
      </section>

      <UploadForm
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        isBackendReady={isBackendReady}
        helperMessage="Supported: image/* and video/* - Max 80 MB"
      />

      {isLoading ? (
        <PredictionResultSkeleton />
      ) : result && mediaUrl && mediaKind ? (
        <PredictionResultView mediaUrl={mediaUrl} mediaKind={mediaKind} result={result} />
      ) : null}
    </main>
  );
}
