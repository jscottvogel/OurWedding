'use client';

import { useGuestbook } from '@/lib/hooks/useGuestbook';
import { useWedding } from '@/lib/hooks/useWedding';
import { StorageImage } from '@/components/features/website/public/StorageImage';
import { BookOpen, Check, EyeOff, Trash2, Music, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { GuestbookPDF } from '@/components/features/guestbook/GuestbookPDF';
import { pdf } from '@react-pdf/renderer';

export default function GuestbookManagementPage() {
  const { entries, loading, toggleApproval, deleteEntry } = useGuestbook();
  const { wedding } = useWedding();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  if (loading) {
    return <div className="p-8 animate-pulse text-sage">Loading guestbook...</div>;
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'PENDING') return !entry.isApproved;
    if (filter === 'APPROVED') return entry.isApproved;
    return true;
  });

  const handleExportPDF = async () => {
    if (!wedding) return;
    setIsExporting(true);

    try {
      // 1. Resolve presigned URLs for the hero image and all entry images
      let heroImageUrl: string | undefined;
      if (wedding.heroImageKey) {
        const urlObj = await getUrl({ path: wedding.heroImageKey });
        heroImageUrl = urlObj.url.toString();
      }

      const approvedEntries = entries.filter(e => e.isApproved);
      const entriesWithUrls = await Promise.all(
        approvedEntries.map(async (entry) => {
          let mediaUrl: string | undefined;
          if (entry.mediaKey) {
            try {
              const urlObj = await getUrl({ path: entry.mediaKey });
              mediaUrl = urlObj.url.toString();
            } catch (err) {
              console.error('Failed to resolve URL for', entry.mediaKey);
            }
          }
          return {
            id: entry.id,
            guestName: entry.guestName,
            message: entry.message || undefined,
            songRequest: entry.songRequest || undefined,
            mediaUrl
          };
        })
      );

      // 2. Render the PDF
      const doc = (
        <GuestbookPDF
          weddingName={`${wedding.coupleName1} & ${wedding.coupleName2}`}
          weddingDate={wedding.weddingDate}
          venueName={wedding.venueName || undefined}
          heroImageUrl={heroImageUrl}
          entries={entriesWithUrls}
        />
      );

      const blob = await pdf(doc).toBlob();
      
      // 3. Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wedding.coupleName1}_${wedding.coupleName2}_Guestbook.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export PDF', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

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

        <button
          onClick={handleExportPDF}
          disabled={isExporting || entries.filter(e => e.isApproved).length === 0}
          className="ml-4 flex items-center bg-dark-sage text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
          {isExporting ? 'Generating...' : 'Export PDF'}
        </button>
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
