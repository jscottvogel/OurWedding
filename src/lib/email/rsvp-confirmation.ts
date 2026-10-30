import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'weddingsteward.com';
const FROM_ADDRESS = process.env.SES_FROM_ADDRESS || `hello@${ROOT_DOMAIN}`;

interface RsvpEmailParams {
  toEmail: string;
  guestName: string;
  attending: boolean;
  weddingSlug: string;
  coupleNames?: string;
  /** Signed one-click unsubscribe link (see amplify/functions/shared/unsubscribe.ts). */
  unsubscribeUrl?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Sends an RSVP confirmation. Callers must resolve `toEmail` server-side from a guest record
 * (never straight from request input). Errors are swallowed so the RSVP still succeeds, and
 * recipient addresses are never logged.
 */
export async function sendRsvpConfirmationEmail({ toEmail, guestName, attending, weddingSlug, coupleNames, unsubscribeUrl }: RsvpEmailParams) {
  const name = escapeHtml(guestName || 'Guest');
  const slug = encodeURIComponent(weddingSlug);
  const siteUrl = `https://${slug}.${ROOT_DOMAIN}`;
  const signoff = coupleNames ? escapeHtml(coupleNames) : 'Wedding Steward';

  const subject = attending
    ? `We can't wait to see you! (RSVP Confirmation)`
    : `We'll miss you (RSVP Confirmation)`;

  const htmlBody = attending ? `
    <html>
      <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2>Hi ${name},</h2>
        <p>Your RSVP has been successfully received! We are so excited to celebrate with you.</p>
        <p>If you need to review details, you can visit our website anytime at
          <a href="${siteUrl}">${siteUrl}</a>.
        </p>
        <p>Cheers,</p>
        <p>${signoff}</p>
      </body>
    </html>
  ` : `
    <html>
      <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2>Hi ${name},</h2>
        <p>We've received your RSVP. We are so sorry you won't be able to make it, but we completely understand!</p>
        <p>Cheers,</p>
        <p>${signoff}</p>
      </body>
    </html>
  `;

  const footer = unsubscribeUrl
    ? `<p style="font-size:12px;color:#888;margin-top:24px;">Don't want wedding emails? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#888;">Unsubscribe</a></p>`
    : '';
  const finalHtml = footer ? htmlBody.replace('</body>', `${footer}</body>`) : htmlBody;

  const command = new SendEmailCommand({
    Source: FROM_ADDRESS,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: finalHtml } },
    },
  });

  try {
    await ses.send(command);
  } catch (error) {
    console.error("Failed to send RSVP confirmation email:", (error as Error)?.name);
  }
}
