export function PageSkeleton() {
  return (
    <div className="page-skeleton">
      <div className="page-skeleton-hero">
        <div className="page-skeleton-grid-overlay" />
        <div className="page-skeleton-content">
          <div className="skeleton skeleton-text short" style={{ width: '30%', marginBottom: '1rem' }} />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text short" />
        </div>
        <div className="page-skeleton-visual">
          <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
        </div>
      </div>
      <div className="page-skeleton-cards">
        <div className="page-skeleton-card">
          <div className="skeleton skeleton-text short" style={{ width: '2.6rem', height: '2.6rem', borderRadius: '8px', marginBottom: '0.8rem' }} />
          <div className="skeleton skeleton-text short" style={{ width: '60%' }} />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
        <div className="page-skeleton-card">
          <div className="skeleton skeleton-text short" style={{ width: '2.6rem', height: '2.6rem', borderRadius: '8px', marginBottom: '0.8rem' }} />
          <div className="skeleton skeleton-text short" style={{ width: '65%' }} />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
        <div className="page-skeleton-card">
          <div className="skeleton skeleton-text short" style={{ width: '2.6rem', height: '2.6rem', borderRadius: '8px', marginBottom: '0.8rem' }} />
          <div className="skeleton skeleton-text short" style={{ width: '55%' }} />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
      </div>
    </div>
  );
}
