import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed unsubscribe tokens: `<guestId>.<hmacB64url>` where the HMAC (SHA-256) covers
 * `unsubscribe:<guestId>`, keyed with INTERNAL_API_SECRET (the existing server-only secret shared
 * by the Next.js server and the Lambdas; the `unsubscribe:` prefix keeps it domain-separated).
 * Tokens don't expire: an unsubscribe link must keep working. Mirrors src/lib/server/unsubscribe.ts.
 */
const PREFIX = 'unsubscribe:';

function sign(guestId: string, secret: string): string {
  return createHmac('sha256', secret).update(`${PREFIX}${guestId}`).digest('base64url');
}

export function makeUnsubscribeToken(guestId: string, secret = process.env.INTERNAL_API_SECRET || ''): string {
  if (!secret) throw new Error('INTERNAL_API_SECRET is not set');
  return `${guestId}.${sign(guestId, secret)}`;
}

/** Returns the guestId when the token is valid, otherwise null. */
export function verifyUnsubscribeToken(token: string, secret = process.env.INTERNAL_API_SECRET || ''): string | null {
  if (!secret || typeof token !== 'string' || token.length > 300) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const guestId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(guestId, secret));
  return given.length === expected.length && timingSafeEqual(given, expected) ? guestId : null;
}

export function unsubscribeUrl(guestId: string, rootDomain: string): string {
  return `https://www.${rootDomain}/unsubscribe?token=${encodeURIComponent(makeUnsubscribeToken(guestId))}`;
}

export function unsubscribeFooterHtml(url: string): string {
  return `<div style="text-align:center;font-family:sans-serif;font-size:12px;color:#888;padding:16px 8px;">` +
    `You're receiving this because you're on a wedding guest list. ` +
    `<a href="${url}" style="color:#888;text-decoration:underline;">Unsubscribe</a></div>`;
}
