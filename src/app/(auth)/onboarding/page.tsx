'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import { updateUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../../../../../amplify/data/resource';

const client = generateClient<Schema>();

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    coupleName1: '',
    coupleName2: '',
    weddingDate: '',
    venueName: '',
    budgetTotal: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsLoading(true);
    try {
      // Create the Wedding record
      const { data: newWedding, errors } = await client.models.Wedding.create({
        slug: `wedding-${Date.now()}`,
        coupleName1: formData.coupleName1 || 'Partner 1',
        coupleName2: formData.coupleName2 || 'Partner 2',
        weddingDate: formData.weddingDate || new Date().toISOString().split('T')[0],
        venueName: formData.venueName || undefined,
        budgetTotal: formData.budgetTotal ? parseFloat(formData.budgetTotal) : undefined,
        isActive: true
      });

      if (errors || !newWedding) {
        throw new Error('Failed to create wedding record');
      }

      // Link it to the user's Cognito attributes
      await updateUserAttributes({
        userAttributes: {
          'custom:wedding_id': newWedding.id,
        },
      });

      // Force a token refresh so the new custom attribute is available immediately on dashboard
      const { fetchAuthSession } = await import('aws-amplify/auth');
      await fetchAuthSession({ forceRefresh: true });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save wedding. Please try again.');
      setIsLoading(false);
    }
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
              <input type="text" name="coupleName1" value={formData.coupleName1} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Partner 2 Name</label>
              <input type="text" name="coupleName2" value={formData.coupleName2} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wedding Date</label>
              <input type="date" name="weddingDate" value={formData.weddingDate} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Venue Name</label>
              <input type="text" name="venueName" value={formData.venueName} onChange={handleChange} className="w-full border p-2 rounded" />
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
              <input type="number" name="budgetTotal" value={formData.budgetTotal} onChange={handleChange} className="w-full border p-2 rounded" placeholder="$0.00" />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleNext}
            disabled={isLoading}
            className="bg-sage text-white px-6 py-2 rounded font-medium hover:bg-dark-sage transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : step === 3 ? 'Complete Setup' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
