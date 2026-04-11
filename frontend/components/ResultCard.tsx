type Result = {
  label: string;
  confidence: number;
  explanationText: string;
};

type Props = {
  result: Result;
};

export function ResultCard({ result }: Props) {
  return (
    <section className="surface-card">
      <h2 className="card-title">{result.label}</h2>
      <p className="card-body">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
      <p className="card-body">{result.explanationText}</p>
    </section>
  );
}
