'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const handleAccept = () => {
    // Logic to confirm sign up with Cognito using token goes here
    router.push('/login');
  };

  return (
    <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-light-gray">
      <h1 className="text-3xl font-display text-sage font-bold text-center mb-2">Welcome!</h1>
      <p className="text-center text-mid-gray mb-6">Set your password to join Wedding Steward</p>
      
      {!token ? (
        <div className="bg-red-50 text-red-600 p-4 rounded text-sm">
          Invalid or missing invitation token.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" className="w-full border p-2 rounded" />
          </div>
          <button 
            onClick={handleAccept}
            className="w-full bg-sage text-white px-6 py-2 rounded font-medium hover:bg-dark-sage transition-colors"
          >
            Accept & Join
          </button>
        </div>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <Suspense fallback={<div>Loading...</div>}>
        <InviteForm />
      </Suspense>
    </div>
  );
}
