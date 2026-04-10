type Props = {
  confidence: number;
  label: string;
};

export function MetricsPanel({ confidence, label }: Props) {
  return (
    <section style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: '1rem' }}>
      <h2>Metrics</h2>
      <p>Predicted label: {label}</p>
      <p>Confidence score: {(confidence * 100).toFixed(1)}%</p>
    </section>
  );
}
