'use client';

import { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-10">
      <div className="max-w-md w-full bg-white rounded-xl border border-light-gray p-8 text-center">
        <h2 className="font-display text-2xl text-charcoal mb-2">This page couldn&apos;t load</h2>
        <p className="text-mid-gray mb-6">Something went wrong while loading your data.</p>
        <button onClick={reset} className="bg-sage text-white px-5 py-2 rounded-md font-medium hover:bg-dark-sage transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}
