import { defineFunction } from '@aws-amplify/backend';

export const pdfExport = defineFunction({
  name: 'pdf-export',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 1024,
  runtime: 20,
  resourceGroupName: 'data',
});
