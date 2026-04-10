import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', lineHeight: 1.5 }}>
      <h1>Explainable Synthetic Media Analysis</h1>
      <p>Upload media, review the prediction, and inspect the explanation overlays.</p>
      <Link href="/Upload">Open upload flow</Link>
    </main>
  );
}
