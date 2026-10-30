import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { appsync, getSiteAccess, internalKey, parseAwsJson } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import { siteCookieName, verifySiteCookie } from '@/lib/server/siteCookie';

const Body = z.object({
  slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
});

export interface FindSeatResult {
  enabled: boolean;
  found: boolean;
  needLastName?: boolean;
  tableName?: string | null;
  tablemates?: string[];
}

/**
 * Public "find my seat" lookup. The findSeat Lambda op needs the internal key, so browsers can't
 * skip this rate limit (deliberately tight: each lookup is a guess at a full name).
 */
export async function POST(request: Request) {
  if (!rateLimit(`find-seat:${clientIp(request)}`, 10, 5)) {
    return NextResponse.json({ error: 'Too many lookups. Please wait a minute.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please enter your first and last name.' }, { status: 400 });
  const slug = decodeURIComponent(parsed.data.slug).toLowerCase();

  try {
    const access = await getSiteAccess({ slug });
    if (!access) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    if (access.passwordProtected && !(await verifySiteCookie(access.slug, cookies().get(siteCookieName(access.slug))?.value))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await appsync<{ findSeat: unknown }>(
      `mutation FindSeat($k: String!, $slug: String!, $name: String!) {
         findSeat(internalKey: $k, slug: $slug, name: $name) }`,
      { k: internalKey(), slug: access.slug, name: parsed.data.name },
    );
    return NextResponse.json(parseAwsJson<FindSeatResult>(data.findSeat) ?? { enabled: false, found: false });
  } catch {
    return NextResponse.json({ error: 'Could not look up your seat right now.' }, { status: 500 });
  }
}
