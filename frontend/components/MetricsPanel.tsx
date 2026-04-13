type Props = {
  confidence: number;
  label: string;
};

export function MetricsPanel({ confidence, label }: Props) {
  return (
    <section className="surface-card result-panel">
      <div className="card-hud">
        <span className="card-status">LIVE</span>
        <span className="caption-chip signal">SIGNAL 98%</span>
      </div>
      <h2 className="card-title">Metrics</h2>
      <div className="caption-row">
        <span className="caption-chip live">PREDICTION {label}</span>
        <span className="caption-chip signal">CONF {(confidence * 100).toFixed(1)}%</span>
      </div>
      <p className="status-line">VERIFIED</p>
      <div className="metrics-grid">
        <span className="metrics-pill">Predicted: {label}</span>
        <span className="metrics-pill">Confidence: {(confidence * 100).toFixed(1)}%</span>
      </div>
      <div className="signal-wave" aria-hidden="true" />
    </section>
  );
}
