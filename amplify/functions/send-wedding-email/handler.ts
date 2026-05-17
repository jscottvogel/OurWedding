import type { AppSyncResolverHandler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { renderEmailHtml, EmailType, PaletteKey, WeddingEmailData } from './templates';
import type { Schema } from '../../data/resource';
import { randomUUID } from 'crypto';

const sesClient = new SESClient({ region: process.env.SES_REGION || 'us-east-1' });
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: AppSyncResolverHandler<
  { 
    campaignId: string; 
    recipientEmails?: string[]; 
    guestIds?: string[]; 
    emailType: string; 
    subjectLine: string; 
    paletteKey: string; 
    personalNote?: string; 
    customContent?: string;
    isTest?: boolean;
  }, 
  any
> = async (event) => {
  const { 
    campaignId, 
    recipientEmails = [], 
    guestIds = [], 
    emailType, 
    subjectLine, 
    paletteKey, 
    personalNote, 
    customContent,
    isTest 
  } = event.arguments;

  const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'hello@weddingsteward.com';
  const FROM_NAME = process.env.SES_FROM_NAME || 'Wedding Steward';
  const TABLE_WEDDING = process.env.TABLE_WEDDING;
  const TABLE_CAMPAIGN = process.env.TABLE_EMAIL_CAMPAIGN;
  const TABLE_SEND_RECORD = process.env.TABLE_EMAIL_SEND_RECORD;

  if (!TABLE_CAMPAIGN || !TABLE_WEDDING || !TABLE_SEND_RECORD) {
    throw new Error('Missing DynamoDB table environment variables.');
  }

  // 1. Get Campaign
  const campaignResult = await docClient.send(new GetCommand({
    TableName: TABLE_CAMPAIGN,
    Key: { id: campaignId }
  }));
  const campaign = campaignResult.Item;
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }
  const weddingId = campaign.weddingId;

  // 2. Get Wedding
  const weddingResult = await docClient.send(new GetCommand({
    TableName: TABLE_WEDDING,
    Key: { id: weddingId }
  }));
  const wedding = weddingResult.Item;
  if (!wedding) {
    throw new Error(`Wedding ${weddingId} not found`);
  }

  function formatDate(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const isDateOnly = dateStr.length <= 10 || !dateStr.includes('T');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: isDateOnly ? 'UTC' : undefined
      });
    } catch {
      return dateStr;
    }
  }

  function formatTime(timeStr?: string): string | undefined {
    if (!timeStr) return undefined;
    try {
      // timeStr is usually "HH:mm" or "HH:mm:ss"
      const [hourStr, minStr] = timeStr.split(':');
      let hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${min.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  }

  // Prepare template data
  const weddingData: WeddingEmailData = {
    coupleName1: wedding.coupleName1,
    coupleName2: wedding.coupleName2,
    date: formatDate(wedding.weddingDate),
    time: formatTime(wedding.weddingTime),
    venue: wedding.venueName,
    websiteUrl: wedding.websiteEnabled ? `https://${wedding.slug}.weddingsteward.com` : undefined, // simplified
    rsvpDate: formatDate(wedding.rsvpDeadline),
  };

  const htmlBody = renderEmailHtml({
    emailType: emailType as EmailType,
    weddingData,
    paletteKey: paletteKey as PaletteKey,
    personalNote: personalNote ?? undefined,
    customContent: customContent ?? undefined
  });

  // 3. Collect all unique recipients
  const recipientsToProcess: { email: string; guestId?: string; name?: string }[] = [];
  
  // Add explicit emails
  for (const email of recipientEmails) {
    if (email) {
      recipientsToProcess.push({ email });
    }
  }

  // (Optional) If guestIds are provided, we would fetch them. 
  // For simplicity, we assume frontend passes all emails via recipientEmails, 
  // but if we needed to query guests we'd do it here. 
  // Let's assume frontend passes both the guest email in recipientEmails and the guestId mapped, 
  // or we just use recipientEmails for the sends.
  // Actually, to fully support guestIds:
  // if (guestIds.length > 0) { ... fetch from Guests table ... }
  // To keep this MVP robust without too many table grants, we'll rely on recipientEmails.

  // Dedup by email
  const uniqueRecipients = Array.from(new Map(recipientsToProcess.map(r => [r.email.toLowerCase(), r])).values());

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // 4. Send emails and record
  for (const recipient of uniqueRecipients) {
    const recordId = randomUUID();
    let sesMessageId = undefined;
    let status = 'queued';
    let errorMessage = undefined;

    try {
      const sendCommand = new SendEmailCommand({
        Source: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        Destination: {
          ToAddresses: [recipient.email],
        },
        Message: {
          Subject: { Data: subjectLine, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' }
          }
        }
      });

      const response = await sesClient.send(sendCommand);
      sesMessageId = response.MessageId;
      status = 'sent';
      sentCount++;
    } catch (e: any) {
      console.error(`Failed to send email to ${recipient.email}:`, e);
      status = 'failed';
      errorMessage = e.message;
      failedCount++;
      errors.push(`Failed for ${recipient.email}: ${e.message}`);
    }

    // Insert send record
    if (!isTest) {
      await docClient.send(new PutCommand({
        TableName: TABLE_SEND_RECORD,
        Item: {
          id: recordId,
          campaignId,
          weddingId,
          recipientEmail: recipient.email,
          guestId: recipient.guestId || null,
          recipientName: recipient.name || null,
          status,
          sesMessageId: sesMessageId || null,
          errorMessage: errorMessage || null,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }));
    }
  }

  // 5. Update Campaign Status
  if (!isTest) {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_CAMPAIGN,
      Key: { id: campaignId },
      UpdateExpression: 'SET #st = :status, sentCount = :sentCount, failedCount = :failedCount, sentAt = :sentAt',
      ExpressionAttributeNames: {
        '#st': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'sent',
        ':sentCount': (campaign.sentCount || 0) + sentCount,
        ':failedCount': (campaign.failedCount || 0) + failedCount,
        ':sentAt': new Date().toISOString()
      }
    }));
  }

  return {
    campaignId,
    sentCount,
    failedCount,
    errors
  };
};
