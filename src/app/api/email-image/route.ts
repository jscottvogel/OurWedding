import { NextRequest, NextResponse } from 'next/server';
import { runWithAmplifyServerContext } from '@/lib/amplify/server';
import { getUrl } from 'aws-amplify/storage/server';

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return new NextResponse('Missing key parameter', { status: 400 });
  }

  try {
    const urlResult = await runWithAmplifyServerContext({
      nextServerContext: { request, response: new NextResponse() },
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
    console.error('Failed to generate presigned URL for proxy:', error);
    // Return a 404 so the image explicitly breaks instead of hanging
    return new NextResponse('Image not found or failed to load', { status: 404 });
  }
}
