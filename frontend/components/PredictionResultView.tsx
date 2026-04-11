import { HeatmapViewer } from './HeatmapViewer';
import { MediaPreview } from './MediaPreview';
import { MetricsPanel } from './MetricsPanel';
import { ResultCard } from './ResultCard';
import {
  ImagePredictionResponse,
  VideoPredictionResponse,
  isImagePredictionResponse,
  isVideoPredictionResponse
} from '../services/api';

const BASE64_PREFIX = 'data:image/png;base64,';

type Props = {
  mediaUrl: string;
  mediaKind: 'image' | 'video';
  result: ImagePredictionResponse | VideoPredictionResponse;
};

function toImageSrc(base64: string) {
  return base64.startsWith('data:') ? base64 : `${BASE64_PREFIX}${base64}`;
}

export function PredictionResultView({ mediaUrl, mediaKind, result }: Props) {
  return (
    <section className="results-grid">
      <MediaPreview mediaUrl={mediaUrl} mediaKind={mediaKind} />
      <ResultCard
        result={{
          label: result.label,
          confidence: result.confidence,
          explanationText: isImagePredictionResponse(result)
            ? result.explanation_text
            : `${result.sampled_frames_explanations.length} frame explanations were sampled.`
        }}
      />
      <MetricsPanel confidence={result.confidence} label={result.label} />

      {isImagePredictionResponse(result) ? (
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
      ) : null}

      {isVideoPredictionResponse(result) ? (
        <section className="results-grid">
          <h2 className="card-title">Sampled Frame Explanations</h2>
          <div className="frame-grid">
            {result.sampled_frames_explanations.map((frame) => (
              <article key={frame.frame_index} className="results-grid">
                <ResultCard
                  result={{
                    label: `${frame.label} - Frame ${frame.frame_index}`,
                    confidence: frame.confidence,
                    explanationText: frame.explanation_text
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
      ) : null}
    </section>
  );
}