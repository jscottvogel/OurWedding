'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory py-12">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-light-gray">
        <h1 className="text-3xl font-display text-sage text-center mb-2">Welcome Back</h1>
        <p className="text-center text-mid-gray mb-6">Log in to manage your wedding</p>
        
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
            return null;
          }}
        </Authenticator>
      </div>
    </div>
  );
}
