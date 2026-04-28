'use client';

import { useState, useEffect } from 'react';
import { useWedding } from '@/lib/hooks/useWedding';
import { differenceInDays } from 'date-fns';
import { Edit2 } from 'lucide-react';

export default function CoupleHero() {
  const { wedding, loading } = useWedding();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({
    coupleName1: '',
    coupleName2: '',
    weddingDate: '',
    venueName: ''
  });

  // Sync state when wedding loads
  useEffect(() => {
    if (wedding) {
      setEditData({
        coupleName1: wedding.coupleName1 || '',
        coupleName2: wedding.coupleName2 || '',
        weddingDate: wedding.weddingDate || '',
        venueName: wedding.venueName || ''
      });
    }
  }, [wedding]);

  const handleUpdate = async () => {
    if (!wedding) return;
    setIsUpdating(true);
    try {
      const { generateClient } = await import('aws-amplify/data');
      const client = generateClient({ authMode: 'userPool' });
      // @ts-ignore
      await client.models.Wedding.update({
        id: wedding.id,
        coupleName1: editData.coupleName1,
        coupleName2: editData.coupleName2,
        weddingDate: editData.weddingDate,
        venueName: editData.venueName || null
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update wedding details', err);
      alert('Failed to update. Check console.');
    } finally {
      setIsUpdating(false);
    }
  };

  const initializeWedding = async () => {
    const { generateClient } = await import('aws-amplify/data');
    // @ts-ignore - dynamic import schema typing workaround
    const client = generateClient({ authMode: 'userPool' });
    
    try {
      await client.models.Wedding.create({
        slug: 'test-wedding-' + Math.floor(Math.random() * 1000),
        coupleName1: 'Alex',
        coupleName2: 'Sam',
        weddingDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        venueName: 'The Grand Estate',
        budgetTotal: 25000,
        isActive: true
      });
      alert('Test wedding created successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to create wedding. Check console.');
    }
  };

  if (loading) return <div className="h-64 bg-light-sage animate-pulse" />;

  if (!wedding) {
    return (
      <div className="h-64 bg-gradient-to-r from-sage to-ivory flex flex-col items-center justify-center">
        <h2 className="text-2xl font-display mb-4">No Wedding Configured</h2>
        <button 
          onClick={initializeWedding}
          className="bg-charcoal text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors"
        >
          Initialize Test Wedding
        </button>
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
      <button 
        onClick={() => setIsEditing(true)}
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all text-white"
      >
        <Edit2 className="w-5 h-5" />
      </button>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
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
              
              <div>
                <label className="block text-sm font-medium mb-1">Wedding Date</label>
                <input 
                  type="date" 
                  value={editData.weddingDate}
                  onChange={(e) => setEditData({...editData, weddingDate: e.target.value})}
                  className="w-full border border-light-gray rounded px-3 py-2 text-sm"
                />
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
