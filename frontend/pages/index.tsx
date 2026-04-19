import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";

const Hero3DVisual = dynamic(() => import("../components/Hero3DVisual"), { ssr: false });

function IconDualXAI() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

function IconVideoAware() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 9.5l6-3.5v12l-6-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  );
}

function IconOperational() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.4"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".timeline-card"));
    if (!cards.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
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
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const rx = (event.clientX - rect.left) / rect.width;
    const ry = (event.clientY - rect.top) / rect.height;
    hero.style.setProperty("--hero-rotate-x", `${((0.5 - ry) * 8).toFixed(2)}deg`);
    hero.style.setProperty("--hero-rotate-y", `${((rx - 0.5) * 9).toFixed(2)}deg`);
    hero.style.setProperty("--hero-glow-x", `${(rx * 100).toFixed(1)}%`);
    hero.style.setProperty("--hero-glow-y", `${(ry * 100).toFixed(1)}%`);
  };

  const resetHeroTilt = () => {
    const hero = heroRef.current;
    if (!hero) return;
    hero.style.setProperty("--hero-rotate-x", "0deg");
    hero.style.setProperty("--hero-rotate-y", "0deg");
    hero.style.setProperty("--hero-glow-x", "50%");
    hero.style.setProperty("--hero-glow-y", "50%");
  };

  return (
    <main className="page-shell home-shell">
      {/* Hero */}
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
            Detect synthetic media with confidence. Understand <em>why</em> with dual
            explainability &mdash; Grad-CAM overlays and ViT attention rollouts for images
            and video frames.
          </p>

          <div className="hero-stat-chips">
            <span className="hero-stat-chip">
              <span className="hero-stat-value">99.2%</span>
              <span className="hero-stat-label">Accuracy</span>
            </span>
            <span className="hero-stat-chip">
              <span className="hero-stat-value">2&times;</span>
              <span className="hero-stat-label">XAI Methods</span>
            </span>
            <span className="hero-stat-chip">
              <span className="hero-stat-value">&lt;2s</span>
              <span className="hero-stat-label">Inference</span>
            </span>
          </div>

          <div className="hero-actions">
            <Link href="/Upload" className="primary-button hero-cta">
              Start Analysis
            </Link>
            <a href="#features" className="secondary-button">
              Explore Features
            </a>
          </div>
        </div>

        <aside className="hero-face" aria-hidden="true">
          <div className="face-panel" style={{ padding: 0 }}>
            <Hero3DVisual />
            <div className="face-readout" style={{ pointerEvents: "none", zIndex: 10 }}>
              <span className="caption-chip signal">IDENTITY</span>
              <span className="caption-chip live">LIVE</span>
            </div>
          </div>
        </aside>
      </section>

      {/* Features */}
      <section className="feature-grid reveal-timeline" id="features">
        <article className="surface-card feature-tilt timeline-card" style={{ "--reveal-delay": "60ms" } as CSSProperties}>
          <div className="card-glow" aria-hidden="true" />
          <div className="card-icon-svg" aria-hidden="true"><IconDualXAI /></div>
          <h2 className="card-title">Dual Explainability</h2>
          <p className="card-body">
            View Grad-CAM and ViT attention overlays side-by-side for transparent model
            behavior and evidence-backed outputs.
          </p>
          <p className="card-tag">Grad-CAM &middot; ViT Rollout</p>
        </article>

        <article className="surface-card feature-tilt timeline-card" style={{ "--reveal-delay": "180ms" } as CSSProperties}>
          <div className="card-glow" aria-hidden="true" />
          <div className="card-icon-svg" aria-hidden="true"><IconVideoAware /></div>
          <h2 className="card-title">Video-Aware Insights</h2>
          <p className="card-body">
            Upload videos and receive sampled frame explanations with aggregate confidence
            metrics and frame-level reasoning.
          </p>
          <p className="card-tag">Frame Sampling &middot; Temporal XAI</p>
        </article>

        <article className="surface-card feature-tilt timeline-card" style={{ "--reveal-delay": "300ms" } as CSSProperties}>
          <div className="card-glow" aria-hidden="true" />
          <div className="card-icon-svg" aria-hidden="true"><IconOperational /></div>
          <h2 className="card-title">Operational Readiness</h2>
          <p className="card-body">
            Real-time backend health monitoring, strict file validation, and drag-and-drop
            upload designed for reliable operations.
          </p>
          <p className="card-tag">Health Check &middot; Drag &amp; Drop</p>
        </article>
      </section>

      {/* How it works */}
      <section className="how-it-works surface-card" aria-labelledby="how-heading">
        <div className="how-header">
          <p className="hero-kicker">HOW IT WORKS</p>
          <h2 className="card-title" id="how-heading">Three Steps to Insight</h2>
        </div>
        <ol className="how-steps">
          <li className="how-step">
            <span className="how-step-num">01</span>
            <div>
              <strong className="how-step-title">Upload Media</strong>
              <p className="how-step-desc">Drag &amp; drop an image or video (up to 80&nbsp;MB) into the analysis terminal.</p>
            </div>
          </li>
          <li className="how-step">
            <span className="how-step-num">02</span>
            <div>
              <strong className="how-step-title">Neural Inference</strong>
              <p className="how-step-desc">Our model runs deepfake detection with dual XAI pipelines in under 2 seconds.</p>
            </div>
          </li>
          <li className="how-step">
            <span className="how-step-num">03</span>
            <div>
              <strong className="how-step-title">Interpret the Evidence</strong>
              <p className="how-step-desc">Review the confidence score, verdict ring, and heatmap overlays to understand every decision.</p>
            </div>
          </li>
        </ol>
      </section>
    </main>
  );
}
