'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Users, Loader2 } from 'lucide-react';
import { useSiteHref } from '@/lib/hooks/useSiteHref';
import type { FindSeatResult } from '@/app/api/website/find-seat/route';

export function SeatFinder({ slug }: { slug: string }) {
  const href = useSiteHref(slug);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FindSeatResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/website/find-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setResult(data as FindSeatResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ivory text-charcoal px-4 py-10">
      <div className="max-w-md mx-auto">
        <Link href={href('/')} className="inline-flex items-center gap-1 text-sm text-mid-gray hover:text-charcoal mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Find your seat</h1>
        <p className="text-mid-gray mb-6">Enter your name as it appears on your invitation.</p>

        <form onSubmit={submit} className="bg-white rounded-xl border border-sage/20 p-5 shadow-sm space-y-3">
          <label htmlFor="seat-name" className="block text-sm font-medium">Full name</label>
          <input
            id="seat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First and last name"
            autoComplete="name"
            required
            className="w-full rounded-md border border-sage/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sage"
          />
          <button
            id="seat-submit"
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full inline-flex items-center justify-center gap-2 py-2 bg-sage hover:bg-dark-sage text-white rounded-md font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find my table
          </button>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </form>

        {result && (
          <div className="mt-6 rounded-xl bg-white border border-sage/20 p-5 shadow-sm animate-in fade-in" aria-live="polite">
            {!result.enabled ? (
              <p className="text-mid-gray">Seat lookup isn&apos;t available for this wedding. Please check the seating chart at the venue.</p>
            ) : result.needLastName ? (
              <p className="text-mid-gray">Please enter both your first and last name.</p>
            ) : !result.found ? (
              <p className="text-mid-gray">We couldn&apos;t find that name. Try the spelling on your invitation, or ask a member of the wedding party.</p>
            ) : !result.tableName ? (
              <p className="text-mid-gray">Found you! Your table hasn&apos;t been assigned yet. Check back closer to the day.</p>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wider text-sage">You&apos;re seated at</p>
                <p className="font-display text-2xl font-bold mb-3">{result.tableName}</p>
                {result.tablemates && result.tablemates.length > 0 && (
                  <p className="text-sm text-charcoal/80 flex gap-2"><Users className="w-4 h-4 mt-0.5 text-sage shrink-0" />With {result.tablemates.join(', ')}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
