import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

function navClass(isActive: boolean) {
  return `site-nav-link${isActive ? ' active' : ''}`;
}

export function SiteLayout({ children }: Props) {
  const router = useRouter();

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="site-brand">
            Synthetic Media Authenticity
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/" className={navClass(router.pathname === '/')}>
              Home
            </Link>
            <Link href="/Upload" className={navClass(router.pathname === '/Upload')}>
              Upload
            </Link>
            <Link href="/Result" className={navClass(router.pathname === '/Result')}>
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
