import { NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

/**
 * Hands out the demo account credentials only when DEMO_ENABLED=true, so they are never
 * bundled into client JS. Tradeoff: the demo password is still public to anyone who calls
 * this route while demo mode is on. The demo user only owns the demo wedding, and
 * reset-demo restores that wedding.
 */
export async function POST(request: Request) {
  if (process.env.DEMO_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!rateLimit(`demo:${clientIp(request)}`, 5, 5)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const username = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!username || !password) {
    return NextResponse.json({ error: 'Demo is not configured' }, { status: 503 });
  }
  return NextResponse.json({ username, password }, { headers: { 'cache-control': 'no-store' } });
}
