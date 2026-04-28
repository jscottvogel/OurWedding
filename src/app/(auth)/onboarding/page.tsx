'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else router.push('/dashboard'); // Finish onboarding
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-display text-sage mb-2 text-center">Let's set up your wedding</h1>
        <p className="text-mid-gray text-center mb-8">Step {step} of 3</p>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Partner 1 Name</label>
              <input type="text" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Partner 2 Name</label>
              <input type="text" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wedding Date</label>
              <input type="date" className="w-full border p-2 rounded" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Venue Name</label>
              <input type="text" className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hero Image</label>
              <input type="file" className="w-full border p-2 rounded" accept="image/*" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total Budget</label>
              <input type="number" className="w-full border p-2 rounded" placeholder="$0.00" />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleNext}
            className="bg-sage text-white px-6 py-2 rounded font-medium hover:bg-dark-sage transition-colors"
          >
            {step === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
