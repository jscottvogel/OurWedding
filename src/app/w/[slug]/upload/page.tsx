'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import UploaderComponent from '@/components/features/gallery/UploaderComponent';
import { Camera } from 'lucide-react';
import { useGallery } from '@/lib/hooks/useGallery';

const client = generateClient<Schema>();

export default function GuestUploadPage({ params }: { params: { slug: string } }) {
  const [wedding, setWedding] = useState<Schema['Wedding']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  // We fetch the wedding id based on the slug to pass to the uploader
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

  // Hook handles public fetching via publicWeddingId argument
  const { addPhotoRecord } = useGallery(wedding?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="animate-pulse text-sage font-medium flex flex-col items-center">
          <Camera className="w-8 h-8 mb-4 animate-bounce" />
          Loading wedding...
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-3xl font-display text-charcoal mb-4">Wedding Not Found</h1>
        <p className="text-mid-gray">Please check the link or scan the QR code again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
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
          <p className="text-ivory text-lg">Help us capture every moment!</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="flex-1 -mt-12 px-4 pb-12 relative z-20">
        <UploaderComponent 
          weddingId={wedding.id} 
          onUploadComplete={addPhotoRecord} 
        />
      </div>
    </div>
  );
}
