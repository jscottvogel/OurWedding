'use client';

import { Authenticator, ThemeProvider, Theme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const theme: Theme = {
  name: 'wedding-steward-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: '#D4E6D6' },
          20: { value: '#D4E6D6' },
          40: { value: '#6B8F71' },
          60: { value: '#6B8F71' },
          80: { value: '#6B8F71' },
          90: { value: '#4A6B50' },
          100: { value: '#4A6B50' },
        },
      },
      font: {
        interactive: { value: '#6B8F71' },
      },
    },
    components: {
      authenticator: {
        container: {
          width: { value: '100%' },
          maxWidth: { value: '100%' },
        },
        router: {
          width: { value: '100%' },
          maxWidth: { value: '100%' },
          boxShadow: { value: 'none' },
          borderWidth: { value: '0' },
          backgroundColor: { value: 'transparent' },
        },
      },
      tabs: {
        item: {
          _active: {
            color: { value: '#6B8F71' },
            borderColor: { value: '#6B8F71' },
          },
          _hover: {
            color: { value: '#6B8F71' },
          },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: '#6B8F71' },
          _hover: { backgroundColor: { value: '#4A6B50' } },
        },
        link: {
          color: { value: '#6B8F71' },
          _hover: { backgroundColor: { value: 'transparent' }, color: { value: '#4A6B50' } },
        },
      },
      fieldcontrol: {
        _focus: {
          boxShadow: { value: '0 0 0 1px #6B8F71' },
          borderColor: { value: '#6B8F71' },
        },
      },
    },
  },
};

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory py-12 px-4">
      <div className="w-full max-w-[480px] p-6 sm:p-8 bg-white shadow-xl rounded-2xl border border-light-gray">
        <h1 className="text-3xl font-display text-sage text-center mb-2">Welcome Back</h1>
        <p className="text-center text-mid-gray mb-6">Log in to manage your wedding</p>
        
        <div className="login-authenticator-wrapper w-full overflow-hidden [&_[data-amplify-authenticator]]:!w-full [&_[data-amplify-authenticator]]:!max-w-full [&_[data-amplify-router]]:!p-0 [&_[data-amplify-router]]:!m-0 [&_[data-amplify-router]]:!border-none [&_[data-amplify-router]]:!shadow-none [&_[data-amplify-router]]:!bg-transparent [&_form]:!w-full [&_form]:!max-w-full">
          <ThemeProvider theme={theme}>
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
          </ThemeProvider>
        </div>
      </div>
    </div>
  );
}
