/**
 * Signed site-access cookies for password-protected wedding sites.
 * Each protected site gets its own cookie: `ws_site_<slug>` = `<expiresEpochSec>.<hmacB64url>`.
 * The HMAC (SHA-256, key SITE_COOKIE_SECRET) covers `<slug>.<expires>`.
 * Uses Web Crypto so it runs in both Edge middleware and Node route handlers.
 */
export const SITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function siteCookieName(slug: string): string {
  return `ws_site_${slug.toLowerCase().replace(/[^a-z0-9-]/g, '_')}`;
}

function b64url(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(message: string): Promise<string> {
  const secret = process.env.SITE_COOKIE_SECRET;
  if (!secret || secret.length < 32) throw new Error('SITE_COOKIE_SECRET must be set (>= 32 chars)');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSiteCookie(slug: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SITE_COOKIE_MAX_AGE;
  return `${exp}.${await hmac(`${slug.toLowerCase()}.${exp}`)}`;
}

export async function verifySiteCookie(slug: string, value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [expStr, sig] = value.split('.');
  const exp = Number(expStr);
  if (!sig || !Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  try {
    return safeEqual(sig, await hmac(`${slug.toLowerCase()}.${exp}`));
  } catch {
    return false;
  }
}
