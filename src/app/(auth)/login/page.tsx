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
        router: {
          boxShadow: { value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
          borderWidth: { value: '1px' },
          borderColor: { value: '#E5E7EB' },
          backgroundColor: { value: '#FFFFFF' },
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

const components = {
  Header() {
    return (
      <div className="text-center pt-10 pb-4 px-8">
        <h1 className="text-3xl font-display text-sage mb-2">Welcome Back</h1>
        <p className="text-mid-gray">Log in to manage your wedding</p>
      </div>
    );
  },
};

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory py-12 px-4">
      <div className="w-full max-w-[480px]">
        <ThemeProvider theme={theme}>
          <Authenticator components={components}>
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
  );
}
