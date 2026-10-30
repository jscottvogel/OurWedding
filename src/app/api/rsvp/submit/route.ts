import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appsync, internalKey, parseAwsJson } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';
import { sendRsvpConfirmationEmail } from '@/lib/email/rsvp-confirmation';
import { unsubscribeUrl } from '../../../../../amplify/functions/shared/unsubscribe';

const optStr = (max: number) => z.string().trim().max(max).optional().nullable();

const PartyMember = z.object({
  id: z.string().max(100).optional().nullable(),
  firstName: z.string().trim().max(100),
  lastName: optStr(100),
  attending: z.boolean().nullable(),
  mealChoice: optStr(200),
  dietaryOther: optStr(1000),
  tags: optStr(1000),
});

const Body = z.object({
  weddingSlug: z.string().trim().min(1).max(100),
  guestId: z.string().min(1).max(100),
  attending: z.boolean(),
  mealChoice: optStr(200),
  dietaryOther: optStr(1000),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional().nullable(),
  phone: optStr(40),
  tags: optStr(1000),
  partyMembers: z.array(PartyMember).max(20).optional(),
});

interface SubmitResult {
  success: boolean;
  attending: boolean;
  guestName: string;
  guestId?: string;
  /** null when there's no address on file or the guest has unsubscribed. */
  confirmationEmail: string | null;
  coupleNames: string;
  siteSlug: string;
}

export async function POST(request: Request) {
  if (!rateLimit(`rsvp-submit:${clientIp(request)}`, 5, 2)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid RSVP', issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  }
  const { weddingSlug, ...payload } = parsed.data;

  let result: SubmitResult | null;
  try {
    const data = await appsync<{ submitRsvp: unknown }>(
      `mutation Submit($k: String!, $slug: String!, $payload: AWSJSON!) {
         submitRsvp(internalKey: $k, slug: $slug, payload: $payload) }`,
      {
        k: internalKey(),
        slug: decodeURIComponent(weddingSlug).toLowerCase(),
        payload: JSON.stringify({ ...payload, email: payload.email || undefined }),
      },
    );
    result = parseAwsJson<SubmitResult>(data.submitRsvp);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    // Errors raised on purpose by the Lambda (guest not found, deadline passed...) are safe to show.
    const userFacing = /not found|deadline|allows|required|too long|invalid/i.test(message);
    return NextResponse.json(
      { error: userFacing ? message : 'Failed to process RSVP' },
      { status: userFacing ? 400 : 500 },
    );
  }

  // Only email an address tied to a guest record of this wedding (resolved server-side).
  if (result?.confirmationEmail) {
    await sendRsvpConfirmationEmail({
      toEmail: result.confirmationEmail,
      guestName: result.guestName,
      attending: result.attending,
      weddingSlug: result.siteSlug,
      coupleNames: result.coupleNames,
      unsubscribeUrl: result.guestId ? safeUnsubscribeUrl(result.guestId) : undefined,
    });
  }

  return NextResponse.json({ success: true });
}

function safeUnsubscribeUrl(guestId: string): string | undefined {
  try {
    return unsubscribeUrl(guestId, (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'weddingsteward.com').toLowerCase());
  } catch {
    return undefined; // INTERNAL_API_SECRET missing: send without the link rather than fail the RSVP
  }
}
