'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';
import GuestbookForm from '@/components/features/guestbook/GuestbookForm';
import { BookOpen } from 'lucide-react';
import { useGuestbook } from '@/lib/hooks/useGuestbook';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function GuestbookSignPage({ params }: { params: { slug: string } }) {
  const [wedding, setWedding] = useState<Schema['Wedding']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWedding = async () => {
      try {
        const decodedSlug = decodeURIComponent(params.slug);
        const configResult = await client.models.WebsiteConfig.list({
          filter: { 
            or: [
              { subdomain: { eq: decodedSlug } },
              { customDomain: { contains: decodedSlug } }
            ]
          },
          authMode: 'apiKey'
        });
        
        const config = configResult.data[0];
        if (!config) {
          setLoading(false);
          return;
        }

        const weddingResult = await client.models.Wedding.get(
          { id: config.weddingId },
          { authMode: 'apiKey' }
        );
        setWedding(weddingResult.data || null);
      } catch (err) {
        console.error('Failed to load wedding', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWedding();
  }, [params.slug]);

  const { addEntry } = useGuestbook(wedding?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-pulse text-sage font-medium flex flex-col items-center">
          <BookOpen className="w-8 h-8 mb-4 animate-bounce" />
          Loading wedding...
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-display text-charcoal mb-4">Wedding Not Found</h1>
        <p className="text-mid-gray">Please check the link or scan the QR code again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Hero Banner */}
      <div className="relative h-64 w-full bg-dark-sage flex items-center justify-center text-center p-6">
        {wedding.heroImageKey && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${wedding.heroImageKey})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display text-white mb-2">
            {wedding.coupleName1} & {wedding.coupleName2}
          </h1>
          <p className="text-ivory text-lg">Leave a message for the couple!</p>
        </div>
      </div>

      {/* Guestbook Section */}
      <div className="flex-1 -mt-12 px-4 pb-12 relative z-20">
        <GuestbookForm 
          weddingId={wedding.id} 
          onUploadComplete={addEntry} 
        />
        
        <div className="text-center mt-8">
          <Link href={`/w/${params.slug}#guestbook`} className="text-sage font-medium hover:text-dark-sage underline transition-colors">
            Return to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
