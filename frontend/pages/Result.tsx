import Link from 'next/link';

export default function ResultPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <h1 className="hero-title">Prediction Result</h1>
        <p className="hero-subtitle">Run an upload to generate live confidence and explainability overlays.</p>
        <p>
          <Link className="inline-link" href="/Upload">
            Open upload workflow
          </Link>
        </p>
      </section>
    </main>
  );
}
