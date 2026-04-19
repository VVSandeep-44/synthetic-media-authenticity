import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";

type Props = { children: ReactNode };

function navClass(isActive: boolean) {
  return `site-nav-link${isActive ? " active" : ""}`;
}

function IconHome() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 12v9h18V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconResult() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconLogin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SiteLayout({ children }: Props) {
  const router = useRouter();
  const [isBootVisible, setIsBootVisible] = useState(false);
  const [year] = useState(() => new Date().getFullYear());

  useEffect(() => {
    const bootKey = "cyber-boot-seen";
    const hasSeenBoot =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(bootKey) === "1";
    if (hasSeenBoot) return undefined;
    setIsBootVisible(true);
    window.sessionStorage.setItem(bootKey, "1");
    const timer = window.setTimeout(() => setIsBootVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="site-shell">
      {isBootVisible && (
        <div className="boot-overlay" aria-hidden="true">
          <div className="boot-panel">
            <p className="boot-label">SYSTEM BOOT</p>
            <p className="boot-line">INITIALIZING VISUAL CONSOLE</p>
            <p className="boot-line">LOADING AUTHENTICITY MODULES</p>
            <p className="boot-line">SYNCING NEURAL OVERLAYS</p>
            <div className="boot-progress"><span /></div>
          </div>
        </div>
      )}

      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand">
            <span className="site-brand-icon"><IconShield /></span>
            <span className="site-brand-text">
              <span className="site-brand-primary">SynthGuard</span>
              <span className="site-brand-sub">AI Forensics</span>
            </span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/" className={navClass(router.pathname === "/")}>
              <span className="site-nav-icon"><IconHome /></span>Home
            </Link>
            <Link href="/Upload" className={navClass(router.pathname === "/Upload")}>
              <span className="site-nav-icon"><IconUpload /></span>Analyze
            </Link>
            <Link href="/Result" className={navClass(router.pathname === "/Result")}>
              <span className="site-nav-icon"><IconResult /></span>Results
            </Link>
            <span className="nav-separator" aria-hidden="true" />
            <Link href="/Login" className={navClass(router.pathname === "/Login")}>
              <span className="site-nav-icon"><IconLogin /></span>Login
            </Link>
            <Link
              href="/Signup"
              className={`site-nav-link nav-signup${router.pathname === "/Signup" ? " active" : ""}`}
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <div className="site-main">{children}</div>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand-col">
            <div className="footer-brand-logo">
              <IconShield />
              <span className="footer-brand-name">SynthGuard</span>
            </div>
            <p className="footer-tagline">
              Explainable deepfake detection powered by Grad-CAM &amp; ViT attention rollouts.
            </p>
          </div>
          <nav className="footer-nav-col" aria-label="Footer navigation">
            <p className="footer-col-heading">Navigation</p>
            <Link href="/" className="footer-nav-link">Home</Link>
            <Link href="/Upload" className="footer-nav-link">Analyze Media</Link>
            <Link href="/Result" className="footer-nav-link">Results</Link>
            <Link href="/Login" className="footer-nav-link">Login</Link>
            <Link href="/Signup" className="footer-nav-link">Sign Up</Link>
          </nav>
          <div className="footer-status-col">
            <p className="footer-col-heading">System</p>
            <div className="footer-status-list">
              <div className="footer-status-row">
                <span className="footer-status-dot active" />
                <span className="footer-status-label">XAI Engine</span>
              </div>
              <div className="footer-status-row">
                <span className="footer-status-dot active" />
                <span className="footer-status-label">Grad-CAM Module</span>
              </div>
              <div className="footer-status-row">
                <span className="footer-status-dot active" />
                <span className="footer-status-label">ViT Attention</span>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copyright">
            &copy; {year} SynthGuard &mdash; Explainable Synthetic Media Analysis
          </span>
          <span className="footer-version">v1.0.0 &middot; Research Build</span>
        </div>
      </footer>
    </div>
  );
}
