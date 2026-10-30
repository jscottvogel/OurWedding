'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useSiteHref } from '@/lib/hooks/useSiteHref';

/** Small print under the public RSVP form: privacy policy + data deletion request. */
export function PrivacyNotice({ slug, className = '' }: { slug?: string; className?: string }) {
  const href = useSiteHref(slug);
  return (
    <p className={`text-xs text-mid-gray text-center ${className}`}>
      Your details are only shared with the couple.{' '}
      <a href={href('/privacy')} className="underline hover:text-sage">Privacy policy</a>
      {slug && (
        <>
          {' · '}
          <a href={href('/privacy#request-deletion')} className="underline hover:text-sage">Request data deletion</a>
        </>
      )}
    </p>
  );
}

/** Guest asks the couple to delete their data (emails the couple; see /api/privacy/deletion-request). */
export function DataDeletionRequestForm({ slug }: { slug: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/privacy/deletion-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, name, email, message: message || undefined }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || 'Could not send your request.');
      setState('sent');
    } catch (err) {
      setError((err as Error).message);
      setState('idle');
    }
  };

  if (state === 'sent') {
    return (
      <div id="request-deletion" className="bg-sage/10 border border-sage/30 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-sage mx-auto mb-2" />
        <p className="text-charcoal font-medium">Request sent to the couple.</p>
        <p className="text-sm text-mid-gray mt-1">They&apos;ll reply to {email} once your data has been removed.</p>
      </div>
    );
  }

  return (
    <form id="request-deletion" onSubmit={submit} className="bg-white border border-light-gray rounded-xl p-6 space-y-4 shadow-sm">
      <h2 className="text-xl font-display text-charcoal">Request deletion of your data</h2>
      <p className="text-sm text-mid-gray">
        We&apos;ll email the couple, who can delete your guest record, any plus-ones and your guestbook entries.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input id="deletion-name" required maxLength={200} placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full border border-light-gray rounded-lg p-3 text-sm focus:border-sage focus:outline-none" />
        <input id="deletion-email" required type="email" maxLength={254} placeholder="Your email (for their reply)" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-light-gray rounded-lg p-3 text-sm focus:border-sage focus:outline-none" />
      </div>
      <textarea id="deletion-message" maxLength={2000} rows={3} placeholder="Anything else? (optional)" value={message} onChange={(e) => setMessage(e.target.value)}
        className="w-full border border-light-gray rounded-lg p-3 text-sm focus:border-sage focus:outline-none" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button id="deletion-submit" type="submit" disabled={state === 'sending'}
        className="bg-sage text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 flex items-center">
        {state === 'sending' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Send request
      </button>
    </form>
  );
}
