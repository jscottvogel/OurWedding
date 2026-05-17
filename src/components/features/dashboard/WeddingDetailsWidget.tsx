'use client';

import { useState, useEffect } from 'react';
import { useWedding } from '@/lib/hooks/useWedding';
import { Calendar, Clock, MapPin, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WeddingDetailsWidget() {
  const { wedding, loading: weddingLoading, updateWedding } = useWedding();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  useEffect(() => {
    if (wedding && !isEditing) {
      setDate(wedding.weddingDate || '');
      setTime(wedding.weddingTime || '');
      setVenue(wedding.venueName || '');
    }
  }, [wedding, isEditing]);

  const handleSave = async () => {
    if (!wedding) return;
    setIsSaving(true);
    try {
      await updateWedding({
        weddingDate: date,
        weddingTime: time,
        venueName: venue
      });
      setIsEditing(false);
      toast.success('Wedding details updated successfully');
    } catch (err) {
      toast.error('Failed to update wedding details');
    } finally {
      setIsSaving(false);
    }
  };

  if (weddingLoading) {
    return <div className="h-48 bg-white rounded-xl border border-light-gray animate-pulse" />;
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-light-gray shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-charcoal">Wedding Details</h3>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-sage hover:text-dark-sage"
          >
            Edit
          </button>
        ) : (
          <button 
            onClick={() => {
              setIsEditing(false);
              setDate(wedding?.weddingDate || '');
              setTime(wedding?.weddingTime || '');
              setVenue(wedding?.venueName || '');
            }}
            className="text-sm font-medium text-mid-gray hover:text-charcoal"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Wedding Date
          </label>
          {isEditing ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm border border-light-gray rounded px-3 py-2 focus:outline-none focus:border-sage"
            />
          ) : (
            <div className="text-charcoal font-medium">
              {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'Not set'}
            </div>
          )}
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Guests Arrive
          </label>
          {isEditing ? (
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-sm border border-light-gray rounded px-3 py-2 focus:outline-none focus:border-sage"
            />
          ) : (
            <div className="text-charcoal font-medium">
              {time ? (() => {
                const [h, m] = time.split(':');
                const hour = parseInt(h, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                return `${hour % 12 || 12}:${m} ${ampm}`;
              })() : 'Not set'}
            </div>
          )}
        </div>

        {/* Venue */}
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Venue
          </label>
          {isEditing ? (
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Willow Pond Estate"
              className="w-full text-sm border border-light-gray rounded px-3 py-2 focus:outline-none focus:border-sage"
            />
          ) : (
            <div className="text-charcoal font-medium">
              {venue || 'Not set'}
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 pt-4 border-t border-light-gray">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center bg-sage text-white py-2 rounded font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Details
          </button>
        </div>
      )}
    </div>
  );
}
