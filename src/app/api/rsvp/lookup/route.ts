import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appsync, internalKey, parseAwsJson } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

const Body = z.object({
  slug: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

/**
 * Finds an invitation by exact first and last name. Returns only RSVP-relevant fields, never
 * email or phone. Rate-limited so the guest list can't be enumerated.
 */
export async function POST(request: Request) {
  if (!rateLimit(`rsvp-lookup:${clientIp(request)}`, 15, 5)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  try {
    const data = await appsync<{ lookupRsvpGuest: unknown }>(
      `mutation Lookup($k: String!, $slug: String!, $f: String!, $l: String!) {
         lookupRsvpGuest(internalKey: $k, slug: $slug, firstName: $f, lastName: $l) }`,
      {
        k: internalKey(),
        slug: decodeURIComponent(parsed.data.slug).toLowerCase(),
        f: parsed.data.firstName,
        l: parsed.data.lastName,
      },
    );
    const result = parseAwsJson<{ found: boolean }>(data.lookupRsvpGuest) ?? { found: false };
    return NextResponse.json(result, { status: result.found ? 200 : 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to look up invitation' }, { status: 500 });
  }
}
