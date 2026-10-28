import { fetchAuthSession } from 'aws-amplify/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';
import { getSiteAccess } from '@/lib/server/appsync';
import { siteCookieName, verifySiteCookie } from '@/lib/server/siteCookie';

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'weddingsteward.com').toLowerCase();

function isPlatformHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host.endsWith('.amplifyapp.com') ||
    host === '127.0.0.1'
  );
}

/** Enforce the site password for /w/<slug>/... Fails closed if the lookup errors. */
async function enforceSitePassword(request: NextRequest, slug: string, rest: string, rewriteTo?: URL) {
  const pass = () => (rewriteTo ? NextResponse.rewrite(rewriteTo) : NextResponse.next());
  if (rest.startsWith('/password')) return pass();
  const toPassword = () => NextResponse.redirect(new URL(`/w/${encodeURIComponent(slug)}/password`, request.url));
  try {
    const access = await getSiteAccess({ slug });
    if (!access) return pass(); // unknown slug: the page renders its own 404
    if (!access.passwordProtected) return pass();
    const ok =
      (await verifySiteCookie(slug, request.cookies.get(siteCookieName(slug))?.value)) ||
      (await verifySiteCookie(access.slug, request.cookies.get(siteCookieName(access.slug))?.value));
    return ok ? pass() : toPassword();
  } catch {
    return toPassword();
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];

  // 1. Subdomain of the root domain (e.g. sarahandtom.weddingsteward.com)
  if (host.endsWith(`.${ROOT_DOMAIN}`) && host !== `www.${ROOT_DOMAIN}`) {
    const slug = host.slice(0, -(ROOT_DOMAIN.length + 1));
    return enforceSitePassword(request, slug, url.pathname, new URL(`/w/${slug}${url.pathname}`, request.url));
  }

  // 2. Custom domain: resolved by full hostname via WebsiteConfig.customDomain
  if (host && !isPlatformHost(host)) {
    try {
      const access = await getSiteAccess({ host });
      if (!access) return new NextResponse('Not found', { status: 404 });
      return enforceSitePassword(request, access.slug, url.pathname, new URL(`/w/${access.slug}${url.pathname}`, request.url));
    } catch {
      return new NextResponse('Service unavailable', { status: 503 });
    }
  }

  // 3. Public wedding sites on the platform host
  const siteMatch = url.pathname.match(/^\/w\/([^/]+)(\/.*)?$/);
  if (siteMatch) {
    return enforceSitePassword(request, decodeURIComponent(siteMatch[1]), siteMatch[2] || '');
  }

  // 4. Auth protection for dashboard and portal: deny by default
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/portal')) {
    const response = NextResponse.next();
    const groups = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          if (!session.tokens) return null;
          const g = session.tokens.accessToken?.payload['cognito:groups'];
          return Array.isArray(g) ? (g as string[]) : [];
        } catch {
          return null;
        }
      },
    });

    if (groups === null) return NextResponse.redirect(new URL('/login', request.url));

    const isPlanner = groups.includes('admin') || groups.includes('planner');
    const isVendor = groups.includes('vendor');

    if (url.pathname.startsWith('/dashboard')) {
      if (isPlanner) return response;
      return NextResponse.redirect(new URL(isVendor ? '/portal' : '/login', request.url));
    }
    if (isVendor) return response;
    return NextResponse.redirect(new URL(isPlanner ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
