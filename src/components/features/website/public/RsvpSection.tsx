'use client';

import { useState } from 'react';
import Fuse from 'fuse.js';
import { RsvpConfirmation } from './RsvpConfirmation';
import type { Schema } from '../../../../../amplify/data/resource';

export function RsvpSection({ slug, guests }: { slug: string, guests?: Schema['Guest']['type'][] }) {
  const [step, setStep] = useState(1);
  const [nameSearch, setNameSearch] = useState('');
  const [matchedGuest, setMatchedGuest] = useState<Schema['Guest']['type'] | null>(null);
  const [attending, setAttending] = useState<boolean | null>(null);
  const [plusOneName, setPlusOneName] = useState('');
  const [mealChoice, setMealChoice] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Mock Wedding config
  const mealOptions = ['Beef', 'Chicken', 'Vegetarian'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guests || guests.length === 0) {
      alert("Guest list is empty. Please contact the couple.");
      return;
    }
    const fuse = new Fuse(guests, { keys: ['firstName', 'lastName'], threshold: 0.35 });
    const results = fuse.search(nameSearch);
    if (results.length > 0) {
      setMatchedGuest(results[0].item);
      setStep(2);
    } else {
      alert("We couldn't find your name. Please contact the couple.");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/rsvp/submit', {
        method: 'POST',
        body: JSON.stringify({
          weddingSlug: slug,
          guestId: matchedGuest?.id,
          attending,
          plusOneName,
          mealChoice,
          dietaryNotes,
          guestEmail
        })
      });
      setIsConfirmed(true);
    } catch (e) {
      console.error(e);
      alert('Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return <RsvpConfirmation attending={attending === true} />;
  }

  return (
    <section id="rsvp" className="py-20 bg-white">
      <div className="max-w-xl mx-auto px-4">
        <h2 className="text-4xl font-heading text-center mb-8" style={{ color: 'var(--color-primary)' }}>RSVP</h2>
        
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 shadow-sm">
          {step === 1 && (
            <form onSubmit={handleSearch} className="space-y-4">
              <h3 className="text-lg font-bold text-center mb-4">Find Your Invitation</h3>
              <input
                type="text"
                placeholder="Enter your full name"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full px-4 py-3 rounded border border-gray-300"
                required
              />
              <button type="submit" className="w-full bg-sage text-white py-3 rounded font-bold">Search</button>
            </form>
          )}

          {step === 2 && matchedGuest && (
            <div className="space-y-6 text-center">
              <h3 className="text-lg font-bold">Hi {matchedGuest.firstName}, will you be joining us?</h3>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => { setAttending(true); setStep(3); }}
                  className="bg-sage text-white py-3 rounded font-bold"
                >
                  Joyfully Accepts
                </button>
                <button 
                  onClick={() => { setAttending(false); setStep(6); }}
                  className="bg-gray-200 text-gray-700 py-3 rounded font-bold"
                >
                  Regretfully Declines
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <h3 className="text-lg font-bold">Will you be bringing a guest?</h3>
              <input
                type="text"
                placeholder="Guest's full name (leave blank if none)"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
                className="w-full px-4 py-3 rounded border border-gray-300 mb-4"
              />
              <button onClick={() => setStep(4)} className="w-full bg-sage text-white py-3 rounded font-bold">Continue</button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-center">Meal Preference</h3>
              <select 
                value={mealChoice} 
                onChange={(e) => setMealChoice(e.target.value)}
                className="w-full px-4 py-3 rounded border border-gray-300"
              >
                <option value="">Select a meal...</option>
                {mealOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea 
                placeholder="Any dietary restrictions?"
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                className="w-full px-4 py-3 rounded border border-gray-300"
                rows={3}
              />
              <button onClick={() => setStep(6)} className="w-full bg-sage text-white py-3 rounded font-bold">Continue</button>
            </div>
          )}

          {step === 6 && matchedGuest && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-center">Review & Submit</h3>
              <div className="bg-white p-4 border rounded">
                <p><strong>Name:</strong> {matchedGuest.firstName} {matchedGuest.lastName}</p>
                <p><strong>Attending:</strong> {attending ? 'Yes' : 'No'}</p>
                {attending && (
                  <>
                    <p><strong>Plus One:</strong> {plusOneName || 'None'}</p>
                    <p><strong>Meal:</strong> {mealChoice}</p>
                    <p><strong>Dietary Notes:</strong> {dietaryNotes || 'None'}</p>
                  </>
                )}
              </div>
              <input
                type="email"
                placeholder="Your email (for confirmation)"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-4 py-3 rounded border border-gray-300"
              />
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full bg-charcoal text-white py-3 rounded font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
