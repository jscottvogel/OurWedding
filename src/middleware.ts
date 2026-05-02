import { fetchAuthSession } from 'aws-amplify/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Custom Domain & Subdomain Routing for Public Sites
  const isAppDomain = hostname.includes('localhost') || hostname === 'weddingsteward.com' || hostname.startsWith('app.');
  
  if (!isAppDomain) {
    // It's a custom domain or a subdomain (e.g. sarah-tom.weddingsteward.com)
    let slug = hostname.replace('.weddingsteward.com', '');
    
    // In a full implementation, if it's a custom domain (e.g. sarahandtom.com),
    // you would fetch the DB here to find the matching subdomain/slug.
    // For this MVP, we pass the slug directly.
    
    // Rewrite the URL to the /[slug] dynamic route
    return NextResponse.rewrite(new URL(`/${slug}${url.pathname}`, request.url));
  }

  // 2. Auth Protection for Dashboard and Portal
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/portal')) {
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

      if (url.pathname.startsWith('/dashboard') && !['admin', 'planner'].includes(role || '')) {
        return NextResponse.redirect(new URL('/portal', request.url));
      }
      
      if (url.pathname.startsWith('/portal') && role !== 'vendor') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return response;
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Allow all other routes (like /login, /signup, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
