import { NextRequest, NextResponse } from 'next/server';
import { appsync } from '@/lib/server/appsync';
import { LEGACY_PUBLIC_PREFIXES, parseKey } from '../../../../amplify/functions/shared/storage-keys';

/**
 * Stable image URL for emails: /api/email-image?key=... redirects to a fresh presigned S3 URL.
 * Only public files can be proxied (weddings/{id}/public/... or, until the key migration is
 * finished, the legacy guest-readable prefixes). The storage-access Lambda re-checks this with
 * API-key (anonymous) auth, so private files are never reachable here.
 */
function isAllowedKey(key: string): boolean {
  if (key.length > 1024 || key.includes('..') || key.includes('\\') || key.startsWith('/')) return false;
  const parsed = parseKey(key);
  if (parsed) return parsed.visibility === 'public';
  return LEGACY_PUBLIC_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length);
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return new NextResponse('Missing key parameter', { status: 400 });
  }
  if (!isAllowedKey(key)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const data = await appsync<{ getFileUrl: string | null }>(
      `query EmailImage($key: String!) { getFileUrl(key: $key) }`,
      { key },
    );
    if (!data.getFileUrl) return new NextResponse('Image not found', { status: 404 });
    // Temporary redirect to the fresh S3 URL
    return NextResponse.redirect(data.getFileUrl, 302);
  } catch (error) {
    console.error('Failed to generate presigned URL for proxy:', (error as Error)?.name);
    // Return a 404 so the image explicitly breaks instead of hanging
    return new NextResponse('Image not found or failed to load', { status: 404 });
  }
}
