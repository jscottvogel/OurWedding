import type { Metadata } from 'next';
import { Suspense } from 'react';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata: Metadata = {
  title: 'Unsubscribe | Wedding Steward',
  description: 'Stop receiving wedding emails sent through Wedding Steward.',
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeClient />
    </Suspense>
  );
}
