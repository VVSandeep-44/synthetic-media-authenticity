import { HeatmapViewer } from "./HeatmapViewer";
import { MediaPreview } from "./MediaPreview";
import { MetricsPanel } from "./MetricsPanel";
import { ResultCard } from "./ResultCard";
import {
  ImagePredictionResponse,
  VideoPredictionResponse,
  isImagePredictionResponse,
  isVideoPredictionResponse,
} from "../services/api";

const BASE64_PREFIX = "data:image/png;base64,";

type Props = {
  mediaUrl: string;
  mediaKind: "image" | "video";
  result: ImagePredictionResponse | VideoPredictionResponse;
};

function toImageSrc(base64: string) {
  return base64.startsWith("data:") ? base64 : `${BASE64_PREFIX}${base64}`;
}

function VerdictBanner({
  label,
  confidence,
}: {
  label: string;
  confidence: number;
}) {
  const isFake =
    label.toLowerCase().includes("fake") ||
    label.toLowerCase().includes("synthetic");
  const percent = Math.round(confidence * 100);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - confidence * circumference;
  const verdictClass = isFake ? "verdict-fake" : "verdict-real";
  const verdictLabel = isFake ? "SYNTHETIC" : "AUTHENTIC";

  return (
    <div
      className={`verdict-banner ${verdictClass}`}
      aria-label={`Verdict: ${verdictLabel}, confidence ${percent}%`}
    >
      <div className="verdict-ring-wrap" aria-hidden="true">
        <svg className="verdict-ring-svg" viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            className="verdict-ring-progress"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="56" textAnchor="middle" className="verdict-ring-pct">
            {percent}%
          </text>
          <text x="60" y="72" textAnchor="middle" className="verdict-ring-sub">
            confidence
          </text>
        </svg>
      </div>
      <div className="verdict-text-col">
        <p className="verdict-kicker">ANALYSIS COMPLETE</p>
        <p className={`verdict-label ${verdictClass}`}>{verdictLabel}</p>
        <p className="verdict-desc">
          The model classified this media as <strong>{label}</strong> with{" "}
          <strong>{percent}%</strong> confidence. Review the explainability
          overlays below for detailed evidence.
        </p>
        <div className="verdict-chips">
          <span className={`caption-chip ${isFake ? "signal" : "live"}`}>
            {isFake ? "DEEPFAKE DETECTED" : "MEDIA VERIFIED"}
          </span>
          <span className="caption-chip">{percent}% CONFIDENCE</span>
        </div>
      </div>
    </div>
  );
}

export function PredictionResultView({ mediaUrl, mediaKind, result }: Props) {
  return (
    <section className="results-grid">
      <VerdictBanner label={result.label} confidence={result.confidence} />

      <div className="results-side-grid">
        <MediaPreview mediaUrl={mediaUrl} mediaKind={mediaKind} />
        <div className="results-meta-stack">
          <ResultCard
            result={{
              label: result.label,
              confidence: result.confidence,
              explanationText: isImagePredictionResponse(result)
                ? result.explanation_text
                : `${result.sampled_frames_explanations.length} frame explanations were sampled.`,
            }}
          />
          <MetricsPanel confidence={result.confidence} label={result.label} />
        </div>
      </div>

      {isImagePredictionResponse(result) && (
        <section className="heatmap-grid">
          <HeatmapViewer
            title="Grad-CAM Overlay"
            imageSrc={toImageSrc(result.gradcam_overlay_base64)}
            description={result.explanation_text}
          />
          <HeatmapViewer
            title="ViT Attention Rollout"
            imageSrc={toImageSrc(result.vit_overlay_base64)}
            description={result.explanation_text}
          />
        </section>
      )}

      {isVideoPredictionResponse(result) && (
        <section className="results-grid">
          <h2 className="card-title">Sampled Frame Explanations</h2>
          <div className="frame-grid">
            {result.sampled_frames_explanations.map((frame) => (
              <article key={frame.frame_index} className="results-grid">
                <ResultCard
                  result={{
                    label: `${frame.label} - Frame ${frame.frame_index}`,
                    confidence: frame.confidence,
                    explanationText: frame.explanation_text,
                  }}
                />
                <HeatmapViewer
                  title={`Frame ${frame.frame_index} Grad-CAM`}
                  imageSrc={toImageSrc(frame.gradcam_overlay_base64)}
                  description={frame.explanation_text}
                />
                <HeatmapViewer
                  title={`Frame ${frame.frame_index} ViT Attention Rollout`}
                  imageSrc={toImageSrc(frame.vit_overlay_base64)}
                  description={frame.explanation_text}
                />
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
