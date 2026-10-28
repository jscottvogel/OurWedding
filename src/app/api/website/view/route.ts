import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appsync, internalKey } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

const Body = z.object({ slug: z.string().trim().min(1).max(100) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

  // One counted view per IP per site roughly every 30 minutes; extra calls are silently ignored.
  if (!rateLimit(`view:${clientIp(request)}:${parsed.data.slug}`, 1, 1 / 30)) {
    return NextResponse.json({ success: true });
  }

  try {
    await appsync(
      `mutation View($k: String!, $slug: String!) { recordSiteView(internalKey: $k, slug: $slug) }`,
      { k: internalKey(), slug: decodeURIComponent(parsed.data.slug).toLowerCase() },
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
