import { defineFunction } from '@aws-amplify/backend';

export const askIvy = defineFunction({
  name: 'ask-ivy',
  entry: './handler.ts',
  timeoutSeconds: 30, // Bedrock can take a few seconds
  resourceGroupName: 'data',
});
