'use client';

import Link from 'next/link';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';

export default function RecentGallery() {
  // Dummy data
  const uploads = [
    { id: '1', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=200&h=200', uploader: 'Aunt Jane' },
    { id: '2', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=200&h=200', uploader: 'Cousin Tom' },
    { id: '3', url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=200&h=200', uploader: 'Sarah' },
    { id: '4', url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=200&h=200', uploader: 'Uncle Bob' },
    { id: '5', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=200&h=200', uploader: 'Aunt Jane' },
    { id: '6', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=200&h=200', uploader: 'Sarah' },
  ];

  return (
    <div className="bg-white rounded-xl border border-light-gray shadow-sm p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-display text-sage">Recent Gallery Uploads</h2>
        <Link href="/gallery" className="text-sm text-mid-gray hover:text-dark-sage flex items-center">
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {uploads.map((upload) => (
          <div key={upload.id} className="relative aspect-square rounded-lg overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={upload.url} 
              alt="Gallery upload" 
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-charcoal/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-xs text-white truncate">{upload.uploader}</span>
            </div>
          </div>
        ))}
        {uploads.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center text-mid-gray py-8">
            <ImageIcon className="w-8 h-8 mb-2 text-light-gray" />
            <p>No photos yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
