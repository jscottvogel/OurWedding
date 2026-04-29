import { defineFunction } from '@aws-amplify/backend';

export const removeUser = defineFunction({
  name: 'remove-user',
  entry: './handler.ts',
  timeoutSeconds: 15,
  memoryMB: 256,
  runtime: 20,
  resourceGroupName: 'data',
});
