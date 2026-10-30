'use client';

import { useEffect, useState } from 'react';

/**
 * Links between pages of a public wedding site. On the platform host pages live under /w/<slug>/...,
 * but on <slug>.<root> and custom domains the middleware rewrites "/" to /w/<slug>/, so links must
 * be root-relative there. Starts with the /w/ form (SSR) and corrects itself after mount.
 */
export function useSiteHref(slug?: string) {
  const [prefix, setPrefix] = useState(slug ? `/w/${encodeURIComponent(slug)}` : '');
  useEffect(() => {
    if (slug && !window.location.pathname.startsWith('/w/')) setPrefix('');
  }, [slug]);
  return (path: string) => `${prefix}${path}`;
}
