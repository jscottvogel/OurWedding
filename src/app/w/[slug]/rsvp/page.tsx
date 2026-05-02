'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import RSVPForm from '@/components/features/guests/RSVPForm';
import { useGuests } from '@/lib/hooks/useGuests';
import { Mail } from 'lucide-react';

const client = generateClient<Schema>();

export default function GuestRSVPPage({ params }: { params: { slug: string } }) {
  const [wedding, setWedding] = useState<Schema['Wedding']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWedding = async () => {
      try {
        const result = await client.models.Wedding.list({
          filter: { slug: { eq: params.slug } },
          authMode: 'apiKey'
        });
        setWedding(result.data[0] || null);
      } catch (err) {
        console.error('Failed to load wedding', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWedding();
  }, [params.slug]);

  const { guests, updateGuest } = useGuests(wedding?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="animate-pulse text-sage font-medium flex flex-col items-center">
          <Mail className="w-8 h-8 mb-4 animate-bounce" />
          Loading RSVP...
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-display text-charcoal mb-4">Wedding Not Found</h1>
        <p className="text-mid-gray">Please check the link provided on your invitation.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      {/* Hero Banner */}
      <div className="relative h-64 w-full bg-sage flex items-center justify-center text-center p-6">
        {wedding.heroImageKey && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${wedding.heroImageKey})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-white/80 font-medium tracking-widest uppercase text-sm mb-3">You are invited</p>
          <h1 className="text-4xl md:text-5xl font-display text-white mb-2 leading-tight">
            {wedding.coupleName1} & {wedding.coupleName2}
          </h1>
          {wedding.weddingDate && (
            <p className="text-ivory text-lg mt-2 font-medium">
              {wedding.weddingDate && (() => {
                const [y, m, d] = wedding.weddingDate.split('-').map(Number);
                return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              })()}
            </p>
          )}
        </div>
      </div>

      {/* RSVP Section */}
      <div className="flex-1 -mt-12 px-4 pb-12 relative z-20">
        <RSVPForm 
          guests={guests} 
          onUpdate={updateGuest}
        />
      </div>
    </div>
  );
}
