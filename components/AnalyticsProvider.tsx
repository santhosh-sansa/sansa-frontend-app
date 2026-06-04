'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, initPostHog, analytics } from '@/lib/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Initialize on mount
  useEffect(() => {
    initGA();
    initPostHog();
  }, []);

  // Track page views on route change
  useEffect(() => {
    analytics.pageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
