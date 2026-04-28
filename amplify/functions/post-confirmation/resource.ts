import { defineFunction } from '@aws-amplify/backend';

export const postConfirmation = defineFunction({
  name: 'post-confirmation',
  entry: './handler.ts',
  timeoutSeconds: 10,
  memoryMB: 128,
  runtime: 20,
  resourceGroupName: 'auth',
});
