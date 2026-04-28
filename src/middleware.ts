import { fetchAuthSession } from 'aws-amplify/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const authenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec);
        return session.tokens !== undefined;
      } catch (error) {
        return false;
      }
    }
  });

  if (authenticated) {
    const role = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[];
          if (groups && groups.length > 0) {
             return groups[0];
          }
          return 'admin';
        } catch (error) {
          return 'admin';
        }
      }
    });

    if (request.nextUrl.pathname.startsWith('/dashboard') && !['admin', 'planner'].includes(role || '')) {
      return NextResponse.redirect(new URL('/portal', request.url));
    }
    
    if (request.nextUrl.pathname.startsWith('/portal') && role !== 'vendor') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/portal/:path*']
};
