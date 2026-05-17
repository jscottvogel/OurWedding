'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../../amplify/data/resource';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWedding } from '@/lib/hooks/useWedding';
import { StorageImage } from '@/components/features/website/public/StorageImage';
import { Image as ImageIcon, CheckCircle2, Loader2, X } from 'lucide-react';

const client = generateClient<Schema>();

interface PhotoSelectorProps {
  photoUrl: string;
  setPhotoUrl: (url: string) => void;
}

export default function PhotoSelector({ photoUrl, setPhotoUrl }: PhotoSelectorProps) {
  const { weddingId } = useAuth();
  const { wedding } = useWedding();
  const [isOpen, setIsOpen] = useState(false);
  const [photos, setPhotos] = useState<Schema['GalleryUpload']['type'][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPhotos = async () => {
    if (!weddingId) return;
    setIsLoading(true);
    try {
      const { data } = await client.models.GalleryUpload.list({
        filter: { weddingId: { eq: weddingId } }
      });
      // Filter out videos, only keep images
      const images = data.filter(d => !d.fileType?.startsWith('video/'));
      setPhotos(images);
    } catch (e) {
      console.error('Failed to fetch photos', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (storageKey: string) => {
    try {
      const result = await getUrl({ path: storageKey });
      setPhotoUrl(result.url.toString());
      setIsOpen(false);
    } catch (e) {
      console.error('Failed to get public URL for image', e);
    }
  };

  const handleSelectHero = async () => {
    if (wedding?.heroImageKey) {
      await handleSelect(wedding.heroImageKey);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-charcoal">Wedding Photo</label>
        {photoUrl && (
          <button 
            onClick={() => setPhotoUrl('')}
            className="text-xs text-rose-500 hover:text-rose-600 flex items-center"
          >
            <X className="w-3 h-3 mr-1" />
            Remove
          </button>
        )}
      </div>

      {!photoUrl ? (
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen && photos.length === 0) fetchPhotos();
          }}
          className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-light-gray rounded-md hover:border-sage hover:bg-sage/5 transition-colors text-mid-gray hover:text-sage"
        >
          <ImageIcon className="w-6 h-6 mb-2" />
          <span className="text-sm font-medium">Select a Photo</span>
        </button>
      ) : (
        <div className="relative w-full max-w-xs mx-auto rounded-md overflow-hidden border border-light-gray">
          <img src={photoUrl} alt="Selected" className="w-full object-cover" />
          <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-full shadow-sm text-sage">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      )}

      {isOpen && !photoUrl && (
        <div className="mt-4 p-4 border border-light-gray rounded-md bg-gray-50">
          <h4 className="text-sm font-medium text-charcoal mb-3">Choose from Gallery</h4>
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-sage" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {wedding?.heroImageKey && (
                <button 
                  onClick={handleSelectHero}
                  className="relative aspect-square rounded overflow-hidden hover:opacity-90 border-2 border-transparent hover:border-sage transition-all"
                  title="Wedding Hero Image"
                >
                  <StorageImage storageKey={wedding.heroImageKey} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center">Hero Image</div>
                </button>
              )}
              {photos.map(p => (
                <button 
                  key={p.id}
                  onClick={() => handleSelect(p.fileKey)}
                  className="relative aspect-square rounded overflow-hidden hover:opacity-90 border-2 border-transparent hover:border-sage transition-all"
                >
                  <StorageImage storageKey={p.thumbnailKey || p.fileKey} className="w-full h-full object-cover" />
                </button>
              ))}
              {photos.length === 0 && !wedding?.heroImageKey && (
                <div className="col-span-3 text-xs text-mid-gray text-center py-4">
                  No photos available.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
