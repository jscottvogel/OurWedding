'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { fetchAuthSession, signIn } from 'aws-amplify/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory py-12">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-light-gray">
        <h1 className="text-3xl font-display text-sage text-center mb-2">Welcome Back</h1>
        <p className="text-center text-mid-gray mb-6">Log in to manage your wedding</p>
        
        <button 
          onClick={async () => {
            try {
              toast.info('Logging into Demo Account...');
              await signIn({ username: 'demo@weddingsteward.com', password: 'DemoPassword123!' });
              setTimeout(() => {
                router.push('/dashboard');
              }, 500);
            } catch (e) {
              toast.error('Failed to access demo account');
            }
          }}
          className="w-full mb-6 bg-sage text-white py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors flex items-center justify-center shadow-sm"
        >
          Try the Live Demo
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-light-gray"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-mid-gray">Or log in</span>
          </div>
        </div>
        
        <Authenticator>
          {({ user }) => {
            if (user) {
              setTimeout(() => {
                router.push('/dashboard');
              }, 100);
              
              return (
                <div className="text-center text-sage py-8 animate-pulse">
                  <p className="font-medium">Welcome back! Redirecting to dashboard...</p>
                </div>
              );
            }
            return <></>;
          }}
        </Authenticator>
      </div>
    </div>
  );
}
