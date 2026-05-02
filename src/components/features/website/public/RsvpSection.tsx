'use client';

import RSVPForm from '../../guests/RSVPForm';
import type { Schema } from '../../../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>();

export function RsvpSection({ slug, guests, wedding }: { slug: string, guests?: Schema['Guest']['type'][], wedding?: Schema['Wedding']['type'] | null }) {
  
  const handleUpdate = async (id: string, updates: Partial<Schema['Guest']['type']>) => {
    return await client.models.Guest.update({ id, ...updates });
  };

  return (
    <section id="rsvp" className="py-20 bg-transparent">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-12" style={{ color: 'var(--color-primary)' }}>RSVP</h2>
        <RSVPForm guests={guests || []} onUpdate={handleUpdate} wedding={wedding} />
      </div>
    </section>
  );
}
