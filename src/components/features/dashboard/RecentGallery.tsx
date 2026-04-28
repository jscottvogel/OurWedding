'use client';

import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';
import { useGallery } from '@/lib/hooks/useGallery';

export default function RecentGallery() {
  const { photos, loading } = useGallery();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
        <h2 className="text-xl font-display text-sage mb-4 animate-pulse bg-light-gray h-6 w-32 rounded"></h2>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square bg-light-gray rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Get up to 4 most recent photos
  const recentPhotos = photos.slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display text-sage">Recent Photos</h2>
        <Link href="/gallery" className="text-sm text-gold hover:text-charcoal transition-colors">
          View Gallery
        </Link>
      </div>

      {recentPhotos.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-light-gray rounded-lg text-mid-gray">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recentPhotos.map((photo) => (
            <div key={photo.id} className="aspect-square relative group overflow-hidden rounded-lg bg-light-gray">
              {photo.url ? (
                <img 
                  src={photo.url} 
                  alt={'Wedding photo'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-mid-gray opacity-30" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
