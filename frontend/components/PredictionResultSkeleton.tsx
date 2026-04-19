export function PredictionResultSkeleton() {
  return (
    <div className="results-grid" style={{ marginTop: '0.5rem' }}>
      {/* Verdict banner skeleton */}
      <div className="skeleton" style={{ height: '140px', borderRadius: '20px' }} />
      {/* Side grid skeleton */}
      <div className="results-side-grid">
        <div className="skeleton skeleton-heatmap" />
        <div className="results-meta-stack">
          <div className="skeleton skeleton-card" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
      {/* Heatmap grid skeleton */}
      <div className="heatmap-grid">
        <div className="skeleton skeleton-heatmap" />
        <div className="skeleton skeleton-heatmap" />
      </div>
    </div>
  );
}
