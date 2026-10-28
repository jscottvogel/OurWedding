import { defineFunction, secret } from '@aws-amplify/backend';

export const resetDemo = defineFunction({
  name: 'reset-demo',
  resourceGroupName: 'data',
  entry: './handler.ts',
  timeoutSeconds: 60,
  // Run every night at midnight UTC
  schedule: 'every day',
  environment: {
    // Cognito sub of the demo user. Only touches records whose weddingId is the demo wedding.
    DEMO_USER_SUB: secret('DEMO_USER_SUB'),
  },
});
