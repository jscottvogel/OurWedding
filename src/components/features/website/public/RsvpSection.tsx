'use client';

import RSVPForm from '../../guests/RSVPForm';
import type { Schema } from '../../../../../amplify/data/resource';

// `guests` is accepted for backwards compatibility but ignored: public RSVP lookup and submit run server-side.
export function RsvpSection({ slug, wedding }: { slug: string, guests?: Schema['Guest']['type'][], wedding?: Schema['Wedding']['type'] | null }) {
  return (
    <section id="rsvp" className="py-20 bg-transparent">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>RSVP</h2>
        <RSVPForm slug={slug} wedding={wedding} />
      </div>
    </section>
  );
}
