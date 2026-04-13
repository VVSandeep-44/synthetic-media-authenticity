type Result = {
  label: string;
  confidence: number;
  explanationText: string;
};

type Props = {
  result: Result;
};

export function ResultCard({ result }: Props) {
  const confidenceText = `${(result.confidence * 100).toFixed(1)}%`;

  return (
    <section className="surface-card result-panel">
      <div className="card-hud">
        <span className="card-status">SIGNAL</span>
        <span className="caption-chip signal">LIVE</span>
      </div>
      <h2 className="card-title">{result.label}</h2>
      <div className="caption-row">
        <span className="caption-chip live">CONF {confidenceText}</span>
        <span className="caption-chip signal">ANALYSIS ACTIVE</span>
      </div>
      <p className="status-line">SCANNING</p>
      <p className="card-body">Confidence: {confidenceText}</p>
      <p className="card-body">{result.explanationText}</p>
      <div className="signal-wave" aria-hidden="true" />
    </section>
  );
}
