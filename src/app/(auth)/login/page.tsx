'use client';

import { Authenticator, ThemeProvider, Theme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { fetchAuthSession, signIn } from 'aws-amplify/auth';
import { toast } from 'sonner';

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
        
        <div className="login-authenticator-wrapper w-full">
          <style dangerouslySetInnerHTML={{__html: `
            .login-authenticator-wrapper [data-amplify-authenticator] {
              width: 100% !important;
              min-width: 0 !important;
            }
            .login-authenticator-wrapper [data-amplify-router] {
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              min-width: 0 !important;
            }
          `}} />
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
