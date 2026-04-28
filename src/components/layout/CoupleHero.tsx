'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { differenceInDays } from 'date-fns';
import { Edit2 } from 'lucide-react';

export default function CoupleHero() {
  const { wedding, loading } = useWedding();

  if (loading) return <div className="h-64 bg-light-sage animate-pulse" />;

  if (!wedding) {
    return (
      <div className="h-64 bg-gradient-to-r from-sage to-ivory flex items-center justify-center">
        <h2 className="text-2xl font-display">No Wedding Configured</h2>
      </div>
    );
  }

  const daysToGo = differenceInDays(new Date(wedding.weddingDate), new Date());

  return (
    <div className="relative h-64 w-full bg-dark-sage overflow-hidden group">
      {wedding.heroImageKey ? (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${wedding.heroImageKey})` }} // In reality, this would be a presigned URL
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sage via-ivory to-light-terra opacity-80" />
      )}
      
      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 w-full">
        <h1 className="text-4xl md:text-5xl font-display text-white mb-2">
          {wedding.coupleName1} & {wedding.coupleName2}
        </h1>
        <div className="flex items-center text-ivory space-x-4">
          <span className="text-lg font-medium">
            {new Date(wedding.weddingDate).toLocaleDateString(undefined, { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </span>
          <span className="text-gold font-bold text-xl">
            — {daysToGo > 0 ? `${daysToGo} days to go!` : 'Today is the day!'}
          </span>
        </div>
        {wedding.venueName && (
          <p className="text-light-sage mt-1 flex items-center">
            {wedding.venueName}
          </p>
        )}
      </div>

      {/* Edit button (shows on hover) */}
      <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all text-white">
        <Edit2 className="w-5 h-5" />
      </button>
    </div>
  );
}
