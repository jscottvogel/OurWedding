'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { Schema } from '../../../../../amplify/data/resource';
import { StorageImage } from './StorageImage';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>();

export function GalleryCarousel({ photos }: { photos: Schema['GalleryUpload']['type'][] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [livePhotos, setLivePhotos] = useState(photos);

  useEffect(() => {
    const weddingId = photos[0]?.weddingId;
    if (!weddingId) return;

    const fetchPhotos = async () => {
      try {
        const { data } = await client.models.GalleryUpload.list({
          filter: { weddingId: { eq: weddingId }, showOnWebsite: { eq: true } },
          authMode: 'apiKey'
        });
        if (data) {
          const activeItems = data.filter(item => !item.isDeleted);
          activeItems.sort((a, b) => {
            const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
            const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
            return dateB - dateA;
          });
          setLivePhotos(activeItems);
        }
      } catch (error) {
        console.error('Failed to poll new gallery images', error);
      }
    };

    const intervalId = setInterval(fetchPhotos, 15000);
    fetchPhotos();

    return () => clearInterval(intervalId);
  }, [photos]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.65 : 320;
      
      let newLeft = scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      if (direction === 'right' && scrollLeft + clientWidth >= scrollWidth - 10) {
        newLeft = 0;
      } else if (direction === 'left' && scrollLeft <= 0) {
        newLeft = scrollWidth - clientWidth;
      }
      
      scrollRef.current.scrollTo({
        left: newLeft,
        behavior: 'smooth'
      });
    }
  };

  const animationRef = useRef<number>();
  const posRef = useRef<number>(0);

  useEffect(() => {
    if (livePhotos.length <= 2 || isHovered) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const container = scrollRef.current;
    if (!container) return;

    let lastTime = performance.now();
    posRef.current = container.scrollLeft;

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Cap delta to prevent massive jumps if tab was inactive
      if (delta > 0 && delta < 100) {
        // Move at 40 pixels per second
        posRef.current += (40 * delta) / 1000;

        // Calculate the exact pixel width of one full original set of photos
        const firstOriginal = container.children[0] as HTMLElement;
        const firstDuplicate = container.children[livePhotos.length] as HTMLElement;
        
        if (firstOriginal && firstDuplicate) {
          const originalWidth = firstDuplicate.offsetLeft - firstOriginal.offsetLeft;

          // Seamlessly jump back by exactly one set width when we've scrolled past it
          if (posRef.current >= originalWidth) {
            posRef.current -= originalWidth;
          }
        }

        container.scrollLeft = posRef.current;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isHovered, livePhotos.length]);

  // Duplicate photos 4 times to ensure it can infinite loop even on ultra-wide screens
  const displayPhotos = livePhotos.length > 2 
    ? [...livePhotos, ...livePhotos, ...livePhotos, ...livePhotos] 
    : livePhotos;

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-8 px-4 -mx-4 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayPhotos.map((photo, idx) => (
          <div 
            key={`${photo.id}-${idx}`} 
            className="shrink-0 w-[65vw] md:w-[300px] aspect-square relative rounded-2xl overflow-hidden shadow-sm border border-black/5 group/item"
          >
            <StorageImage 
              storageKey={photo.fileKey}
              fileType={photo.fileType}
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
      
      {livePhotos.length > 2 && (
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
