import { defineFunction } from '@aws-amplify/backend';

export const resetDemo = defineFunction({
  name: 'reset-demo',
  entry: './handler.ts',
  timeoutSeconds: 60,
  // Run every night at midnight UTC
  schedule: 'cron(0 0 * * ? *)'
});
