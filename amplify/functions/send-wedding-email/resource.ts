import { defineFunction } from '@aws-amplify/backend';

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
    SES_REGION: process.env.AWS_REGION || 'us-east-1'
  }
});
