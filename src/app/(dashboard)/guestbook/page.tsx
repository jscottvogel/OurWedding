'use client';

import { useGuestbook } from '@/lib/hooks/useGuestbook';
import { StorageImage } from '@/components/features/website/public/StorageImage';
import { BookOpen, Check, EyeOff, Trash2, Music } from 'lucide-react';
import { useState } from 'react';

export default function GuestbookManagementPage() {
  const { entries, loading, toggleApproval, deleteEntry } = useGuestbook();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');

  if (loading) {
    return <div className="p-8 animate-pulse text-sage">Loading guestbook...</div>;
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'PENDING') return !entry.isApproved;
    if (filter === 'APPROVED') return entry.isApproved;
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-display text-sage mb-2 flex items-center">
            <BookOpen className="w-8 h-8 mr-3" />
            Digital Guestbook
          </h1>
          <p className="text-mid-gray">Manage messages, photos, and song requests from your guests.</p>
        </div>
        
        <div className="flex bg-white rounded-lg border border-light-gray p-1 shadow-sm">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-sage text-white' : 'text-mid-gray hover:bg-ivory'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'PENDING' ? 'bg-sage text-white' : 'text-mid-gray hover:bg-ivory'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'APPROVED' ? 'bg-sage text-white' : 'text-mid-gray hover:bg-ivory'}`}
          >
            Approved
          </button>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-12 text-center">
          <BookOpen className="w-12 h-12 text-mid-gray mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-display text-charcoal mb-2">No entries yet</h3>
          <p className="text-mid-gray">When guests sign your guestbook, their messages will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden flex flex-col">
              {entry.mediaKey && (
                <div className="h-48 w-full relative bg-gray-100 border-b border-light-gray">
                  <StorageImage
                    storageKey={entry.mediaKey}
                    fileType={entry.mediaType}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-charcoal text-lg">{entry.guestName}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${entry.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {entry.isApproved ? 'Public' : 'Hidden'}
                  </span>
                </div>
                
                {entry.message && (
                  <p className="text-mid-gray text-sm italic mb-4 flex-1">
                    "{entry.message}"
                  </p>
                )}

                {entry.songRequest && (
                  <div className="flex items-center text-sm text-charcoal bg-ivory p-2 rounded border border-light-gray mb-4">
                    <Music className="w-4 h-4 mr-2 text-sage" />
                    <span className="truncate">{entry.songRequest}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-light-gray">
                  <button
                    onClick={() => toggleApproval(entry.id, !entry.isApproved)}
                    className={`flex items-center text-sm font-medium px-3 py-1.5 rounded transition-colors ${entry.isApproved ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    {entry.isApproved ? (
                      <><EyeOff className="w-4 h-4 mr-1.5" /> Hide</>
                    ) : (
                      <><Check className="w-4 h-4 mr-1.5" /> Approve</>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this entry?')) {
                        deleteEntry(entry.id);
                      }
                    }}
                    className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
