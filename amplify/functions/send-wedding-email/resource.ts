import { defineFunction, secret } from '@aws-amplify/backend';

export const sendWeddingEmail = defineFunction({
  name: 'send-wedding-email',
  resourceGroupName: 'data',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  runtime: 20,
  environment: {
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL || 'hello@weddingsteward.com',
    SES_FROM_NAME: process.env.SES_FROM_NAME || 'Wedding Steward',
    SES_REGION: process.env.AWS_REGION || 'us-east-1',
    // Existing secret (already used by public-site/storage-access); keys the unsubscribe HMAC.
    INTERNAL_API_SECRET: secret('INTERNAL_API_SECRET'),
    ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'weddingsteward.com',
  }
});
