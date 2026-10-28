'use server';

import { lookup } from 'node:dns/promises';
import net from 'node:net';

const TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 1_000_000; // 1 MB
const MAX_IMAGE_BYTES = 5_000_000; // 5 MB
const MAX_REDIRECTS = 3;

export interface UrlImportResult {
  ok: boolean;
  error?: string;
  title?: string;
  sourceUrl?: string;
  imageUrl?: string;
  contentType?: string;
  /** base64 image bytes so the client can upload to its own S3 path */
  imageBase64?: string;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7));
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('ff');
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error('Invalid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Only http(s) URLs are allowed');
  if (u.username || u.password) throw new Error('Credentials in URL are not allowed');
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Non-standard ports are not allowed');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) throw new Error('Host not allowed');
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('Host not allowed');
  return u;
}

/** Fetch with SSRF checks on every redirect hop, timeout and byte cap. */
async function safeFetch(raw: string, maxBytes: number, accept: string) {
  let url = raw;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const u = await assertPublicUrl(url);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(u, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { Accept: accept, 'User-Agent': 'WeddingStewardBot/1.0 (+https://weddingsteward.com)' },
        cache: 'no-store',
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) throw new Error('Bad redirect');
        url = new URL(loc, u).toString();
        continue;
      }
      if (!res.ok || !res.body) throw new Error(`Fetch failed (${res.status})`);
      const len = Number(res.headers.get('content-length') || 0);
      if (len > maxBytes) throw new Error('Response too large');
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) { await reader.cancel(); throw new Error('Response too large'); }
        chunks.push(value);
      }
      return { url: u.toString(), contentType: res.headers.get('content-type') || '', bytes: Buffer.concat(chunks) };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('Too many redirects');
}

function metaContent(html: string, prop: string): string | undefined {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  const c = tag?.match(/content=["']([^"']+)["']/i)?.[1];
  return c?.replace(/&amp;/g, '&').trim();
}

/**
 * Import an inspiration image from a URL (Pinterest pin, blog post, or direct image).
 * Resolves og:image / twitter:image, then downloads the image (<=5 MB) so the client
 * can store it in S3. SSRF protections: http(s) only, standard ports, DNS resolution
 * checked against private/reserved ranges on every redirect, 8s timeout, size caps.
 */
export async function importImageFromUrl(url: string): Promise<UrlImportResult> {
  try {
    if (typeof url !== 'string' || url.length > 2048) throw new Error('Invalid URL');
    const page = await safeFetch(url.trim(), MAX_HTML_BYTES, 'text/html,image/*;q=0.9,*/*;q=0.5');
    let imageUrl = page.url;
    let title: string | undefined;
    let image = page;

    if (!page.contentType.startsWith('image/')) {
      const html = page.bytes.toString('utf8');
      const og = metaContent(html, 'og:image') || metaContent(html, 'og:image:url') || metaContent(html, 'twitter:image');
      if (!og) throw new Error('No preview image found on that page');
      title = metaContent(html, 'og:title') || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
      imageUrl = new URL(og, page.url).toString();
      image = await safeFetch(imageUrl, MAX_IMAGE_BYTES, 'image/*');
    }
    const contentType = image.contentType.split(';')[0].trim();
    if (!/^image\/(jpeg|png|gif|webp|avif)$/.test(contentType)) throw new Error('Unsupported image type');

    return {
      ok: true,
      title: title?.slice(0, 200),
      sourceUrl: url,
      imageUrl,
      contentType,
      imageBase64: image.bytes.toString('base64'),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Import failed' };
  }
}
