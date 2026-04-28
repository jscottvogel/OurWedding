'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    fetchAuthSession().then((session) => {
      if (session.tokens) {
        const groups = session.tokens.accessToken?.payload['cognito:groups'] as string[];
        if (groups?.includes('vendor')) {
          router.push('/portal');
        } else {
          router.push('/dashboard');
        }
      }
    }).catch(() => {
      // Not logged in
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border border-light-gray">
        <h1 className="text-3xl font-display text-sage text-center mb-6">OurWedding</h1>
        <Authenticator hideSignUp={true} />
      </div>
    </div>
  );
}
