import { defineFunction } from '@aws-amplify/backend';

export const resetDemo = defineFunction({
  name: 'reset-demo',
  resourceGroupName: 'data',
  entry: './handler.ts',
  timeoutSeconds: 60,
  // Run every night at midnight UTC
  schedule: 'every day'
});
