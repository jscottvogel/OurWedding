'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailX, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Requires a click rather than unsubscribing on load, so link scanners and mail-client
 * prefetching can't opt guests out by accident.
 */
export default function UnsubscribeClient() {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const unsubscribe = async () => {
    setState('working');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || 'Could not unsubscribe right now.');
      setState('done');
    } catch (err) {
      setError((err as Error).message);
      setState('error');
    }
  };

  return (
    <main className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <div className="bg-white border border-light-gray rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {state === 'done' ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-sage mx-auto mb-4" />
            <h1 className="text-2xl font-display text-charcoal mb-2">You&apos;re unsubscribed</h1>
            <p className="text-mid-gray">You won&apos;t receive any more wedding emails sent through Wedding Steward for this guest list.</p>
          </>
        ) : !token ? (
          <>
            <MailX className="w-12 h-12 text-mid-gray mx-auto mb-4" />
            <h1 className="text-2xl font-display text-charcoal mb-2">Link incomplete</h1>
            <p className="text-mid-gray">Please use the unsubscribe link from your email.</p>
          </>
        ) : (
          <>
            <MailX className="w-12 h-12 text-sage mx-auto mb-4" />
            <h1 className="text-2xl font-display text-charcoal mb-2">Unsubscribe from wedding emails?</h1>
            <p className="text-mid-gray mb-6">The couple will no longer be able to email you through Wedding Steward.</p>
            {state === 'error' && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <button id="unsubscribe-confirm" onClick={unsubscribe} disabled={state === 'working'}
              className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 flex justify-center items-center">
              {state === 'working' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unsubscribe'}
            </button>
          </>
        )}
        <p className="mt-6 text-xs text-mid-gray">
          <Link href="/privacy" className="underline hover:text-sage">Privacy policy</Link>
        </p>
      </div>
    </main>
  );
}
