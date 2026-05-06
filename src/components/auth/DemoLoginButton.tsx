'use client';

import { signIn } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DemoLoginButton() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleDemoLogin = async () => {
    setIsLoggingIn(true);
    try {
      toast.info('Logging into Demo Account...');
      await signIn({ username: 'demo@weddingsteward.com', password: 'DemoPassword123!' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (e) {
      console.error(e);
      toast.error('Failed to access demo account');
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
