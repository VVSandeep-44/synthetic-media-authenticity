import Link from 'next/link';

export default function ResultPage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', display: 'grid', gap: '1rem' }}>
      <h1>Prediction Result</h1>
      <p>The live prediction and explanation overlays are shown from the upload page.</p>
      <Link href="/Upload">Open upload flow</Link>
    </main>
  );
}
