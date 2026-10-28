import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://weddingsteward.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/w/'],
        disallow: [
          '/api/',
          '/portal',
          '/dashboard',
          '/budget',
          '/checklist',
          '/email-studio',
          '/gallery',
          '/guestbook',
          '/guests',
          '/mood-board',
          '/run-sheet',
          '/seating',
          '/settings',
          '/vendors',
          '/website',
          '/onboarding',
          '/invite',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
