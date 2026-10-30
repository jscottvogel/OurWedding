import type { MetadataRoute } from 'next';

// Colours mirror the CSS variables used by tailwind.config.ts (--sage, --ivory).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WeddingSteward',
    short_name: 'WeddingSteward',
    description: 'Modern wedding planning and coordination',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF7F0',
    theme_color: '#6B8F71',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
