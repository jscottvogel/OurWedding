'use client';

import { signIn, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DemoLoginButton() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (process.env.NEXT_PUBLIC_DEMO_ENABLED !== 'true') return null;

  const handleDemoLogin = async () => {
    setIsLoggingIn(true);
    try {
      toast.info('Logging into Demo Account...');
      const res = await fetch('/api/demo/login', { method: 'POST' });
      if (!res.ok) throw new Error('Demo is currently unavailable');
      const { username, password } = await res.json();
      try { await signOut(); } catch (e) { /* ignore */ }
      await signIn({ username, password });
      router.push('/dashboard');
    } catch (e: any) {
      toast.error(`Failed to access demo account: ${e.message || 'Unknown error'}`);
      setIsLoggingIn(false);
    }
  };

  return (
    <button 
      onClick={handleDemoLogin}
      disabled={isLoggingIn}
      className="w-full sm:w-auto bg-white text-charcoal border border-light-gray px-8 py-4 rounded-full text-lg font-medium shadow-sm hover:bg-off-white hover:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoggingIn ? 'Logging in...' : 'View Demo'}
    </button>
  );
}
