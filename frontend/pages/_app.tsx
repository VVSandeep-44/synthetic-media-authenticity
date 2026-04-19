import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '../styles/globals.css';
import { SiteLayout } from '../components/SiteLayout';
import { PageSkeleton } from '../components/PageSkeleton';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  useEffect(() => {
    // Page-ready reveal animation on first mount
    const timer = setTimeout(() => setIsPageReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        setIsRouteLoading(true);
      }
    };

    const handleComplete = () => {
      setIsRouteLoading(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <SiteLayout>
      {isRouteLoading && <div className="route-progress" />}
      {isRouteLoading ? (
        <PageSkeleton />
      ) : (
        <div className={isPageReady ? 'page-ready' : ''} key={router.asPath}>
          <Component {...pageProps} />
        </div>
      )}
    </SiteLayout>
  );
}
