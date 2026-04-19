export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-hidden="true">
      {/* Hero section skeleton */}
      <div className="page-skeleton-hero">
        <div className="page-skeleton-grid-overlay" />
        <div className="page-skeleton-content">
          <div className="skeleton skeleton-text" style={{ width: '160px', height: '0.8rem' }} />
          <div className="skeleton skeleton-title" style={{ width: '75%' }} />
          <div className="skeleton skeleton-title" style={{ width: '50%' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%', marginTop: '1rem' }} />
          <div className="skeleton skeleton-text short" style={{ width: '70%' }} />
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.4rem' }}>
            <div className="skeleton" style={{ width: '140px', height: '48px', borderRadius: '999px' }} />
            <div className="skeleton" style={{ width: '130px', height: '48px', borderRadius: '999px' }} />
          </div>
        </div>
        <div className="page-skeleton-visual">
          <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '28px' }} />
        </div>
      </div>

      {/* Feature cards skeleton */}
      <div className="page-skeleton-cards">
        {[1, 2, 3].map((i) => (
          <div key={i} className="page-skeleton-card">
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', marginBottom: '0.8rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ width: '100%' }} />
            <div className="skeleton skeleton-text" style={{ width: '85%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
