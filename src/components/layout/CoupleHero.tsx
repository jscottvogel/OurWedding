'use client';

import { useState, useEffect } from 'react';
import { useWedding } from '@/lib/hooks/useWedding';
import { differenceInDays, startOfDay } from 'date-fns';
import { Edit2 } from 'lucide-react';

export default function CoupleHero() {
  const { wedding, loading } = useWedding();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [editData, setEditData] = useState({
    coupleName1: '',
    coupleName2: '',
    weddingDate: '',
    weddingTime: '',
    timezone: '',
    venueName: '',
    venueAddress: ''
  });

  // Sync state when wedding loads
  useEffect(() => {
    if (wedding) {
      setEditData({
        coupleName1: wedding.coupleName1 || '',
        coupleName2: wedding.coupleName2 || '',
        weddingDate: wedding.weddingDate || '',
        weddingTime: wedding.weddingTime || '',
        timezone: wedding.timezone || '',
        venueName: wedding.venueName || '',
        venueAddress: wedding.venueAddress || ''
      });
      
      if (wedding.heroImageKey) {
        import('aws-amplify/storage').then(({ getUrl }) => {
          getUrl({ path: wedding.heroImageKey! })
            .then((res) => setHeroImageUrl(res.url.toString()))
            .catch((err) => console.error('Failed to load hero image', err));
        });
      }
    }
  }, [wedding]);

  const handleUpdate = async () => {
    if (!wedding) return;
    setIsUpdating(true);
    try {
      let updatedHeroImageKey = wedding.heroImageKey;

      if (heroImageFile) {
        const { uploadData } = await import('aws-amplify/storage');
        const key = `assets/hero-${Date.now()}-${heroImageFile.name}`;
        await uploadData({
          path: key,
          data: heroImageFile
        });
        updatedHeroImageKey = key;
      }

      const { generateClient } = await import('aws-amplify/data');
      const client = generateClient({ authMode: 'userPool' });
      
      const formattedTime = editData.weddingTime 
        ? (editData.weddingTime.length === 5 ? `${editData.weddingTime}:00` : editData.weddingTime)
        : null;

      // @ts-ignore
      await client.models.Wedding.update({
        id: wedding.id,
        coupleName1: editData.coupleName1,
        coupleName2: editData.coupleName2,
        weddingDate: editData.weddingDate,
        weddingTime: formattedTime,
        timezone: editData.timezone || null,
        venueName: editData.venueName || null,
        venueAddress: editData.venueAddress || null,
        heroImageKey: updatedHeroImageKey
      });
      setIsEditing(false);
      setHeroImageFile(null);
    } catch (err) {
      console.error('Failed to update wedding details', err);
      alert('Failed to update. Check console.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="h-64 bg-light-sage animate-pulse" />;

  if (!wedding) {
    return (
      <div className="h-64 bg-gradient-to-r from-sage to-ivory flex flex-col items-center justify-center">
        <h2 className="text-2xl font-display mb-4">No Wedding Configured</h2>
        <a 
          href="/onboarding"
          className="bg-charcoal text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors"
        >
          Set Up Your Wedding
        </a>
      </div>
    );
  }

  const [year, month, day] = wedding.weddingDate.split('-').map(Number);
  const localWeddingDate = new Date(year, month - 1, day);
  const daysToGo = differenceInDays(localWeddingDate, startOfDay(new Date()));

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return undefined;
    try {
      const [hourStr, minStr] = timeStr.split(':');
      let hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${min.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="relative h-80 md:h-96 w-full bg-dark-sage overflow-hidden group">
      {heroImageUrl ? (
        <>
          {/* Blurred backdrop to fill empty letterboxing elegantly */}
          <div 
            className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
            style={{ backgroundImage: `url(${heroImageUrl})` }} 
          />
          {/* Creative Oval Frame Foreground */}
          <div className="absolute inset-0 flex justify-center items-center py-6 pb-16 z-10 pointer-events-none">
            <div className="relative group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-auto">
              {/* Outer decorative ring */}
              <div className="absolute -inset-3 rounded-[50%] border-2 border-white/20 animate-pulse" />
              <div className="absolute -inset-6 rounded-[50%] border border-white/10" />
              {/* The Image */}
              <img 
                src={heroImageUrl} 
                alt="Couple"
                className="max-h-[220px] md:max-h-[280px] w-auto object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-[6px] ring-white/15"
                style={{ borderRadius: '50%' }}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sage via-ivory to-light-terra opacity-80" />
      )}
      
      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent z-10 pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 w-full z-20 pointer-events-none">
        <h1 className="text-4xl md:text-5xl font-display text-white mb-2">
          {wedding.coupleName1} & {wedding.coupleName2}
        </h1>
        <div className="flex items-center text-ivory space-x-4">
          <span className="text-lg font-medium">
            {localWeddingDate.toLocaleDateString(undefined, { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
            {wedding.weddingTime && ` at ${formatTime(wedding.weddingTime)}${wedding.timezone ? ` ${wedding.timezone}` : ''}`}
          </span>
          <span className="text-gold font-bold text-xl">
            — {daysToGo > 0 ? `${daysToGo} days to go!` : 'Today is the day!'}
          </span>
        </div>
        {wedding.venueName && (
          <p className="text-light-sage mt-1 flex flex-col">
            <span className="font-medium text-lg">{wedding.venueName}</span>
            {wedding.venueAddress && <span className="text-sm opacity-90">{wedding.venueAddress}</span>}
          </p>
        )}
      </div>

      {/* Edit button (shows on hover) */}
      <button 
        onClick={() => setIsEditing(true)}
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all text-white z-30 pointer-events-auto shadow-lg"
      >
        <Edit2 className="w-5 h-5" />
      </button>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-display text-sage mb-6">Edit Wedding Details</h2>
            
            <div className="space-y-4 text-charcoal">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Partner 1</label>
                  <input 
                    type="text" 
                    value={editData.coupleName1}
                    onChange={(e) => setEditData({...editData, coupleName1: e.target.value})}
                    className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Partner 2</label>
                  <input 
                    type="text" 
                    value={editData.coupleName2}
                    onChange={(e) => setEditData({...editData, coupleName2: e.target.value})}
                    className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5">
                  <label className="block text-sm font-medium mb-1 truncate" title="Wedding Date">Wedding Date</label>
                  <input 
                    type="date" 
                    value={editData.weddingDate}
                    onChange={(e) => setEditData({...editData, weddingDate: e.target.value})}
                    className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-sm font-medium mb-1 truncate" title="Arrival Time">Arrival Time</label>
                  <input 
                    type="time" 
                    value={editData.weddingTime}
                    onChange={(e) => setEditData({...editData, weddingTime: e.target.value})}
                    className="w-full border border-light-gray rounded px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select
                    value={editData.timezone}
                    onChange={(e) => setEditData({...editData, timezone: e.target.value})}
                    className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="EST">EST</option>
                    <option value="CST">CST</option>
                    <option value="MST">MST</option>
                    <option value="PST">PST</option>
                    <option value="EDT">EDT</option>
                    <option value="CDT">CDT</option>
                    <option value="MDT">MDT</option>
                    <option value="PDT">PDT</option>
                    <option value="GMT">GMT</option>
                    <option value="BST">BST</option>
                    <option value="CET">CET</option>
                    <option value="CEST">CEST</option>
                    <option value="AEST">AEST</option>
                    <option value="AEDT">AEDT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Venue Name (Optional)</label>
                <input 
                  type="text" 
                  value={editData.venueName}
                  onChange={(e) => setEditData({...editData, venueName: e.target.value})}
                  placeholder="e.g. The Grand Estate"
                  className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Venue Address (Optional)</label>
                <textarea 
                  value={editData.venueAddress}
                  onChange={(e) => setEditData({...editData, venueAddress: e.target.value})}
                  placeholder="e.g. 123 Wedding Lane&#10;City, State 12345"
                  rows={2}
                  className="w-full border border-light-gray rounded px-3 py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dashboard Hero Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setHeroImageFile(e.target.files?.[0] || null)}
                  className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                />
                <p className="text-xs text-mid-gray mt-1">Upload a new cover photo to replace the current one.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-mid-gray hover:bg-light-gray rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-sage text-white px-4 py-2 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
