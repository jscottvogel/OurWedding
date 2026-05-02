'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { Loader2 } from 'lucide-react';
import { RsvpResponseTable } from '@/components/features/website/studio/RsvpResponseTable';
import { RsvpSummaryStats } from '@/components/features/website/studio/RsvpSummaryStats';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../../amplify/data/resource';

const client = generateClient<Schema>();

export default function WebsiteRsvpPage() {
  const { wedding, loading } = useWedding();
  const [deadline, setDeadline] = useState('');
  const [mealOptions, setMealOptions] = useState('');
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (wedding) {
      setDeadline(wedding.rsvpDeadline || '');
      setMealOptions(wedding.rsvpMealOptions?.join(', ') || '');
      setConfirmationMsg(wedding.rsvpConfirmationMsg || '');
    }
  }, [wedding]);

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  const handleSave = async () => {
    if (!wedding?.id) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await client.models.Wedding.update({
        id: wedding.id,
        rsvpDeadline: deadline || null,
        rsvpMealOptions: mealOptions ? mealOptions.split(',').map(s => s.trim()).filter(Boolean) : null,
        rsvpConfirmationMsg: confirmationMsg || null
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save RSVP settings", err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-4">RSVP Settings</h3>
        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">RSVP Deadline</label>
            <input 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Meal Options</label>
            <p className="text-sm text-mid-gray mb-2">Guests will choose one of these options when RSVPing. Separate with commas.</p>
            <input 
              type="text" 
              value={mealOptions}
              onChange={(e) => setMealOptions(e.target.value)}
              placeholder="e.g. Beef, Chicken, Vegetarian" 
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Confirmation Message</label>
            <p className="text-sm text-mid-gray mb-2">Shown to guests after they submit their RSVP.</p>
            <textarea 
              rows={3} 
              value={confirmationMsg}
              onChange={(e) => setConfirmationMsg(e.target.value)}
              placeholder="Thank you! We can't wait to celebrate with you."
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage"
            ></textarea>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-sage text-white px-6 py-2 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            {saveSuccess && <span className="text-sage text-sm font-medium">Saved successfully!</span>}
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-4">RSVP Responses</h3>
        <RsvpSummaryStats />
        <RsvpResponseTable />
      </div>
    </div>
  );
}
