import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';

type Props = {
  children: ReactNode;
};

function navClass(isActive: boolean) {
  return `site-nav-link${isActive ? ' active' : ''}`;
}

export function SiteLayout({ children }: Props) {
  const router = useRouter();
  const [isBootVisible, setIsBootVisible] = useState(false);

  useEffect(() => {
    const bootKey = 'cyber-boot-seen';
    const hasSeenBoot = typeof window !== 'undefined' && window.sessionStorage.getItem(bootKey) === '1';

    if (hasSeenBoot) {
      return undefined;
    }

    setIsBootVisible(true);
    window.sessionStorage.setItem(bootKey, '1');

    const timer = window.setTimeout(() => {
      setIsBootVisible(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="site-shell">
      {isBootVisible ? (
        <div className="boot-overlay" aria-hidden="true">
          <div className="boot-panel">
            <p className="boot-label">SYSTEM BOOT</p>
            <p className="boot-line">INITIALIZING VISUAL CONSOLE</p>
            <p className="boot-line">LOADING AUTHENTICITY MODULES</p>
            <p className="boot-line">SYNCING NEURAL OVERLAYS</p>
            <div className="boot-progress">
              <span />
            </div>
          </div>
        </div>
      ) : null}

      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand">
            Synthetic Media Authenticity
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/" className={navClass(router.pathname === '/')}>
              <span className="site-nav-icon" aria-hidden="true">⌂</span>
              Home
            </Link>
            <Link href="/Upload" className={navClass(router.pathname === '/Upload')}>
              <span className="site-nav-icon" aria-hidden="true">⇪</span>
              Upload
            </Link>
            <Link href="/Result" className={navClass(router.pathname === '/Result')}>
              <span className="site-nav-icon" aria-hidden="true">◎</span>
              Result
            </Link>
          </nav>
        </div>
      </header>

      <div className="site-main">{children}</div>

      <footer className="site-footer">
        <p className="site-footer-text">Explainable Synthetic Media Analysis</p>
      </footer>
    </div>
  );
}
