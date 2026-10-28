import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySitePassword } from '@/lib/server/appsync';
import { signSiteCookie, siteCookieName, SITE_COOKIE_MAX_AGE } from '@/lib/server/siteCookie';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

const Body = z.object({
  slug: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  // 10 attempts, refilling at 5 per minute, per IP.
  if (!rateLimit(`pw:${clientIp(request)}`, 10, 5)) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Please wait a minute.' }, { status: 429 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  try {
    const slug = decodeURIComponent(parsed.data.slug).toLowerCase();
    const access = await verifySitePassword(slug, parsed.data.password);
    if (!access) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    // Sign for both the requested slug and the canonical slug (they differ for custom domains).
    for (const s of Array.from(new Set([slug, access.slug.toLowerCase()]))) {
      response.cookies.set(siteCookieName(s), await signSiteCookie(s), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SITE_COOKIE_MAX_AGE,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
