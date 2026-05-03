'use client';

import React, { useRef } from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { StorageImage } from './StorageImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function GalleryCarousel({ photos }: { photos: Schema['GalleryUpload']['type'][] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.65 : 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 px-4 -mx-4 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="snap-start shrink-0 w-[65vw] md:w-[300px] aspect-square relative rounded-2xl overflow-hidden shadow-sm border border-black/5 group/item"
          >
            <StorageImage 
              storageKey={photo.fileKey}
              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-700 ease-out"
              alt={photo.caption || "Wedding Gallery Photo"}
            />
            {photo.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 text-left opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium tracking-wide line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {photos.length > 2 && (
        <>
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-[calc(50%-16px)] -translate-y-1/2 -translate-x-1/2 bg-white text-charcoal p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10 hidden md:flex items-center justify-center border border-light-gray"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-[calc(50%-16px)] -translate-y-1/2 translate-x-1/2 bg-white text-charcoal p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10 hidden md:flex items-center justify-center border border-light-gray"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
