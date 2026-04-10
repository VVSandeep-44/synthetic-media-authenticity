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
    <section style={{ border: '1px solid #d0d7de', borderRadius: 16, padding: '1rem', background: '#fff' }}>
      <h2>{result.label}</h2>
      <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
      <p>{result.explanationText}</p>
    </section>
  );
}
