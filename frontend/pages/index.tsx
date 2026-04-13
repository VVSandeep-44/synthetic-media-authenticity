import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';

const Hero3DVisual = dynamic(() => import('../components/Hero3DVisual'), { ssr: false });

export default function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.timeline-card'));
    if (!cards.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  const handleHeroMove = (event: MouseEvent<HTMLElement>) => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    const rotateY = (relativeX - 0.5) * 9;
    const rotateX = (0.5 - relativeY) * 8;

    hero.style.setProperty('--hero-rotate-x', `${rotateX.toFixed(2)}deg`);
    hero.style.setProperty('--hero-rotate-y', `${rotateY.toFixed(2)}deg`);
    hero.style.setProperty('--hero-glow-x', `${(relativeX * 100).toFixed(1)}%`);
    hero.style.setProperty('--hero-glow-y', `${(relativeY * 100).toFixed(1)}%`);
  };

  const resetHeroTilt = () => {
    const hero = heroRef.current;
    if (!hero) {
      return;
    }

    hero.style.setProperty('--hero-rotate-x', '0deg');
    hero.style.setProperty('--hero-rotate-y', '0deg');
    hero.style.setProperty('--hero-glow-x', '50%');
    hero.style.setProperty('--hero-glow-y', '50%');
  };

  return (
    <main className="page-shell home-shell">
      <section
        ref={heroRef}
        className="hero-card hero-cyber"
        onMouseMove={handleHeroMove}
        onMouseLeave={resetHeroTilt}
      >
        <div className="hero-grid-overlay" aria-hidden="true" />
        <div className="hero-orb hero-orb-left" aria-hidden="true" />
        <div className="hero-orb hero-orb-right" aria-hidden="true" />

        <div className="hero-content">
          <p className="hero-kicker">AI FORENSICS CONSOLE</p>
          <h1 className="hero-title hero-title-glitch" data-text="Explainable Synthetic Media Analysis">
            Explainable Synthetic Media Analysis
          </h1>
          <p className="hero-subtitle">
            Detect synthetic media with confidence. Understand why with dual explainability: Grad-CAM overlays and ViT attention rollouts for images and video frames.
          </p>
          <div className="hero-actions">
            <Link href="/Upload" className="primary-button">
              Start Analysis
            </Link>
            <a href="#features" className="secondary-button">
              Learn More
            </a>
          </div>
        </div>

        <aside className="hero-face" aria-hidden="true">
          <div className="face-panel" style={{ padding: 0 }}>
            <Hero3DVisual />
            <div className="face-readout" style={{ pointerEvents: 'none', zIndex: 10 }}>
              <span className="caption-chip signal">IDENTITY</span>
              <span className="caption-chip live">LIVE</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="feature-grid reveal-timeline" id="features">
        <article className="surface-card feature-tilt timeline-card" style={{ '--reveal-delay': '60ms' } as CSSProperties}>
          <div className="card-glow" aria-hidden="true" />
          <div className="card-icon">01</div>
          <h2 className="card-title">Dual Explainability</h2>
          <p className="card-body">View Grad-CAM and ViT attention overlays side-by-side for transparent model behavior and evidence-backed outputs.</p>
        </article>
        <article className="surface-card feature-tilt timeline-card" style={{ '--reveal-delay': '180ms' } as CSSProperties}>
          <div className="card-glow" aria-hidden="true" />
          <div className="card-icon">02</div>
          <h2 className="card-title">Video-Aware Insights</h2>
          <p className="card-body">Upload videos and receive sampled frame explanations with aggregate confidence metrics and frame-level reasoning.</p>
        </article>
        <article className="surface-card feature-tilt timeline-card" style={{ '--reveal-delay': '300ms' } as CSSProperties}>
          <div className="card-glow" aria-hidden="true" />
          <div className="card-icon">03</div>
          <h2 className="card-title">Operational Readiness</h2>
          <p className="card-body">Real-time backend health monitoring, file validation, and drag-and-drop upload designed for reliable operations.</p>
        </article>
      </section>
    </main>
  );
}
