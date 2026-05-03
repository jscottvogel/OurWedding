'use client';

import { useState } from 'react';
import { Search, CheckCircle2, UserCheck, UserX, Loader2 } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { toast } from 'sonner';

interface RSVPFormProps {
  guests: Schema['Guest']['type'][];
  onUpdate: (id: string, updates: Partial<Schema['Guest']['type']>) => Promise<any>;
  wedding?: Schema['Wedding']['type'] | null;
}

export default function RSVPForm({ guests, onUpdate, wedding }: RSVPFormProps) {
  const [step, setStep] = useState<'SEARCH' | 'RSVP' | 'SUCCESS'>('SEARCH');
  const [searchFirst, setSearchFirst] = useState('');
  const [searchLast, setSearchLast] = useState('');
  const [foundGuest, setFoundGuest] = useState<Schema['Guest']['type'] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // RSVP Form State
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [mealChoice, setMealChoice] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFirst || !searchLast) return;
    
    setIsSearching(true);
    
    // Simulate network delay for UX
    setTimeout(() => {
      const match = guests.find(g => {
        const dbFirst = (g.firstName || '').toLowerCase().trim();
        const dbLast = (g.lastName || '').toLowerCase().trim();
        const searchFirstClean = searchFirst.toLowerCase().trim();
        const searchLastClean = searchLast.toLowerCase().trim();
        
        return dbFirst === searchFirstClean && dbLast === searchLastClean;
      });
      
      if (match) {
        setFoundGuest(match);
        setIsAttending(match.rsvpStatus === 'CONFIRMED' ? true : match.rsvpStatus === 'DECLINED' ? false : null);
        setMealChoice(match.mealChoice || '');
        setDietaryRequirements(match.dietaryOther || '');
        setStep('RSVP');
      } else {
        toast.error('We couldn\'t find your invitation. Please check the spelling or contact the couple.');
      }
      setIsSearching(false);
    }, 800);
  };

  const handleSubmitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundGuest || isAttending === null) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(foundGuest.id, {
        rsvpStatus: isAttending ? 'CONFIRMED' : 'DECLINED',
        mealChoice: isAttending ? mealChoice : undefined,
        dietaryOther: isAttending ? dietaryRequirements : undefined,
      });
      setStep('SUCCESS');
    } catch (err) {
      toast.error('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto border border-light-gray text-center">
        <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-sage" />
        </div>
        <h2 className="text-2xl font-display text-charcoal mb-2">Thank You!</h2>
        <p className="text-mid-gray mb-6">
          Your RSVP has been received. {isAttending ? 'We can\'t wait to celebrate with you!' : 'You will be missed!'}
        </p>
        <button 
          onClick={() => {
            setStep('SEARCH');
            setSearchFirst('');
            setSearchLast('');
            setFoundGuest(null);
          }}
          className="text-sage hover:text-dark-sage font-medium text-sm underline"
        >
          RSVP for another guest
        </button>
      </div>
    );
  }

  if (step === 'RSVP' && foundGuest) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-auto border border-light-gray">
        <h2 className="text-2xl font-display text-sage mb-1 text-center">
          Hi, {foundGuest.firstName}!
        </h2>
        <p className="text-mid-gray text-center mb-8 text-sm">Please let us know if you can make it.</p>
        
        <form onSubmit={handleSubmitRSVP} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsAttending(true)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${
                isAttending === true 
                  ? 'border-sage bg-sage/5 text-sage' 
                  : 'border-light-gray text-mid-gray hover:border-sage/30'
              }`}
            >
              <UserCheck className="w-8 h-8 mb-2" />
              <span className="font-medium">Joyfully Accept</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAttending(false)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${
                isAttending === false 
                  ? 'border-red-400 bg-red-50 text-red-500' 
                  : 'border-light-gray text-mid-gray hover:border-red-200'
              }`}
            >
              <UserX className="w-8 h-8 mb-2" />
              <span className="font-medium">Regretfully Decline</span>
            </button>
          </div>

          {isAttending && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Meal Choice</label>
                <select 
                  required
                  value={mealChoice}
                  onChange={(e) => setMealChoice(e.target.value)}
                  className="w-full border border-light-gray rounded-lg p-3 bg-white focus:border-sage focus:outline-none"
                >
                  <option value="" disabled>Select a meal...</option>
                  {(wedding?.rsvpMealOptions || wedding?.mealOptions || ['Beef', 'Chicken', 'Vegetarian']).filter(Boolean).map(m => (
                    <option key={m as string} value={m as string}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Special Instructions or Dietary Needs</label>
                <input 
                  type="text" 
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  placeholder="e.g. Gluten-free, Nut allergy (optional)"
                  className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setStep('SEARCH')}
              className="text-mid-gray hover:text-charcoal text-sm font-medium"
              disabled={isSubmitting}
            >
              Back
            </button>
            <button 
              type="submit"
              disabled={isAttending === null || isSubmitting}
              className="bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : 'Submit RSVP'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // SEARCH STEP
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-auto border border-light-gray">
      <h2 className="text-2xl font-display text-sage mb-6 text-center">Find Your Invitation</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">First Name</label>
          <input 
            required
            type="text" 
            value={searchFirst}
            onChange={(e) => setSearchFirst(e.target.value)}
            className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">Last Name</label>
          <input 
            required
            type="text" 
            value={searchLast}
            onChange={(e) => setSearchLast(e.target.value)}
            className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
          />
        </div>
        
        <button 
          type="submit"
          disabled={!searchFirst || !searchLast || isSearching}
          className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 mt-4 flex justify-center items-center"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search RSVP'}
        </button>
      </form>
    </div>
  );
}
