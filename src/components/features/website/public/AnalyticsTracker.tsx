'use client';

import { useEffect, useRef } from 'react';

// Props kept for compatibility. Counting happens server-side via /api/website/view.
export function AnalyticsTracker({ weddingId, slug }: { weddingId: string, configId?: string, currentViewCount?: number, slug?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    const siteSlug = slug || window.location.pathname.match(/^\/w\/([^/]+)/)?.[1] || window.location.hostname.split('.')[0];
    const timer = setTimeout(() => {
      fetch('/api/website/view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: decodeURIComponent(siteSlug), weddingId }),
        keepalive: true,
      }).catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, [weddingId, slug]);

  return null; // Silent component
}
