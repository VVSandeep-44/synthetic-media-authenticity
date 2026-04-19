export function PredictionResultSkeleton() {
  return (
    <section className="results-grid" aria-hidden="true">
      <div className="skeleton skeleton-heatmap" style={{ height: '400px' }} />
      <div className="skeleton skeleton-card" />
      
      <section className="heatmap-grid" style={{ marginTop: '2rem' }}>
        <div className="skeleton skeleton-heatmap" />
        <div className="skeleton skeleton-heatmap" />
      </section>
    </section>
  );
}
