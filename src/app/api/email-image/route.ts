import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';
import { getUrl } from 'aws-amplify/storage/server';

/**
 * Prefixes that amplify/storage/resource.ts makes guest-readable. Only these can be proxied.
 * Keep in sync with the storage access rules.
 */
const PUBLIC_PREFIXES = ['gallery/', 'story/', 'logo/', 'guestbook/', 'registry/'];

function isAllowedKey(key: string): boolean {
  if (key.length > 1024 || key.includes('..') || key.includes('\\') || key.startsWith('/')) return false;
  return PUBLIC_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length);
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
    const urlResult = await runWithAmplifyServerContext({
      nextServerContext: null,
      operation: async (contextSpec) => {
        return await getUrl(contextSpec, {
          path: key,
          options: {
            expiresIn: 900 // 15 minutes, generated fresh on every request
          }
        });
      }
    });

    // We do a temporary redirect to the fresh S3 URL
    return NextResponse.redirect(urlResult.url.toString(), 302);
  } catch (error) {
    console.error('Failed to generate presigned URL for proxy:', (error as Error)?.name);
    // Return a 404 so the image explicitly breaks instead of hanging
    return new NextResponse('Image not found or failed to load', { status: 404 });
  }
}
