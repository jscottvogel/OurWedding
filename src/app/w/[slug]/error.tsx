'use client';

import { useEffect } from 'react';

export default function WeddingSiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory p-6">
      <div className="text-center max-w-md">
        <h1 className="font-display text-3xl text-charcoal mb-3">We couldn&apos;t load this wedding website</h1>
        <p className="text-mid-gray mb-6">Please try again in a moment.</p>
        <button onClick={reset} className="bg-sage text-white px-5 py-2 rounded-md font-medium hover:bg-dark-sage transition-colors">
          Try again
        </button>
      </div>
    </main>
  );
}
