import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { appsync, getSiteAccess, internalKey } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import { siteCookieName, verifySiteCookie } from '@/lib/server/siteCookie';

const Body = z.object({
  slug: z.string().trim().min(1).max(100),
  kind: z.enum(['gallery', 'guestbook']),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().max(100).optional(),
});

/**
 * Guest uploads from a public wedding site (gallery QR page, guestbook). Returns a presigned POST
 * for weddings/{id}/public/{kind}/... minted by the storage-access Lambda, which also checks the
 * site is published and the file is an image within the size limit. The internal key keeps
 * browsers from calling createGuestUploadUrl directly, so this rate limit can't be bypassed.
 */
export async function POST(request: Request) {
  if (!rateLimit(`guest-upload:${clientIp(request)}`, 20, 10)) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const slug = decodeURIComponent(parsed.data.slug).toLowerCase();

  try {
    // Password-protected sites: the guest must already hold that site's access cookie.
    const access = await getSiteAccess({ slug });
    if (!access) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    if (access.passwordProtected && !(await verifySiteCookie(access.slug, cookies().get(siteCookieName(access.slug))?.value))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await appsync<{ createGuestUploadUrl: unknown }>(
      `mutation GuestUpload($k: String!, $slug: String!, $kind: String!, $fileName: String!, $contentType: String) {
         createGuestUploadUrl(internalKey: $k, slug: $slug, kind: $kind, fileName: $fileName, contentType: $contentType) {
           key url fields contentType maxBytes expiresAt } }`,
      { k: internalKey(), slug, kind: parsed.data.kind, fileName: parsed.data.fileName, contentType: parsed.data.contentType },
    );
    return NextResponse.json(data.createGuestUploadUrl);
  } catch (err) {
    const message = (err as Error)?.message || '';
    // Validation messages from the Lambda (file type, unpublished site) are safe to show.
    if (/not allowed|not open|not found|Invalid/i.test(message)) return NextResponse.json({ error: message }, { status: 400 });
    return NextResponse.json({ error: 'Failed to prepare upload' }, { status: 500 });
  }
}
