type Props = {
  confidence: number;
  label: string;
};

export function MetricsPanel({ confidence, label }: Props) {
  return (
    <section className="surface-card">
      <h2 className="card-title">Metrics</h2>
      <div className="metrics-grid">
        <span className="metrics-pill">Predicted: {label}</span>
        <span className="metrics-pill">Confidence: {(confidence * 100).toFixed(1)}%</span>
      </div>
    </section>
  );
}
