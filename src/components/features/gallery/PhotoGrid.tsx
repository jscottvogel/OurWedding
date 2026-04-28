'use client';

import { useState } from 'react';
import { GalleryPhoto } from '@/lib/hooks/useGallery';
import { X, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoGridProps {
  photos: GalleryPhoto[];
  onDelete?: (photo: GalleryPhoto) => void;
  isAdmin?: boolean;
}

export default function PhotoGrid({ photos, onDelete, isAdmin = false }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center text-mid-gray">
        <p className="text-lg">No photos uploaded yet.</p>
        <p className="text-sm mt-2">Share the QR code for guests to start uploading!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-light-gray"
            onClick={() => setSelectedPhoto(photo)}
          >
            {photo.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={photo.url} 
                alt={`Uploaded by ${photo.uploaderName}`} 
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full animate-pulse bg-sage/20"></div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-white text-sm font-medium truncate">{photo.uploaderName}</p>
              {photo.uploadedAt && (
                <p className="text-white/80 text-xs">{format(new Date(photo.uploadedAt), 'MMM d, h:mm a')}</p>
              )}
            </div>
            
            {isAdmin && onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-charcoal/95 z-50 flex items-center justify-center p-4 md:p-8">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={selectedPhoto.url} 
              alt="Enlarged gallery photo" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            
            <div className="mt-4 flex items-center justify-between w-full max-w-lg bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div>
                <p className="text-white font-medium">Uploaded by {selectedPhoto.uploaderName}</p>
                {selectedPhoto.uploadedAt && (
                  <p className="text-white/70 text-sm">{format(new Date(selectedPhoto.uploadedAt), 'MMMM d, yyyy - h:mm a')}</p>
                )}
              </div>
              <a 
                href={selectedPhoto.url} 
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-sage hover:bg-dark-sage text-white rounded-lg transition-colors flex items-center"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
