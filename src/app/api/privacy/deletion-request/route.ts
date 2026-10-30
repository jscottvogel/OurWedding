import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { appsync, internalKey, parseAwsJson } from '@/lib/server/appsync';
import { clientIp, rateLimit } from '@/lib/server/rateLimit';

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'weddingsteward.com';
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS || `hello@${ROOT_DOMAIN}`;

const Body = z.object({
  slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254),
  message: z.string().trim().max(2000).optional(),
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Guest asks the couple to delete their data. We email the couple (the data controllers); they
 * use "Delete guest and all data" in the dashboard. Recipient addresses never reach the browser.
 */
export async function POST(request: Request) {
  if (!rateLimit(`deletion-request:${clientIp(request)}`, 3, 1)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please enter your name and a valid email.' }, { status: 400 });
  const { name, email, message } = parsed.data;
  const slug = decodeURIComponent(parsed.data.slug).toLowerCase();

  let info: { recipients: string[]; coupleNames: string } | null;
  try {
    const data = await appsync<{ requestDataDeletion: unknown }>(
      `mutation Del($k: String!, $slug: String!) { requestDataDeletion(internalKey: $k, slug: $slug) }`,
      { k: internalKey(), slug },
    );
    info = parseAwsJson(data.requestDataDeletion);
  } catch {
    return NextResponse.json({ error: 'Could not send your request right now.' }, { status: 500 });
  }
  if (!info?.recipients?.length) {
    return NextResponse.json({ error: "We couldn't reach the couple automatically. Please contact them directly." }, { status: 422 });
  }

  const html = `<html><body style="font-family:sans-serif;color:#333;line-height:1.6;">
    <h2>Data deletion request</h2>
    <p>A guest has asked you to delete the personal data held about them for your wedding website.</p>
    <p><strong>Name:</strong> ${esc(name)}<br/><strong>Email:</strong> ${esc(email)}</p>
    ${message ? `<p><strong>Message:</strong><br/>${esc(message).replace(/\n/g, '<br/>')}</p>` : ''}
    <p>To remove them, open <em>Guests</em> in your Wedding Steward dashboard, find the guest and choose
    <em>Delete guest and all data</em>. This removes the guest, their plus-ones and their guestbook entries.
    Please reply to the guest once done.</p>
  </body></html>`;

  try {
    await ses.send(new SendEmailCommand({
      Source: FROM_ADDRESS,
      Destination: { ToAddresses: info.recipients.slice(0, 10) },
      ReplyToAddresses: [email],
      Message: {
        Subject: { Data: `Data deletion request from ${name.slice(0, 80)}` },
        Body: { Html: { Data: html } },
      },
    }));
  } catch (error) {
    console.error('Failed to send deletion request email:', (error as Error)?.name);
    return NextResponse.json({ error: 'Could not send your request right now.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
