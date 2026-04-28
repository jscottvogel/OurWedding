import { defineFunction } from '@aws-amplify/backend';

export const qrGenerate = defineFunction({
  name: 'qr-generate',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  runtime: 20,
  environment: {
    DOMAIN: process.env.NEXT_PUBLIC_DOMAIN || 'example.com'
  }
});
