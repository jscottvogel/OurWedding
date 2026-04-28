'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!role) {
        router.push('/onboarding');
      } else if (!allowedRoles.includes(role)) {
        if (role === 'vendor') router.push('/portal');
        else router.push('/');
      }
    }
  }, [user, role, loading, router, allowedRoles]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return null;
}
