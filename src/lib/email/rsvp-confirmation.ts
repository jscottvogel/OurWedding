import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface RsvpEmailParams {
  toEmail: string;
  guestName: string;
  attending: boolean;
  weddingSlug: string;
}

export async function sendRsvpConfirmationEmail({ toEmail, guestName, attending, weddingSlug }: RsvpEmailParams) {
  const subject = attending 
    ? `We can't wait to see you! (RSVP Confirmation)` 
    : `We'll miss you (RSVP Confirmation)`;

  const htmlBody = attending ? `
    <html>
      <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2>Hi ${guestName},</h2>
        <p>Your RSVP has been successfully received! We are so excited to celebrate with you.</p>
        <p>If you need to review details, you can visit our website anytime at 
          <a href="https://${weddingSlug}.weddingsteward.com">https://${weddingSlug}.weddingsteward.com</a>.
        </p>
        <p>Cheers,</p>
        <p>Wedding Steward</p>
      </body>
    </html>
  ` : `
    <html>
      <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2>Hi ${guestName},</h2>
        <p>We've received your RSVP. We are so sorry you won't be able to make it, but we completely understand!</p>
        <p>Cheers,</p>
        <p>Wedding Steward</p>
      </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: "hello@weddingsteward.com",
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: htmlBody,
        },
      },
    },
  });

  try {
    await ses.send(command);
    console.log(`Confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    // In production, you might not want to throw here so the RSVP still completes
  }
}
