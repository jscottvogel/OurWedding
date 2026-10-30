import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appsync, internalKey } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

const Body = z.object({ token: z.string().min(10).max(300) });

/** One-click unsubscribe from the signed link in every guest email. */
export async function POST(request: Request) {
  if (!rateLimit(`unsubscribe:${clientIp(request)}`, 10, 5)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  try {
    await appsync<{ unsubscribeGuest: boolean }>(
      `mutation Unsub($k: String!, $token: String!) { unsubscribeGuest(internalKey: $k, token: $token) }`,
      { k: internalKey(), token: parsed.data.token },
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    const invalid = /invalid/i.test((err as Error)?.message || '');
    return NextResponse.json(
      { error: invalid ? 'This unsubscribe link is invalid.' : 'Could not unsubscribe right now.' },
      { status: invalid ? 400 : 500 },
    );
  }
}
