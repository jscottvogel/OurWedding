import { defineFunction } from '@aws-amplify/backend';

export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  timeoutSeconds: 15,
  memoryMB: 256,
  runtime: 20,
  environment: {
    DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'example.com'
  }
});
