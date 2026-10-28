'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-ivory p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-light-gray shadow-sm p-8 text-center">
        <p className="text-sm uppercase tracking-widest text-terra mb-2">Something went wrong</p>
        <h1 className="font-display text-3xl text-charcoal mb-3">We hit a snag</h1>
        <p className="text-mid-gray mb-6">An unexpected error occurred. Please try again.</p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="bg-sage text-white px-5 py-2 rounded-md font-medium hover:bg-dark-sage transition-colors">
            Try again
          </button>
          <Link href="/" className="px-5 py-2 rounded-md font-medium border border-light-gray text-charcoal hover:bg-ivory transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
