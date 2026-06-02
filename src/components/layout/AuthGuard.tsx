'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Component that protects routes by enforcing authentication and role-based access control (RBAC).
 * 
 * If a user is not authenticated, they are redirected to `/login`.
 * If a user lacks a role, they are redirected to `/onboarding`.
 * If a user does not have a role included in `allowedRoles`, they are redirected:
 * - 'vendor' roles are redirected to `/portal`.
 * - All other unauthorized roles are redirected to `/` (home).
 *
 * @param props.children - The child components that are protected by this guard.
 * @param props.allowedRoles - An array of role strings (e.g., 'admin', 'planner', 'vendor') authorized to access the route.
 * @returns The protected components if authorized, null during redirection, or a loading state.
 */
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
