'use client';

import { useWedding } from '@/lib/hooks/useWedding';
import { Loader2 } from 'lucide-react';
import { RsvpResponseTable } from '@/components/features/website/studio/RsvpResponseTable';
import { RsvpSummaryStats } from '@/components/features/website/studio/RsvpSummaryStats';

export default function WebsiteRsvpPage() {
  const { wedding, loading } = useWedding();

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sage" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-light-gray p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-charcoal mb-4">RSVP Settings</h3>
        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">RSVP Deadline</label>
            <input type="date" className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Meal Options</label>
            <p className="text-sm text-mid-gray mb-2">Guests will choose one of these options when RSVPing.</p>
            <input type="text" placeholder="e.g. Beef, Chicken, Vegetarian" className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Confirmation Message</label>
            <p className="text-sm text-mid-gray mb-2">Shown to guests after they submit their RSVP.</p>
            <textarea 
              rows={3} 
              placeholder="Thank you! We can't wait to celebrate with you."
              className="w-full border-light-gray rounded-md focus:ring-sage focus:border-sage"
            ></textarea>
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
